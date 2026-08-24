// Minimal Chrome DevTools Protocol client.
//
// The Tauri webview offers no capture API, so the browser pane drives a real
// headless Chromium over CDP: we get a live screencast, input dispatch, and —
// the point of the exercise — real screenshots Lead/Agents can read.

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void };

export interface ScreencastFrameMeta {
 offsetTop: number;
 pageScaleFactor: number;
 deviceWidth: number;
 deviceHeight: number;
 scrollOffsetX: number;
 scrollOffsetY: number;
}

export class CdpClient {
 private ws: WebSocket;
 private nextId = 1;
 private pending = new Map<number, Pending>();
 private listeners = new Map<string, Set<(params: any) => void>>();

 private constructor(ws: WebSocket) {
 this.ws = ws;
 this.ws.onmessage = (ev) => this.handle(ev.data);
 }

 static connect(wsUrl: string, timeoutMs = 10_000): Promise<CdpClient> {
 return new Promise((resolve, reject) => {
 const ws = new WebSocket(wsUrl);
 const timer = setTimeout(() => {
 ws.close();
 reject(new Error("CDP connection timed out"));
 }, timeoutMs);
 ws.onopen = () => {
 clearTimeout(timer);
 resolve(new CdpClient(ws));
 };
 ws.onerror = () => {
 clearTimeout(timer);
 reject(new Error("CDP connection failed"));
 };
 });
 }

 private handle(raw: string) {
 let msg: any;
 try { msg = JSON.parse(raw); } catch { return; }

 if (msg.id !== undefined) {
 const p = this.pending.get(msg.id);
 if (!p) return;
 this.pending.delete(msg.id);
 if (msg.error) p.reject(new Error(msg.error.message ?? "CDP error"));
 else p.resolve(msg.result);
 return;
 }

 if (msg.method) {
 this.listeners.get(msg.method)?.forEach((cb) => cb(msg.params));
 }
 }

 /** Send a CDP command. Each call gets a per-request timeout so a crashed
 * browser tab can't leave a hanging promise forever. */
 send<T = any>(method: string, params: object = {}, sessionId?: string, timeoutMs = 15_000): Promise<T> {
 if (this.ws.readyState !== WebSocket.OPEN) {
 return Promise.reject(new Error("CDP socket is not open"));
 }
 const id = this.nextId++;
 const payload: any = { id, method, params };
 if (sessionId) payload.sessionId = sessionId;
 return new Promise<T>((resolve, reject) => {
 const timer = setTimeout(() => {
 this.pending.delete(id);
 reject(new Error(`CDP timeout: ${method} did not respond within ${timeoutMs}ms`));
 }, timeoutMs);
 this.pending.set(id, {
 resolve: (v) => { clearTimeout(timer); resolve(v); },
 reject: (e) => { clearTimeout(timer); reject(e); },
 });
 this.ws.send(JSON.stringify(payload));
 });
 }

 /** Subscribe to a CDP event. Returns an unsubscribe function. */
 on(event: string, cb: (params: any) => void): () => void {
 if (!this.listeners.has(event)) this.listeners.set(event, new Set());
 this.listeners.get(event)!.add(cb);
 return () => this.listeners.get(event)?.delete(cb);
 }

 close() {
 this.pending.forEach((p) => p.reject(new Error("CDP client closed")));
 this.pending.clear();
 this.listeners.clear();
 try { this.ws.close(); } catch {}
 }
}

/**
 * Normalizes user input into a valid browser URL, tailored for dev workflows.
 */
export function normalizeUrl(input: string, defaultPort = 3000): string {
  const trimmed = input.trim();
  if (!trimmed) return "about:blank";

  // Explicit schemes (http://, https://, about:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }

  // Bare port (e.g. "3000", "5173")
  if (/^\d{2,5}$/.test(trimmed)) {
    return `http://localhost:${trimmed}`;
  }

  // Bare path (e.g. "/dashboard")
  if (trimmed.startsWith("/")) {
    return `http://localhost:${defaultPort}${trimmed}`;
  }

  // Spaces or invalid characters indicate search phrases / junk
  if (/\s/.test(trimmed) || /^[^a-zA-Z0-9]/.test(trimmed)) {
    throw new Error(`Not a valid address: "${input}"`);
  }

  if (trimmed === "localhost") {
    return `http://localhost:${defaultPort}`;
  }

  // Hostnames / IP addresses (e.g. "localhost:5173", "127.0.0.1:8080/x", "dev.local:8080")
  if (/^[a-zA-Z0-9.-]+(:\d+)?(\/.*)?$/.test(trimmed)) {
    return `http://${trimmed}`;
  }

  throw new Error(`Not a valid address: "${input}"`);
}
