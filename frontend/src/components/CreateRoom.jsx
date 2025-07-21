import React, { useState } from "react";
// range constraints for inputs
const N_MIN = 1;
const N_MAX = 9;
const M_MIN = 0;
const M_MAX = 9;
const K_MIN = 1;
const K_MAX = 100;
const S_MIN = 1;
const S_MAX = 10;

export default function CreateRoom({ onCreate }) {
  const [name, setName] = useState("My Room");
  const [N, setN] = useState(1);
  const [M, setM] = useState(1);
  const [K, setK] = useState(10);
  const [S, setS] = useState(1);

  const handleSubmit = e => {
    e.preventDefault();
    onCreate({
      name,
      num_players_N: N,
      num_non_player_nodes_M: M,
      points_per_round_K: K,
      max_turns_S: S
    });
    setName("");
  };

  return (
    <div className="flex flex-col h-screen">
      <hr className="border-t border-gray-300 my-4" />
      <h2 className="text-2xl font-bold font-serif drop-shadow">
        Create New Room
      </h2>
      <hr className="border-t border-gray-300 my-4" />
      <form className="flex flex-col flex-1" onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-col">
          <label className="mb-1 font-semibold">Name:</label>
          <input
            className="p-2 bg-stone-200 rounded border border-gray-300 text-black text-center"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4 flex flex-col">
          <label className="mb-1 font-semibold">Players:</label>
          <div className="flex items-center w-full min-w-0">
            <button
              type="button"
              onClick={() => setN(prev => Math.max(N_MIN, prev - 1))}
              className="bg-stone-200 border border-gray-300 rounded-l-lg px-3 h-10 hover:bg-stone-300 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h16"
                />
              </svg>
            </button>
            <input
              type="number"
              min={N_MIN}
              max={N_MAX}
              step={1}
              value={N}
              onChange={e => setN(parseInt(e.target.value, 10))}
              className="flex-1 w-full text-center bg-stone-200 border-t border-b border-gray-300 h-10 focus:ring-2 focus:ring-blue-500 text-black outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setN(prev => Math.min(N_MAX, prev + 1))}
              className="bg-stone-200 border border-gray-300 rounded-r-lg px-3 h-10 hover:bg-stone-300 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 1v16M1 9h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col">
          <label className="mb-1 font-semibold">Neutral areas:</label>
          <div className="flex items-center w-full min-w-0">
            <button
              type="button"
              onClick={() => setM(prev => Math.max(M_MIN, prev - 1))}
              className="bg-stone-200 border border-gray-300 rounded-l-lg px-3 h-10 hover:bg-stone-300 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h16"
                />
              </svg>
            </button>
            <input
              type="number"
              min={M_MIN}
              max={M_MAX}
              step={1}
              value={M}
              onChange={e => setM(parseInt(e.target.value, 10))}
              className="flex-1 w-full text-center bg-stone-200 border-t border-b border-gray-300 h-10 focus:ring-2 focus:ring-blue-500 text-black outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setM(prev => Math.min(M_MAX, prev + 1))}
              className="bg-stone-200 border border-gray-300 rounded-r-lg px-3 h-10 hover:bg-stone-300 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 1v16M1 9h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col">
          <label className="mb-1 font-semibold">Points per round:</label>
          <div className="flex items-center w-full min-w-0">
            <button
              type="button"
              onClick={() => setK(prev => Math.max(K_MIN, prev - 5))}
              className="
                bg-stone-200 border border-gray-300 
                rounded-l-lg px-3 h-10
                hover:bg-stone-300 focus:ring-2 focus:ring-blue-500
                flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h16"
                />
              </svg>
            </button>

            <input
              type="number"
              min={K_MIN}
              max={K_MAX}
              step={1}
              value={K}
              onChange={e => setK(e.target.valueAsNumber || 1)}
              className="flex-1 w-full text-center bg-stone-200 border-t border-b border-gray-300 h-10 focus:ring-2 focus:ring-blue-500 text-black outline-none"
            />

            <button
              type="button"
              onClick={() => setK(prev => Math.min(K_MAX,
                prev === K_MIN
                  ? (Math.floor(K_MIN / 5) + 1) * 5
                  : prev + 5
              ))}
              className="
                bg-stone-200 border border-gray-300 
                rounded-r-lg px-3 h-10
                hover:bg-stone-300 focus:ring-2 focus:ring-blue-500
                flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 1v16M1 9h16"
                />
              </svg>
            </button>
          </div>
        </div>


        <div className="mb-6 flex flex-col">
          <label className="mb-1 font-semibold">Rounds:</label>
          <div className="flex items-center w-full min-w-0">
            <button
              type="button"
              onClick={() => setS(prev => Math.max(S_MIN, prev - 1))}
              className="bg-stone-200 border border-gray-300 rounded-l-lg px-3 h-10 hover:bg-stone-300 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 2"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h16"
                />
              </svg>
            </button>
            <input
              type="number"
              min={S_MIN}
              max={S_MAX}
              step={1}
              value={S}
              onChange={e => setS(parseInt(e.target.value, 10))}
              className="flex-1 w-full text-center bg-stone-200 border-t border-b border-gray-300 h-10 focus:ring-2 focus:ring-blue-500 text-black outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setS(prev => Math.min(S_MAX, prev + 1))}
              className="bg-stone-200 border border-gray-300 rounded-r-lg px-3 h-10 hover:bg-stone-300 focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 1v16M1 9h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1"></div>

        <button
          type="submit"
          className="relative h-12 bottom-2 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5"
        >
          CREATE ROOM
        </button>
      </form>
    </div>
  );
}
