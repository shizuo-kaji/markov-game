import React, { useState, useEffect } from 'react';
import ReturnButton from '../components/ReturnButton.jsx';

export default function RoomLobby({ room, onStart, onSpectate, onReturn, onDeleteRoom, onRenamePlayer, onGameOver }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const selectedPlayer = room.players.find(p => p.id === selectedPlayerId);
  const canStart = Boolean(selectedPlayerId && !selectedPlayer?.is_ai);
  const aiNotesMap = room.ai_move_notes || {};

  // if game already finished, navigate immediately to Trophy
  useEffect(() => {
    if (room.turn > room.max_turns_S) onGameOver();
  }, [room, onGameOver]);

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
          {room.players.map((p) => {
            const isSelected = selectedPlayerId === p.id;
            return (
              <div
                key={p.id}
                className={`flex items-center h-12 justify-between ${
                  isSelected ? 'bg-emerald-200' : 'bg-emerald-800'
                } rounded p-2 mb-2`}
              >
                <button
                  className={`flex-1 ml-2 font-bold text-left ${
                    isSelected ? 'text-emerald-900 text-[20px]' : 'text-white'
                  } ${p.is_ai ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={p.is_ai}
                  onClick={() => {
                    if (!p.is_ai) setSelectedPlayerId(p.id);
                  }}
                  title={p.is_ai ? 'AI players are computer-controlled' : 'Select this player'}
                >
                  {p.name}
                </button>
                {p.is_ai && (
                  <span
                    className="text-xs text-amber-300 font-semibold mr-2"
                    title={aiNotesMap[p.id]?.join(' / ') || 'AI controlled player'}
                  >
                    🤖 AI
                  </span>
                )}
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
            );
          })}
        </div>

        <div className="flex-1"></div>

        {/* Start Game button */}
        <button
          className="relative h-12 bottom-2 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5 disabled:opacity-20"
          disabled={!canStart}
          onClick={() => canStart && onStart(selectedPlayerId)}
        >
          START GAME
        </button>

        {/* Spectator button */}
        <button
          className="relative h-10 bottom-2 bg-stone-500 text-white rounded p-2 font-semibold hover:bg-stone-600 active:translate-y-0.5"
          onClick={() => onSpectate?.()}
        >
          JOIN AS SPECTATOR
        </button>
      </aside>

      <ReturnButton onClick={onReturn} />
    </div>
  );
}
