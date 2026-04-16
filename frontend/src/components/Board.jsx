// Board.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef
} from "react";
import DiredEdge from "./DiredEdge";
import BoardPlayerEdges from "./BoardPlayerEdges.jsx";
import NodeIcon from "./NodeIcon.jsx";
import ConvergenceOverlay from "./ConvergenceOverlay.jsx";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getNodeLabelPlacement = (node, width, height) => {
  if (node.y < height * 0.20) {
    if (node.x < width * 0.28) return "right";
    if (node.x > width * 0.72) return "left";
    return "bottom";
  }
  if (node.y > height * 0.80) {
    if (node.x < width * 0.28) return "right";
    if (node.x > width * 0.72) return "left";
    return "top";
  }
  if (node.x < width * 0.20) return "right";
  if (node.x > width * 0.80) return "left";
  return node.y > height / 2 ? "top" : "bottom";
};

const getLabelStyle = (placement) => {
  switch (placement) {
    case "top":
      return { transform: "translate(-50%, -82%)" };
    case "left":
      return { transform: "translate(-94%, -50%)" };
    case "right":
      return { transform: "translate(-6%, -50%)" };
    default:
      return { transform: "translate(-50%, -18%)" };
  }
};

function layoutNodesWithSpacing(inputNodes, width, height) {
  if (!width || !height) return inputNodes;

  const marginX = 54;
  const marginY = 54;
  const baseSpacing = Math.max(
    86,
    Math.min(128, Math.min(width, height) / (Math.sqrt(Math.max(inputNodes.length, 1)) + 0.55))
  );

  const nodes = inputNodes.map((node) => ({
    ...node,
    anchorX: typeof node.anchorX === "number" ? node.anchorX : node.x,
    anchorY: typeof node.anchorY === "number" ? node.anchorY : node.y,
    x: clamp(node.x, marginX, width - marginX),
    y: clamp(node.y, marginY, height - marginY),
  }));

  for (let iteration = 0; iteration < 90; iteration += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const labelExtra = Math.min(18, (a.name.length + b.name.length) * 0.9);
        const minDist = baseSpacing + labelExtra;

        if (dist >= minDist) continue;

        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }

    for (const node of nodes) {
      node.x = clamp(node.x * 0.86 + node.anchorX * 0.14, marginX, width - marginX);
      node.y = clamp(node.y * 0.86 + node.anchorY * 0.14, marginY, height - marginY);
    }
  }

  return nodes.map((node) => ({
    ...node,
    labelPlacement: getNodeLabelPlacement(node, width, height),
  }));
}

function normalizeBoardNodes(sourceNodes, rect) {
  return layoutNodesWithSpacing(
    sourceNodes.map((node) => ({
      ...node,
      x: typeof node.x === "string" ? (parseFloat(node.x) / 100) * rect.width : node.x,
      y: typeof node.y === "string" ? (parseFloat(node.y) / 100) * rect.height : node.y,
    })),
    rect.width,
    rect.height
  );
}


