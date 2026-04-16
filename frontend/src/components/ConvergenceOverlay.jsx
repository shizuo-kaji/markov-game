import React, { useEffect, useMemo, useState } from "react";
import {
  CONVERGENCE_DEMO_INITIAL_DELAY_MS,
  CONVERGENCE_DEMO_STEP_COUNT,
  CONVERGENCE_DEMO_STEP_DURATION_MS,
  buildTransitionMatrix,
  computeStationaryScores,
} from "../utils/markov.js";

const PARTICLE_COLORS = [
  "rgba(249, 115, 22, 0.95)",
  "rgba(59, 130, 246, 0.95)",
  "rgba(16, 185, 129, 0.95)",
  "rgba(236, 72, 153, 0.95)",
  "rgba(245, 158, 11, 0.95)",
  "rgba(139, 92, 246, 0.95)",
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_PARTICLE_COUNT = 240;
const MAX_PARTICLE_COUNT = 480;
const PARTICLES_PER_NODE = 56;
const MIN_RESERVOIR_PARTICLE_COUNT = 180;
const MAX_RESERVOIR_PARTICLE_COUNT = 360;
const RESERVOIR_PARTICLES_PER_NODE = 40;
const PARTICLE_RADIUS = 2.85;
const RESERVOIR_PARTICLE_RADIUS = 2.15;
const PARTICLE_STAGGER_WINDOW = 0.82;

const fract = (value) => value - Math.floor(value);

const seededNoise = (seed, salt = 0) =>
  fract(Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453123);

function createQuadraticCurve(fromNode, toNode, offset = 46) {
  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);

  if (dist < 1e-6) {
    return { type: "loop", cx: x1, cy: y1, radius: 28 };
  }

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const curveOffset = Math.min(offset, dist * 0.42 + 8);
  const nx = -dy / dist;
  const ny = dx / dist;

  return {
    type: "quad",
    x1,
    y1,
    cx: midX + nx * curveOffset,
    cy: midY + ny * curveOffset,
    x2,
    y2,
  };
}

function pointOnCurve(curve, t) {
  if (curve.type === "loop") {
    const angle = -Math.PI / 2 + t * Math.PI * 2;
    return {
      x: curve.cx + Math.cos(angle) * curve.radius,
      y: curve.cy + Math.sin(angle) * curve.radius,
    };
  }

  const mt = 1 - t;
  return {
    x: mt * mt * curve.x1 + 2 * mt * t * curve.cx + t * t * curve.x2,
    y: mt * mt * curve.y1 + 2 * mt * t * curve.cy + t * t * curve.y2,
  };
}

