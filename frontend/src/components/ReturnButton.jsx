import React from "react";

export default function ReturnButton({ onClick }) {
  return (
    <button
      className="
        absolute top-4 right-4 h-8 w-8
        flex items-center justify-center 
        bg-amber-300 rounded hover:bg-amber-800
        text-black font-bold text-[24px] 
        disabled:opacity-50"
      onClick={onClick}
    >
      «
    </button>
  );
}