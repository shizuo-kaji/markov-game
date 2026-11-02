"""A small, single-process teaching game. Public snapshots never include pending moves."""
import asyncio
import copy
import os
import secrets
import uuid
from pathlib import Path
from typing import Annotated

import numpy as np
from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, model_validator

try:
    from .logging_conf import get_room_logger
except ImportError:
    from logging_conf import get_room_logger

app = FastAPI(title="Markovian Town", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "*")],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Player-Token"],
)
EPSILON = 0.01
rooms: dict[str, dict] = {}
locks: dict[str, asyncio.Lock] = {}
connections: dict[str, set[WebSocket]] = {}
BASE_DIR = Path(__file__).parent


def transition_matrix(weights, alpha=1.0):
    weights = np.asarray(weights, dtype=float)
    smoothed = weights + EPSILON
    walk = smoothed / smoothed.sum(axis=1, keepdims=True)
    return alpha * walk + (1 - alpha) / len(weights)


def stationary_distribution(transition):
    """Solve πP=π, sum(π)=1; avoids slow power iteration on almost periodic graphs."""
    n = len(transition)
    a = np.asarray(transition).T - np.eye(n)
    a[-1] = np.ones(n)
    b = np.zeros(n)
    b[-1] = 1
    distribution = np.linalg.solve(a, b)
    distribution = np.maximum(distribution, 0)
    return distribution / distribution.sum()


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RoomCreate(StrictModel):
    name: str = Field(default="はじめての街", min_length=1, max_length=40)
    num_players_N: int = Field(default=2, ge=1, le=6, strict=True)
    num_non_player_nodes_M: int = Field(default=2, ge=0, le=6, strict=True)
    points_per_round_K: int = Field(default=3, ge=1, le=20, strict=True)
    max_turns_S: int = Field(default=5, ge=1, le=12, strict=True)
    ai_player_positions: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_settings(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("ルーム名を入力してください。")
        if not 2 <= self.num_players_N + self.num_non_player_nodes_M <= 10:
            raise ValueError("街のノード数は合計2〜10個にしてください。")
        if any(p < 1 or p > self.num_players_N for p in self.ai_player_positions):
            raise ValueError("AIのプレイヤー番号が不正です。")
        if len(set(self.ai_player_positions)) >= self.num_players_N:
            raise ValueError("少なくとも1人は人間のプレイヤーにしてください。")
        return self


class JoinRequest(StrictModel):
    player_id: str
    name: str | None = Field(default=None, min_length=1, max_length=24)


class Move(StrictModel):
    source: str
    target: str
    delta: int = Field(ge=-20, le=20, strict=True)


class Submission(StrictModel):
    round: int = Field(ge=1, strict=True)
    request_id: str = Field(min_length=8, max_length=80)
    moves: list[Move] = Field(default_factory=list, max_length=20)


def get_room(room_id):
    if room_id not in rooms:
        raise HTTPException(404, "ルームが見つかりません。サーバー再起動で消えた可能性があります。")
    return rooms[room_id]


def snapshot(room):
    public = {key: copy.deepcopy(value) for key, value in room.items() if not key.startswith("_")}
    public["submitted"] = list(room["_pending"])
    public["players"] = [
        {**node, "claimed": node["id"] in room["_tokens"]}
        for node in room["nodes"] if node["kind"] == "player"
    ]
    return public


def room_summary(room):
    # The lobby needs only this small summary, not a copy of every round's history.
    public = {key: copy.deepcopy(room[key]) for key in ("id", "name", "round", "status", "settings")}
    public["players"] = [{**node, "claimed": node["id"] in room["_tokens"]}
                         for node in room["nodes"] if node["kind"] == "player"]
    return public


async def broadcast(room_id, payload):
    async def send(socket):
        try:
            await asyncio.wait_for(socket.send_json(payload), timeout=3)
        except (RuntimeError, OSError, asyncio.TimeoutError):
            connections.get(room_id, set()).discard(socket)
    await asyncio.gather(*(send(socket) for socket in list(connections.get(room_id, set()))))


def update_scores(room):
    transition = transition_matrix(room["matrix"])
    room["transition"] = transition.tolist()
    room["scores"] = stationary_distribution(transition).tolist()


def computer_moves(room, player_index):
    """Each AI sees only the previous public board, like every human player."""
    weights = np.array(room["matrix"], dtype=float)
    planned = {}
    for _ in range(room["settings"]["points_per_round_K"]):
        best = None
        for source in range(len(weights)):
            # Compare attracting visitors and reducing rivals' inflow.
            for target in range(room["settings"]["num_players_N"]):
                delta = 1 if target == player_index else -1
                if weights[source, target] + delta < 0:
                    continue
                weights[source, target] += delta
                scores = stationary_distribution(transition_matrix(weights))
                rivals = np.delete(scores[:room["settings"]["num_players_N"]], player_index)
                value = scores[player_index] - (float(max(rivals)) if len(rivals) else 0)
                weights[source, target] -= delta
                if best is None or value > best[0]:
                    best = (value, source, target, delta)
        if best is None:
            break
        _, source, target, delta = best
        weights[source, target] += delta
        planned[source, target] = planned.get((source, target), 0) + delta
    return [{"source": room["nodes"][s]["id"], "target": room["nodes"][t]["id"], "delta": d}
            for (s, t), d in planned.items() if d]


def resolve_round(room):
    before = np.array(room["matrix"], dtype=float)
    deltas = np.zeros_like(before)
    index = {node["id"]: i for i, node in enumerate(room["nodes"])}
    revealed = []
    for i, node in enumerate(room["nodes"]):
        if node["kind"] != "player":
            continue
        moves = computer_moves(room, i) if node["is_ai"] else room["_pending"][node["id"]]
        for move in moves:
            deltas[index[move["source"]], index[move["target"]]] += move["delta"]
            revealed.append({**move, "player_id": node["id"]})
    after = np.maximum(before + deltas, 0)
    room["matrix"] = after.tolist()
    update_scores(room)
    changes = [
        {"source": room["nodes"][i]["id"], "target": room["nodes"][j]["id"],
         "before": float(before[i, j]), "after": float(after[i, j]),
         "delta": float(after[i, j] - before[i, j]), "requested_delta": float(deltas[i, j])}
        for i in range(len(before)) for j in range(len(before)) if deltas[i, j]
    ]
    room["history"].append({"round": room["round"], "matrix": copy.deepcopy(room["matrix"]),
                            "scores": list(room["scores"]), "changes": changes, "moves": revealed})
    get_room_logger(room["id"]).info("round_completed", extra={"round": room["round"],
        "matrix": room["matrix"], "scores": room["scores"], "moves": revealed})
    room["_pending"] = {}
    room["round"] += 1
    if room["round"] > room["settings"]["max_turns_S"]:
        room["status"] = "finished"


@app.get("/health")
def health():
    return {"status": "online", "version": 2}


@app.get("/rooms")
def list_rooms():
    return [room_summary(room) for room in reversed(list(rooms.values())) if room["name"] != "__warmup__"]


@app.post("/rooms", status_code=201)
def create_room(settings: RoomCreate):
    if settings.name == "__warmup__":
        existing = next((r for r in rooms.values() if r["name"] == "__warmup__"), None)
        if existing:
            return snapshot(existing)
    n, m = settings.num_players_N, settings.num_non_player_nodes_M
    icons = [line.strip() for line in (BASE_DIR / "default_players.txt").read_text().splitlines() if line.strip()]
    neutral_names = ["駅", "公園", "学校", "映画館", "図書館", "広場"]
    nodes = [{"id": f"p{i+1}", "name": f"プレイヤー {i+1}", "kind": "player", "name_key": "player",
              "icon": icons[i % len(icons)] if icons else "", "is_ai": i + 1 in settings.ai_player_positions}
             for i in range(n)]
    nodes += [{"id": f"n{i+1}", "name": neutral_names[i], "name_key": neutral_names[i], "kind": "neutral", "is_ai": False} for i in range(m)]
    weights = [[0 if i == j else (2 if (i < n) != (j < n) else 1)
                for j in range(n + m)] for i in range(n + m)]
    room_id = str(uuid.uuid4())
    room = {"id": room_id, "name": settings.name, "settings": settings.model_dump(exclude={"name"}),
            "nodes": nodes, "matrix": weights, "round": 1, "status": "playing", "revision": 0,
            "epsilon": EPSILON, "history": [], "_tokens": {}, "_pending": {}, "_receipts": {}}
    update_scores(room)
    room["history"].append({"round": 0, "matrix": copy.deepcopy(weights), "scores": list(room["scores"]),
                            "changes": [], "moves": []})
    rooms[room_id] = room
    locks[room_id] = asyncio.Lock()
    return snapshot(room)


@app.get("/rooms/{room_id}")
def read_room(room_id: str):
    return snapshot(get_room(room_id))


@app.post("/rooms/{room_id}/join")
async def join_room(room_id: str, request: JoinRequest,
                    x_player_token: Annotated[str | None, Header()] = None):
    room = get_room(room_id)
    async with locks[room_id]:
        if room["status"] == "finished":
            raise HTTPException(409, "終了したゲームです。結果を見たり、新しいルームを作ったりできます。")
        node = next((p for p in room["nodes"] if p["id"] == request.player_id and p["kind"] == "player"), None)
        if not node or node["is_ai"]:
            raise HTTPException(400, "人間のプレイヤーを選んでください。")
        token = room["_tokens"].get(node["id"])
        if token and not secrets.compare_digest(token, x_player_token or ""):
            raise HTTPException(409, "このプレイヤーは参加済みです。別の席を選んでください。")
        token = token or secrets.token_urlsafe(24)
        room["_tokens"][node["id"]] = token
        if request.name and request.name.strip():
            node["name"] = request.name.strip()
            node.pop("name_key", None)
        room["revision"] += 1
        public = snapshot(room)
    await broadcast(room_id, {"type": "room", "room": public})
    return {"token": token, "player_id": node["id"], "room": public}


@app.post("/rooms/{room_id}/submit")
async def submit(room_id: str, request: Submission,
                 x_player_token: Annotated[str | None, Header()] = None):
    room = get_room(room_id)
    async with locks[room_id]:
        player_id = next((pid for pid, token in room["_tokens"].items()
                          if secrets.compare_digest(token, x_player_token or "")), None)
        if not player_id:
            raise HTTPException(403, "参加情報がありません。ロビーから参加し直してください。")
        receipt_key = (player_id, request.request_id)
        if receipt_key in room["_receipts"]:
            if room["_receipts"][receipt_key] != request.model_dump():
                raise HTTPException(409, "同じ送信番号で異なる内容は送れません。")
            return snapshot(room)
        if room["status"] == "finished" or request.round != room["round"]:
            raise HTTPException(409, "ラウンドが変わりました。最新の盤面を確認してください。")
        if player_id in room["_pending"]:
            raise HTTPException(409, "このラウンドは提出済みです。")
        budget = room["settings"]["points_per_round_K"]
        if sum(abs(move.delta) for move in request.moves) > budget:
            raise HTTPException(400, "使えるポイントを超えています。")
        index = {node["id"]: i for i, node in enumerate(room["nodes"])}
        seen = set()
        for move in request.moves:
            if move.source not in index or move.target not in index or move.delta == 0:
                raise HTTPException(400, "辺または変更量が不正です。")
            key = (move.source, move.target)
            if key in seen:
                raise HTTPException(400, "同じ辺への変更はまとめてください。")
            seen.add(key)
            if room["matrix"][index[move.source]][index[move.target]] + move.delta < 0:
                raise HTTPException(400, "辺の重みは0未満にできません。")
        room["_pending"][player_id] = [move.model_dump() for move in request.moves]
        room["_receipts"][receipt_key] = request.model_dump()
        humans = [node["id"] for node in room["nodes"] if node["kind"] == "player" and not node["is_ai"]]
        if all(pid in room["_pending"] for pid in humans):
            resolve_round(room)
        room["revision"] += 1
        public = snapshot(room)
    await broadcast(room_id, {"type": "room", "room": public})
    return public


@app.websocket("/ws/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: str):
    if room_id not in rooms:
        await websocket.close(code=4004)
        return
    await websocket.accept()
    connections.setdefault(room_id, set()).add(websocket)
    try:
        await websocket.send_json({"type": "room", "room": snapshot(rooms[room_id])})
        while True:
            await websocket.receive_text()
            await websocket.send_json({"type": "pong"})
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        connections.get(room_id, set()).discard(websocket)
