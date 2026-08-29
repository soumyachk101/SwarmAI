import React, { useState } from "react";
import { type PortSide, useCanvasStore } from "./canvasStore.js";
import { type Camera } from "./camera.js";
import { X } from "lucide-react";

interface Props {
  camera?: Camera;
  mouseWorld?: { x: number; y: number } | null;
}

export default function CanvasEdges({ mouseWorld }: Props) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const connectingFrom = useCanvasStore((s) => s.connectingFrom);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // Helper to calculate socket positions in world space
  const getSocketPos = (nodeId: string, port?: PortSide, targetNodeId?: string) => {
    const box = nodes[nodeId];
    if (!box) return null;

    let p = port;
    if (!p && targetNodeId) {
      const other = nodes[targetNodeId];
      if (other) {
        if (box.x + box.w < other.x) p = "right";
        else if (box.x > other.x + other.w) p = "left";
        else if (box.y < other.y) p = "bottom";
        else p = "top";
      }
    }
    p = p || "right";

    if (p === "left") return { x: box.x, y: box.y + box.h / 2, port: "left" as const };
    if (p === "top") return { x: box.x + box.w / 2, y: box.y, port: "top" as const };
    if (p === "bottom") return { x: box.x + box.w / 2, y: box.y + box.h, port: "bottom" as const };
    return { x: box.x + box.w, y: box.y + box.h / 2, port: "right" as const };
  };

  // Helper to calculate smooth Bezier path with port orientation
  const makeBezierPath = (
    from: { x: number; y: number; port?: PortSide },
    to: { x: number; y: number; port?: PortSide }
  ) => {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const offset = Math.max(40, Math.min(180, Math.max(dx, dy) * 0.45));

    let cx1 = from.x;
    let cy1 = from.y;
    let cx2 = to.x;
    let cy2 = to.y;

    if (from.port === "left") cx1 -= offset;
    else if (from.port === "right") cx1 += offset;
    else if (from.port === "top") cy1 -= offset;
    else if (from.port === "bottom") cy1 += offset;
    else cx1 += to.x > from.x ? offset : -offset;

    if (to.port === "left") cx2 -= offset;
    else if (to.port === "right") cx2 += offset;
    else if (to.port === "top") cy2 -= offset;
    else if (to.port === "bottom") cy2 += offset;
    else if (to.port) cx2 += to.x > from.x ? -offset : offset;
    else {
      // Elastic free dragging: smooth lead
      cx2 = to.x;
      cy2 = to.y;
    }

    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  };

  return (
    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible z-[5]">
      <defs>
        {/* Core Theme Accent Gradient */}
        <linearGradient id="edgeGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--swarm-border-hi-hex, #64748b)" stopOpacity="0.85" />
          <stop offset="50%" stopColor="var(--swarm-gold-hex, #fafcff)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--swarm-gold-hi-hex, #94a3b8)" stopOpacity="0.9" />
        </linearGradient>

        {/* Ambient Neural Glow Filter */}
        <filter id="synapseGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur1" />
          <feGaussianBlur stdDeviation="5.5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render all active edges */}
      {edges.map((edge) => {
        const fromPos = getSocketPos(edge.from, edge.fromPort, edge.to);
        const toPos = getSocketPos(edge.to, edge.toPort, edge.from);
        if (!fromPos || !toPos) return null;

        const pathStr = makeBezierPath(fromPos, toPos);
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        const isHovered = hoveredEdge === edge.id;

        return (
          <g key={edge.id} className="pointer-events-auto group">
            {/* Wider transparent hit zone for hovering and double-click to disconnect */}
            <path
              d={pathStr}
              fill="none"
              stroke="transparent"
              strokeWidth={36}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredEdge(edge.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                removeEdge(edge.id);
              }}
            >
              <title>Double-click wire to disconnect</title>
            </path>

            {/* Base dark backdrop cable track */}
            <path
              d={pathStr}
              fill="none"
              stroke="var(--swarm-canvas-hex, #060709)"
              strokeWidth={isHovered ? 9 : 7.5}
              strokeOpacity={0.95}
              className="transition-all duration-200"
            />

            {/* Ambient Neon Glow Layer */}
            <path
              d={pathStr}
              fill="none"
              stroke={isHovered ? "var(--swarm-err-hex, #f43f5e)" : "url(#edgeGoldGrad)"}
              strokeWidth={isHovered ? 4.5 : 2.5}
              strokeOpacity={isHovered ? 1 : 0.9}
              filter="url(#synapseGlow)"
              className="transition-all duration-200"
            />

            {/* Animated Dashed Fiber Line */}
            <path
              d={pathStr}
              fill="none"
              stroke={isHovered ? "#fda4af" : "var(--swarm-gold-hi-hex, #ffffff)"}
              strokeWidth={isHovered ? 1.8 : 1.2}
              strokeDasharray="6 12"
              strokeOpacity={isHovered ? 1 : 0.8}
              className="animate-[dash_1.8s_linear_infinite]"
            />

            {/* Live Traveling Neural Energy Pulse 1 */}
            <circle r={isHovered ? 4 : 3.5} fill={isHovered ? "#f43f5e" : "var(--swarm-gold-hi-hex, #ffffff)"} filter="url(#synapseGlow)">
              <animateMotion dur="2.2s" repeatCount="indefinite" path={pathStr} />
            </circle>
            <circle r="1.5" fill="#ffffff">
              <animateMotion dur="2.2s" repeatCount="indefinite" path={pathStr} />
            </circle>

            {/* Live Traveling Neural Energy Pulse 2 */}
            <circle r={isHovered ? 3.5 : 3} fill={isHovered ? "#fb7185" : "var(--swarm-gold-hex, #cbd5e1)"} filter="url(#synapseGlow)">
              <animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path={pathStr} />
            </circle>
            <circle r="1.2" fill="var(--swarm-gold-hi-hex, #ffffff)">
              <animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite" path={pathStr} />
            </circle>

            {/* Micro Floating Tooltip Badge only visible on wire hover */}
            {isHovered && (
              <foreignObject
                x={midX - 75}
                y={midY - 14}
                width={150}
                height={28}
                className="overflow-visible pointer-events-auto"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEdge(edge.id);
                  }}
                  className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-[#18080a]/95 border border-rose-500/80 text-rose-200 shadow-2xl text-[10px] font-mono font-medium backdrop-blur-xl animate-fade-in cursor-pointer hover:bg-rose-950 hover:scale-105 transition-all select-none"
                  title="Double-click wire or click here to disconnect"
                >
                  <X size={11} className="text-rose-400 shrink-0" />
                  <span>Double-click to disconnect</span>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* Render active dragging wire if user is currently connecting */}
      {connectingFrom && mouseWorld && (() => {
        const fromPos = getSocketPos(connectingFrom.nodeId, connectingFrom.port);
        if (!fromPos) return null;

        const pathStr = makeBezierPath(fromPos, { x: mouseWorld.x, y: mouseWorld.y });

        return (
          <g className="pointer-events-none animate-fade-in">
            {/* Live elastic glow wire */}
            <path
              d={pathStr}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={3}
              strokeDasharray="6 8"
              filter="url(#synapseGlow)"
              className="animate-[dash_0.8s_linear_infinite]"
            />
            <circle cx={mouseWorld.x} cy={mouseWorld.y} r={6} fill="#f1f5f9" className="animate-ping opacity-75" />
            <circle cx={mouseWorld.x} cy={mouseWorld.y} r={4} fill="#ffffff" />
          </g>
        );
      })()}
    </svg>
  );
}
