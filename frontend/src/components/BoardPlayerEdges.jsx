import React, { useState, useEffect, useMemo, useRef } from "react";
import DiredEdge from "./DiredEdge";

export default function BoardPlayerEdges({ room, playMode }) {
  if (!room || !room.nodes) {
    console.log('BoardPlayerEdges: room or room.nodes is undefined, returning null.');
    return null;
  }
  console.log('BoardPlayerEdges: room', room);
  const nodes = room.nodes || [];
  const getNode = (id) => nodes.find((n) => n.id === id);
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
  }, []);

  // Compute pixel coords from percentage values
  const toPx = (coord, size) =>
    typeof coord === 'string' && coord.endsWith('%')
      ? (parseFloat(coord) / 100) * size
      : Number(coord);
  const turnIndex = room.turn - 1;
  console.log('BoardPlayerEdges: turnIndex', turnIndex);
  const edges = nodes.flatMap((fromNode, fromIdx) =>
    nodes
      .map((toNode, toIdx) => {
        const weight = room.turns?.[turnIndex]?.adj_matrix?.[fromIdx]?.[toIdx] ?? 0;
        return {
          x1: toPx(fromNode.x, dims.width),
          y1: toPx(fromNode.y, dims.height),
          x2: toPx(toNode.x, dims.width),
          y2: toPx(toNode.y, dims.height),
          weight: weight,
        };
      })
  );
  // Compute node labels from adjacency adjMatrix for current turn
  const nodeLabels = useMemo(() => {
    return nodes.map(() => ""); // Simply return empty strings for now
  }, [nodes]);

  return (
    <div ref={containerRef} className="absolute w-full h-full pointer-events-none">
      {/* Render one edge per node */}
      {edges.map((coords, i) => (
        <DiredEdge
          key={i}
          coords={coords}
          offset={40}
          color={playMode}
          strokeWidth={3}
          weight={coords.weight}
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