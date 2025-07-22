import React, { useState, useEffect, useMemo, useRef } from "react";
import DiredEdge from "./DiredEdge";

export default function InitialEdges({ onReturn, room }) {
  const nodes = room.nodes || [];
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
    }
  }, []);

  const toPx = (coord, size) =>
    typeof coord === "string" && coord.endsWith("%")
      ? (parseFloat(coord) / 100) * size
      : Number(coord);

  const turnIndex = room.turn - 1;
  const adjMatrix = room.turns?.[turnIndex]?.adj_matrix || [];

  const edges = useMemo(() => {
    const edgeList = [];
    const numNodes = nodes.length;

    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        const fromNode = nodes[i];
        const toNode = nodes[j];

        if (!fromNode || !toNode) continue;

        // For self-loops
        if (i === j) {
          const weight = adjMatrix[i]?.[j] || 0;
          if (weight > 0) {
            edgeList.push({
              x1: toPx(fromNode.x, dims.width),
              y1: toPx(fromNode.y, dims.height),
              x2: toPx(toNode.x, dims.width),
              y2: toPx(toNode.y, dims.height),
              weight_ab: weight, // Only one weight for self-loop
              weight_ba: undefined,
            });
          }
        } else if (i < j) { // Process each unique pair (i, j) once for non-self-loops
          const weight_ij = adjMatrix[i]?.[j] || 0; // weight from i to j
          const weight_ji = adjMatrix[j]?.[i] || 0; // weight from j to i

          if (weight_ij > 0 || weight_ji > 0) {
            edgeList.push({
              x1: toPx(fromNode.x, dims.width),
              y1: toPx(fromNode.y, dims.height),
              x2: toPx(toNode.x, dims.width),
              y2: toPx(toNode.y, dims.height),
              weight_ab: weight_ij,
              weight_ba: weight_ji,
            });
          }
        }
      }
    }
    return edgeList;
  }, [adjMatrix, nodes, dims]);

  return (
    <div
      ref={containerRef}
      className="absolute w-full h-full bg-black/30"
      onClick={onReturn}
    >
      {edges.map((edge, i) => (
        <DiredEdge
          key={i}
          coords={edge}
          offset={60}
          color="grey"
          strokeWidth={2}
        />
      ))}
    </div>
  );
}
