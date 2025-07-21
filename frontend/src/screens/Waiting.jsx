// Waiting.jsx
import { useState, useEffect, useRef } from "react";
import { useApi } from '../../apiConfig.js';
import Board from "../components/Board.jsx";
import ReturnButton from '../components/ReturnButton.jsx';

function Waiting({ room, onNextTurn, onGameOver , onReturn }) {
  const apiBase = useApi();
  // Maintain local room state and poll for updates
  const [currentRoom, setCurrentRoom] = useState(room);
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
    const interval = setInterval(fetchRoom, 500);
    return () => clearInterval(interval);
  }, [apiBase, room.id]);

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

  // determine if all players have used their points
  const allDone = currentRoom.players.every(p => (currentRoom.submitted_moves_points[p.id] || 0) >= currentRoom.points_per_round_K);
  // track whether we've already auto-advanced to avoid duplicate calls
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  // derive if this is the final turn for UI messaging
  const isLastTurn = currentRoom.turn > currentRoom.max_turns_S;

  // // reset auto-advance guard on each new turn
  // useEffect(() => {
  //   setHasAutoAdvanced(false);
  // }, [currentRoom.turn]);

  /* --- auto-advance and navigation -------------------------------- */
  useEffect(() => {
    // only advance once when all players are done
    if (!allDone || hasAutoAdvanced) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/rooms/${room.id}/advance-turn`, { method: 'POST' });
        if (!res.ok) throw new Error('Advance turn failed');
        const updated = await res.json();
        // setCurrentRoom(updated);
        setHasAutoAdvanced(true);
        console.log('Auto-advance: Turn advanced to', updated.turn);
        // after 5 seconds, automatically navigate
        setTimeout(() => {
          console.log('Navigating now to', updated.turn > updated.max_turns_S ? 'GameOver' : 'NextTurn');
          if (updated.turn > updated.max_turns_S) onGameOver();
          else onNextTurn();
        }, 5000);
      } catch (err) {
        console.error('Error during auto-advance:', err);
      }
    })();
  }, [allDone, hasAutoAdvanced, apiBase, room.id, onGameOver, onNextTurn]);

  /* --- render ---------------------------------------------------------- */
  return (
    <div className="appBackground">
      <header className="bg-stone-100/80">
        <h1 className="font-bold text-center text-xl p-2">
          {currentRoom.name}
        </h1>
        <section className="text-center p-2">
          {/* Display only player nodes with their scores */}
          {currentRoom.players.map((p) => (
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
          className="relative flex-[8]"
          nodes={nodes}
        />
        <section className="relative flex-[2] bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow text-[9px]">
          <ul className="list-none grid grid-cols-2 gap-x-4 gap-y-1">
             {currentRoom.players.map(p => {
               const spent = currentRoom.submitted_moves_points[p.id] || 0;
               const remaining = currentRoom.points_per_round_K - spent;
               return (
                 <li key={p.id} className={remaining === 0 ? 'italic' : 'font-bold'}>
                   {p.name}: {remaining} points
                 </li>
               );
             })}
           </ul>
         </section>
      </main>

      <footer className="h-60 flex flex-col items-center justify-center bg-stone-100/80 p-4">
        <img src="/assets/background/wait2_clean.png" alt="logo" className="w-[150px] h-[120px]" />
        <div className="flex items-center justify-center">
          {!hasAutoAdvanced ? (
            <h2 className="font-bold">Waiting for other players</h2>
          ) : (
            <h2 className="font-bold">
              {isLastTurn
                ? 'Final score coming in 5 seconds...'
                : 'Next turn starting in 5 seconds...'}
            </h2>
          )}
        </div>
      </footer>
      <ReturnButton onClick={onReturn} />
    </div>
  );
}

export default Waiting;
