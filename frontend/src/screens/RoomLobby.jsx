import React, { useState } from 'react';
import ReturnButton from '../components/ReturnButton.jsx';

export default function RoomLobby({ room, onStart, onReturn, onDeleteRoom, onRenamePlayer }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

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
        {/* Room title card */}
        <div className="flex items-center h-12 justify-between bg-emerald-600/20 rounded p-2 hover:bg-emerald-600 mb-2">
          <span className="flex-1 ml-2 text-white font-bold text-lg">{room.name}</span>
          <button
            className="flex-shrink-0 text-red-300 hover:text-red-500 ml-2"
            onClick={() => onDeleteRoom(room.id)}
            aria-label="Delete room"
          >
            🗑️
          </button>
        </div>

        {/* Room details */}
        <div className="text-sm space-y-1">
          <p>Players: {room.num_players_N} | Neutral areas: {room.num_non_player_nodes_M}</p>
          <p>Points: {room.points_per_round_K} | Rounds: {room.max_turns_S}</p>
        </div>

        {/* Player selection with rename option */}
        <div className="pt-4 space-y-2">
          <h3 className="font-bold">Select your player:</h3>
          {room.players.map((p) => (
          <div
            key={p.id}
            className={`flex items-center h-12 justify-between ${
              selectedPlayerId === p.id ? 'bg-emerald-200' : 'bg-emerald-800'
            } rounded p-2 mb-2`}
          >
              <button
                className={`flex-1 ml-2 font-bold ${selectedPlayerId === p.id ? 'text-emerald-900 text-[20px]' : 'text-white'}`}
                onClick={() => setSelectedPlayerId(p.id)}
              >
                {p.name}
              </button>
              <button
                type="button"
                className="flex-shrink-0 ml-2 text-white hover:text-gray-200"
                onClick={() => {
                  const newName = window.prompt('Enter new name for ' + p.name, p.name);
                  console.log('Renaming player:', p.id, 'to', newName);
                  if (newName && newName !== p.name) {
                    onRenamePlayer?.(p.id, newName);
                  }
                }}
                title="Rename player"
              >
                ✏️
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* Start Game button */}
        <button
          className="relative h-12 bottom-2 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5 disabled:opacity-20"
          disabled={!selectedPlayerId}
          onClick={() => onStart(selectedPlayerId)}
        >
          START GAME
        </button>
      </aside>

      <ReturnButton onClick={onReturn} />
    </div>
  );
}