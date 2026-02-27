export function getPreviousRoundAiNotes(room) {
  const currentTurn = Number(room?.turn ?? 1);
  const previousRound = currentTurn - 1;

  if (previousRound < 1) {
    return { previousRound: null, notesByPlayer: {} };
  }

  const movesHistory = room?.moves_history || {};
  const moves =
    movesHistory[previousRound] ||
    movesHistory[String(previousRound)] ||
    [];

  const notesByPlayer = {};
  for (const move of moves) {
    const note = typeof move.note === "string" ? move.note.trim() : "";
    if (!note) continue;
    if (!notesByPlayer[move.player_id]) {
      notesByPlayer[move.player_id] = [];
    }
    if (!notesByPlayer[move.player_id].includes(note)) {
      notesByPlayer[move.player_id].push(note);
    }
  }

  return { previousRound, notesByPlayer };
}
