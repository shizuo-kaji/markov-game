// Waiting.jsx
import { useState, useEffect } from "react";
import { useApi } from '../../apiConfig.js';
import Board from "../components/Board.jsx";
import AiInsightsPanel from "../components/AiInsightsPanel.jsx";
import NodeIcon from "../components/NodeIcon.jsx";
import ReturnButton from '../components/ReturnButton.jsx';
import { getPreviousRoundAiNotes } from "../utils/aiInsights.js";

function Waiting({ room, currentPlayerId, onNextTurn, onGameOver, onReturn, turnNumber }) {
  const apiBase = useApi();
  // Inform server of current screen location
  useEffect(() => {
    (async () => {
      try {
        await fetch(`${apiBase}/rooms/${room.id}/players/${currentPlayerId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: 'Waiting' })
        });
      } catch (e) {
        console.error('Error updating location:', e);
      }
    })();
  }, [apiBase, room.id, currentPlayerId]);

  // The following are fetched every 0.5 seconds
  const [currentRoom, setCurrentRoom] = useState(room);
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  const [turnCompleted, setTurnCompleted] = useState(false);
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentRoom(data);
        }
      } catch (e) {
        console.error('Error fetching room updates:', e);
      }
    };
    const fetchReady = async () => {
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
      // look up current turn object by its number key
      const curr = currentRoom.turns?.[turnNumber];
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
    const interval = setInterval(() => { fetchRoom(); fetchReady(); fetchTurnCompleted(); }, 500);
    return () => clearInterval(interval);
  }, [apiBase, room.id, turnNumber, currentRoom.turns]);

  // derive dynamic nodes from backend (players and neutrals) for map layout
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
  const { previousRound, notesByPlayer: aiNotesMap } = getPreviousRoundAiNotes(currentRoom);
  const aiPlayers = currentRoom.players.filter((p) => p.is_ai);

  // derive if this is the final turn for UI messaging
  const isLastTurn = currentRoom.turn > currentRoom.max_turns_S

  /* --- auto-advance and navigation -------------------------------- */
   // effect: trigger advance-turn while ready and not yet completed
   useEffect(() => {
    if (!(readyToAdvance && !turnCompleted)) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}/advance-turn`, { method: 'POST' });
        if (!res.ok) throw new Error('Advance turn failed');
        console.log('Auto-advance: posted advance-turn');
      } catch (err) {
        console.error('Error during auto-advance:', err);
      }
    })();
  }, [readyToAdvance, turnCompleted, apiBase, room.id]);

  // effect: navigate after turn completed
  useEffect(() => {
    if (!turnCompleted) return;
    let updatedRoom;
    // first refresh room data
    (async () => {
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}`);
        if (res.ok) {
          updatedRoom = await res.json();
          setCurrentRoom(updatedRoom);
        }
      } catch (e) {
        console.error('Error refreshing room before navigation:', e);
      }
      // then schedule navigation
      console.log('Navigating now to', updatedRoom.turn > updatedRoom.max_turns_S ? 'GameOver' : 'NextTurn');
      if (updatedRoom.turn > updatedRoom.max_turns_S) onGameOver();
      else onNextTurn();
    })();
  }, [turnCompleted, apiBase, room.id, onGameOver, onNextTurn]);

  /* --- render ---------------------------------------------------------- */
  return (
    <div className="appBackground">
      <header className="shrink-0 bg-stone-100/80">
        <h1 className="font-bold text-center text-xl p-2">
          {currentRoom.name}
        </h1>
        <section className="flex flex-wrap justify-center gap-1 p-2">
          {/* Display only player nodes with their scores */}
          {currentRoom.players.map((p) => {
            const noteText = p.is_ai ? (aiNotesMap[p.id]?.join(' / ') || 'AI controlled player') : '';
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
          );})}
        </section>
      </header>

      <AiInsightsPanel
        aiPlayers={aiPlayers}
        notesByPlayer={aiNotesMap}
        previousRound={previousRound}
        emptyMessage="No previous-round AI insights yet."
      />

      <main className="flex min-h-0 flex-1 flex-col">
        <Board
          as="section"
          className="relative min-h-0 flex-[8]"
          nodes={nodes}
          currentRoom={currentRoom}
          playMode="wait"
        />
        <section className="relative min-h-[52px] flex-[2] overflow-y-auto bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow text-[9px]">
          <ul className="list-none grid grid-cols-2 gap-x-4 gap-y-1">
             {currentRoom.players.map(p => {
               const spent = currentRoom.submitted_moves_points[p.id] || 0;
               const remaining = currentRoom.points_per_round_K - spent;
               if (p.is_ai) {
                 const firstNote = aiNotesMap[p.id]?.[0];
                 return (
                   <li key={p.id} className="italic text-amber-400" title={firstNote || 'AI controlled player'}>
                     {p.name}: 🤖 {firstNote || 'AI ready'}
                   </li>
                 );
               }
               return (
                 <li key={p.id} className={remaining === 0 ? 'italic' : 'font-bold'}>
                   {p.name}: {remaining} points
                 </li>
               );
             })}
           </ul>
         </section>
      </main>

      <footer className="shrink-0 flex min-h-[180px] flex-col items-center justify-center bg-stone-100/80 p-3 sm:h-60 sm:p-4">
        <img src="/assets/background/wait2_clean.png" alt="logo" className="w-[150px] h-[120px]" />
        <div className="flex items-center justify-center">
        {turnCompleted ? (
            <h2 className="font-bold">
              {isLastTurn
                ? 'Final score coming...'
                : 'Next turn starting...'}
            </h2>
          ) : (
            <h2 className="font-bold">Waiting for other players</h2>
          )}
        </div>
      </footer>
      <ReturnButton onClick={onReturn} />
    </div>
  );
}

export default Waiting;
