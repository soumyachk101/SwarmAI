"use client";

import { useRef, useState } from "react";
import { useCanvasStore, type NodeBox } from "./canvasStore.js";

interface Props {
  id: string;
  box?: NodeBox;
  zoom: number;
  children: React.ReactNode;
}

/**
 * One node on the canvas: a glass frame holding a real pane.
 *
 * Dragging is bound to the pane's own title bar (which already carries
 * `cursor-grab`), not the whole frame — otherwise clicking inside a terminal
 * would drag the window out from under the cursor.
 */
export default function CanvasNode({ id, box, zoom, children }: Props) {
  const moveNode = useCanvasStore((s) => s.moveNode);
  const resizeNode = useCanvasStore((s) => s.resizeNode);
  const raiseNode = useCanvasStore((s) => s.raiseNode);

  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const resize = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const [live, setLive] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const ensureNode = useCanvasStore((s) => s.ensureNode);
  const fallbackBox = box ?? { x: 0, y: 0, w: 520, h: 380, z: 1 };
  const shown = live ?? fallbackBox;

  const startDrag = (e: React.PointerEvent) => {
    // Only the header drags, and only with the left button.
    const el = e.target as HTMLElement;
    if (e.button !== 0) return;
    if (el.closest("button, input, select, textarea, a, [role='button']")) return;
    if (!el.closest("[data-pane-header]")) return;
    drag.current = { px: e.clientX, py: e.clientY, x: fallbackBox.x, y: fallbackBox.y };
    setLive({ x: fallbackBox.x, y: fallbackBox.y, w: fallbackBox.w, h: fallbackBox.h });
    raiseNode(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const startResize = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    resize.current = { px: e.clientX, py: e.clientY, w: fallbackBox.w, h: fallbackBox.h };
    setLive({ x: fallbackBox.x, y: fallbackBox.y, w: fallbackBox.w, h: fallbackBox.h });
    raiseNode(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  };

  const onMove = (e: React.PointerEvent) => {
    // Pointer deltas are in screen pixels; the world is scaled, so divide or
    // the node runs away from the cursor at anything but 100% zoom.
    if (drag.current) {
      const d = drag.current;
      setLive({
        x: d.x + (e.clientX - d.px) / zoom,
        y: d.y + (e.clientY - d.py) / zoom,
        w: fallbackBox.w,
        h: fallbackBox.h,
      });
      e.stopPropagation();
    } else if (resize.current) {
      const r = resize.current;
      setLive({
        x: fallbackBox.x,
        y: fallbackBox.y,
        w: Math.max(260, r.w + (e.clientX - r.px) / zoom),
        h: Math.max(160, r.h + (e.clientY - r.py) / zoom),
      });
      e.stopPropagation();
    }
  };

  const commit = () => {
    if (live) {
      if (drag.current) moveNode(id, live.x, live.y);
      if (resize.current) resizeNode(id, live.w, live.h);
    }
    drag.current = null;
    resize.current = null;
    setLive(null);
  };

  const connectingFrom = useCanvasStore((s) => s.connectingFrom);
  const setConnectingFrom = useCanvasStore((s) => s.setConnectingFrom);
  const addEdge = useCanvasStore((s) => s.addEdge);

  const edges = useCanvasStore((s) => s.edges);
  const incomingCount = edges.filter((e) => e.to === id).length;
  const outgoingCount = edges.filter((e) => e.from === id).length;
  const isConnected = incomingCount > 0 || outgoingCount > 0;

  const isConnectingSource = connectingFrom?.nodeId === id;
  const isConnectingTarget = connectingFrom !== null && connectingFrom.nodeId !== id;

  const dragging = live !== null;

  return (
    <div
      className={`absolute flex flex-col overflow-visible rounded-2xl border transition-[box-shadow,border-color] duration-200 ${
        isConnected
          ? "border-swarm-borderHi/60 bg-swarm-surface/95 shadow-2xl shadow-black/80 ring-1 ring-swarm-gold/20"
          : "border-swarm-border/70 bg-swarm-surface/90 hover:border-swarm-borderHi/50 hover:shadow-xl"
      } ${dragging ? "shadow-2xl ring-2 ring-swarm-gold/60" : ""} ${
        isConnectingSource ? "ring-2 ring-swarm-gold" : ""
      }`}
      style={{
        left: shown.x,
        top: shown.y,
        width: shown.w,
        height: shown.h,
        zIndex: fallbackBox.z,
        transition: dragging ? "none" : "box-shadow 0.2s ease, border-color 0.2s ease",
        touchAction: "none",
      }}
      onPointerDown={startDrag}
      onPointerMove={onMove}
      onPointerUp={commit}
      onPointerCancel={commit}
      onMouseDownCapture={() => raiseNode(id)}
    >
      {/* Active Synapse Swarm Badge */}
      {isConnected && (
        <div className="pointer-events-none absolute -top-3 left-4 z-30 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-swarm-canvas/95 border border-swarm-borderHi/40 text-[10px] font-mono text-swarm-text shadow-lg backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
          <span>
            {incomingCount > 0 && outgoingCount > 0
              ? `Synapse (${incomingCount} in · ${outgoingCount} out)`
              : incomingCount > 0
              ? `Receiving (${incomingCount} link${incomingCount > 1 ? "s" : ""})`
              : `Dispatches to (${outgoingCount} CLI${outgoingCount > 1 ? "s" : ""})`}
          </span>
        </div>
      )}

      {/* Node Content Container with Curvy Corners */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl">{children}</div>

      {/* Top Socket (Top Side Connector) */}
      <div
        data-input-socket="true"
        className={`absolute left-1/2 -top-2.5 -translate-x-1/2 size-5 rounded-full flex items-center justify-center cursor-crosshair transition-all z-30 opacity-75 hover:opacity-100 ${
          isConnectingTarget
            ? "bg-swarm-gold text-swarm-canvas scale-125 animate-bounce shadow-md shadow-swarm-gold/50 opacity-100"
            : "bg-swarm-surfaceHi border border-swarm-borderHi/60 hover:scale-110 hover:border-swarm-gold"
        }`}
        title="Top Port (Drag wire or drop here to connect)"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setConnectingFrom({ nodeId: id, port: "top" });
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (connectingFrom && connectingFrom.nodeId !== id) {
            addEdge(connectingFrom.nodeId, id, connectingFrom.port, "top");
          }
        }}
      >
        <span className="size-1.5 rounded-full bg-swarm-textDim" />
      </div>

      {/* Left Socket (Left Side Connector - Drag OR Drop) */}
      <div
        data-input-socket="true"
        className={`absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center cursor-crosshair transition-all z-30 ${
          isConnectingTarget
            ? "bg-swarm-gold text-swarm-canvas scale-125 animate-bounce shadow-lg shadow-swarm-gold/50"
            : incomingCount > 0
            ? "bg-swarm-surfaceHi border-2 border-swarm-gold text-swarm-text shadow-md shadow-swarm-gold/20 hover:scale-110"
            : "bg-swarm-surfaceHi border border-swarm-borderHi/60 text-swarm-textDim hover:scale-110 hover:border-swarm-gold"
        }`}
        title="Left Port (Drag wire or drop here to connect)"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setConnectingFrom({ nodeId: id, port: "left" });
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (connectingFrom && connectingFrom.nodeId !== id) {
            addEdge(connectingFrom.nodeId, id, connectingFrom.port, "left");
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (connectingFrom && connectingFrom.nodeId !== id) {
            addEdge(connectingFrom.nodeId, id, connectingFrom.port, "left");
          }
        }}
      >
        <span
          className={`size-2 rounded-full ${
            incomingCount > 0 ? "bg-swarm-gold animate-pulse" : "bg-swarm-textDim"
          }`}
        />
      </div>

      {/* Right Socket (Right Side Connector - Drag OR Drop) */}
      <div
        data-input-socket="true"
        className={`absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center cursor-crosshair transition-all z-30 ${
          isConnectingSource
            ? "bg-swarm-gold text-swarm-canvas scale-125 ring-2 ring-swarm-gold/60 shadow-lg shadow-swarm-gold/50"
            : outgoingCount > 0
            ? "bg-swarm-surfaceHi border-2 border-swarm-gold text-swarm-text shadow-md shadow-swarm-gold/20 hover:scale-110"
            : "bg-swarm-surfaceHi border border-swarm-borderHi/60 text-swarm-textDim hover:scale-110 hover:border-swarm-gold"
        }`}
        title="Right Port (Drag wire or drop here to connect)"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setConnectingFrom({ nodeId: id, port: "right" });
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (connectingFrom && connectingFrom.nodeId !== id) {
            addEdge(connectingFrom.nodeId, id, connectingFrom.port, "right");
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (connectingFrom && connectingFrom.nodeId !== id) {
            addEdge(connectingFrom.nodeId, id, connectingFrom.port, "right");
          }
        }}
      >
        <span
          className={`size-2 rounded-full ${
            outgoingCount > 0 ? "bg-swarm-gold animate-pulse" : "bg-swarm-textDim"
          }`}
        />
      </div>

      {/* Bottom Socket (Bottom Side Connector) */}
      <div
        data-input-socket="true"
        className={`absolute left-1/2 -bottom-2.5 -translate-x-1/2 size-5 rounded-full flex items-center justify-center cursor-crosshair transition-all z-30 opacity-75 hover:opacity-100 ${
          isConnectingTarget
            ? "bg-swarm-gold text-swarm-canvas scale-125 animate-bounce shadow-md shadow-swarm-gold/50 opacity-100"
            : "bg-swarm-surfaceHi border border-swarm-borderHi/60 hover:scale-110 hover:border-swarm-gold"
        }`}
        title="Bottom Port (Drag wire or drop here to connect)"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setConnectingFrom({ nodeId: id, port: "bottom" });
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (connectingFrom && connectingFrom.nodeId !== id) {
            addEdge(connectingFrom.nodeId, id, connectingFrom.port, "bottom");
          }
        }}
      >
        <span className="size-1.5 rounded-full bg-swarm-textDim" />
      </div>

      {/* Resize grip */}
      <div
        onPointerDown={startResize}
        onPointerMove={onMove}
        onPointerUp={commit}
        onPointerCancel={commit}
        title="Resize"
        className="absolute bottom-0 right-0 cursor-nwse-resize z-20"
        style={{ width: 20 / zoom, height: 20 / zoom, padding: 4 / zoom, boxSizing: "border-box", touchAction: "none" }}
      >
        <svg viewBox="0 0 16 16" className="size-full text-swarm-textMuted/70">
          <path d="M15 6 6 15M15 11l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
