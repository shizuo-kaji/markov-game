import React, { useState, useEffect, useMemo, useRef } from "react";
import DiredEdge from "./DiredEdge";

export default function BoardPlayerEdges({ room, playMode, selectedEdgeKey = null, onEdgeSelect }) {
  const nodes = useMemo(() => room?.nodes ?? [], [room?.nodes]);
  const [activeEdgeKey, setActiveEdgeKey] = useState(null);
  const endorseColor  = "hsla(110, 70%, 50%, 1.00)";
  const sabotageColor = "hsla(0, 70%, 60%, 1.00)";
  const bgModeColor   = playMode === "endorse" ? endorseColor : sabotageColor;

  // Container ref and dimensions for converting percent coords to pixels
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
    }
  }, [nodes.length]);

  // Compute pixel coords from percentage values
  const toPx = (coord, size) =>
    typeof coord === 'string' && coord.endsWith('%')
      ? (parseFloat(coord) / 100) * size
      : Number(coord);
  const turnIndex = (room?.turn ?? 1) - 1;
  const highlightedEdgeKey = activeEdgeKey ?? selectedEdgeKey;
  const showPreviousTurnMoves = ["endorse", "sabotage", "wait", "spectator", "results"].includes(playMode);
  const playerNameById = useMemo(
    () =>
      Object.fromEntries(
        (room?.players ?? []).map((player, index) => [player.id, { name: player.name, index }])
      ),
    [room?.players]
  );
  const previousTurnAnnotations = useMemo(() => {
    if (!showPreviousTurnMoves || (room?.turn ?? 1) <= 1) return {};

    const previousTurnNumber = (room?.turn ?? 1) - 1;
    const history = room?.moves_history ?? {};
    const previousMoves = history[previousTurnNumber] ?? history[String(previousTurnNumber)] ?? [];
    const annotationsByEdge = new Map();

    for (const move of previousMoves) {
      const edgeKey = `${move.source}-${move.target}`;
      if (!annotationsByEdge.has(edgeKey)) {
        annotationsByEdge.set(edgeKey, new Map());
      }
      const perPlayer = annotationsByEdge.get(edgeKey);
      perPlayer.set(
        move.player_id,
        (perPlayer.get(move.player_id) ?? 0) + Number(move.weight_change ?? 0)
      );
    }

    return Object.fromEntries(
      [...annotationsByEdge.entries()].map(([edgeKey, perPlayer]) => [
        edgeKey,
        [...perPlayer.entries()]
          .filter(([, delta]) => delta !== 0)
          .sort(
            ([playerIdA], [playerIdB]) =>
              (playerNameById[playerIdA]?.index ?? Number.MAX_SAFE_INTEGER) -
              (playerNameById[playerIdB]?.index ?? Number.MAX_SAFE_INTEGER)
          )
          .map(([playerId, delta]) => ({
            text: `${playerNameById[playerId]?.name ?? playerId} ${delta > 0 ? "+" : ""}${delta}`,
            tone: delta >= 0 ? "endorse" : "sabotage",
          })),
      ])
    );
  }, [playerNameById, room?.moves_history, room?.turn, showPreviousTurnMoves]);
  const edges = useMemo(
    () =>
      nodes.flatMap((fromNode, fromIdx) =>
        nodes
          .map((toNode, toIdx) => {
            const key = `${fromNode.id}-${toNode.id}`;
            const weight = room?.turns?.[turnIndex]?.adj_matrix?.[fromIdx]?.[toIdx] ?? 0;
            return {
              key,
              sourceId: fromNode.id,
              targetId: toNode.id,
              labelOffset: 18 + ((fromIdx * 7 + toIdx * 11) % 3) * 8,
              x1: toPx(fromNode.x, dims.width),
              y1: toPx(fromNode.y, dims.height),
              x2: toPx(toNode.x, dims.width),
              y2: toPx(toNode.y, dims.height),
              weight,
              annotations: previousTurnAnnotations[key] ?? [],
            };
          })
          .filter((edge) => edge.weight > 0.9)
      ),
    [nodes, dims.width, dims.height, previousTurnAnnotations, room?.turns, turnIndex]
  );
  const orderedEdges = useMemo(() => {
    const priorityEdgeKey = highlightedEdgeKey;
    if (!priorityEdgeKey) return edges;
    const activeEdge = edges.find((edge) => edge.key === priorityEdgeKey);
    if (!activeEdge) return edges;
    return [
      ...edges.filter((edge) => edge.key !== priorityEdgeKey),
      activeEdge,
    ];
  }, [edges, highlightedEdgeKey]);

  useEffect(() => {
    if (!activeEdgeKey) return;
    if (!edges.some((edge) => edge.key === activeEdgeKey)) {
      setActiveEdgeKey(null);
    }
  }, [activeEdgeKey, edges]);

  // Compute node labels from adjacency adjMatrix for current turn
  const nodeLabels = useMemo(() => {
    return nodes.map(() => ""); // Simply return empty strings for now
  }, [nodes]);

  if (!room || !nodes.length) return null;

  return (
    <div ref={containerRef} className="absolute w-full h-full pointer-events-none">
      {/* Render one edge per node */}
      {orderedEdges.map((coords, i) => (
        <DiredEdge
          key={coords.key ?? i}
          coords={coords}
          offset={60}
          color={"grey"}
          labelOffset={coords.labelOffset}
          highlightColor={playMode}
          interactive
          highlighted={coords.key === highlightedEdgeKey}
          onHoverChange={(isHovered) => {
            setActiveEdgeKey((currentKey) => {
              if (isHovered) return coords.key;
              return currentKey === coords.key ? null : currentKey;
            });
          }}
          onSelect={() => onEdgeSelect?.(coords.sourceId, coords.targetId)}
          strokeWidth={3}
          weight={coords.weight}
          annotations={coords.annotations}
        />
      ))}
      {/* Overlay close button and node markers */}

        {nodes.map((n, idx) => (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: n.y, left: n.x }}
          >
            <span
              className="relative rounded-lg border-black border-1"
              style={{ backgroundColor: bgModeColor }}
            >
              {nodeLabels[idx]}
            </span>
          </div>
        ))}

    </div>
  );
}
