// Board.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef
} from "react";
import DiredEdge from "./DiredEdge";
import BoardPlayerEdges from "./BoardPlayerEdges.jsx";


const Board = forwardRef(function Board({
  as: Component = "div",
  className = "",
  nodes: initialNodes,
  bgModeColor = "gray",
  resetSignal,
  onSelectionChange,
  currentRoom,
  playMode,
  ...restProps
}, ref) {
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const [nodes, setNodes] = useState([]);
  const [draggingNode, setDraggingNode] = useState(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newNodes = initialNodes.map(n => ({
        ...n,
        x: typeof n.x === 'string' ? (parseFloat(n.x) / 100) * rect.width : n.x,
        y: typeof n.y === 'string' ? (parseFloat(n.y) / 100) * rect.height : n.y,
      }));
      setNodes(newNodes);
    }
  }, [initialNodes]);

  const handleMouseDown = (e, id) => {
    setDraggingNode(id);
  };

  const handleMouseMove = (e) => {
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
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNode, nodes]);


  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [arrow, setArrow] = useState(null); // provisional single arrow only

  const [showBoardPlayerEdges, setShowBoardPlayerEdges] = useState(true);


  // Handle node selection
  const handleSelect = (id) => {
    if (!from) {setFrom(id); return;}
    if (!to) {setTo(id); return;}
    setFrom(to);
    setTo(id);
  };

  // Compute provisional arrow when both selected
  useEffect(() => {
    if (from && to && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
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
  }, [from, to, nodes]);

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

  return (
    <Component
      ref={containerRef}
      className={`bg-[url('/assets/background/bg3.png')] bg-white/10 bg-blend-overlay bg-center bg-[length:450px_auto] ${className}`}
      {...restProps}
    >
      {nodes.map((n) => (
        <button
          key={n.id}
            ref={(el) => (nodeRefs.current[n.id] = el)}
            onMouseDown={(e) => handleMouseDown(e, n.id)}
            onClick={() => handleSelect(n.id)}
            className={`absolute flex flex-col items-center transition-transform -translate-x-1/2 -translate-y-1/2 ${
              isSelected(n.id)
                ? "scale-100 rounded-lg border border-black px-1 py-1"
                : "hover:scale-125"
            }`}
            style={{
              top: n.y,
              left: n.x,
              backgroundColor: isSelected(n.id)
                ? bgModeColor
                : "rgba(243,244,246,0.0)",
              cursor: draggingNode ? 'grabbing' : 'grab',
            }}
          >
           {/* degree indicators
              <div className="absolute bg-white/80 rounded top-1 left-1 flex flex-col items-start space-y-0.5 text-[8px] font-semibold text-black">
                <span>出{n.out_deg?? -1} </span>
                <span>入{n.in_deg?? -1} </span>
              </div>
           */}
            <img
              src={`/assets/nodes/${n.icon}`}
              alt={n.name}
              className="w-11 h-11"
            />
            <span className="font-bold text-[12px] text-center bg-stone-100/90 rounded-lg border-1 border-black px-1 py-1">
              {n.name}
            </span>
          </button>
        ))}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {showBoardPlayerEdges && (
            <BoardPlayerEdges
              room={{...currentRoom, nodes: nodes}}
              playMode={playMode}
            />
          )}
          <DiredEdge coords={arrow} offset={50} color={playMode} strokeWidth={4} />
        </div>

      </Component>
  );
});

export default Board;
