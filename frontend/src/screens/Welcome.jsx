import React, { useState } from "react";
import Help from "../components/Help.jsx";

export default function Welcome({ rooms, onEnterRoom, onDeleteRoom, onCreateRoom, serverStatus, onRetryConnection }) {
  const [showHelp, setShowHelp] = useState(false);

  const statusConfig = {
    connecting: { text: "Waking up server...", color: "text-yellow-400", icon: "⏳" },
    online: { text: "Server online", color: "text-green-400", icon: "✓" },
    offline: { text: "Server offline", color: "text-red-400", icon: "✗" },
  };
  const status = statusConfig[serverStatus] || statusConfig.connecting;

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

        {/* Server status indicator */}
        <div className={`flex items-center gap-2 p-2 rounded ${status.color}`}>
          <span>{status.icon}</span>
          <span className="text-sm">{status.text}</span>
          {serverStatus === "offline" && (
            <button
              onClick={onRetryConnection}
              className="ml-2 px-2 py-1 text-xs bg-stone-700 hover:bg-stone-600 rounded"
            >
              Retry
            </button>
          )}
        </div>

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
        <div className="flex gap-4 mb-2">
          <button onClick={() => setShowHelp(true)}>
            Help
          </button>
          <a
            href="https://github.com/shizuo-kaji/markov-game"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-300 hover:text-white"
          >
            GitHub
          </a>
        </div>
        {showHelp && (
          <Help onReturn={() => setShowHelp(false)} />
        )}
        <button
          className={`relative h-12 bottom-2 rounded p-2 font-bold active:translate-y-0.5 ${
            serverStatus === "online"
              ? "bg-amber-300 text-orange-900 hover:bg-amber-400"
              : "bg-stone-500 text-stone-300 cursor-not-allowed"
          }`}
          onClick={onCreateRoom}
          disabled={serverStatus !== "online"}
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