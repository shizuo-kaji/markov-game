export const CONVERGENCE_DEMO_INITIAL_DELAY_MS = 450;
export const CONVERGENCE_DEMO_STEP_DURATION_MS = 600;
export const CONVERGENCE_DEMO_STEP_COUNT = 6;
export const CONVERGENCE_DEMO_FINAL_DELAY_MS = 450;
export const CONVERGENCE_DEMO_TOTAL_DURATION_MS =
  CONVERGENCE_DEMO_INITIAL_DELAY_MS
  + CONVERGENCE_DEMO_STEP_DURATION_MS * CONVERGENCE_DEMO_STEP_COUNT
  + CONVERGENCE_DEMO_FINAL_DELAY_MS;

export function buildTransitionMatrix(adjMatrix) {
  if (!Array.isArray(adjMatrix) || adjMatrix.length === 0) {
    return null;
  }

  return adjMatrix.map((row, rowIndex) => {
    const numericRow = Array.isArray(row)
      ? row.map((value) => Math.max(0, Number(value ?? 0)))
      : [];
    const rowSum = numericRow.reduce((sum, value) => sum + value, 0);

    if (rowSum <= 0) {
      return numericRow.map((_, colIndex) => (colIndex === rowIndex ? 1 : 0));
    }

    return numericRow.map((value) => value / rowSum);
  });
}

export function computeStationaryScores(adjMatrix, nodeIds) {
  if (!adjMatrix || adjMatrix.length === 0 || !nodeIds || nodeIds.length !== adjMatrix.length) {
    return null;
  }

  const transition = buildTransitionMatrix(adjMatrix);
  if (!transition) return null;

  const n = transition.length;
  let dist = Array(n).fill(1 / n);

  for (let iter = 0; iter < 400; iter += 1) {
    const next = Array(n).fill(0);
    for (let col = 0; col < n; col += 1) {
      let value = 0;
      for (let row = 0; row < n; row += 1) {
        value += dist[row] * transition[row][col];
      }
      next[col] = value;
    }

    const diff = next.reduce((sum, value, idx) => sum + Math.abs(value - dist[idx]), 0);
    dist = next;
    if (diff < 1e-11) break;
  }

  const total = dist.reduce((sum, value) => sum + value, 0) || 1;
  const normalized = dist.map((value) => value / total);

  return nodeIds.reduce((scores, nodeId, idx) => {
    scores[nodeId] = normalized[idx];
    return scores;
  }, {});
}

