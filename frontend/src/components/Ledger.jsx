// Ledger.jsx
import React from "react";

export default function Ledger({ ledger, getNode }) {
  if (!ledger.length) return null;

  return (
    <ul className="
      absolute left-1/2 -translate-x-1/2 top-1
      md:top-2 bg-white/80 backdrop-blur-sm 
      px-2 py-1 rounded 
      text-[9px] 
      space-y-1 
      shadow pointer-events-none">
      {ledger.map((m, i) => {
        const a = getNode(m.from);
        const b = getNode(m.to);
        const sign = m.mode === "endorse" ? "+" : "−";
        return (
          <li
            key={i}
            className={m.ghost ? "italic opacity-30" : "opacity-100"}
          >
            {a.name} ➜ {b.name} ({sign}
            {m.value})
          </li>
        );
      })}
    </ul>
  );
}
