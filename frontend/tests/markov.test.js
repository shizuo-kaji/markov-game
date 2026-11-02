import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyMoves,
  buildTransitionMatrix,
  stationaryDistribution,
  stepDistribution,
  totalVariation,
  uniform,
  sampleDestination,
} from "../src/utils/markov.js";
const cases = JSON.parse(
  readFileSync(new URL("../../tests/markov-cases.json", import.meta.url)),
);
for (const scenario of cases)
  test(`${scenario.name}: conservation, fixed point, convergence`, () => {
    const transition = buildTransitionMatrix(scenario.weights, scenario.alpha);
    transition.forEach((row) => {
      assert.ok(row.every((p) => p > 0));
      assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    });
    const stationary = stationaryDistribution(transition);
    assert.ok(stationary.every((p) => p >= 0 && p <= 1));
    assert.ok(Math.abs(stationary.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    assert.ok(
      totalVariation(stationary, stepDistribution(stationary, transition)) <
        1e-12,
    );
    for (const initial of [
      uniform(stationary.length),
      stationary.map((_, i) => Number(i === 0)),
    ]) {
      let distribution = initial;
      let previousDistance = totalVariation(distribution, stationary);
      for (let i = 0; i < 8000; i++) {
        distribution = stepDistribution(distribution, transition);
        const distance = totalVariation(distribution, stationary);
        assert.ok(distance <= previousDistance + 1e-12);
        previousDistance = distance;
      }
      assert.ok(totalVariation(distribution, stationary) < 1e-10);
    }
  });
test("two-state stationary distribution agrees with analytic answer", () => {
  const p = buildTransitionMatrix([
    [3, 2],
    [7, 1],
  ]);
  const expected = p[1][0] / (p[0][1] + p[1][0]);
  assert.ok(Math.abs(stationaryDistribution(p)[0] - expected) < 1e-12);
});
test("weight ratios are normalized after adding epsilon to every entry", () => {
  const p = buildTransitionMatrix([
    [0, 2],
    [0, 0],
  ]);
  assert.ok(Math.abs(p[0][1] - 2.01 / 2.02) < 1e-12);
  assert.deepEqual(p[1], [0.5, 0.5]);
});
test("PageRank alpha zero gives uniform distribution regardless of the graph", () => {
  assert.deepEqual(
    stationaryDistribution(
      buildTransitionMatrix(
        [
          [20, 0],
          [1, 0],
        ],
        0,
      ),
    ),
    [0.5, 0.5],
  );
});
test("drafts leave the public board unchanged and floor combined weights at zero", () => {
  const matrix = [
    [0, 2],
    [3, 0],
  ];
  const nodes = [{ id: "a" }, { id: "b" }];
  const result = applyMoves(matrix, nodes, [
    { source: "a", target: "b", delta: -3 },
  ]);
  assert.deepEqual(result, [
    [0, 0],
    [3, 0],
  ]);
  assert.deepEqual(matrix, [
    [0, 2],
    [3, 0],
  ]);
});
test("random walkers follow cumulative transition probabilities", () => {
  const row = [0.2, 0.3, 0.5];
  assert.equal(
    sampleDestination(row, () => 0),
    0,
  );
  assert.equal(
    sampleDestination(row, () => 0.2),
    1,
  );
  assert.equal(
    sampleDestination(row, () => 0.499),
    1,
  );
  assert.equal(
    sampleDestination(row, () => 0.5),
    2,
  );
  assert.equal(
    sampleDestination(row, () => 0.9999),
    2,
  );
});
