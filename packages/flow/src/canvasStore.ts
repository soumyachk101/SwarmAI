import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_CAMERA, clampZoom, clampPan, fitTo, panBy, placeNear, snap, zoomAbout,
  type Camera, type Rect,
} from "./camera.js";

export interface NodeBox extends Rect {
  /** Stacking order. Touching a node floats it above the rest. */
  z: number;
}

export const DEFAULT_NODE_SIZE = { w: 520, h: 380 };

export type PortSide = "left" | "right" | "top" | "bottom";

export interface ConnectingInfo {
  nodeId: string;
  port: PortSide;
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  fromPort?: PortSide;
  toPort?: PortSide;
}

interface CanvasState {
  /** Node geometry, keyed by pane id. One flat map across all swarms: pane
   *  ids are already unique, and a pane keeps its spot when swarms switch. */
  nodes: Record<string, NodeBox>;
  /** Camera per swarm, so each project keeps its own viewpoint. */
  cameras: Record<string, Camera>;
  topZ: number;
  /** Active wire connections between nodes */
  edges: CanvasEdge[];
  /** Node and port currently initiating a connection drag */
  connectingFrom: ConnectingInfo | null;

  cameraFor: (swarmId: string) => Camera;
  setCamera: (swarmId: string, cam: Camera) => void;
  panCamera: (swarmId: string, dxScreen: number, dyScreen: number) => void;
  zoomCamera: (swarmId: string, sx: number, sy: number, factor: number) => void;
  setZoom: (swarmId: string, zoom: number, viewW: number, viewH: number) => void;
  fitAll: (swarmId: string, ids: string[], viewW: number, viewH: number) => void;

  boxFor: (id: string) => NodeBox | undefined;
  /** Give a pane a spot if it has none yet, avoiding everything already placed. */
  ensureNode: (id: string, siblingIds: string[]) => NodeBox;
  moveNode: (id: string, x: number, y: number) => void;
  resizeNode: (id: string, w: number, h: number) => void;
  raiseNode: (id: string) => void;
  removeNode: (id: string) => void;
  /** Lay every pane out in a tidy grid — the escape hatch from a messy canvas. */
  tidy: (ids: string[]) => void;

  /** Edge actions */
  setConnectingFrom: (info: ConnectingInfo | null) => void;
  addEdge: (from: string, to: string, fromPort?: PortSide, toPort?: PortSide) => void;
  removeEdge: (edgeId: string) => void;
  clearEdges: () => void;
}

const MIN_W = 260;
const MIN_H = 160;

