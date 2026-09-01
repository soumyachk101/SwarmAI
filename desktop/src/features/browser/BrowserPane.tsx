"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
 ArrowLeft, ArrowRight, RotateCw, Camera, X, Maximize2, Minimize2, Globe, Loader2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { CdpClient, normalizeUrl } from "@/features/browser/cdp";
import { useBrowserStore } from "@/features/browser/browserStore";
import { PANE_HEADER_CLASS, themeForKind } from "@swarm/board";

const CDP_PORT = 9222;

/** CDP modifier bitmask: Alt=1, Ctrl=2, Meta=4, Shift=8. */
function cdpModifiers(e: { altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }): number {
 return (e.altKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.metaKey ? 4 : 0) | (e.shiftKey ? 8 : 0);
}

interface Props {
 paneId: string;
 initialUrl?: string;
 onClose: () => void;
 onToggleMaximize: () => void;
 isMaximized: boolean;
}

export default function BrowserPane({
 paneId, initialUrl = "about:blank", onClose, onToggleMaximize, isMaximized,
}: Props) {
 const [urlInput, setUrlInput] = useState(initialUrl === "about:blank" ? "" : initialUrl);
 const [frame, setFrame] = useState<string | null>(null);
 const [status, setStatus] = useState<"booting" | "ready" | "error">("booting");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [shotFlash, setShotFlash] = useState(false);
 // Bumped by Retry to re-run the boot effect.
 const [bootNonce, setBootNonce] = useState(0);

 const clientRef = useRef<CdpClient | null>(null);
 const sessionRef = useRef<string | null>(null);
 /** The headless tab this pane owns, so unmount can close it. */
 const targetRef = useRef<string | null>(null);
 const viewRef = useRef<HTMLDivElement>(null);
 const imgRef = useRef<HTMLImageElement>(null);
 // Mirrors urlInput so callbacks registered once don't read a stale URL.
 const urlRef = useRef(initialUrl);
 useEffect(() => { urlRef.current = urlInput; }, [urlInput]);

 /**
 * The emulated viewport in CSS pixels. Frames come back at this size times the
 * device scale factor, so pointer coordinates have to be scaled against *this*
 * and not against the image's own pixel dimensions — otherwise every click on
 * a HiDPI display lands at twice the intended offset.
 */
 const metricsRef = useRef({ width: 1280, height: 800 });

 /** Match the emulated viewport to the pane, at the display's real pixel ratio. */
 const applyMetrics = useCallback(async (c: CdpClient, s: string) => {
 const r = viewRef.current?.getBoundingClientRect();
 const width = Math.max(320, Math.round(r?.width ?? 1280));
 const height = Math.max(240, Math.round(r?.height ?? 800));
 metricsRef.current = { width, height };
 await c.send("Emulation.setDeviceMetricsOverride", {
 width,
 height,
 deviceScaleFactor: window.devicePixelRatio || 1,
 mobile: false,
 }, s);
 }, []);

 const setScreenshot = useBrowserStore((s) => s.setScreenshot);
 const clearScreenshot = useBrowserStore((s) => s.clearScreenshot);
 const registerControls = useBrowserStore((s) => s.registerControls);
 const unregisterControls = useBrowserStore((s) => s.unregisterControls);

 /* ── Boot: launch Chromium, attach a target, start the screencast ── */
 useEffect(() => {
 let cancelled = false;
 let client: CdpClient | null = null;

 (async () => {
 try {
 await invoke<number>("launch_cdp_browser", { port: CDP_PORT });
 const wsUrl = await invoke<string>("cdp_ws_url", { port: CDP_PORT });
 if (cancelled) return;

 client = await CdpClient.connect(wsUrl);
 if (cancelled) { client.close(); return; }
 clientRef.current = client;

 const { targetId } = await client.send<{ targetId: string }>("Target.createTarget", {
 url: initialUrl,
 });
 targetRef.current = targetId;
 const { sessionId } = await client.send<{ sessionId: string }>("Target.attachToTarget", {
 targetId,
 flatten: true,
 });
 if (cancelled) return;
 sessionRef.current = sessionId;

 await client.send("Page.enable", {}, sessionId);

 client.on("Page.screencastFrame", (p: any) => {
 setFrame(p.data);
 const c = clientRef.current, s = sessionRef.current;
 if (!c) return;
 c.send("Page.screencastFrameAck", { sessionId: p.sessionId }, s).catch(() => {});
 });
 client.on("Page.frameNavigated", (p: any) => {
 if (p.frame?.parentId) return;
 if (p.frame?.url && p.frame.url !== "about:blank") setUrlInput(p.frame.url);
 });
 client.on("Page.frameStartedLoading", () => setLoading(true));
 client.on("Page.frameStoppedLoading", () => setLoading(false));

 await applyMetrics(client, sessionId);

 await client.send("Page.startScreencast", {
 format: "jpeg", quality: 65, everyNthFrame: 1,
 }, sessionId);

 if (!cancelled) setStatus("ready");
 } catch (e: any) {
 if (!cancelled) {
 setError(String(e?.message ?? e));
 setStatus("error");
 }
 }
 })();

 return () => {
 cancelled = true;
 const s = sessionRef.current;
 const t = targetRef.current;
 const c = clientRef.current;
 clientRef.current = null;
 sessionRef.current = null;
 targetRef.current = null;
 clearScreenshot(paneId);
 if (!c) return;
 (async () => {
 try {
 if (s) await c.send("Page.stopScreencast", {}, s);
 if (t) await c.send("Target.closeTarget", { targetId: t });
 } catch {
 // Browser already gone; closing the socket below is all that is left.
 } finally {
 c.close();
 }
 // Best-effort: kill the Chromium process so we don't leave an orphan
 // holding its profile lock (which would break the next launch.
 invoke("stop_cdp_browser").catch(() => {});
 })();
 };
 }, [paneId, clearScreenshot, bootNonce]); // initialUrl excluded — tracked via ref to prevent re-boot loops

 /* ── Keep the emulated viewport matched to the pane size ────────── */
 useEffect(() => {
 if (status !== "ready" || !viewRef.current) return;
 const el = viewRef.current;
 let t: ReturnType<typeof setTimeout>;
 const ro = new ResizeObserver(() => {
 clearTimeout(t);
 t = setTimeout(() => {
 const c = clientRef.current, s = sessionRef.current;
 if (c && s) applyMetrics(c, s).catch(() => {});
 }, 120);
 });
 ro.observe(el);
 return () => { clearTimeout(t); ro.disconnect(); };
 }, [status, applyMetrics]);

 const cmd = useCallback(async (method: string, params: object = {}) => {
 const c = clientRef.current, s = sessionRef.current;
 if (!c || !s) return;
 try { await c.send(method, params, s); } catch (e: any) { setError(String(e?.message ?? e)); }
 }, []);

 const navigate = useCallback((raw: string) => {
 let url: string;
 try {
 url = normalizeUrl(raw);
 } catch (e: any) {
 setError(String(e?.message ?? e));
 return;
 }
 // Only allow http/https — javascript:, data:, file: etc. are rejected to
 // prevent code execution via the browser pane.
 const scheme = url.split(":")[0].toLowerCase();
 if (scheme !== "http" && scheme !== "https" && scheme !== "about") {
 setError("Only http, https, and about: URLs are allowed");
 return;
 }
 setError(null);
 setUrlInput(url === "about:blank" ? "" : url);
 cmd("Page.navigate", { url });
 }, [cmd]);

 /* ── Input forwarding ───────────────────────────────────────────── */
 const toPageCoords = (e: { clientX: number; clientY: number }, img: HTMLImageElement) => {
 const r = img.getBoundingClientRect();
 const { width: vw, height: vh } = metricsRef.current;
 if (!r.width || !r.height || !vw || !vh) return null;
 const scale = Math.min(r.width / vw, r.height / vh);
 const offX = r.left + (r.width - vw * scale) / 2;
 const offY = r.top + (r.height - vh * scale) / 2;
 return {
 x: Math.round((e.clientX - offX) / scale),
 y: Math.round((e.clientY - offY) / scale),
 };
 };

 const dispatchMouse = (e: React.MouseEvent<HTMLImageElement>, type: string) => {
 const p = toPageCoords(e, e.currentTarget);
 if (!p) return;
 cmd("Input.dispatchMouseEvent", {
 type, x: p.x, y: p.y,
 button: "left",
 modifiers: cdpModifiers(e),
 clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0,
 });
 };

 const moveQueued = useRef(false);
 const dispatchMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
 if (moveQueued.current) return;
 moveQueued.current = true;
 const img = e.currentTarget;
 const { clientX, clientY } = e;
 requestAnimationFrame(() => {
 moveQueued.current = false;
 const p = toPageCoords({ clientX, clientY }, img);
 if (!p) return;
 cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y, button: "none" });
 });
 };

 const dispatchKey = (e: React.KeyboardEvent, type: "keyDown" | "keyUp") => {
 const printable = e.key.length === 1;
 const text = printable ? e.key : e.key === "Enter" ? "\r" : e.key === "Tab" ? "\t" : "";
 cmd("Input.dispatchKeyEvent", {
 type: type === "keyDown" && !text ? "rawKeyDown" : type,
 modifiers: cdpModifiers(e),
 key: e.key,
 code: e.code,
 windowsVirtualKeyCode: e.keyCode,
 nativeVirtualKeyCode: e.keyCode,
 ...(type === "keyDown" && text ? { text, unmodifiedText: text.toLowerCase() } : {}),
 });
 };

 const screenshot = useCallback(async () => {
 const c = clientRef.current, s = sessionRef.current;
 if (!c || !s) return null;
 try {
 const { data } = await c.send<{ data: string }>("Page.captureScreenshot", { format: "png" }, s);
 const shot = { data, url: urlRef.current || "about:blank", takenAt: Date.now() };
 setScreenshot(paneId, shot);
 setShotFlash(true);
 setTimeout(() => setShotFlash(false), 350);
 return shot;
 } catch (e: any) {
 setError(String(e?.message ?? e));
 return null;
 }
 }, [paneId, setScreenshot]);

 useEffect(() => {
 if (status !== "ready") return;
 registerControls(paneId, { capture: screenshot, navigate });
 return () => unregisterControls(paneId);
 }, [status, paneId, screenshot, navigate, registerControls, unregisterControls]);

 return (
 <div className="flex h-full flex-col overflow-hidden glass-body">
 <div data-pane-drag data-pane-header="true" className={`${PANE_HEADER_CLASS} gap-1 px-1.5`}>
 <span
 className="size-1.5 shrink-0 rounded-full"
 style={{ background: themeForKind("browser").accent }}
 aria-hidden
 />
 <Globe className="size-3 shrink-0 text-swarm-textMuted" />
 <button
 onClick={() => cmd("Runtime.evaluate", { expression: "history.back()" })}
 className="rounded p-0.5 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text"
 title="Back"
 >
 <ArrowLeft className="size-3" />
 </button>
 <button
 onClick={() => cmd("Runtime.evaluate", { expression: "history.forward()" })}
 className="rounded p-0.5 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text"
 title="Forward"
 >
 <ArrowRight className="size-3" />
 </button>
 <button
 onClick={() => cmd("Page.reload", {})}
 className="rounded p-0.5 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text"
 title="Reload"
 >
 <RotateCw className="size-3" />
 </button>

 <div className="relative mx-1 flex min-w-0 flex-1 items-center">
 <input
 value={urlInput}
 onChange={(e) => setUrlInput(e.target.value)}
 onKeyDown={(e) => { if (e.key === "Enter") navigate(urlInput); }}
 onFocus={(e) => e.currentTarget.select()}
 placeholder="3000 · localhost:5173 · /dashboard"
 spellCheck={false}
 aria-label="Address"
 className="min-w-0 flex-1 rounded-md border border-swarm-border/50 glass-inset py-0.5 pl-2 pr-6 text-mini text-swarm-text outline-none transition-colors placeholder:text-swarm-textMuted/50 focus:border-swarm-gold/40"
 />
 {loading && (
 <Loader2 className="pointer-events-none absolute right-1.5 size-3 animate-spin text-swarm-gold" />
 )}
 </div>

 <button
 onClick={screenshot}
 disabled={status !== "ready"}
 className="rounded p-0.5 text-swarm-textMuted transition-colors hover:bg-swarm-gold/20 hover:text-swarm-gold disabled:opacity-30"
 title="Capture screenshot for Lead"
 >
 <Camera className="size-3" />
 </button>
 <button
 onClick={onToggleMaximize}
 className="rounded p-0.5 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text"
 title={isMaximized ? "Restore" : "Maximize"}
 >
 {isMaximized ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
 </button>
 <button
 onClick={onClose}
 className="rounded p-0.5 text-swarm-textMuted transition-colors hover:bg-swarm-err/70 hover:text-white"
 title="Close"
 >
 <X className="size-3" />
 </button>
 </div>

 {/* Viewport */}
 <div ref={viewRef} className="relative min-h-0 flex-1 overflow-hidden">
 {status === "booting" && (
 <div className="flex h-full items-center justify-center text-mini text-swarm-textMuted">
 Starting browser…
 </div>
 )}
 {status === "error" && (
 <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
 <Globe className="mb-1 size-5 text-swarm-textMuted/50" />
 <p className="text-mini font-medium text-swarm-err">Preview engine didn't start</p>
 <p className="max-w-[380px] text-micro leading-[1.5] text-swarm-textMuted">{error}</p>
 <p className="max-w-[380px] text-micro leading-[1.5] text-swarm-textMuted/70">
 This pane previews your local dev server. It needs Microsoft Edge or
 Google Chrome installed to render the page.
 </p>
 <button
 onClick={() => { setStatus("booting"); setError(null); setBootNonce((n) => n + 1); }}
 className="mt-1 rounded-md border border-swarm-gold/30 bg-swarm-gold/10 px-2.5 py-1 text-micro font-medium text-swarm-goldHi transition-colors hover:bg-swarm-gold/20"
 >
 Retry
 </button>
 </div>
 )}
 {status === "ready" && frame && (
 <img
 ref={imgRef}
 src={`data:image/jpeg;base64,${frame}`}
 alt=""
 draggable={false}
 tabIndex={0}
 onMouseDown={(e) => { e.currentTarget.focus(); dispatchMouse(e, "mousePressed"); }}
 onMouseUp={(e) => dispatchMouse(e, "mouseReleased")}
 onMouseMove={dispatchMouseMove}
 onKeyDown={(e) => {
 if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) return;
 e.preventDefault();
 dispatchKey(e, "keyDown");
 }}
 onKeyUp={(e) => { e.preventDefault(); dispatchKey(e, "keyUp"); }}
 onWheel={(e) => {
 const p = toPageCoords(e, e.currentTarget);
 if (!p) return;
 cmd("Input.dispatchMouseEvent", {
 type: "mouseWheel", x: p.x, y: p.y,
 deltaX: -e.deltaX, deltaY: -e.deltaY,
 modifiers: cdpModifiers(e),
 });
 }}
 className="h-full w-full select-none object-contain outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-swarm-gold/60"
 />
 )}
 {status === "ready" && !frame && (
 <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
 <Globe className="size-5 text-swarm-textMuted/40" />
 <p className="text-mini text-swarm-textDim">Enter a URL to start</p>
 <p className="max-w-[300px] text-micro leading-[1.5] text-swarm-textMuted">
 Type a port like <span className="text-swarm-gold">3000</span> — the pane
 resolves it to localhost. Start your dev server first, or the page
 will come back refused.
 </p>
 </div>
 )}
 {shotFlash && <div className="pointer-events-none absolute inset-0 bg-white/70" />}
 </div>
 </div>
 );
}
