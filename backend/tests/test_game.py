import concurrent.futures
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import AsyncMock, patch

import numpy as np
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from backend.main import app, rooms, locks, connections, transition_matrix, stationary_distribution

ROOT = Path(__file__).resolve().parents[2]


class MathematicsTests(unittest.TestCase):
    def test_python_and_browser_models_match(self):
        cases = json.loads((ROOT / "tests/markov-cases.json").read_text())
        script = """
        import {readFileSync} from 'node:fs';
        import {buildTransitionMatrix,stationaryDistribution} from './frontend/src/utils/markov.js';
        const cases=JSON.parse(readFileSync('./tests/markov-cases.json'));
        console.log(JSON.stringify(cases.map(c=>{
          const p=buildTransitionMatrix(c.weights,c.alpha);return {p,pi:stationaryDistribution(p)};
        })));
        """
        browser = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", script], cwd=ROOT))
        for case, expected in zip(cases, browser):
            with self.subTest(case=case["name"]):
                p = transition_matrix(case["weights"], case["alpha"])
                pi = stationary_distribution(p)
                np.testing.assert_allclose(p, expected["p"], atol=1e-12)
                np.testing.assert_allclose(pi, expected["pi"], atol=1e-12)
                np.testing.assert_allclose(pi @ p, pi, atol=1e-12)
                self.assertAlmostEqual(float(sum(pi)), 1)