// Debounced localStorage to avoid ~60 writes/sec during pan/zoom.
const debouncedSetItem = <T>(storage: Storage) => {
 let timeout: ReturnType<typeof setTimeout> | null = null;
 return {
 getItem: (name: string) => storage.getItem(name),
 setItem: (name: string, value: string) => {
 if (timeout) clearTimeout(timeout);
 timeout = setTimeout(() => storage.setItem(name, value), 500);
 },
 removeItem: (name: string) => storage.removeItem(name),
 };
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      nodes: {},
      cameras: {},
      topZ: 1,
      edges: [],
      connectingFrom: null,

      cameraFor: (swarmId) => get().cameras[swarmId] ?? DEFAULT_CAMERA,
      setCamera: (swarmId, cam) =>
        set((s) => ({ cameras: { ...s.cameras, [swarmId]: { ...cam, zoom: clampZoom(cam.zoom) } } })),
      panCamera: (swarmId, dx, dy) =>
        set((s) => ({ cameras: { ...s.cameras, [swarmId]: panBy(s.cameras[swarmId] ?? DEFAULT_CAMERA, dx, dy) } })),
      zoomCamera: (swarmId, sx, sy, factor) =>
        set((s) => ({ cameras: { ...s.cameras, [swarmId]: zoomAbout(s.cameras[swarmId] ?? DEFAULT_CAMERA, sx, sy, factor) } })),
      setZoom: (swarmId, zoom, viewW, viewH) =>
        set((s) => {
          const cam = s.cameras[swarmId] ?? DEFAULT_CAMERA;
          // Zoom from the middle of the viewport, which is where the user is
          // looking when they press a zoom button rather than scroll.
          const factor = clampZoom(zoom) / cam.zoom;
          return { cameras: { ...s.cameras, [swarmId]: zoomAbout(cam, viewW / 2, viewH / 2, factor) } };
        }),
      fitAll: (swarmId, ids, viewW, viewH) =>
        set((s) => {
          const rects = ids.map((id) => s.nodes[id]).filter(Boolean) as Rect[];
          return { cameras: { ...s.cameras, [swarmId]: fitTo(rects, viewW, viewH) } };
        }),

      boxFor: (id) => get().nodes[id],

      ensureNode: (id, siblingIds) => {
        const existing = get().nodes[id];
        if (existing) return existing;
        const others = siblingIds
          .filter((s) => s !== id)
          .map((s) => get().nodes[s])
          .filter(Boolean) as Rect[];
        const spot = placeNear(others, DEFAULT_NODE_SIZE, { x: 0, y: 0 });
        const z = get().topZ + 1;
        const box: NodeBox = { ...spot, ...DEFAULT_NODE_SIZE, z };
        set((s) => ({ nodes: { ...s.nodes, [id]: box }, topZ: z }));
        return box;
      },

      moveNode: (id, x, y) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n) return s;
          return { nodes: { ...s.nodes, [id]: { ...n, x: snap(x), y: snap(y) } } };
        }),

      resizeNode: (id, w, h) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n) return s;
          return {
            nodes: { ...s.nodes, [id]: { ...n, w: Math.max(MIN_W, snap(w)), h: Math.max(MIN_H, snap(h)) } },
          };
        }),

      raiseNode: (id) =>
        set((s) => {
          const n = s.nodes[id];
          if (!n || n.z === s.topZ) return s;
          const z = s.topZ + 1;
          return { nodes: { ...s.nodes, [id]: { ...n, z } }, topZ: z };
        }),

      removeNode: (id) =>
        set((s) => {
          const { [id]: _gone, ...rest } = s.nodes;
          const remainingEdges = s.edges.filter((e) => e.from !== id && e.to !== id);
          return { nodes: rest, edges: remainingEdges };
        }),

      tidy: (ids) =>
        set((s) => {
          const cols = Math.max(1, Math.ceil(Math.sqrt(ids.length)));
          const gap = 28;
          const nodes = { ...s.nodes };
          ids.forEach((id, i) => {
            const n = nodes[id];
            if (!n) return;
            nodes[id] = {
              ...n,
              ...DEFAULT_NODE_SIZE,
              x: (i % cols) * (DEFAULT_NODE_SIZE.w + gap),
              y: Math.floor(i / cols) * (DEFAULT_NODE_SIZE.h + gap),
            };
          });
          return { nodes };
        }),

      setConnectingFrom: (info) => set({ connectingFrom: info }),

      addEdge: (from, to, fromPort = "right", toPort = "left") =>
        set((s) => {
          if (from === to) return s;
          const exists = s.edges.some((e) => e.from === from && e.to === to);
          if (exists) return s;
          const newEdge: CanvasEdge = {
            id: `edge-${from}-${to}-${Date.now()}`,
            from,
            to,
            fromPort,
            toPort,
          };
          return { edges: [...s.edges, newEdge], connectingFrom: null };
        }),

      removeEdge: (edgeId) =>
        set((s) => ({ edges: s.edges.filter((e) => e.id !== edgeId) })),

      clearEdges: () => set({ edges: [] }),
    }),
    {
      name: "swarm-canvas",
      storage: createJSONStorage(() => debouncedSetItem(localStorage)),
      partialize: (s) => ({ nodes: s.nodes, cameras: s.cameras, topZ: s.topZ, edges: s.edges }),
    },
  ),
);
