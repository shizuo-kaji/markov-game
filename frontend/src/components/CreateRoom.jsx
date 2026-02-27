import React, { useState, useEffect } from "react";
// range constraints for inputs
const N_MIN = 1;
const N_MAX = 9;
const M_MIN = 0;
const M_MAX = 9;
const K_MIN = 1;
const K_MAX = 100;
const S_MIN = 1;
const S_MAX = 10;

function NumberStepper({ label, value, min, max, onChange }) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className="flex flex-col gap-1 text-sm font-semibold">
      <span>{label}</span>
      <div className="flex items-center rounded border border-gray-300 bg-stone-200 text-black">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={!canDecrease}
          className="h-10 w-10 rounded-l bg-stone-300 text-lg font-bold hover:bg-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="flex h-10 flex-1 items-center justify-center border-x border-gray-300 text-base font-bold">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={!canIncrease}
          className="h-10 w-10 rounded-r bg-stone-300 text-lg font-bold hover:bg-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      <span className="text-[11px] text-stone-200/80">Range: {min} - {max}</span>
    </div>
  );
}

export default function CreateRoom({ onCreate, loading = false }) {
  const [name, setName] = useState("My Room");
  const [N, setN] = useState(2);
  const [M, setM] = useState(1);
  const [K, setK] = useState(5);
  const [S, setS] = useState(2);
  const [aiFlags, setAiFlags] = useState(() => Array(2).fill(false));

  useEffect(() => {
    setAiFlags(prev => {
      const trimmed = prev.slice(0, N);
      if (trimmed.length < N) {
        return trimmed.concat(Array(N - trimmed.length).fill(false));
      }
      return trimmed;
    });
  }, [N]);

  const clampNumber = (value, min, max, fallback) => {
    if (Number.isNaN(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  };

  const stepValue = (setter, min, max, fallback) => (nextValue) => {
    setter(prev => {
      const base = Number.isFinite(prev) ? prev : fallback;
      const target = Number.isFinite(nextValue) ? nextValue : base;
      return Math.max(min, Math.min(max, target));
    });
  };

  const setPlayers = stepValue(setN, N_MIN, N_MAX, 2);
  const setNeutrals = stepValue(setM, M_MIN, M_MAX, 1);
  const setPoints = stepValue(setK, K_MIN, K_MAX, 5);
  const setRounds = stepValue(setS, S_MIN, S_MAX, 2);

  const handleSubmit = e => {
    e.preventDefault();
    if (loading) return;
    // Validate and clamp values on submit
    const validN = clampNumber(N, N_MIN, N_MAX, 2);
    const validM = clampNumber(M, M_MIN, M_MAX, 1);
    const validK = clampNumber(K, K_MIN, K_MAX, 5);
    const validS = clampNumber(S, S_MIN, S_MAX, 2);
    const aiPositions = aiFlags.slice(0, validN).reduce((acc, isAi, idx) => {
      if (isAi) acc.push(idx + 1); // backend expects 1-based positions
      return acc;
    }, []);
    onCreate({
      name,
      num_players_N: validN,
      num_non_player_nodes_M: validM,
      points_per_round_K: validK,
      max_turns_S: validS,
      ai_player_positions: aiPositions
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div>
        <h2 className="text-2xl font-bold font-serif drop-shadow">Create New Room</h2>
        <p className="text-sm text-stone-200/80">
          Tune the parameters below and optionally assign AI teammates or rivals.
        </p>
      </div>
      <form className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          <span>Name</span>
          <input
            className="p-2 bg-stone-200 rounded border border-gray-300 text-black"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberStepper label="Players (N)" value={N} min={N_MIN} max={N_MAX} onChange={setPlayers} />
          <NumberStepper label="Neutral Nodes (M)" value={M} min={M_MIN} max={M_MAX} onChange={setNeutrals} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberStepper label="Points per Round (K)" value={K} min={K_MIN} max={K_MAX} onChange={setPoints} />
          <NumberStepper label="Rounds (S)" value={S} min={S_MIN} max={S_MAX} onChange={setRounds} />
        </div>

        <div className="rounded border border-emerald-500/40 bg-emerald-950/30 p-3">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>AI Players</span>
            <span className="text-xs text-emerald-100/80">
              {aiFlags.filter(Boolean).length}/{N} slots
            </span>
          </div>
          <p className="text-xs text-stone-200/80 mb-2">Toggle any slot to let the computer control that player.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: N }, (_, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2 rounded border border-emerald-400/40 bg-emerald-900/20 px-2 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-400"
                  checked={!!aiFlags[idx]}
                  onChange={() =>
                    setAiFlags(prev => {
                      const next = [...prev];
                      next[idx] = !next[idx];
                      return next;
                    })
                  }
                />
                <span>Player {idx + 1}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-2 h-12 rounded p-2 font-bold ${
            loading
              ? 'bg-amber-200 text-orange-700 cursor-wait'
              : 'bg-amber-300 text-orange-900 hover:bg-amber-400 active:translate-y-0.5'
          }`}
        >
          {loading ? 'CREATING...' : 'CREATE ROOM'}
        </button>
      </form>
    </div>
  );
}
