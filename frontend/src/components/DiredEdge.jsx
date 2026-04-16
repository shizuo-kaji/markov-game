import React, { useMemo } from 'react';

const modeColors = {
  endorse: 'hsla(110, 70%, 50%, 1.00)',
  sabotage: 'hsla(0, 70%, 60%, 1.00)',
  grey: 'grey',
  black: 'black'
};

export default function DiredEdge({
  coords,
  offset = 50,
  color = 'black',
  strokeWidth = 4,
  weight,
  labelOffset = 20,
  nodePadding = 28,
  highlightColor = color,
  interactive = false,
  highlighted = false,
  onHoverChange,
  onSelect,
  annotations = []
}) {
  const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = coords ?? {};
  const samePoint = coords ? x1 === x2 && y1 === y2 : false;
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Calculate angle of the line
  const angle = Math.atan2(dy, dx);
  const dist = Math.hypot(dx, dy);
  const safeDist = dist < 1e-6 ? 1e-6 : dist; // Avoid division by zero
  const trimStart = samePoint ? 0 : Math.min(nodePadding, safeDist * 0.22);
  const trimEnd = samePoint ? 0 : Math.min(nodePadding, safeDist * 0.36);
  const pathStartX = samePoint ? x1 : x1 + (dx / safeDist) * trimStart;
  const pathStartY = samePoint ? y1 : y1 + (dy / safeDist) * trimStart;
  const pathEndX = samePoint ? x2 : x2 - (dx / safeDist) * trimEnd;
  const pathEndY = samePoint ? y2 : y2 - (dy / safeDist) * trimEnd;
  const pathDist = Math.hypot(pathEndX - pathStartX, pathEndY - pathStartY);
  const curveOffset = samePoint ? offset : Math.min(offset, pathDist * 0.42 + 8);
  const textOffset = samePoint
    ? labelOffset
    : Math.max(labelOffset, Math.min(38, labelOffset + Math.max(0, 120 - dist) * 0.12));

  // Midpoint of the line
  const midX = (pathStartX + pathEndX) / 2;
  const midY = (pathStartY + pathEndY) / 2;

  // Position for weight
  const textAbX = midX - textOffset * Math.sin(angle);
  const textAbY = midY + textOffset * Math.cos(angle);

  const textX = samePoint ? x1 : textAbX;
  const textY = samePoint ? y1 - offset - textOffset * 0.8 : textAbY;
  const baseKey = modeColors[color] ? color : 'black';
  const highlightedKey = modeColors[highlightColor] ? highlightColor : baseKey;
  const isActive = highlighted;
  const markerKey = isActive ? highlightedKey : baseKey;
  const strokeColor = modeColors[markerKey];
  const visibleStrokeWidth = isActive ? strokeWidth + 1.5 : strokeWidth;
  const edgePath = useMemo(() => {
    if (samePoint) {
      return `M ${x1} ${y1 - offset} A ${offset} ${offset} 0 1 1 ${x1} ${y1 + offset} A ${offset} ${offset} 0 1 1 ${x1} ${y1 - offset}`;
    }
    return `M ${pathStartX} ${pathStartY} Q ${midX - (pathEndY - pathStartY) / Math.max(pathDist, 1e-6) * curveOffset} ${midY + (pathEndX - pathStartX) / Math.max(pathDist, 1e-6) * curveOffset} ${pathEndX} ${pathEndY}`;
  }, [curveOffset, midX, midY, offset, pathDist, pathEndX, pathEndY, pathStartX, pathStartY, samePoint, x1, y1]);
  const weightLabel = weight !== undefined ? String(Math.floor(weight)) : null;
  const labelWidth = weightLabel ? Math.max(26, weightLabel.length * 10 + 14) : 0;
  const labelHeight = 24;
  const labelX = textX - labelWidth / 2;
  const labelY = textY - labelHeight / 2;
  const annotationGap = 6;
  const annotationHeight = 22;
  const annotationOffset = samePoint ? offset + textOffset + 12 : textOffset + 28;
  const annotationBaseX = samePoint ? x1 : midX - annotationOffset * Math.sin(angle);
  const annotationBaseY = samePoint ? y1 - annotationOffset : midY + annotationOffset * Math.cos(angle);
  const annotationItems = useMemo(
    () =>
      annotations.map((annotation) => ({
        ...annotation,
        width: Math.max(60, annotation.text.length * 7.4 + 20),
      })),
    [annotations]
  );
  const annotationBlockHeight = annotationItems.length
    ? annotationItems.length * annotationHeight + (annotationItems.length - 1) * annotationGap
    : 0;
  const handleMouseEnter = interactive ? () => {
    onHoverChange?.(true);
  } : undefined;
  const handleMouseLeave = interactive ? () => {
    onHoverChange?.(false);
  } : undefined;
  const handleClick = interactive ? (event) => {
    event.stopPropagation();
    onSelect?.();
  } : undefined;

  if (!coords) return null;

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

      {interactive && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(16, strokeWidth * 4)}
          pointerEvents="stroke"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      )}

      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={visibleStrokeWidth}
        strokeLinecap="round"
        markerEnd={`url(#arrowhead-${markerKey})`}
      />

      {weightLabel && (
        <g
          pointerEvents={interactive ? 'all' : 'none'}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <rect
            x={labelX}
            y={labelY}
            width={labelWidth}
            height={labelHeight}
            rx={12}
            fill={isActive ? strokeColor : 'rgba(255, 255, 255, 0.92)'}
            stroke={strokeColor}
            strokeWidth={isActive ? 2.5 : 1.5}
          />
          <text
            x={textX}
            y={textY + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isActive ? 'white' : strokeColor}
            fontSize="14"
            fontWeight="bold"
          >
            {weightLabel}
          </text>
        </g>
      )}

      {annotationItems.length > 0 && (
        <g
          pointerEvents={interactive ? 'all' : 'none'}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {annotationItems.map((annotation, index) => {
            const annotationX = annotationBaseX - annotation.width / 2;
            const annotationY =
              annotationBaseY - annotationBlockHeight / 2 + index * (annotationHeight + annotationGap);
            const toneKey = annotation.tone === 'sabotage' ? 'sabotage' : 'endorse';
            const toneStroke = modeColors[toneKey];
            const toneFill = isActive
              ? toneStroke
              : toneKey === 'endorse'
                ? 'rgba(240, 253, 244, 0.96)'
                : 'rgba(254, 242, 242, 0.96)';
            const toneText = isActive ? 'white' : toneStroke;

            return (
              <g key={`${annotation.text}-${index}`}>
                <rect
                  x={annotationX}
                  y={annotationY}
                  width={annotation.width}
                  height={annotationHeight}
                  rx={11}
                  fill={toneFill}
                  stroke={toneStroke}
                  strokeWidth={isActive ? 2.2 : 1.3}
                />
                <text
                  x={annotationBaseX}
                  y={annotationY + annotationHeight / 2 + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={toneText}
                  fontSize="11"
                  fontWeight="bold"
                >
                  {annotation.text}
                </text>
              </g>
            );
          })}
        </g>
      )}
      
    </svg>
  );
}
