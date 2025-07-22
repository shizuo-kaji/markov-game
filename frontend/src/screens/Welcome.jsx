import React, { useState } from "react";
import Help from "../components/Help.jsx";

export default function Welcome({ rooms, onEnterRoom, onDeleteRoom, onCreateRoom }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div 
      className="appWelcome"
    >
      {/* Left panel */}
      <aside className="sidePanel">
        <h1 className="
          text-5xl 
          p-2 
          font-bold font-serif 
          drop-shadow"
        > Markovian<br />Royale </h1>
        <img src={"/assets/background/game_clean.png"} alt="logo" className="w-80 h-80" />

        {rooms.map(r => (
          <div
            key={r.id}
            className="flex items-center h-12 justify-between bg-emerald-900 rounded p-2 hover:bg-emerald-700"
          >
            <button
              className="flex-1 ml-2 text-left text-white font-bold"
              onClick={() => onEnterRoom(r)}
            >
              {r.name}
            </button>
            <button
              className="ml-2 text-red-300 hover:text-red-500 p-1"
              onClick={() => onDeleteRoom(r.id)}
              aria-label="Delete room"
            >
              🗑️
            </button>
          </div>
        ))}

        <div className="flex-1"></div>
        <button onClick={() => setShowHelp(true)}>
        ❔ Help
        </button>
        {showHelp && (
          <Help onReturn={() => setShowHelp(false)} />
        )}
        <button
          className="relative h-12 bottom-2 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5"
          onClick={onCreateRoom}
        >
          CREATE NEW ROOM
        </button>
      </aside>

      {/* Placeholder map */}
      <main className="flex-1 relative">
      </main>
    </div>
  );
}