class GameTests(unittest.TestCase):
    def setUp(self):
        rooms.clear(); locks.clear(); connections.clear()
        self.log_patch = patch("backend.main.get_room_logger")
        self.log_patch.start()
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.log_patch.stop()

    def create(self, **kwargs):
        response = self.client.post('/rooms', json={"name": "test", **kwargs})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def join(self, room, player='p1'):
        response = self.client.post(f'/rooms/{room["id"]}/join', json={"player_id": player})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['token']

    def submit(self, room, token, moves=None, round_number=1, request_id='request-0001'):
        return self.client.post(f'/rooms/{room["id"]}/submit', headers={"X-Player-Token": token},
            json={"round": round_number, "request_id": request_id, "moves": moves or []})

    def test_recommended_defaults_are_symmetric_and_scored(self):
        room = self.create()
        self.assertEqual([room['settings'][key] for key in ['num_players_N','num_non_player_nodes_M','points_per_round_K','max_turns_S']], [2,2,3,5])
        np.testing.assert_allclose(room['scores'], [.25]*4)
        np.testing.assert_allclose(room['matrix'], np.array(room['matrix']).T)
        self.assertEqual(room['history'][0]['round'], 0)

    def test_default_names_have_localization_keys_but_custom_names_do_not(self):
        room = self.create()
        self.assertEqual(room['players'][0]['name_key'], 'player')
        self.assertEqual(room['nodes'][2]['name_key'], '駅')
        joined = self.client.post(f'/rooms/{room["id"]}/join',
            json={"player_id": "p1", "name": "駅"}).json()['room']
        self.assertEqual(joined['players'][0]['name'], '駅')
        self.assertNotIn('name_key', joined['players'][0])
        self.assertEqual(joined['nodes'][2]['name_key'], '駅')
        self.assertEqual(joined['matrix'], room['matrix'])
        self.assertEqual(joined['scores'], room['scores'])

    def test_warmup_is_reused_and_hidden(self):
        first = self.create(name='__warmup__')
        second = self.create(name='__warmup__')
        self.assertEqual(first['id'], second['id'])
        self.assertEqual(self.client.get('/rooms').json(), [])

    def test_invalid_settings_are_rejected(self):
        for payload in [{"num_players_N": 0}, {"num_players_N": 1, "num_non_player_nodes_M": 0},
                        {"points_per_round_K": 0}, {"num_players_N": 6, "num_non_player_nodes_M": 6},
                        {"ai_player_positions": [1,2]}, {"name": "  "}, {"max_turns_S": 1.5}]:
            with self.subTest(payload=payload):
                self.assertEqual(self.client.post('/rooms', json={"name":"test", **payload}).status_code, 422)

    def test_claims_cannot_be_stolen_or_used_for_other_players(self):
        room = self.create()
        token = self.join(room)
        self.assertEqual(self.client.post(f'/rooms/{room["id"]}/join', json={"player_id":"p1"}).status_code, 409)
        response = self.client.post(f'/rooms/{room["id"]}/join', json={"player_id":"p1", "name":"new name"}, headers={"X-Player-Token":token})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['token'], token)
        self.assertEqual(self.submit(room, 'wrong-token').status_code, 403)

    def test_submissions_remain_private_until_simultaneous_resolution(self):
        room = self.create()
        first, second = self.join(room), self.join(room, 'p2')
        move = {"source":"n1", "target":"p1", "delta":3}
        response = self.submit(room, first, [move])
        self.assertEqual(response.status_code, 200)
        public = self.client.get(f'/rooms/{room["id"]}').json()
        self.assertEqual(public['round'], 1)
        self.assertEqual(public['matrix'], room['matrix'])
        self.assertEqual(public['submitted'], ['p1'])
        self.assertEqual(len(public['history']), 1)
        self.assertNotIn(first, json.dumps(public))
        self.assertFalse(any(key.startswith('_') for key in public))
        finished = self.submit(room, second).json()
        self.assertEqual(finished['round'], 2)
        self.assertEqual(finished['matrix'][2][0], 5)
        self.assertGreater(finished['scores'][0], .25)
        self.assertEqual(finished['history'][-1]['changes'][0]['delta'], 3)

    def test_duplicate_retries_are_idempotent_even_after_round_advance(self):
        room = self.create(ai_player_positions=[2])
        token = self.join(room)
        first = self.submit(room, token).json()
        again = self.submit(room, token).json()
        self.assertEqual(first, again)
        self.assertEqual(again['round'], 2)
        changed = self.submit(room, token, [{"source":"n1","target":"p1","delta":1}])
        self.assertEqual(changed.status_code, 409)
        self.assertEqual(self.submit(room, token, request_id='another-id').status_code, 409)

    def test_invalid_moves_do_not_commit_any_part_of_a_submission(self):
        room = self.create()
        token = self.join(room)
        for moves in [[{"source":"nope","target":"p1","delta":1}], [{"source":"p1","target":"p1","delta":-1}],
                      [{"source":"n1","target":"p1","delta":4}], [{"source":"n1","target":"p1","delta":0}],
                      [{"source":"n1","target":"p1","delta":1}]*2]:
            with self.subTest(moves=moves):
                response = self.submit(room, token, moves)
                self.assertEqual(response.status_code, 400)
                public = self.client.get(f'/rooms/{room["id"]}').json()
                self.assertEqual(public['submitted'], [])
                self.assertEqual(public['matrix'], room['matrix'])

    def test_concurrent_final_submissions_advance_only_once_and_clip_after_sum(self):
        room = self.create()
        tokens = [self.join(room), self.join(room, 'p2')]
        move = [{"source":"n1", "target":"p1", "delta":-2}]
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda token: self.submit(room, token, move), tokens))
        self.assertTrue(all(response.status_code == 200 for response in results))
        public = self.client.get(f'/rooms/{room["id"]}').json()
        self.assertEqual(public['round'], 2)
        self.assertEqual(len(public['history']), 2)
        self.assertEqual(public['matrix'][2][0], 0)
        change = public['history'][-1]['changes'][0]
        self.assertEqual((change['delta'], change['requested_delta']), (-2, -4))

    def test_game_over_passes_and_history_match_scores(self):
        room = self.create(ai_player_positions=[2], max_turns_S=2)
        token = self.join(room)
        self.assertEqual(self.submit(room, token).status_code, 200)
        final = self.submit(room, token, round_number=2, request_id='request-0002').json()
        self.assertEqual(final['status'], 'finished')
        self.assertEqual(len(final['history']), 3)
        self.assertEqual(final['history'][-1]['scores'], final['scores'])
        self.assertEqual(self.submit(room, token, round_number=3, request_id='request-0003').status_code, 409)

    def test_websocket_snapshots_are_public_and_updates_are_delivered(self):
        room = self.create()
        with self.client.websocket_connect(f'/ws/{room["id"]}') as socket:
            initial = socket.receive_json()
            self.assertEqual(initial['type'], 'room')
            token = self.join(room)
            update = socket.receive_json()
            self.assertNotIn(token, json.dumps(update))
            self.assertTrue(update['room']['players'][0]['claimed'])
            socket.send_text('ping')
            self.assertEqual(socket.receive_json()['type'], 'pong')

    def test_only_creator_can_delete_and_owner_token_is_private(self):
        room = self.create()
        path = f'/rooms/{room["id"]}'
        player_token = self.join(room)
        public = self.client.get(path).json()
        listing = self.client.get('/rooms').json()
        self.assertNotIn(room['owner_token'], json.dumps([public, listing]))
        self.assertEqual(self.client.delete(path).status_code, 403)
        self.assertEqual(self.client.delete(path, headers={'X-Room-Token': player_token}).status_code, 403)
        with self.client.websocket_connect(f'/ws/{room["id"]}') as socket:
            self.assertNotIn(room['owner_token'], json.dumps(socket.receive_json()))
            response = self.client.delete(path, headers={'X-Room-Token': room['owner_token']})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(socket.receive_json(), {'type': 'room_deleted', 'reason': 'deleted'})
            with self.assertRaises(WebSocketDisconnect) as closed:
                socket.receive_json()
            self.assertEqual(closed.exception.code, 4004)
        self.assertEqual(self.client.get(path).status_code, 404)
        self.assertNotIn(room['id'], locks)
        self.assertNotIn(room['id'], connections)
        self.assertEqual(self.client.get('/rooms').json(), [])
        self.assertEqual(self.submit(room, player_token).status_code, 404)

    def test_idle_expiry_ignores_polling_and_heartbeat(self):
        room = self.create(idle_timeout_minutes=15)
        internal = rooms[room['id']]
        internal['_last_activity_at'] -= 14 * 60
        timestamp = internal['_last_activity_at']
        with self.client.websocket_connect(f'/ws/{room["id"]}') as socket:
            socket.receive_json()
            socket.send_text('ping')
            self.assertEqual(socket.receive_json()['type'], 'pong')
            self.client.get(f'/rooms/{room["id"]}')
            self.client.get('/rooms')
            self.assertEqual(internal['_last_activity_at'], timestamp)
            internal['_last_activity_at'] -= 61
            self.assertEqual(self.client.get('/rooms').json(), [])
            self.assertEqual(socket.receive_json(), {'type': 'room_deleted', 'reason': 'expired'})
        self.assertNotIn(room['id'], locks)

    def test_authenticated_activity_renews_timeout_and_expired_room_cannot_revive(self):
        room = self.create(idle_timeout_minutes=15)
        token = self.join(room)
        internal = rooms[room['id']]
        path = f'/rooms/{room["id"]}/activity'
        for headers in [{'X-Player-Token': token}, {'X-Room-Token': room['owner_token']}]:
            internal['_last_activity_at'] -= 14 * 60
            timestamp = internal['_last_activity_at']
            self.assertEqual(self.client.post(path).status_code, 403)
            self.assertEqual(internal['_last_activity_at'], timestamp)
            self.assertEqual(self.client.post(path, headers=headers).status_code, 200)
            self.assertGreater(internal['_last_activity_at'], timestamp + 800)
        internal['_last_activity_at'] -= 901
        self.assertEqual(self.client.post(path, headers={'X-Player-Token': token}).status_code, 404)
        self.assertNotIn(room['id'], rooms)

    def test_expiry_continues_when_a_socket_has_already_disconnected(self):
        room = self.create(idle_timeout_minutes=15)
        socket = AsyncMock()
        socket.send_json.side_effect = WebSocketDisconnect(1006)
        connections[room['id']] = {socket}
        rooms[room['id']]['_last_activity_at'] -= 901
        response = self.client.get('/rooms')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])
        self.assertNotIn(room['id'], rooms)
        self.assertNotIn(room['id'], connections)

    def test_no_expiry_option_and_idle_setting_validation(self):
        room = self.create(idle_timeout_minutes=0)
        rooms[room['id']]['_last_activity_at'] -= 1000000
        self.assertEqual(self.client.get(f'/rooms/{room["id"]}').status_code, 200)
        for timeout in [-1, 1441, 2.5, True]:
            self.assertEqual(self.client.post('/rooms', json={'idle_timeout_minutes': timeout}).status_code, 422)

    def test_join_and_submit_count_as_activity(self):
        room = self.create()
        internal = rooms[room['id']]
        internal['_last_activity_at'] -= 100
        timestamp = internal['_last_activity_at']
        token = self.join(room)
        self.assertGreater(internal['_last_activity_at'], timestamp + 99)
        internal['_last_activity_at'] -= 100
        timestamp = internal['_last_activity_at']
        self.assertEqual(self.submit(room, token).status_code, 200)
        self.assertGreater(internal['_last_activity_at'], timestamp + 99)


if __name__ == '__main__':
    unittest.main()
