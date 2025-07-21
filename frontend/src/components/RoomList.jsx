import React from "react";

export default function RoomList({
  rooms,
  playerSelections,
  setPlayerSelections,
  onJoin,
  onDelete
}) {
  if (rooms.length === 0) {
    return <p className="text-center mt-4">No rooms available. Create one!</p>;
  }

  return (
    <div className="p-4">
      <ul>
        {rooms.map(room => (
          <li
            key={room.id}
            className="flex items-center justify-between bg-emerald-900 rounded p-2 hover:bg-emerald-700 mb-2"
          >
            <span className="flex-1 ml-2 text-white font-bold">
              {room.name} ({room.num_players_N})
            </span>
            <select
              className="mx-2 p-1 bg-stone-200 rounded border border-gray-300"
              value={playerSelections[room.id] || ""}
              onChange={e =>
                setPlayerSelections({
                  ...playerSelections,
                  [room.id]: e.target.value
                })
              }
            >
              <option value="" disabled>
                Select Player
              </option>
              {Array.from({ length: room.num_players_N }, (_, i) => (
                <option key={i} value={i}>
                  Player-{i + 1}
                </option>
              ))}
            </select>
            <button
              className="bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5 mx-2"
              onClick={() => onJoin(room, playerSelections[room.id])}
            >
              Join
            </button>
            <button
              className="flex-shrink-0 ml-2 text-red-300 hover:text-red-500 p-1"
              onClick={() => onDelete(room.id)}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
