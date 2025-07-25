//Player.jsx
import React, { useState, useRef, useEffect } from "react";
import Board from "../components/Board.jsx";
import Ledger from "../components/Ledger.jsx";
import ReturnButton from '../components/ReturnButton.jsx';
import { useApi } from '../../apiConfig.js';

export default function PlayerTurn({ room, currentPlayerId, onEndTurn, onReturn }) {
  const apiBase = useApi();
  // Inform server of current screen location
  useEffect(() => {
    (async () => {
      try {
        await fetch(`${apiBase}/rooms/${room.id}/players/${currentPlayerId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: 'PlayerTurn' })
        });
      } catch (e) {
        console.error('Error updating location:', e);
      }
    })();
  }, [apiBase, room.id, currentPlayerId]);

  const playerName = room.players.find(p => p.id === currentPlayerId)?.name || '';

  // Track board selection via state
  const [selection, setSelection] = useState({ from: null, to: null });

  // Dynamic nodes generated from room state
  const nodes = room.nodes || [];

  const [mode, setMode] = useState("endorse"); // endorse | sabotage
  const [value, setValue] = useState(0);       // slider value for current move
  const [moves, setMoves] = useState([]);      // committed moves (for ledger only here)
  const [resetCounter, setResetCounter] = useState(0); // increments to signal reset

  // Initialize moves state from server moves for this player
  useEffect(() => {
    if (room.moves) {
      const initial = room.moves
        .filter(m => m.player_id === currentPlayerId)
        .map(m => ({
          from: m.source,
          to: m.target,
          mode: m.weight_change >= 0 ? 'endorse' : 'sabotage',
          value: Math.abs(m.weight_change)
        }));
      setMoves(initial);
    }
  }, [room.moves, currentPlayerId]);

  const endorseColor  = "hsla(110, 70%, 50%, 1.00)";
  const sabotageColor = "hsla(0, 70%, 60%, 1.00)";
  const bgModeColor   = mode === "endorse" ? endorseColor : sabotageColor;

  const boardRef = useRef(null);

  const pointsUsed    = moves.reduce((s, m) => s + m.value, 0);
  const totalPoints   = room.points_per_round_K ?? 0;
  const remainingAll  = totalPoints - pointsUsed;
  const turnComplete  = remainingAll === 0 && value === 0; // since selection is inside Board

  // Submit current selection as a move via API
  const submit = async () => {
    console.log('Submit button clicked.');
    if (value === 0) {
      console.log('Value is 0, returning.');
      return;
    }
    const sel = selection;
    if (!sel.from || !sel.to) {
      console.log('No nodes selected, returning.');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/rooms/${room.id}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Provide id field to satisfy backend requirement
          id: 0,
          player_id: currentPlayerId,
          source: sel.from,
          target: sel.to,
          // Use negative for sabotage and positive for endorse
          weight_change: mode === 'sabotage' ? -value : value
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        // Compose a readable error message
        const msg = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail || errorData);
        throw new Error(msg);
      }
      // Add committed move to local state for ledger display
      setMoves(prev => [...prev, { from: sel.from, to: sel.to, mode, value }]);
      boardRef.current.clearSelection();
      setValue(0);
      // Sync with backend: re-fetch room moves
      try {
        const roomRes = await fetch(`${apiBase}/rooms/${room.id}`);
        if (roomRes.ok) {
          const data = await roomRes.json();
          const updated = data.moves
            .filter(m => m.player_id === currentPlayerId)
            .map(m => ({
              from: m.source,
              to: m.target,
              mode: m.weight_change >= 0 ? 'endorse' : 'sabotage',
              value: Math.abs(m.weight_change)
            }));
          setMoves(updated);
        }
      } catch (e) {
        console.error('Error syncing moves:', e);
      }
    } catch (err) {
      console.error('Error submitting move:', err);
      alert('Error submitting move: ' + err.message);
    }
  };

  const endTurn = () => {
    // Optionally validate finished state, pass current turn number
    onEndTurn?.(room.turn);
  };

  // Reset this player's submitted moves via API
  const resetAll = async () => {
    try {
      const res = await fetch(`${apiBase}/rooms/${room.id}/reset-moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: currentPlayerId })
      });
      if (!res.ok) {
        const errorData = await res.json();
        const msg = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail || errorData);
        throw new Error(msg);
      }
      setMoves([]);
      setValue(0);
      setResetCounter((c) => c + 1);
      // server broadcast will update submitted_points via WebSocket
    } catch (err) {
      console.error('Error resetting moves:', err);
      alert('Error resetting moves: ' + err.message);
    }
  };

  const provisional = selection.from && selection.to
    ? [{ ...selection, mode, value, ghost: true }]
    : [];
  const ledgerEntries = [...moves, ...provisional];

  const getNode = (id) => nodes.find((n) => n.id === id);

  return (
    <div className="appBackground">
      <header className="bg-stone-100/80">
        <h1 className="font-bold text-center text-xl p-2">
          {playerName} (Round {room.turn}/{room.max_turns_S} )
        </h1>
        <section className="text-center p-2">
            {/* Display only player nodes in header with updated scores */}
            {room.players.map((p) => (
              <span key={p.id} 
                className="
                  inline-flex items-center
                  bg-stone-100/90 rounded-lg border-2 border-black 
                  px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
                <img src={`/assets/nodes/${p.icon}`} 
                  alt={p.name} className="w-6 h-6" />
                <span className="leading-none">
                  {Math.round((p.score ?? 0) * 100)}% 
                </span>
              </span>
            ))}
        </section>
      </header>

      <main className="flex flex-col flex-1">
        <Board
          as="section"
          className="relative flex-[8] border-t-2 border-b-2"
          ref={boardRef}
          nodes={nodes}
          bgModeColor={bgModeColor}
          resetSignal={resetCounter}
          onSelectionChange={setSelection}
          currentRoom={room}
          playMode={mode}
        />
        <section className="relative flex-[2]">
          <Ledger ledger={ledgerEntries} getNode={getNode} />
        </section>
      </main>

      <footer className="h-60 flex flex-col bg-stone-100/80 p-4 space-y-2">
        <div className="h-20 flex justify-end space-x-2">
          <button
            className="flex flex-1 flex-col items-center justify-center px-2 py-2 rounded"
            style={{ backgroundColor: mode === "endorse" ? endorseColor : "hsla(0,0%,65%,1)" }}
            onClick={() => setMode("endorse")}
          >
            <img src="/assets/buttons/endorse.png" alt="endorse" className="w-12 h-12" />
          </button>
          <button
            className="flex flex-1 flex-col items-center justify-center px-2 py-2 rounded"
            style={{ backgroundColor: mode === "sabotage" ? sabotageColor : "hsla(0,0%,65%,1)" }}
            onClick={() => setMode("sabotage")}
          >
            <img src="/assets/buttons/sabotage.png" alt="sabotage" className="w-12 h-12" />
          </button>
        </div>

        <p>Points: {value}/{remainingAll}</p>
        <input
          type="range"
          min="0"
          max={remainingAll}
            step="1"
            value={value}
            disabled={remainingAll === 0}
            onChange={(e) => setValue(+e.target.value)}
            style={{ width: `${(remainingAll/room.points_per_round_K)*100}%`, accentColor: bgModeColor }}
            className="w-full max-w-[100%] disabled:opacity-50"
        />

        <div className="h-20 flex justify-end space-x-2">
          <button
            className="flex flex-1 flex-col items-center justify-center px-2 py-2 bg-amber-200 rounded"
            onClick={resetAll}
          >
            <img src="/assets/buttons/reset.png" alt="Reset" className="w-8 h-8" />
            <p>RESET</p>
          </button>
          <button
            className="flex flex-1 flex-col items-center justify-center px-2 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
            onClick={turnComplete ? endTurn : submit}
          >
            <img src={`/assets/buttons/${turnComplete ? "end.png" : "submit.png"}`} alt={turnComplete ? "END TURN" : "SUBMIT"} className="w-8 h-8" />
            <p>{turnComplete ? "END TURN" : "SUBMIT"}</p>
          </button>
        </div>
      </footer>
      <ReturnButton onClick={onReturn} />
    </div>
  );
}