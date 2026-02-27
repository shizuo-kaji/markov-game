// Spectator.jsx - Observer mode with full visibility of game state
import { useState, useEffect, useRef } from "react";
import { useApi } from '../../apiConfig.js';
import Board from "../components/Board.jsx";
import NodeIcon from "../components/NodeIcon.jsx";
import ReturnButton from '../components/ReturnButton.jsx';

function Spectator({ room, onGameOver, onReturn }) {
  const apiBase = useApi();
  const [currentRoom, setCurrentRoom] = useState(room);
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  const [turnCompleted, setTurnCompleted] = useState(false);
  const lastTurnRef = useRef(room.turn);
  const isAdvancingRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  // Store latest room data in ref to avoid dependency issues
  const currentRoomRef = useRef(currentRoom);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Poll room state, ready-to-advance, and turn-completed every 500ms
  useEffect(() => {
    const fetchRoom = async () => {
      if (hasNavigatedRef.current) return;
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}`);
        if (res.ok) {
          const data = await res.json();
          // Check if game is over first
          if (data.turn > data.max_turns_S) {
            console.log('Spectator: game over detected', data.turn, '>', data.max_turns_S);
            hasNavigatedRef.current = true;
            setCurrentRoom(data);
            onGameOver();
            return;
          }
          // Detect turn change - reset flags
          if (data.turn !== lastTurnRef.current) {
            lastTurnRef.current = data.turn;
            setTurnCompleted(false);
            isAdvancingRef.current = false;
          }
          setCurrentRoom(data);
        }
      } catch (e) {
        console.error('Error fetching room updates:', e);
      }
    };

    const fetchReady = async () => {
      if (hasNavigatedRef.current) return;
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}/ready-to-advance`);
        if (res.ok) {
          const { ready_to_advance } = await res.json();
          setReadyToAdvance(ready_to_advance);
        }
      } catch (e) {
        console.error('Error fetching ready flag:', e);
      }
    };

    const fetchTurnCompleted = async () => {
      if (hasNavigatedRef.current) return;
      const turnNumber = lastTurnRef.current;
      const curr = currentRoomRef.current.turns?.[turnNumber];
      if (!curr) return;
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}/turns/${curr.id}/completed`);
        if (res.ok) {
          const { turn_completed } = await res.json();
          setTurnCompleted(turn_completed);
        }
      } catch (e) {
        console.error('Error fetching turn status:', e);
      }
    };

    fetchRoom();
    fetchReady();
    const interval = setInterval(() => {
      fetchRoom();
      fetchReady();
      fetchTurnCompleted();
    }, 500);
    return () => clearInterval(interval);
  }, [apiBase, room.id, onGameOver]);

  // Auto-advance turn when ready (spectator can trigger this for AI-only games)
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (!(readyToAdvance && !turnCompleted)) return;
    if (isAdvancingRef.current) return; // Prevent multiple calls
    isAdvancingRef.current = true;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}/advance-turn`, { method: 'POST' });
        if (!res.ok) throw new Error('Advance turn failed');
        console.log('Spectator: auto-advance posted');
      } catch (err) {
        console.error('Error during auto-advance:', err);
      }
    })();
  }, [readyToAdvance, turnCompleted, apiBase, room.id]);

  // Navigate after turn completed (similar to Waiting.jsx)
  useEffect(() => {
    if (!turnCompleted) return;
    if (hasNavigatedRef.current) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}`);
        if (res.ok) {
          const updatedRoom = await res.json();
          setCurrentRoom(updatedRoom);
          console.log('Spectator: turn completed, checking game over', updatedRoom.turn, '>', updatedRoom.max_turns_S);
          if (updatedRoom.turn > updatedRoom.max_turns_S) {
            hasNavigatedRef.current = true;
            onGameOver();
          } else {
            // Reset for next turn
            isAdvancingRef.current = false;
          }
        }
      } catch (e) {
        console.error('Error refreshing room after turn:', e);
      }
    })();
  }, [turnCompleted, apiBase, room.id, onGameOver]);

  // Derive nodes for Board
  const nodes = [
    ...currentRoom.players.map(p => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      x: p.x_str,
      y: p.y_str,
      score: p.score,
      out_deg: p.out_deg,
      in_deg: p.in_deg
    })),
    ...currentRoom.neutrals.map(n => ({
      id: n.id,
      name: n.name,
      icon: n.icon,
      x: n.x_str,
      y: n.y_str,
      score: n.score,
      out_deg: n.out_deg,
      in_deg: n.in_deg
    }))
  ];

  const aiNotesMap = currentRoom.ai_move_notes || {};
  const submittedPoints = currentRoom.submitted_moves_points || {};
  const moves = currentRoom.moves || [];

  // Group moves by player
  const movesByPlayer = {};
  currentRoom.players.forEach(p => {
    movesByPlayer[p.id] = moves.filter(m => m.player_id === p.id);
  });

  // Helper to get node name by id
  const getNodeName = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.name || `Node ${nodeId}`;
  };

  return (
    <div className="appBackground">
      <header className="bg-stone-100/80">
        <h1 className="font-bold text-center text-xl p-2">
          {currentRoom.name} - Spectator Mode
        </h1>
        <p className="text-center text-sm pb-2">
          Round {Math.min(currentRoom.turn, currentRoom.max_turns_S)}/{currentRoom.max_turns_S}
        </p>
        <section className="text-center p-2">
          {currentRoom.players.map((p) => {
            const noteText = p.is_ai ? (aiNotesMap[p.id]?.join(' / ') || 'AI controlled') : '';
            return (
              <span key={p.id}
                className="
                  inline-flex items-center
                  bg-stone-100/90 rounded-lg border-2 border-black
                  px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
                <NodeIcon icon={p.icon} alt={p.name} className="w-6 h-6" />
                {p.is_ai && <span className="text-xs" title={noteText}>🤖</span>}
                <span className="leading-none">
                  {Math.round((p.score ?? 0) * 100)}%
                </span>
              </span>
            );
          })}
        </section>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden">
        <Board
          as="section"
          className="relative flex-[6] border-t-2 border-b-2"
          nodes={nodes}
          currentRoom={currentRoom}
          playMode="spectator"
        />

        {/* Detailed moves panel for spectators */}
        <section className="flex-[4] bg-stone-800/90 overflow-y-auto p-3">
          <h2 className="text-white font-bold mb-2">Submitted Moves (This Round)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentRoom.players.map(p => {
              const playerMoves = movesByPlayer[p.id] || [];
              const spent = submittedPoints[p.id] || 0;
              const remaining = currentRoom.points_per_round_K - spent;
              const isReady = remaining === 0;

              return (
                <div
                  key={p.id}
                  className={`rounded p-2 ${isReady ? 'bg-emerald-900/50 border border-emerald-500' : 'bg-stone-700/50 border border-stone-500'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <NodeIcon icon={p.icon} alt={p.name} className="w-5 h-5" />
                    <span className="text-white font-semibold">{p.name}</span>
                    {p.is_ai && <span className="text-xs text-amber-300">🤖</span>}
                    <span className={`ml-auto text-xs ${isReady ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {isReady ? 'READY' : `${remaining} pts left`}
                    </span>
                  </div>

                  {playerMoves.length > 0 ? (
                    <ul className="text-xs text-stone-200 space-y-1">
                      {playerMoves.map((m, idx) => {
                        const isEndorse = m.weight_change >= 0;
                        const absValue = Math.abs(m.weight_change);
                        return (
                          <li key={idx} className="flex items-center gap-1">
                            <span className={isEndorse ? 'text-green-400' : 'text-red-400'}>
                              {isEndorse ? '+' : '-'}{absValue}
                            </span>
                            <span className="text-stone-400">
                              {getNodeName(m.source)} → {getNodeName(m.target)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-400 italic">No moves yet</p>
                  )}

                  {p.is_ai && aiNotesMap[p.id]?.length > 0 && (
                    <p className="text-xs text-amber-200/80 mt-1 italic">
                      {aiNotesMap[p.id].join(' / ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="h-16 flex items-center justify-center bg-stone-100/80 p-2">
        {readyToAdvance && !turnCompleted ? (
          <span className="text-amber-600 text-sm font-semibold animate-pulse">
            All players ready - Advancing turn...
          </span>
        ) : turnCompleted ? (
          <span className="text-emerald-600 text-sm font-semibold">
            Turn completed - Loading next round...
          </span>
        ) : (
          <span className="text-stone-600 text-sm">
            Watching as spectator - You can see all submitted moves
          </span>
        )}
      </footer>
      <ReturnButton onClick={onReturn} />
    </div>
  );
}

export default Spectator;
