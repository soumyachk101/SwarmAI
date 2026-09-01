"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { DEFAULT_CAMERA, GRID, clampZoom, screenToWorld, type Camera } from "./camera.js";
import { useCanvasStore } from "./canvasStore.js";
import CanvasNode from "./CanvasNode.js";
import CanvasControls from "./CanvasControls.js";
import SwarmTelemetryHUD from "./SwarmTelemetryHUD.js";

import CanvasEdges from "./CanvasEdges.js";
import FlowCommandBar, { type FlowAgentTarget } from "./FlowCommandBar.js";

export interface CanvasItem {
  id: string;
  /** Rendered inside the node frame. The frame supplies chrome and geometry. */
  content: React.ReactNode;
}

export interface FlowAgentMeta {
  id: string;
  name: string;
  cli?: string;
  isLead?: boolean;
  status?: string;
}

interface Props {
  /** Camera and layout are kept per swarm. */
  swarmId: string;
  items: CanvasItem[];
  agentsMeta?: FlowAgentMeta[];
  onDispatch?: (params: {
    prompt: string;
    mode: "broadcast" | "pipeline";
    targetIds: string[];
  }) => Promise<void>;
  /** Fired when the user drops something onto empty canvas, in world coords. */
  onCanvasDoubleClick?: (world: { x: number; y: number }) => void;
  /** Terminals must be re-measured after a zoom settles. */
  onZoomSettled?: () => void;
  emptyState?: React.ReactNode;
}

