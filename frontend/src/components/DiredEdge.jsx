import React from 'react';

export default function DiredEdge({ coords, offset = 50, color = 'black', strokeWidth = 4 }) {
  if (!coords) return null;
  const { x1, y1, x2, y2 } = coords;
  const samePoint = x1 === x2 && y1 === y2;

  return (
    <svg style={{overflow: 'visible', position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        <marker 
          id="arrowhead" 
          viewBox="0 0 10 10" 
          refX="10" refY="5" 
          markerWidth="5" 
          markerHeight="5" 
          orient="auto" 
          markerUnits="strokeWidth">
          <path d="M 0 2 L 15 5 L 0 8 Z" fill={color} />
        </marker>
      </defs>

      {samePoint ? (
        <circle
          cx={x1}
          cy={y1}
          r={offset}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ) : (
        <path
          d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 - (y2 - y1) / Math.hypot(x2 - x1, y2 - y1) * offset} 
              ${(y1 + y2) / 2 + (x2 - x1) / Math.hypot(x2 - x1, y2 - y1) * offset} ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
        />
      )}
    </svg>
  );
}