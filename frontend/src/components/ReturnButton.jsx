import React from "react";

export default function ReturnButton({ onClick, icon = '«', className = 'absolute top-2 right-2 z-20 sm:top-4 sm:right-4' }) {
  return (
    <button
      className={
        `${className} h-8 w-8
        flex items-center justify-center 
        bg-amber-300 rounded hover:bg-amber-800
        text-black font-bold text-[24px] 
        disabled:opacity-50`
      }
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