function getNodeJitter(particleId, nodeIndex) {
  const angle = seededNoise(particleId + 1, nodeIndex + 1) * Math.PI * 2;
  const radius = 8 + seededNoise(particleId + 11, nodeIndex + 13) * 13;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function chooseTargetIndex(probabilities, particleId, stepIndex) {
  const row = Array.isArray(probabilities) ? probabilities : [];
  if (row.length === 0) return 0;

  const sample = seededNoise(particleId + 1, stepIndex + 1);
  let cumulative = 0;
  for (let idx = 0; idx < row.length; idx += 1) {
    cumulative += row[idx];
    if (sample <= cumulative + 1e-9) return idx;
  }
  return row.length - 1;
}

function advanceDistribution(distribution, transitionMatrix) {
  if (!Array.isArray(distribution) || !Array.isArray(transitionMatrix)) {
    return [];
  }

  return transitionMatrix[0].map((_, colIndex) => {
    let value = 0;
    for (let rowIndex = 0; rowIndex < distribution.length; rowIndex += 1) {
      value += (distribution[rowIndex] ?? 0) * (transitionMatrix[rowIndex]?.[colIndex] ?? 0);
    }
    return value;
  });
}

function interpolateDistribution(fromDistribution, toDistribution, progress) {
  return fromDistribution.map((value, index) => (
    value * (1 - progress) + (toDistribution[index] ?? 0) * progress
  ));
}

function allocateParticleCounts(distribution, totalCount) {
  if (!distribution.length || totalCount <= 0) {
    return distribution.map(() => 0);
  }

  const raw = distribution.map((value) => Math.max(0, value) * totalCount);
  const counts = raw.map((value) => Math.floor(value));
  let assigned = counts.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  let cursor = 0;
  while (assigned < totalCount && order.length > 0) {
    counts[order[cursor % order.length].index] += 1;
    assigned += 1;
    cursor += 1;
  }

  return counts;
}

function getReservoirOffset(localIndex, totalCount, nodeIndex) {
  const angle = localIndex * GOLDEN_ANGLE + nodeIndex * 0.31;
  const ringProgress = Math.sqrt((localIndex + 0.5) / Math.max(totalCount, 1));
  const radius = 18 + ringProgress * (16 + Math.sqrt(totalCount) * 1.7);

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function getProbabilityBadgeStyle(node) {
  switch (node.labelPlacement) {
    case "top":
      return { top: node.y + 26, left: node.x, transform: "translate(-50%, 0)" };
    case "left":
      return { top: node.y, left: node.x + 30, transform: "translate(0, -50%)" };
    case "right":
      return { top: node.y, left: node.x - 30, transform: "translate(-100%, -50%)" };
    default:
      return { top: node.y - 28, left: node.x, transform: "translate(-50%, -100%)" };
  }
}

export default function ConvergenceOverlay({
  active = false,
  demoId = null,
  nodes = [],
  room,
  turnKey,
}) {
  const [particles, setParticles] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("idle");

  const nodeSignature = useMemo(
    () =>
      nodes
        .map((node) => `${node.id}:${Math.round(node.x)}:${Math.round(node.y)}`)
        .join("|"),
    [nodes]
  );
  const adjMatrix = room?.turns?.[turnKey]?.adj_matrix ?? room?.turns?.[String(turnKey)]?.adj_matrix ?? null;
  const transitionMatrix = useMemo(() => buildTransitionMatrix(adjMatrix), [adjMatrix]);
  const particleCount = useMemo(
    () => Math.max(MIN_PARTICLE_COUNT, Math.min(MAX_PARTICLE_COUNT, nodes.length * PARTICLES_PER_NODE)),
    [nodes.length]
  );
  const reservoirParticleCount = useMemo(
    () => Math.max(
      MIN_RESERVOIR_PARTICLE_COUNT,
      Math.min(MAX_RESERVOIR_PARTICLE_COUNT, nodes.length * RESERVOIR_PARTICLES_PER_NODE)
    ),
    [nodes.length]
  );
  const initialParticles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, idx) => {
        const startIndex = nodes.length > 0 ? idx % nodes.length : 0;
        return {
          id: idx,
          homeIndex: startIndex,
          currentIndex: startIndex,
          startIndex,
          targetIndex: startIndex,
          progress: null,
        };
      }),
    [nodes.length, particleCount]
  );
  const stationaryScores = useMemo(
    () => computeStationaryScores(adjMatrix, nodes.map((node) => node.id)),
    [adjMatrix, nodes]
  );
  const distributionTimeline = useMemo(() => {
    if (!transitionMatrix || nodes.length === 0) {
      return [];
    }

    const initialDistribution = Array(nodes.length).fill(1 / nodes.length);
    const timeline = [initialDistribution];
    let currentDistribution = initialDistribution;

    for (let step = 0; step < CONVERGENCE_DEMO_STEP_COUNT; step += 1) {
      currentDistribution = advanceDistribution(currentDistribution, transitionMatrix);
      timeline.push(currentDistribution);
    }

    return timeline;
  }, [nodes.length, transitionMatrix]);

  useEffect(() => {
    if (!active || !transitionMatrix || nodes.length === 0) {
      setParticles([]);
      setStepIndex(0);
      setPhase("idle");
      return undefined;
    }

    let cancelled = false;
    let rafId = 0;
    const timeoutIds = [];

    const settleParticles = (nextParticles, nextStepIndex) => {
      if (cancelled) return;
      setParticles(nextParticles);
      setStepIndex(nextStepIndex);
    };

    const runStep = (baseParticles, currentStep) => {
      if (cancelled) return;

      if (currentStep >= CONVERGENCE_DEMO_STEP_COUNT) {
        setPhase("done");
        settleParticles(baseParticles, CONVERGENCE_DEMO_STEP_COUNT);
        return;
      }

      setPhase("running");
      setStepIndex(currentStep + 1);

      const travelingParticles = baseParticles.map((particle) => ({
        ...particle,
        startIndex: particle.currentIndex,
        targetIndex: chooseTargetIndex(
          transitionMatrix[particle.currentIndex],
          particle.id,
          currentStep + particle.homeIndex
        ),
        departure: seededNoise(
          particle.id + currentStep * 29,
          particle.currentIndex + particle.targetIndex + 7
        ) * PARTICLE_STAGGER_WINDOW,
        progress: 0,
      }));

      let startTime = null;
      const animate = (timestamp) => {
        if (cancelled) return;
        if (startTime === null) startTime = timestamp;

        const progress = Math.min(
          1,
          (timestamp - startTime) / CONVERGENCE_DEMO_STEP_DURATION_MS
        );
        settleParticles(
          travelingParticles.map((particle) => ({
            ...particle,
            progress: Math.min(
              1,
              Math.max(
                0,
                (progress - particle.departure) / Math.max(0.0001, 1 - particle.departure)
              )
            ),
          })),
          currentStep + 1
        );

        if (progress < 1) {
          rafId = window.requestAnimationFrame(animate);
          return;
        }

        const settledParticles = travelingParticles.map((particle) => ({
          ...particle,
          currentIndex: particle.targetIndex,
          departure: undefined,
          progress: null,
        }));
        settleParticles(settledParticles, currentStep + 1);
        runStep(settledParticles, currentStep + 1);
      };

      rafId = window.requestAnimationFrame(animate);
    };

    setPhase("intro");
    settleParticles(initialParticles, 0);
    timeoutIds.push(window.setTimeout(() => runStep(initialParticles, 0), CONVERGENCE_DEMO_INITIAL_DELAY_MS));

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [active, demoId, initialParticles, nodeSignature, nodes.length, transitionMatrix]);

  const animatedStepProgress = useMemo(() => {
    if (phase === "done") return 1;
    if (phase !== "running" || particles.length === 0) return 0;
    return particles.reduce((sum, particle) => sum + (particle.progress ?? 0), 0) / particles.length;
  }, [particles, phase]);

  const currentDistribution = useMemo(() => {
    if (distributionTimeline.length === 0) {
      return [];
    }

    if (phase === "intro" || stepIndex === 0) {
      return distributionTimeline[0];
    }
    if (phase === "done") {
      return distributionTimeline[distributionTimeline.length - 1];
    }

    const previousDistribution = distributionTimeline[Math.max(0, stepIndex - 1)] ?? distributionTimeline[0];
    const nextDistribution =
      distributionTimeline[Math.min(distributionTimeline.length - 1, stepIndex)] ?? previousDistribution;

    return interpolateDistribution(previousDistribution, nextDistribution, animatedStepProgress);
  }, [animatedStepProgress, distributionTimeline, phase, stepIndex]);

  const topStationaryTargets = useMemo(() => {
    if (!stationaryScores || currentDistribution.length === 0) return [];

    return nodes
      .map((node, index) => ({
        id: node.id,
        name: node.name,
        currentShare: currentDistribution[index] ?? 0,
        targetShare: stationaryScores[node.id] ?? 0,
      }))
      .sort((a, b) => b.targetShare - a.targetShare)
      .slice(0, 3);
  }, [currentDistribution, nodes, stationaryScores]);

  const reservoirParticleViews = useMemo(() => {
    const counts = allocateParticleCounts(currentDistribution, reservoirParticleCount);

    return nodes.flatMap((node, nodeIndex) =>
      Array.from({ length: counts[nodeIndex] ?? 0 }, (_, localIndex) => {
        const offset = getReservoirOffset(localIndex, counts[nodeIndex] ?? 0, nodeIndex);
        return {
          id: `reservoir-${node.id}-${localIndex}`,
          x: node.x + offset.x,
          y: node.y + offset.y,
        };
      })
    );
  }, [currentDistribution, nodes, reservoirParticleCount]);

  const particleViews = useMemo(
    () =>
      particles.map((particle) => {
        const startNode = nodes[particle.startIndex] ?? nodes[particle.currentIndex];
        const targetNode = nodes[particle.targetIndex] ?? startNode;

        if (!startNode || !targetNode) {
          return null;
        }

        const startJitter = getNodeJitter(particle.id, particle.startIndex);
        const endJitter = getNodeJitter(particle.id, particle.targetIndex);
        const progress = particle.progress ?? 1;

        if (particle.progress === null) {
          return {
            id: particle.id,
            x: targetNode.x + endJitter.x,
            y: targetNode.y + endJitter.y,
            color: PARTICLE_COLORS[particle.homeIndex % PARTICLE_COLORS.length],
          };
        }

        const curve = createQuadraticCurve(startNode, targetNode);
        const basePoint = pointOnCurve(curve, progress);
        const driftStart = 1 - progress;
        const driftEnd = progress;

        return {
          id: particle.id,
          x: basePoint.x + startJitter.x * driftStart + endJitter.x * driftEnd,
          y: basePoint.y + startJitter.y * driftStart + endJitter.y * driftEnd,
          color: PARTICLE_COLORS[particle.homeIndex % PARTICLE_COLORS.length],
        };
      }).filter(Boolean),
    [nodes, particles]
  );

  if (!active || nodes.length === 0 || !transitionMatrix) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {reservoirParticleViews.map((particle) => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={RESERVOIR_PARTICLE_RADIUS}
            fill="rgba(255,255,255,0.92)"
            stroke="rgba(15,23,42,0.22)"
            strokeWidth="0.65"
            opacity="0.92"
          />
        ))}
        {particleViews.map((particle) => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={PARTICLE_RADIUS}
            fill={particle.color}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="0.95"
            opacity="0.78"
          />
        ))}
      </svg>

      {nodes.map((node, index) => {
        const currentShare = currentDistribution[index];
        if (currentShare === undefined) return null;

        return (
          <span
            key={`probability-${node.id}`}
            className="absolute rounded-full border border-black/12 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-stone-700 shadow-sm"
            style={getProbabilityBadgeStyle(node)}
          >
            {Math.round(currentShare * 100)}%
          </span>
        );
      })}

      <div className="absolute left-2 top-2 max-w-[min(18rem,70%)] rounded-2xl border border-black/15 bg-white/88 px-3 py-2 shadow-md backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
          Convergence Demo
        </p>
        <p className="mt-1 text-xs font-semibold text-stone-900">
          {phase === "intro" && "Dots start evenly spread across the graph."}
          {phase === "running" && `Step ${stepIndex}/${CONVERGENCE_DEMO_STEP_COUNT}: walkers follow outgoing weights.`}
          {phase === "done" && "The crowd is settling toward the steady-state distribution."}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-stone-600">
          Colors track where each group started, so you can see the new edge weights reshaping the flow.
        </p>
        {topStationaryTargets.length > 0 && (
          <div className="mt-2 space-y-1">
            {topStationaryTargets.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[11px]">
                <span className="truncate font-semibold text-stone-800">{entry.name}</span>
                <span className="text-stone-500">{Math.round(entry.currentShare * 100)}%</span>
                <span className="font-bold text-stone-900">→ {Math.round(entry.targetShare * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
