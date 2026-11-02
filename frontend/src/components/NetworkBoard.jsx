import { useI18n } from "../i18n/useI18n.js";
import { useId, useRef, useState } from "react";
import { COLORS, percent, signed } from "../utils/markov.js";
function layout(n) {
  return Array.from(
    {
      length: n,
    },
    (_, i) => {
      const angle = -Math.PI * 0.75 + (2 * Math.PI * i) / n;
      return {
        x: 350 + 218 * Math.cos(angle),
        y: 235 + 150 * Math.sin(angle),
      };
    },
  );
}
function edgeGeometry(a, b, loop = false, trim = true) {
  if (loop) {
    const direction = a.x < 350 ? -1 : 1;
    return {
      path: `M ${a.x + direction * 40} ${a.y - 26} C ${a.x + direction * 110} ${a.y - 75}, ${a.x + direction * 110} ${a.y + 75}, ${a.x + direction * 40} ${a.y + 26}`,
      x: a.x + direction * 88,
      y: a.y,
    };
  }
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length,
    ny = dx / length,
    margin = trim ? 46 : 0;
  const start = {
    x: a.x + (dx / length) * margin,
    y: a.y + (dy / length) * margin,
  };
  const end = {
    x: b.x - (dx / length) * margin,
    y: b.y - (dy / length) * margin,
  };
  const control = {
    x: (a.x + b.x) / 2 + nx * 34,
    y: (a.y + b.y) / 2 + ny * 34,
  };
  const t = 0.58,
    s = 1 - t;
  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    x: s * s * start.x + 2 * s * t * control.x + t * t * end.x,
    y: s * s * start.y + 2 * s * t * control.y + t * t * end.y,
  };
}
export default function NetworkBoard({
  nodes,
  matrix,
  transition,
  selection,
  onSelect,
  distribution,
  targetDistribution,
  changes = [],
  particles = [],
  motionKey = 0,
  duration = 800,
  focusSource = "",
  compact = false,
}) {
  const { t } = useI18n();
  const id = useId().replaceAll(":", "");
  const svg = useRef(null);
  const drag = useRef(null);
  const [positions, setPositions] = useState(() => layout(nodes.length));
  const [hover, setHover] = useState(null);
  const [origin, setOrigin] = useState(null);
  const highlighted = hover || selection;
  const chosenSource =
    focusSource || (nodes.length > 6 ? selection?.source || nodes[0].id : "");
  const choose = (source, target) => {
    onSelect?.({
      source,
      target,
    });
    setOrigin(null);
  };
  const onPointerDown = (event, i) => {
    if (compact) return;
    drag.current = {
      index: i,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!drag.current || !svg.current) return;
    if (
      Math.hypot(
        event.clientX - drag.current.x,
        event.clientY - drag.current.y,
      ) > 5
    )
      drag.current.moved = true;
    if (!drag.current.moved) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      svg.current.getScreenCTM().inverse(),
    );
    setPositions((current) =>
      current.map((position, i) =>
        i === drag.current.index
          ? {
              x: Math.min(590, Math.max(110, point.x)),
              y: Math.min(365, Math.max(105, point.y)),
            }
          : position,
      ),
    );
  };
  const selectNode = (node) => {
    if (!onSelect) return;
    if (origin) choose(origin, node.id);
    else setOrigin(node.id);
  };
  const edges = [];
  nodes.forEach((source, i) =>
    nodes.forEach((target, j) => {
      const selected =
        highlighted?.source === source.id && highlighted?.target === target.id;
      const change = changes.find(
        (c) => c.source === source.id && c.target === target.id,
      );
      if (chosenSource && chosenSource !== source.id && !selected && !change)
        return;
      if (compact && matrix[i][j] === 0 && !selected && !change) return;
      const geometry = edgeGeometry(positions[i], positions[j], i === j);
      edges.push({
        source,
        target,
        i,
        j,
        selected,
        geometry,
        change,
      });
    }),
  );
  // Keep hit targets in a stable DOM order: moving a hovered edge loses its click.
  const edgeEvents = (source, target) => ({
    onMouseEnter: () => setHover({ source: source.id, target: target.id }),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover({ source: source.id, target: target.id }),
    onBlur: () => setHover(null),
    onPointerDown: (event) => {
      if (event.button === 0) choose(source.id, target.id);
    },
    onClick: () => choose(source.id, target.id),
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(source.id, target.id);
      }
    },
  });
  const edgeClass = (i, j, selected) =>
    `graph-edge ${selected ? "is-selected" : ""} ${matrix[i][j] === 0 ? "is-zero" : ""}`;
  return (
    <div className={`network ${compact ? "compact-network" : ""}`}>
      <svg
        ref={svg}
        viewBox="0 0 700 470"
        role="group"
        aria-label={t(
          "街の有向グラフ。辺を選択、または出発点と行き先を順に選択。",
        )}
        className="network-svg"
      >
        <defs>
          <pattern
            id={`${id}-grid`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.8" fill="#c5cdc2" />
          </pattern>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M1 1 9 5 1 9Z" fill="#879a91" />
          </marker>
          <marker
            id={`${id}-active`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M1 1 9 5 1 9Z" fill="#176b58" />
          </marker>
        </defs>
        <rect width="700" height="470" fill={`url(#${id}-grid)`} />
        {edges.map(({ source, target, i, j, selected, geometry }) => (
          <g
            key={`${i}-${j}`}
            className={edgeClass(i, j, selected)}
            data-source={source.id}
            data-target={target.id}
            aria-pressed={
              onSelect
                ? selection?.source === source.id &&
                  selection?.target === target.id
                : undefined
            }
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect && !compact ? 0 : undefined}
            aria-label={t("{0}から{1}、重み{2}、移動確率{3}", [
              source.name,
              target.name,
              matrix[i][j],
              percent(transition?.[i]?.[j] || 0),
            ])}
            {...edgeEvents(source, target)}
          >
            <path
              className="edge-hit"
              d={geometry.path}
              fill="none"
              stroke="transparent"
              strokeWidth="24"
            />
            <path
              className="edge-line"
              d={geometry.path}
              fill="none"
              stroke={selected ? "#176b58" : "#a0afa5"}
              strokeWidth={
                selected
                  ? 3.5
                  : Math.min(4, 1.2 + Math.sqrt(matrix[i][j]) * 0.55)
              }
              strokeDasharray={matrix[i][j] === 0 ? "5 4" : undefined}
              markerEnd={`url(#${id}-${selected ? "active" : "arrow"})`}
            />
          </g>
        ))}
        {/* Labels sit above every hit path, so another edge cannot intercept a label click. */}
        {edges.map(({ source, target, i, j, selected, geometry, change }) => (
          <g
            key={`label-${i}-${j}`}
            className={edgeClass(i, j, selected)}
            aria-hidden="true"
            {...edgeEvents(source, target)}
          >
            <rect
              className="edge-label-bg"
              x={geometry.x - 14}
              y={geometry.y - 12}
              width="28"
              height="24"
              rx="8"
              fill={selected ? "#176b58" : "#fcfcf7"}
              stroke={selected ? "#176b58" : "#dce1d6"}
            />
            <text
              className="edge-label"
              x={geometry.x}
              y={geometry.y + 5}
              textAnchor="middle"
              fill={selected ? "white" : "#4a6256"}
            >
              {matrix[i][j]}
            </text>
            {change && (
              <g className="edge-change">
                <rect
                  x={geometry.x + 17}
                  y={geometry.y - 11}
                  width="34"
                  height="22"
                  rx="11"
                  fill={change.delta > 0 ? "#d3f1b2" : "#fbe0d5"}
                />
                <text
                  x={geometry.x + 34}
                  y={geometry.y + 4}
                  textAnchor="middle"
                  fill={change.delta > 0 ? "#315c24" : "#9c4327"}
                >
                  {signed(change.delta)}
                </text>
              </g>
            )}
          </g>
        ))}
        <g key={motionKey} className="walkers" aria-hidden="true">
          {particles.map((particle, k) => {
            const offsetX = Math.sin(k * 2.4) * 6,
              offsetY = Math.cos(k * 2.4) * 6;
            const from = {
              x: positions[particle.from].x + offsetX,
              y: positions[particle.from].y + offsetY,
            };
            const to = {
              x: positions[particle.to].x + offsetX,
              y: positions[particle.to].y + offsetY,
            };
            const path = edgeGeometry(
              from,
              to,
              particle.from === particle.to,
              false,
            ).path;
            return (
              <circle
                key={k}
                r="3.2"
                fill={COLORS[particle.to % COLORS.length]}
                className="flow-dot"
                style={{
                  offsetPath: `path('${path}')`,
                  "--duration": `${duration * 0.85}ms`,
                  "--delay": `${(k % 4) * 15}ms`,
                }}
              />
            );
          })}
        </g>
        {nodes.map((node, i) => (
          <g
            key={node.id}
            transform={`translate(${positions[i].x} ${positions[i].y})`}
            className={`graph-node ${origin === node.id ? "node-origin" : ""}`}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect && !compact ? 0 : undefined}
            aria-label={
              origin === node.id
                ? t("{0}：出発点に選択中", [node.name])
                : node.name
            }
            onPointerDown={(event) => onPointerDown(event, i)}
            onPointerMove={onPointerMove}
            onPointerUp={() => {
              const moved = drag.current?.moved;
              drag.current = null;
              if (!moved) selectNode(node);
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectNode(node);
              }
            }}
          >
            <circle
              r="35"
              fill="white"
              stroke={origin === node.id ? "#176b58" : COLORS[i]}
              strokeWidth={origin === node.id ? 4 : 1.5}
            />
            {distribution && (
              <>
                <circle
                  r="39"
                  fill="none"
                  stroke={COLORS[i]}
                  strokeOpacity=".15"
                  strokeWidth="5"
                />
                <circle
                  className="node-distribution-arc"
                  r="39"
                  fill="none"
                  stroke={COLORS[i]}
                  strokeWidth="5"
                  pathLength="1"
                  strokeDasharray={`${distribution[i]} 1`}
                  transform="rotate(-90)"
                />
                {targetDistribution && (
                  <path
                    className="node-target-mark"
                    d="M0 -34V-44"
                    stroke="#263f35"
                    strokeWidth="2.5"
                    transform={`rotate(${targetDistribution[i] * 360})`}
                  />
                )}
              </>
            )}
            <circle r="27" fill={COLORS[i]} fillOpacity=".15" />
            {node.kind === "player" ? (
              <g stroke={COLORS[i]} fill="none" strokeWidth="2">
                <path d="M-14-6h28l-3-10h-22Z M-12-5v20h24V-5 M-5 15V4h10v11 M-17-6q4 9 8 0 4 9 9 0 5 9 9 0 4 9 8 0" />
              </g>
            ) : (
              <g stroke={COLORS[i]} fill="none" strokeWidth="2">
                <path
                  d={
                    i % 2
                      ? "M0-18-15 5h9l-9 8h30L6 5h9ZM0 13v8"
                      : "M-14 14V-9q0-7 7-7H7q7 0 7 7v23ZM-9-8H9v10H-9ZM-9 15l-4 6M9 15l4 6"
                  }
                />
              </g>
            )}
            <rect
              x="-60"
              y="42"
              width="120"
              height="24"
              rx="9"
              fill="#fcfcf7"
              fillOpacity=".95"
            />
            <text y="58" textAnchor="middle" className="node-name">
              {node.name.length > 12 ? `${node.name.slice(0, 11)}…` : node.name}
            </text>
            <title>{node.name}</title>
            {distribution && (
              <g>
                <rect
                  x="-26"
                  y="-66"
                  width="52"
                  height="23"
                  rx="11"
                  fill={COLORS[i]}
                />
                <text
                  y="-50"
                  textAnchor="middle"
                  className="node-share"
                  fill="white"
                >
                  {percent(distribution[i])}
                </text>
                {targetDistribution && (
                  <text
                    y="83"
                    textAnchor="middle"
                    className="node-target-share"
                  >
                    π {percent(targetDistribution[i])}
                  </text>
                )}
              </g>
            )}
          </g>
        ))}
      </svg>
      {!compact && (
        <div className="graph-hint">
          {origin
            ? t("次に、行き先を選択。同じ点なら自己ループ。")
            : nodes.length > 6
              ? t("点が多いため、選択した出発点の辺を表示しています。")
              : t("矢印・数字をクリックして選択。破線は重み0。")}
        </div>
      )}
    </div>
  );
}
