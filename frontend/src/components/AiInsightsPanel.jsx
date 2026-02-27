import { useMemo, useState } from "react";

export default function AiInsightsPanel({
  aiPlayers = [],
  notesByPlayer = {},
  previousRound = null,
  emptyMessage = "No AI insights yet.",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(true);

  const entries = useMemo(
    () =>
      aiPlayers.map((player) => ({
        player,
        notes: notesByPlayer[player.id] || []
      })),
    [aiPlayers, notesByPlayer]
  );

  const hasEntries = entries.some((entry) => entry.notes.length > 0);

  if (!aiPlayers.length) return null;

  return (
    <section
      className={`mx-3 mb-2 rounded-lg border border-emerald-500/50 bg-emerald-900/20 px-3 py-2 text-xs text-white/90 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-emerald-200">
          AI Insights
          {previousRound ? ` (Round ${previousRound})` : ""}
        </h2>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded border border-emerald-300/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-700/30"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen &&
        (hasEntries ? (
          <ul className="mt-1 space-y-1">
            {entries.map(({ player, notes }) => (
              <li key={player.id}>
                <span className="font-semibold">{player.name}:</span>{" "}
                {notes.length ? notes.join(" / ") : "No insight from previous round."}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 italic">{emptyMessage}</p>
        ))}
    </section>
  );
}
