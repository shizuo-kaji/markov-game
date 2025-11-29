import { useEffect } from "react";
import { useApi } from '../../apiConfig.js';
import Board from "../components/Board.jsx";


export default function Trophy({ onRestart, room }) {
  const apiBase = useApi();

  // sort players by score descending for ranking
  const sortedPlayers = [...room.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sortedPlayers[0];
  return (
    <div className="appBackground">
      <header className="bg-stone-100/80">
        <h1 className="font-bold text-center text-xl p-2">
          Game Over
        </h1>
        <section className="text-center p-2">
          {/* Display only player nodes in header with updated scores */}
          {room.players.map((p) => {
            const noteText = p.is_ai ? (room.ai_move_notes?.[p.id]?.join(' / ') || 'AI controlled player') : '';
            return (
            <span key={p.id} 
              className="
                inline-flex items-center
                bg-stone-100/90 rounded-lg border-2 border-black 
                px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
              <img src={`/assets/nodes/${p.icon}`} 
                alt={p.name} className="w-6 h-6" />
              {p.is_ai && <span className="text-xs" title={noteText}>🤖</span>}
              <span className="leading-none">
                {Math.round((p.score ?? 0) * 100)}% 
              </span>
            </span>
          );})}
        </section>
      </header>

      <main className="flex flex-col flex-1">
        <Board
          as="section"
          className="relative flex-[8] border-t-2 border-b-2"
          nodes={room.nodes}
          currentRoom={room}
        />
        <section className="relative flex-[2]">
          <p className="text-4xl p-4">{winner?.name} 🏆</p>
          <ul className="space-y-2"> 
            {sortedPlayers.map((p, idx) => {
              const noteText = p.is_ai ? (room.ai_move_notes?.[p.id]?.join(' / ') || 'AI controlled player') : '';
              return (
              <li key={p.id} className="
              inline-flex items-center 
              bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow pointer-events-none
              px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
                <span>{`${idx + 1}. ${p.name} — ${Math.round((p.score ?? 0) * 100)}%`}</span>
                {p.is_ai && <span className="text-xs" title={noteText}>🤖</span>}
                <img src={`/assets/nodes/${p.icon}`} alt={p.name} className="w-8 h-8" />
              </li>
            );})}
          </ul>
        </section>
      </main>

      <footer className="h-20 flex justify-center items-center bg-stone-100/80 p-4">
        <button
          className="relative h-12 w-80 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5"
          onClick={onRestart}
        >
          Back to Lobby
        </button>
      </footer>
    </div>
  );
}