export default function FlowCanvas({
  swarmId, items, agentsMeta = [], onDispatch, onCanvasDoubleClick, onZoomSettled, emptyState,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const nodes = useCanvasStore((s) => s.nodes);
  const cameras = useCanvasStore((s) => s.cameras);
  const ensureNode = useCanvasStore((s) => s.ensureNode);
  const panCamera = useCanvasStore((s) => s.panCamera);
  const zoomCamera = useCanvasStore((s) => s.zoomCamera);
  const connectingFrom = useCanvasStore((s) => s.connectingFrom);
  const setConnectingFrom = useCanvasStore((s) => s.setConnectingFrom);

  const stored = cameras[swarmId];
  const PAN_LIMIT = 8000;
 const cam: Camera = stored
 ? {
 ...stored,
 zoom: clampZoom(stored.zoom) || 1,
 x: Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, stored.x ?? DEFAULT_CAMERA.x)),
 y: Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, stored.y ?? DEFAULT_CAMERA.y)),
 }
 : DEFAULT_CAMERA;

  const ids = items.map((i) => i.id);
  const idKey = ids.join("|");

  useIsomorphicLayoutEffect(() => {
    for (const id of ids) ensureNode(id, ids);
  }, [idKey]);

  useIsomorphicLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Panning & Mouse tracking for wire connections ───────────────────── */
  const panning = useRef<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number } | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    const onEmpty = e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBackdrop === "true";
    if (onEmpty && connectingFrom) {
      setConnectingFrom(null);
    }
    if (e.button === 1 || (e.button === 0 && onEmpty)) {
      panning.current = { x: e.clientX, y: e.clientY };
      setIsPanning(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  };

  // Global pointer tracker for wire drag connection so dragging over terminals/panes never stalls
  useEffect(() => {
    if (!connectingFrom) {
      setMouseWorld(null);
      return;
    }

    const onGlobalMove = (e: PointerEvent) => {
      if (viewportRef.current) {
        const r = viewportRef.current.getBoundingClientRect();
        setMouseWorld(screenToWorld(cam, e.clientX - r.left, e.clientY - r.top));
      }
    };

    const onGlobalUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      // If dropped not on an input socket, cancel the temporary wire
      if (!target || !target.closest("[data-input-socket]")) {
        setConnectingFrom(null);
        setMouseWorld(null);
      }
    };

    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);
    return () => {
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
  }, [connectingFrom, cam, setConnectingFrom]);

  const onPointerMove = (e: React.PointerEvent) => {
    const p = panning.current;
    if (p) {
      panCamera(swarmId, e.clientX - p.x, e.clientY - p.y);
      panning.current = { x: e.clientX, y: e.clientY };
      setHasNavigated(true);
    }
  };

  const endPan = () => {
    panning.current = null;
    setIsPanning(false);
  };

  /* ── Wheel: pan/zoom only over the backdrop ─────────────────────────── */
  const settleTimer = useRef<number | null>(null);
  const onWheel = useCallback((e: WheelEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    const target = e.target as HTMLElement | null;
    const isBackdrop = !!target && (target.dataset.canvasBackdrop === "true" || target === el);
    if (!isBackdrop) return;
    const r = el.getBoundingClientRect();
    const dScale = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 120 : 1;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      zoomCamera(swarmId, e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * dScale * 0.0022));
    } else if (e.shiftKey) {
      e.preventDefault();
      panCamera(swarmId, -e.deltaY * dScale, 0);
    } else {
      e.preventDefault();
      panCamera(swarmId, -e.deltaX * dScale, -e.deltaY * dScale);
    }
    setHasNavigated(true);
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => onZoomSettled?.(), 180);
  }, [swarmId, zoomCamera, panCamera, onZoomSettled]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  useEffect(() => () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
  }, []);

  const MIN_DOT_PX = 11;
  const rawDot = GRID * cam.zoom;
  const dot = rawDot * 2 ** Math.max(0, Math.ceil(Math.log2(MIN_DOT_PX / rawDot)));
  const originX = cam.x * cam.zoom;
  const originY = cam.y * cam.zoom;

  // Prepare targets for Swarm Command Bar
  const flowTargets: FlowAgentTarget[] = items.map((item) => {
    const meta = agentsMeta.find((m) => m.id === item.id);
    return {
      id: item.id,
      name: meta?.name || item.id,
      cli: meta?.cli,
      isLead: meta?.isLead,
    };
  });

  const handleDispatch = async (params: {
    prompt: string;
    mode: "broadcast" | "pipeline";
    targetIds: string[];
  }) => {
    if (onDispatch) {
      setIsDispatching(true);
      try {
        await onDispatch(params);
      } finally {
        setIsDispatching(false);
      }
    }
  };

  return (
    <div
      ref={viewportRef}
      className={`absolute inset-0 overflow-hidden font-sans antialiased ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onDoubleClick={(e) => {
        if (e.target !== e.currentTarget && (e.target as HTMLElement).dataset.canvasBackdrop !== "true") return;
        const r = viewportRef.current!.getBoundingClientRect();
        onCanvasDoubleClick?.(screenToWorld(cam, e.clientX - r.left, e.clientY - r.top));
      }}
    >
      {/* Interactive Floating Swarm Command Bar */}
      {items.length > 0 && onDispatch && (
        <FlowCommandBar
          agents={flowTargets}
          onDispatch={handleDispatch}
          isDispatching={isDispatching}
        />
      )}

      {/* The background surface dot grid */}
      <div
        data-canvas-backdrop="true"
        className="absolute inset-0 canvas-surface"
        style={{
          backgroundSize: `${dot}px ${dot}px, ${dot * 5}px ${dot * 5}px`,
          backgroundPosition: `${originX}px ${originY}px, ${originX}px ${originY}px`,
        }}
      />

      {items.length === 0 && emptyState && (
        <div data-canvas-backdrop="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">{emptyState}</div>
        </div>
      )}

      {/* World layer for nodes and wires */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `scale(${cam.zoom}) translate(${cam.x}px, ${cam.y}px)` }}
      >
        {/* SVG Bezier Wire Mesh Layer */}
        <CanvasEdges mouseWorld={mouseWorld} />

        {items.map((item) => (
          <CanvasNode key={item.id} id={item.id} box={nodes[item.id]} zoom={cam.zoom}>
            {item.content}
          </CanvasNode>
        ))}
      </div>

      <CanvasHint used={hasNavigated} />
      <SwarmTelemetryHUD agents={agentsMeta} />
      <CanvasControls swarmId={swarmId} ids={ids} view={size} />
    </div>
  );
}

const HINT_KEY = "swarm-canvas-hint-seen";

function CanvasHint({ used }: { used: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!used || dismissed) return;
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }, [used, dismissed]);

  if (dismissed) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg glass-hi glass-sheen px-2.5 py-1.5 text-micro text-swarm-textMuted font-sans antialiased">
      Drag socket dots to connect CLIs · Swarm Bar to broadcast · Drag title bar to move
    </div>
  );
}
