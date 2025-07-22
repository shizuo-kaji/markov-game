import { useEffect } from "react";
import { useApi } from '../../apiConfig.js';
import InitialEdges from "../components/InitialEdges.jsx";

export default function Trophy({ onRestart, room }) {
  const apiBase = useApi();

  // sort players by score descending for ranking
  const sortedPlayers = [...room.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sortedPlayers[0];
  return (
    <div className="flex flex-col 
    items-center 
    justify-center 
    h-screen 
    bg-[url('/assets/background/bg_texture.png')]
    bg-yellow-50">
      <div className="flex-1"></div>
      <img src={"/assets/background/end.png"} alt="logo" className="w-80 h-80" />
      <p className="text-4xl p-4">{winner?.name} 🏆</p>

      <InitialEdges room={room} />

      <section className="
        text-center p-4 relative top-1
        text-[12px]">
        <ul className="space-y-2"> 
          {sortedPlayers.map((p, idx) => (
            <li key={p.id} className="
            inline-flex items-center 
            bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow pointer-events-none
            px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
              <span>{`${idx + 1}. ${p.name} — ${Math.round((p.score ?? 0) * 100)}%`}</span>
              <img src={`/assets/nodes/${p.icon}`} alt={p.name} className="w-8 h-8" />
            </li>
          ))}
        </ul>
      </section>
      <div className="flex-1"></div>
      <button
        className="relative h-12 w-80 bottom-6 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5"
        onClick={onRestart}
      >
        Back to Lobby
      </button>
    </div>
  );
}
