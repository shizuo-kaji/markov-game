import React, { useState, useEffect, useMemo } from "react";
import DiredEdge from "./DiredEdge";

export default function BoardPlayerEdges({ onReturn, room, selectedPlayerId, playMode }) {
  const nodes = room.nodes || [];
  const getNode = (id) => nodes.find((n) => n.id === id);
  const endorseColor  = "hsla(110, 70%, 50%, 1.00)";
  const sabotageColor = "hsla(0, 70%, 60%, 1.00)";
  const bgModeColor   = playMode === "endorse" ? endorseColor : sabotageColor;
  const fromPlayer = getNode(selectedPlayerId);
  // Container ref and dimensions for converting percent coords to pixels
  const containerRef = React.useRef(null);
  const [dims, setDims] = React.useState({ width: 0, height: 0 });
  React.useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
    }
  }, []);

  // create a node_labels as follows, from the room pick the adjacency matrix of the last turn this should be in room.turns[room.current_turn-1].adjacency_matrix then,
  // then I need too pick roows or columns of the adj matrix. If playMode is endorse then I need to pick the rows of the adj matrix for the selected player, if playMode is sabotage then I need to pick the columns of the adj matrix for the selected player.
  // after I selected the row or column, i create a list of labels that will be associated to each node.
  // I will then use this label to print as the label instead of now using {n.name}.

  // Compute pixel coords from percentage values
  const toPx = (coord, size) =>
    typeof coord === 'string' && coord.endsWith('%')
      ? (parseFloat(coord) / 100) * size
      : Number(coord);
  const edges = fromPlayer
    ? nodes
        .filter((n) => n.id !== selectedPlayerId)
        .map((n) => ({
          x1: toPx(fromPlayer.x, dims.width),
          y1: toPx(fromPlayer.y, dims.height),
          x2: toPx(n.x, dims.width),
          y2: toPx(n.y, dims.height)
        }))
    : [];
  // Compute node labels from adjacency matrix for current turn
  const turnIndex = room.turn - 1;
  const nodeLabels = useMemo(() => {
    // first turn: wildcard labels
    const matrix = room.turns?.[turnIndex]?.adj_matrix || [];
    const selIdx = nodes.findIndex((n) => n.id === selectedPlayerId);
    return nodes.map((n, idx) => {
      if (playMode === "sabotage") {
        return matrix[selIdx]?.[idx] ?? "*";
      } else {
        return matrix[idx]?.[selIdx] ?? "*";
      }
    });
  }, [nodes, room.turns, turnIndex, selectedPlayerId, playMode]);

  return (
    <div ref={containerRef} className="absolute w-full h-full bg-black/70">
      {/* Render one edge per node */}
      {edges.map((coords, i) => (
        <DiredEdge
          key={i}
          coords={coords}
          offset={40}
          color={playMode}
          strokeWidth={3}
        />
      ))}
      {/* Overlay close button and node markers */}
      <button className="absolute inset-0 text-left" onClick={onReturn}>
        {nodes.map((n, idx) => (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: n.y, left: n.x }}
          >
            <span
              className="relative rounded-lg border-black border-1 top-[-50%]"
              style={{ backgroundColor: bgModeColor }}
            >
              {nodeLabels[idx]}
            </span>
          </div>
        ))}
      </button>
    </div>
  );
}