const Board = forwardRef(function Board({
  as: RootComponent = "div",
  className = "",
  nodes: initialNodes,
  bgModeColor = "gray",
  resetSignal,
  onSelectionChange,
  currentRoom,
  playMode,
  convergenceDemo,
  ...restProps
}, ref) {
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const [nodes, setNodes] = useState([]);
  const [draggingNode, setDraggingNode] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setNodes(normalizeBoardNodes(initialNodes, rect));
    }
  }, [initialNodes]);

  const handleMouseDown = (_e, id) => {
    setDraggingNode(id);
  };

  const handleMouseMove = useCallback((e) => {
    if (draggingNode === null) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newNodes = nodes.map(n => {
      if (n.id === draggingNode) {
        const x = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
        const y = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));
        return {
          ...n,
          x: x,
          y: y,
        };
      }
      return n;
    });
    setNodes(newNodes);
  }, [draggingNode, nodes]);

  const handleMouseUp = useCallback(() => {
    if (draggingNode === null) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setNodes((currentNodes) =>
        layoutNodesWithSpacing(
          currentNodes.map((node) => ({
            ...node,
            anchorX: node.x,
            anchorY: node.y,
          })),
          rect.width,
          rect.height
        )
      );
    }
    setDraggingNode(null);
  }, [draggingNode]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [arrow, setArrow] = useState(null); // provisional single arrow only

  const showBoardPlayerEdges = true;


  // Handle node selection
  const handleSelect = (id) => {
    if (!from) {setFrom(id); return;}
    if (!to) {setTo(id); return;}
    setFrom(to);
    setTo(id);
  };
  const handleEdgeSelect = useCallback((sourceId, targetId) => {
    setFrom(sourceId);
    setTo(targetId);
  }, []);

  // Compute provisional arrow when both selected
  useEffect(() => {
    if (from && to && containerRef.current) {
      const getCenter = (nid) => {
        const node = nodes.find(n => n.id === nid);
        if (!node) return null;
        return {
          x: node.x,
          y: node.y
        };
      };
      const p1 = getCenter(from);
      const p2 = getCenter(to);
      if (p1 && p2) {
        setArrow({
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y
        });
      }
    } else {
      setArrow(null);
    }
    // notify parent of new selection
    onSelectionChange?.({ from, to });
  }, [from, to, nodes, onSelectionChange]);

  // Respond to external reset signal
  useEffect(() => {
    setFrom(null);
    setTo(null);
    setArrow(null);
  }, [resetSignal]);

  // Imperative API
  useImperativeHandle(
    ref,
    () => ({
      getSelection: () => ({ from, to }),
      clearSelection: () => {
        setFrom(null);
        setTo(null);
        setArrow(null);
      }
    }),
    [from, to]
  );

  const isSelected = (id) => id === from || id === to;
  const canSelectEdges = typeof onSelectionChange === "function"
    && (playMode === "endorse" || playMode === "sabotage");
  const selectedEdgeKey = from && to ? `${from}-${to}` : null;
  const selectedEdgeAlreadyExists = (() => {
    if (!from || !to || !currentRoom?.turns) return false;
    const turnIndex = (currentRoom.turn ?? 1) - 1;
    const fromIndex = nodes.findIndex((node) => node.id === from);
    const toIndex = nodes.findIndex((node) => node.id === to);
    if (fromIndex < 0 || toIndex < 0) return false;
    const weight = currentRoom.turns?.[turnIndex]?.adj_matrix?.[fromIndex]?.[toIndex] ?? 0;
    return weight > 0.9;
  })();

  const children = (
    <>
      {convergenceDemo?.active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <ConvergenceOverlay
            active={convergenceDemo.active}
            demoId={convergenceDemo.demoId}
            nodes={nodes}
            room={currentRoom}
            turnKey={convergenceDemo.turnKey}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {nodes.map((n) => (
          <span
            key={`${n.id}-label`}
            className="absolute font-bold text-[12px] text-center rounded-lg border-1 border-black px-2 py-1 whitespace-nowrap shadow-sm"
            style={{
              top: n.y,
              left: n.x,
              backgroundColor: isSelected(n.id) ? bgModeColor : "rgba(245, 245, 244, 0.90)",
              color: isSelected(n.id) ? "black" : "inherit",
              ...getLabelStyle(n.labelPlacement),
            }}
          >
            {n.name}
          </span>
        ))}
      </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {showBoardPlayerEdges && (
            <BoardPlayerEdges
              room={{...currentRoom, nodes: nodes}}
              playMode={playMode}
              selectedEdgeKey={canSelectEdges ? selectedEdgeKey : null}
              onEdgeSelect={canSelectEdges ? handleEdgeSelect : undefined}
            />
          )}
          {!selectedEdgeAlreadyExists && (
            <DiredEdge coords={arrow} offset={50} color={playMode} strokeWidth={4} />
          )}
        </div>
      {nodes.map((n) => (
        <button
          key={n.id}
            ref={(el) => (nodeRefs.current[n.id] = el)}
            onClick={() => handleSelect(n.id)}
            className={`absolute transition-transform -translate-x-1/2 -translate-y-1/2 ${
              isSelected(n.id)
                ? "scale-100 rounded-full border border-black px-2 py-2"
                : "hover:scale-125"
            }`}
            style={{
              top: n.y,
              left: n.x,
              backgroundColor: isSelected(n.id)
                ? bgModeColor
                : "rgba(243,244,246,0.0)",
              cursor: draggingNode ? 'grabbing' : 'grab',
              zIndex: 1,
            }}
          >
           {/* degree indicators
              <div className="absolute bg-white/80 rounded top-1 left-1 flex flex-col items-start space-y-0.5 text-[8px] font-semibold text-black">
                <span>出{n.out_deg?? -1} </span>
                <span>入{n.in_deg?? -1} </span>
              </div>
           */}
            <div onMouseDown={(e) => handleMouseDown(e, n.id)}>
              <NodeIcon
                icon={n.icon}
                alt={n.name}
                className="w-11 h-11"
                style={{ pointerEvents: 'none' }}
              />
            </div>
          </button>
        ))}
    </>
  );

  return React.createElement(
    RootComponent,
    {
      ref: containerRef,
      className: `bg-[url('/assets/background/bg3.png')] bg-white/10 bg-blend-overlay bg-center bg-[length:450px_auto] ${className}`,
      ...restProps
    },
    children
  );
});

export default Board;
