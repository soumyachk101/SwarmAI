"use client";

import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";

interface MacWindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized?: boolean;
  className?: string;
}

export default function MacWindowControls({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  className = "",
}: MacWindowControlsProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-2 px-2 py-1 select-none ${className}`}
      data-tauri-drag-region="deep"
    >
      {/* Close (Red) */}
      <button
        type="button"
        onClick={onClose}
        className="group relative flex size-3 items-center justify-center rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-sm transition-transform active:scale-90"
        title="Close"
        aria-label="Close"
      >
        <X
          className={`size-2 text-[#4D0000] stroke-[2.5] transition-opacity duration-150 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>

      {/* Minimize (Yellow) */}
      <button
        type="button"
        onClick={onMinimize}
        className="group relative flex size-3 items-center justify-center rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm transition-transform active:scale-90"
        title="Minimize"
        aria-label="Minimize"
      >
        <Minus
          className={`size-2 text-[#5C4100] stroke-[2.5] transition-opacity duration-150 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>

      {/* Maximize / Fullscreen (Green) */}
      <button
        type="button"
        onClick={onMaximize}
        className="group relative flex size-3 items-center justify-center rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-sm transition-transform active:scale-90"
        title={isMaximized ? "Exit Fullscreen" : "Fullscreen"}
        aria-label={isMaximized ? "Exit Fullscreen" : "Fullscreen"}
      >
        <Plus
          className={`size-2 text-[#004500] stroke-[2.5] transition-opacity duration-150 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
    </div>
  );
}
