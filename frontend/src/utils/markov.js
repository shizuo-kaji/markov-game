// Row-vector convention throughout: x_next = x P, πP = π.
export const EPSILON = 0.01;
export const COLORS = [
  "#ea7952",
  "#4789c8",
  "#a175c4",
  "#d4a42f",
  "#278f83",
  "#b9688c",
  "#6b8190",
  "#67885b",
  "#a17b55",
  "#607393",
];
export const percent = (value) => `${(value * 100).toFixed(1)}%`;
export const signed = (value) => `${value > 0 ? "+" : ""}${value}`;
export const uniform = (n) => Array(n).fill(1 / n);

export function buildTransitionMatrix(matrix, alpha = 1, epsilon = EPSILON) {
  const n = matrix.length;
  if (
    !n ||
    matrix.some(
      (row) =>
        row.length !== n || row.some((w) => !Number.isFinite(w) || w < 0),
    )
  ) {
    throw new Error("Weights must form a nonnegative square matrix.");
  }
  return matrix.map((row) => {
    const sum = row.reduce((a, b) => a + b, 0) + n * epsilon;
    return row.map(
      (w) => alpha * (sum ? (w + epsilon) / sum : 1 / n) + (1 - alpha) / n,
    );
  });
}

export function stepDistribution(distribution, transition) {
  return distribution.map((_, j) =>
    distribution.reduce((sum, value, i) => sum + value * transition[i][j], 0),
  );
}

export function totalVariation(a, b) {
  return a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / 2;
}

export function stationaryDistribution(transition) {
  const n = transition.length;
  const a = transition.map((_, i) => [
    ...transition.map((row, j) => row[i] - Number(i === j)),
    0,
  ]);
  a[n - 1] = [...Array(n).fill(1), 1];
  // Partial pivoting for stable, fast solves even when convergence is very slow.
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col];
    if (Math.abs(divisor) < 1e-14)
      throw new Error("Stationary distribution is not unique.");
    for (let j = col; j <= n; j++) a[col][j] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
    }
  }
  const values = a.map((row) => Math.max(0, row[n]));
  const sum = values.reduce((a, b) => a + b, 0);
  return values.map((value) => value / sum);
}

export function applyMoves(matrix, nodes, moves) {
  const next = matrix.map((row) => [...row]);
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  for (const move of moves)
    next[index.get(move.source)][index.get(move.target)] += move.delta;
  return next.map((row) => row.map((value) => Math.max(0, value)));
}

export function initialMatrix(players = 2, neutrals = 2) {
  return Array.from({ length: players + neutrals }, (_, i) =>
    Array.from({ length: players + neutrals }, (_, j) =>
      i === j ? 0 : i < players !== j < players ? 2 : 1,
    ),
  );
}

export function sampleDestination(row, random = Math.random) {
  const value = random();
  let sum = 0;
  for (let i = 0; i < row.length; i++) {
    sum += row[i];
    if (value < sum) return i;
  }
  return row.length - 1;
}
