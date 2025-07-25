import React from 'react';

export default function DiredEdge({ coords, offset = 50, color = 'black', strokeWidth = 4, weight }) {
  if (!coords) return null;
  const { x1, y1, x2, y2 } = coords;
  const samePoint = x1 === x2 && y1 === y2;

  // Calculate angle of the line
  const angle = Math.atan2(y2 - y1, x2 - x1);
  // Offset for text perpendicular to the line
  const textOffset = 20; // Distance from the line

  const dist = Math.hypot(x2 - x1, y2 - y1);
  const safeDist = dist < 1e-6 ? 1e-6 : dist; // Avoid division by zero

  // Midpoint of the line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Position for weight
  const textAbX = midX - textOffset * Math.sin(angle);
  const textAbY = midY + textOffset * Math.cos(angle);

  const textX = samePoint ? x1 : textAbX;
  const textY = samePoint ? y1 - offset - 15 : textAbY;

  // Derive actual color based on mode or override
  // Accepts modes: 'endorse', 'sabotage', 'grey', 'black'
  const modeColors = {
    endorse: 'hsla(110, 70%, 50%, 1.00)',
    sabotage: 'hsla(0, 70%, 60%, 1.00)',
    grey: 'grey',
    black: 'black'
  };
  // Determine which marker/color key to use (fallback to 'black')
  const markerKey = modeColors[color] ? color : 'black';
  const strokeColor = modeColors[markerKey];

  return (
    <svg style={{ overflow: 'visible', position: 'absolute', pointerEvents: 'none', width: '100%', height: '100%' }}>
      <defs>
        {/* One marker per predefined color */}
        <marker id="arrowhead-endorse" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 2 L 15 5 L 0 8 Z" fill={modeColors.endorse} />
        </marker>
        <marker id="arrowhead-sabotage" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 2 L 15 5 L 0 8 Z" fill={modeColors.sabotage} />
        </marker>
        <marker id="arrowhead-grey" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 2 L 15 5 L 0 8 Z" fill={modeColors.grey} />
        </marker>
        <marker id="arrowhead-black" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 2 L 15 5 L 0 8 Z" fill={modeColors.black} />
        </marker>
      </defs>

      {samePoint ? (
        <path
          d={`M ${x1} ${y1 - offset} A ${offset} ${offset} 0 1 1 ${x1} ${y1 + offset} A ${offset} ${offset} 0 1 1 ${x1} ${y1 - offset}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          markerEnd={`url(#arrowhead-${markerKey})`}
        />
      ) : (
        <path
          d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 - (y2 - y1) / safeDist * offset} ${(y1 + y2) / 2 + (x2 - x1) / safeDist * offset} ${x2} ${y2}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          markerEnd={`url(#arrowhead-${markerKey})`}
        />
      )}
      {weight !== undefined && (
        <text
          x={textX}
          y={textY}
          textAnchor="middle"
          fill="black"
          fontSize="14"
          fontWeight="bold"
          stroke="white"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {Math.floor(weight)}
        </text>
      )}
      
    </svg>
  );
}
