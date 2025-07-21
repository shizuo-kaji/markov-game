// Board.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef
} from "react";
import DiredEdge from "./DiredEdge";

const Board = forwardRef(function Board({
  as: Component = "div",
  className = "",
  nodes,
  bgModeColor = "gray",
  resetSignal,
  onSelectionChange,
  ...restProps
}, ref) {
  const containerRef = useRef(null);
  const nodeRefs = useRef({});

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [arrow, setArrow] = useState(null); // provisional single arrow only

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
        const el = nodeRefs.current[nid];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: r.left - rect.left + r.width / 2,
          y: r.top - rect.top + r.height / 2
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
  }, [from, to]);

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
      className={`bg-[url('/assets/background/bg3.png')] bg-white/20 bg-blend-overlay bg-center bg-[length:450px_auto] ${className}`}
      {...restProps}
    >
      {nodes.map((n) => (
        <button
          key={n.id}
            ref={(el) => (nodeRefs.current[n.id] = el)}
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
                : "rgba(243,244,246,0.0)"
            }}
          >
            {/* degree indicators */}
              <div className="absolute bg-white/80 rounded top-1 left-1 flex flex-col items-start space-y-0.5 text-[8px] font-semibold text-black">
                <span>▲{n.out_deg?? -1} </span>
                <span>▼{n.in_deg?? -1} </span>
              </div>
            {/* degree indicators
            {n.out_deg != null && n.in_deg != null && (
              <div className="absolute top-1 left-1 flex flex-col items-start space-y-0.5 text-[8px] font-semibold text-black">
                <span>▲{n.out_deg}</span>
                <span>▼{n.in_deg}</span>
              </div>
            )} */}
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
        <DiredEdge coords={arrow} offset={40} color="black" strokeWidth={4} />
      </Component>
  );
});

export default Board;
