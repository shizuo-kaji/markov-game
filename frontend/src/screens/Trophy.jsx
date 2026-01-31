import { useState, useMemo } from "react";
import { useApi } from '../../apiConfig.js';
import Board from "../components/Board.jsx";


export default function Trophy({ onRestart, room }) {
  const apiBase = useApi();
  const [selectedTurn, setSelectedTurn] = useState(room.max_turns_S); // Start at final turn
  const [showReview, setShowReview] = useState(false);

  // sort players by score descending for ranking
  const sortedPlayers = [...room.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sortedPlayers[0];

  // Get all turns as array (room.turns is an object keyed by turn number)
  const turnsArray = useMemo(() => {
    if (!room.turns) return [];
    return Object.entries(room.turns)
      .map(([turnNum, turnData]) => ({ turnNum: parseInt(turnNum), ...turnData }))
      .sort((a, b) => a.turnNum - b.turnNum);
  }, [room.turns]);

  // Get moves history (room.moves_history contains moves grouped by turn)
  const movesHistory = room.moves_history || {};

  // Compute scores for each turn based on adjacency matrix
  const computeScoresFromMatrix = (adjMatrix, nodeCount) => {
    if (!adjMatrix || adjMatrix.length === 0) return null;
    // Normalize columns to create transition matrix
    const n = adjMatrix.length;
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += adjMatrix[i][j];
      }
    }
    // Compute stationary distribution (simplified: use column sums as proxy)
    const total = colSums.reduce((a, b) => a + b, 0);
    if (total === 0) return Array(n).fill(1 / n);
    return colSums.map(s => s / total);
  };

  // Get scores at selected turn
  const scoresAtTurn = useMemo(() => {
    const turnData = room.turns?.[selectedTurn];
    if (!turnData?.adj_matrix) return null;
    return computeScoresFromMatrix(turnData.adj_matrix, room.nodes?.length || 0);
  }, [selectedTurn, room.turns, room.nodes]);

  // Create a modified room object for the selected turn
  const roomAtTurn = useMemo(() => {
    if (!showReview) return room;
    const turnData = room.turns?.[selectedTurn];
    if (!turnData) return room;

    // Update player/neutral scores if we have computed scores
    const updatedPlayers = room.players.map((p, idx) => ({
      ...p,
      score: scoresAtTurn ? scoresAtTurn[idx] : p.score
    }));
    const updatedNeutrals = room.neutrals.map((n, idx) => ({
      ...n,
      score: scoresAtTurn ? scoresAtTurn[room.players.length + idx] : n.score
    }));
    const updatedNodes = [
      ...updatedPlayers.map(p => ({
        id: p.id, name: p.name, icon: p.icon,
        x: p.x_str, y: p.y_str, score: p.score,
        out_deg: p.out_deg, in_deg: p.in_deg
      })),
      ...updatedNeutrals.map(n => ({
        id: n.id, name: n.name, icon: n.icon,
        x: n.x_str, y: n.y_str, score: n.score,
        out_deg: n.out_deg, in_deg: n.in_deg
      }))
    ];

    return {
      ...room,
      players: updatedPlayers,
      neutrals: updatedNeutrals,
      nodes: updatedNodes,
      turn: selectedTurn
    };
  }, [showReview, selectedTurn, room, scoresAtTurn]);

  // Get moves for the selected turn
  const movesAtTurn = useMemo(() => {
    return movesHistory[selectedTurn] || [];
  }, [movesHistory, selectedTurn]);

  // Helper to get node name by id
  const getNodeName = (nodeId) => {
    const node = room.nodes?.find(n => n.id === nodeId);
    return node?.name || `Node ${nodeId}`;
  };

  return (
    <div className="appBackground">
      <header className="bg-stone-100/80">
        <h1 className="font-bold text-center text-xl p-2">
          {showReview ? `Review - Round ${selectedTurn}` : 'Game Over'}
        </h1>
        <section className="text-center p-2">
          {/* Display player scores */}
          {(showReview ? roomAtTurn.players : room.players).map((p) => {
            const noteText = p.is_ai ? (room.ai_move_notes?.[p.id]?.join(' / ') || 'AI controlled player') : '';
            return (
            <span key={p.id}
              className="
                inline-flex items-center
                bg-stone-100/90 rounded-lg border-2 border-black
                px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
              <img src={`/assets/nodes/${p.icon}`}
                alt={p.name} className="w-6 h-6" />
              {p.is_ai && <span className="text-xs" title={noteText}>🤖</span>}
              <span className="leading-none">
                {Math.round((p.score ?? 0) * 100)}%
              </span>
            </span>
          );})}
        </section>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden">
        <Board
          as="section"
          className="relative flex-[6] border-t-2 border-b-2"
          nodes={roomAtTurn.nodes}
          currentRoom={roomAtTurn}
          playMode={showReview ? "review" : undefined}
        />

        {showReview ? (
          /* Review Mode - Turn history */
          <section className="flex-[4] bg-stone-800/90 overflow-y-auto p-3">
            {/* Turn selector */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-white text-sm">Round:</span>
              <div className="flex gap-1">
                {Array.from({ length: room.max_turns_S }, (_, i) => i + 1).map(turn => (
                  <button
                    key={turn}
                    onClick={() => setSelectedTurn(turn)}
                    className={`w-8 h-8 rounded font-bold text-sm ${
                      selectedTurn === turn
                        ? 'bg-amber-400 text-amber-900'
                        : 'bg-stone-600 text-white hover:bg-stone-500'
                    }`}
                  >
                    {turn}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="ml-auto px-3 py-1 bg-stone-600 text-white text-sm rounded hover:bg-stone-500"
              >
                Back to Results
              </button>
            </div>

            {/* Moves for this turn */}
            <h3 className="text-white font-semibold mb-2">Moves in Round {selectedTurn}</h3>
            {movesAtTurn.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {room.players.map(p => {
                  const playerMoves = movesAtTurn.filter(m => m.player_id === p.id);
                  return (
                    <div key={p.id} className="bg-stone-700/50 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <img src={`/assets/nodes/${p.icon}`} alt={p.name} className="w-4 h-4" />
                        <span className="text-white text-sm font-semibold">{p.name}</span>
                        {p.is_ai && <span className="text-xs text-amber-300">🤖</span>}
                      </div>
                      {playerMoves.length > 0 ? (
                        <ul className="text-xs text-stone-200 space-y-1">
                          {playerMoves.map((m, idx) => {
                            const isEndorse = m.weight_change >= 0;
                            return (
                              <li key={idx} className="flex items-center gap-1">
                                <span className={isEndorse ? 'text-green-400' : 'text-red-400'}>
                                  {isEndorse ? '+' : ''}{m.weight_change}
                                </span>
                                <span className="text-stone-400">
                                  {getNodeName(m.source)} → {getNodeName(m.target)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-stone-400 italic">No moves</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-stone-400 text-sm italic">No move data available for this turn</p>
            )}
          </section>
        ) : (
          /* Results Mode - Winner and ranking */
          <section className="flex-[4] overflow-y-auto p-3">
            <p className="text-4xl p-2">{winner?.name} 🏆</p>
            <ul className="space-y-2">
              {sortedPlayers.map((p, idx) => {
                const noteText = p.is_ai ? (room.ai_move_notes?.[p.id]?.join(' / ') || 'AI controlled player') : '';
                return (
                <li key={p.id} className="
                inline-flex items-center
                bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow pointer-events-none
                px-1 py-1 gap-1 mr-1 grid grid-flow-col auto-cols-max">
                  <span>{`${idx + 1}. ${p.name} — ${Math.round((p.score ?? 0) * 100)}%`}</span>
                  {p.is_ai && <span className="text-xs" title={noteText}>🤖</span>}
                  <img src={`/assets/nodes/${p.icon}`} alt={p.name} className="w-8 h-8" />
                </li>
              );})}
            </ul>
          </section>
        )}
      </main>

      <footer className="h-20 flex justify-center items-center gap-4 bg-stone-100/80 p-4">
        {!showReview && (
          <button
            className="relative h-12 px-6 bg-stone-500 text-white rounded p-2 font-bold hover:bg-stone-600 active:translate-y-0.5"
            onClick={() => setShowReview(true)}
          >
            Review Game
          </button>
        )}
        <button
          className="relative h-12 px-6 bg-amber-300 text-orange-900 rounded p-2 font-bold hover:bg-amber-400 active:translate-y-0.5"
          onClick={onRestart}
        >
          Back to Lobby
        </button>
      </footer>
    </div>
  );
}
