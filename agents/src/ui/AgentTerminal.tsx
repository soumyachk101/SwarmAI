import { useEffect, useRef } from "react";
import { Terminal as XTerm, type ITerminalOptions } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { SearchAddon } from "xterm-addon-search";
import { WebglAddon } from "xterm-addon-webgl";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
 isAlreadySpawned,
 markSpawned,
 isTrackedAsSpawned,
 saveTranscript,
 takeTranscript,
} from "./spawnGuard.js";
import { onWindowResize } from "./paneResize.js";
import {
 THEME_CHANGE_EVENT,
 buildXtermThemeFromDom,
 swarmHex,
} from "./themeColors.js";
import { MCP_CAPABLE_CLIS } from "../cli-configs/index.js";
import { envForCli, type ApiKeys } from "../cli-configs/env.js";
import { ensureMCPConfigForCLI, type PheromoneBridge } from "./ensureMcpConfig.js";
import { ensureCliWorkspaceTrust } from "./ensureWorkspaceTrust.js";
import { excerptForHandoff, looksLikeTerminalGarbage, stripTerminalNoise } from "./sanitizeHandoff.js";
import { TauriPheromone as Pheromone } from "@swarm/pheromone/tauri";
import { withHandoffLock } from "./handoffQueue.js";
import { agentsHost } from "./host.js";
import { useAgentsStore } from "./agentsStore.js";
import type { LeadMode } from "@swarm/lead";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentInfo {
 id: string;
 cli: string;
 cliName: string;
 customName?: string;
 args?: string[];
 role?: string;
 branchName?: string;
 workspaceId?: string;
 isLead?: boolean;
 leadMode?: LeadMode;
 model?: string;
 effort?: string;
 initialPrompt?: string;
}

interface AgentTerminalProps {
 paneId: string;
 agent: AgentInfo;
 workingDir?: string | null;
 apiKeys: ApiKeys;
 sharedMemoryDir?: string | null;
 onSpawnStateChange: (state: "connecting" | "running" | "error" | "notFound") => void;
 onSetStalled: (v: boolean) => void;
 onSetSyncing: (v: boolean) => void;
 onSetLastSync: (v: number | null) => void;
 onCopy: () => void;
 onClear: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMeaningfulChunk(content: string): boolean {
 return content.replace(/<!--[\s\S]*?-->/g, "").trim().length > 0;
}

function isNotFoundError(err: unknown): boolean {
 if (typeof err === "string") return err.toLowerCase().includes("not found") || err.toLowerCase().includes("enoent");
 if (err && typeof err === "object" && "message" in err) return String((err as { message?: string }).message).toLowerCase().includes("not found");
 return false;
}

function detectCommandNotFoundError(output: string, command: string): boolean {
 const lower = output.toLowerCase();
 return lower.includes(`${command} not found`) || lower.includes(`command not found: ${command}`) || lower.includes("command not found");
}

function flattenForStdin(text: string): string {
 return stripTerminalNoise(text.replace(/\r?\n+/g, " "));
}

function buildPaneXtermTheme() {
 return {
 ...buildXtermThemeFromDom(),
 background: swarmHex("--swarm-canvas-hi"),
 };
}

// ---------------------------------------------------------------------------
// AgentTerminal
// ---------------------------------------------------------------------------

function AgentTerminal({
 paneId,
 agent,
 workingDir,
 sharedMemoryDir,
 apiKeys,
 onSpawnStateChange,
 onSetStalled,
 onSetSyncing,
 onSetLastSync,
 onCopy,
 onClear,
}: AgentTerminalProps) {
 const terminalRef = useRef<HTMLDivElement>(null);
 const terminalInstance = useRef<XTerm | null>(null);
 const fitAddonRef = useRef<FitAddon | null>(null);
 const webglRef = useRef<WebglAddon | null>(null);
 const gpuActiveRef = useRef(false);
 const syncNowRef = useRef<null | (() => Promise<void>)>(null);
 const sharedDirRef = useRef<string | null | undefined>(sharedMemoryDir);
 sharedDirRef.current = sharedMemoryDir;

 // Re-fit on global refit signal (tab switch / maximize restore)
 useEffect(() => {
 if (!fitAddonRef.current || !terminalRef.current || !terminalInstance.current) return;
 const rect = terminalRef.current.getBoundingClientRect();
 if (rect.width > 0 && rect.height > 0) {
 try {
 fitAddonRef.current.fit();
 terminalInstance.current.refresh(0, terminalInstance.current.rows - 1);
 } catch (err) { console.warn("[AgentTerminal] refit failed:", err); }
 }
 }, [useAgentsStore.getState().refitCount]);

 // Theme change listener
 useEffect(() => {
 const onTheme = () => {
 const t = terminalInstance.current;
 if (!t) return;
 t.options.theme = buildPaneXtermTheme();
 try {
 webglRef.current?.clearTextureAtlas();
 t.refresh(0, t.rows - 1);
 } catch { /* ignore */ }
 };
 window.addEventListener(THEME_CHANGE_EVENT, onTheme);
 return () => window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
 }, []);

 // Main spawn / lifecycle effect
 useEffect(() => {
 onSpawnStateChange("connecting");
 onSetStalled(false);

 let disposed = false;
 let terminal: XTerm | null = null;
 let onDataDisposable: { dispose: () => void } | null = null;
 let unsubscribeResize: (() => void) | null = null;
 let observerRef: ResizeObserver | null = null;
 let webglAddon: WebglAddon | null = null;
 let stallTimer: ReturnType<typeof setTimeout> | null = null;
 let resizeDebounce: ReturnType<typeof setTimeout> | null = null;
 let liveHandoffInterval: ReturnType<typeof setInterval> | null = null;
 let unlistenOutput: UnlistenFn | null = null;
 let aliveCheckInterval: ReturnType<typeof setInterval> | null = null;
 let outputSubscribed = false;
 let spawned = false;
 let lastCols = 0;
 let lastRows = 0;
 let lastSyncedCols = 0;
 let lastSyncedRows = 0;
 let loopsStarted = false;
 let summarySaved = false;
 let lastFlushedLength = 0;
 const transcriptRef = { current: "" };
 let spawnDir = workingDir;

 const hasValidSize = () => {
 if (!terminalRef.current) return false;
 const rect = terminalRef.current.getBoundingClientRect();
 return rect.width >= 100 && rect.height >= 80;
 };

 const stopReadOutput = () => {
 unlistenOutput?.();
 unlistenOutput = null;
 if (aliveCheckInterval) {
 clearInterval(aliveCheckInterval);
 aliveCheckInterval = null;
 }
 };

  const writeToProcess = (data: string) => {
    invoke("write_to_terminal", { paneId, data }).catch((e) =>
      console.error(`write_to_terminal failed for ${paneId}:`, e),
    );
  };

 const startLoops = () => {
 if (loopsStarted) return;
 loopsStarted = true;

 const appendHandoffEntry = async (
 pheromoneInstance: Pheromone,
 dir: string,
 transcript: string,
 label: string,
 ) => withHandoffLock(dir, async () => {
 const dateStr = new Date().toISOString();
 const handoffExcerpt = excerptForHandoff(transcript, 1200);
 if (!handoffExcerpt) return;
 const handoffEntry = `\n## [${dateStr.split("T")[0]}] ${agent.cliName} (${agent.cli}) ${label}\n\nChars: ${transcript.length}\n\n### Session Excerpt (last ~1200 chars)\n\n${handoffExcerpt}\n`;

 let existingHandoff = "";
 try {
 const hf = await pheromoneInstance.readMemoryFile("agents/handoffs.md");
 existingHandoff = hf.content;
 } catch (err) { console.warn("[AgentTerminal] operation failed:", err); }

 const handoffHeader = "# Handoffs\n\nWhat each agent left for the next one.\n";
 const priorBody = existingHandoff.includes("# Handoffs")
 ? existingHandoff.slice(existingHandoff.indexOf(handoffHeader) + handoffHeader.length)
 : existingHandoff;
 const cappedBody = (priorBody + handoffEntry).slice(-6000);
 await pheromoneInstance.writeMemoryFile("agents/handoffs.md", handoffHeader + cappedBody);
 });

 const flushHandoff = async (force: boolean) => {
 const syncDir = sharedDirRef.current || spawnDir;
 if (disposed || !syncDir) return;
 const transcript = transcriptRef.current.trim();
 if (!force && transcript.length - lastFlushedLength < 200) return;
 if (!transcript) return;
 onSetSyncing(true);
 try {
 const pheromoneInstance = await Pheromone.create(syncDir);
 await appendHandoffEntry(pheromoneInstance, syncDir, transcript, force ? "(manual sync)" : "(in progress)");
 lastFlushedLength = transcript.length;
 onSetLastSync(Date.now());
 } catch (e) {
 console.warn(`[Pheromone] Handoff sync failed for ${paneId}:`, e);
 } finally {
 onSetSyncing(false);
 }
 };

 syncNowRef.current = () => flushHandoff(true);
 liveHandoffInterval = setInterval(() => flushHandoff(false), 10000);

 aliveCheckInterval = setInterval(async () => {
 try {
 const alive = await invoke<boolean>("is_process_alive", { paneId });
 if (!alive) {
 console.log(`[AgentTerminal - ${paneId}] Process exited naturally. Saving session summary...`);
 saveSessionSummary(transcriptRef.current);
 stopReadOutput();
 }
 } catch (e) {
 console.error("is_process_alive check failed:", e);
 }
 }, 6000);
 };

 const subscribeOutput = async () => {
 if (outputSubscribed || disposed) return;
 outputSubscribed = true;
 const fn = await listen<{ paneId: string; data: string }>("pty-output", (event) => {
 if (disposed || event.payload.paneId !== paneId || !terminal) return;
 const output = event.payload.data;
 if (!output) return;

 if (detectCommandNotFoundError(output, agent.cli)) {
 onSpawnStateChange("notFound");
 invoke("kill_terminal", { paneId }).catch(console.error);
 if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
 stopReadOutput();
 return;
 }

 const cleanOutput = output.replace(/\[[0-9;]*[a-zA-Z]/g, "");
 transcriptRef.current = (transcriptRef.current + cleanOutput).slice(-50000);

 terminal.write(output);
 onSpawnStateChange("running");
 onSetStalled(false);
 if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
 });
 if (disposed) { fn(); return; }
 unlistenOutput = fn;
 };

 const saveSessionSummary = async (transcript: string) => {
 if (summarySaved) return;
 summarySaved = true;

 let saveDir = spawnDir;
 if (!saveDir) {
 try { saveDir = await invoke<string>("get_project_path"); } catch (err) { console.warn("[AgentTerminal] op failed:", err); }
 }
 if (!saveDir) {
 try { saveDir = await invoke<string>("get_home_dir"); } catch (err) { console.warn("[AgentTerminal] op failed:", err); }
 }
 if (!saveDir) {
 console.warn(`[Pheromone] Cannot save session: no project dir available for ${paneId}`);
 return;
 }

 const sessionId = `session-${Date.now()}`;
 const cleanTranscript = transcript.trim();
 const dateStr = new Date().toISOString();
 console.log(`[Pheromone] Saving session ${sessionId} for ${agent.cliName} in ${saveDir}`);

 try {
 const pheromoneInstance = await Pheromone.create(saveDir);
 const rawSessionContent = `# ${agent.cliName} Session Log\n\nDate: ${dateStr}\nAgent: ${agent.cli}\nProject: ${saveDir}\n\n## Raw Transcript\n\n\`\`\`\n${cleanTranscript || "(empty session)"}\n\`\`\`\n`;

 await pheromoneInstance.writeMemoryFile(
 `agents/sessions/${sessionId}.md`,
 rawSessionContent,
 { agent: agent.cli, timestamp: Date.now() }
 );
 console.log(`[Pheromone] Session log written: agents/sessions/${sessionId}.md`);
 } catch (e) {
 console.error(`[Pheromone] Failed to save session log for ${paneId}:`, e);
 }
 };

 const spawnProcess = async () => {
 if (spawned || disposed || !terminal) return;
 spawned = true;

 await subscribeOutput();
 if (disposed || !terminal) return;

 if (await isAlreadySpawned(paneId, workingDir)) {
 if (disposed || !terminal) return;
 const previous = takeTranscript(paneId);
 if (previous) {
 terminal.write(previous);
 transcriptRef.current = previous;
 }
 fitAddonRef.current?.fit();
 const { rows, cols } = terminal;
 invoke("resize_terminal", { paneId, rows, cols }).catch(console.error);
 terminal.writeln(`\r\n\x1b[38;5;108m[swarm] reattached to the running ${agent.cliName}\x1b[0m`);
 onSpawnStateChange("running");
 startLoops();
 return;
 }

 if (!spawnDir) {
 try { spawnDir = await invoke<string>("get_home_dir"); } catch (e2) { console.error("Failed to get home directory:", e2); }
 }

 let pheromoneBridge: PheromoneBridge = "stdin-fallback";
 if (spawnDir) {
 try {
 pheromoneBridge = await ensureMCPConfigForCLI(agent.cli, spawnDir);
 } catch (e) {
 console.error(`[Pheromone] MCP config FAILED for ${agent.cli}`, e);
 pheromoneBridge = "stdin-fallback";
 }
 await ensureCliWorkspaceTrust(agent.cli, spawnDir);
 }

 try {
 const command = agent.cli;
 const env = envForCli(command, apiKeys);
 env.SWARM_PANE_ID = paneId;
 env.SWARM_SWARM_NAME = agent.customName || agent.cliName;
 if (agent.isLead) env.SWARM_LEAD = "1";

 if (disposed || !terminal) return;
 fitAddonRef.current?.fit();
 const { rows, cols } = terminal;

 const bypassFlags: Record<string, string[]> = {
 claude: ["--dangerously-skip-permissions"],
 codex: ["--dangerously-bypass-approvals-and-sandbox"],
 };
 const bypassEnabled = agentsHost().permissionBypassEnabled();
 const fullArgs = [...(bypassEnabled ? (bypassFlags[command] || []) : []), ...(agent.args || [])];

 await invoke("spawn_terminal", {
 paneId,
 command,
 args: fullArgs,
 workingDir: spawnDir,
 env,
 rows,
 cols,
 });
 markSpawned(paneId, workingDir);

 if (disposed || !terminal) return;

 onSpawnStateChange("running");
 onSetStalled(false);
 startLoops();

 if (spawnDir) {
 (async () => {
 try {
 await new Promise((resolve) => setTimeout(resolve, 2500));
 if (disposed || !terminal) return;

 if (agent.isLead) {
 agentsHost().publishLeadRole(sharedDirRef.current || spawnDir, agent.leadMode ?? "Steward");
 }

 const openFiles = agentsHost().openFilesFor(sharedDirRef.current || spawnDir);
 const openFilesHint = openFiles.length > 0 ? ` Open files: ${openFiles.slice(0, 12).join(", ")}.` : "";

 if (pheromoneBridge === "mcp" || pheromoneBridge === "mcp-plugin") {
 if (agent.initialPrompt && !disposed) {
 const pText = agent.initialPrompt;
 useAgentsStore.getState().updateAgent(paneId, { initialPrompt: undefined });
 setTimeout(() => { if (!disposed) writeToProcess(pText + "\r"); }, 1200);
 }
 return;
 }

 if (agent.initialPrompt && !disposed) {
 const pText = agent.initialPrompt;
 useAgentsStore.getState().updateAgent(paneId, { initialPrompt: undefined });
 setTimeout(() => { if (!disposed) writeToProcess(pText + "\r"); }, 1200);
 }

 if (MCP_CAPABLE_CLIS.includes(agent.cli)) return;

 let ctxLine = "[Swarm Pheromone] Read .pheromone/agents/handoffs.md and .pheromone/memory/ for shared project context.";
 if (openFilesHint) ctxLine += openFilesHint;

 try {
 const pheromone = await Pheromone.create(sharedDirRef.current || spawnDir!);
 const hf = await pheromone.readMemoryFile("agents/handoffs.md");
 if (isMeaningfulChunk(hf.content)) {
 const clean = flattenForStdin(excerptForHandoff(hf.content, 400));
 if (clean && !looksLikeTerminalGarbage(clean)) {
 ctxLine += ` Recent handoff: ${clean}`;
 }
 }
 } catch { /* first session / no handoff */ }

 writeToProcess(flattenForStdin(ctxLine) + "\n");
 } catch (e) { console.error("Pheromone injection failed:", e); }
 })();
 }
 } catch (e) {
 if (isNotFoundError(e)) {
 if (!disposed) onSpawnStateChange("notFound");
 } else {
 if (!disposed && terminal) {
 terminal.writeln(`\x1b[31mFailed to spawn ${agent.customName || agent.cliName}: ${e}\x1b[0m`);
 }
 if (!disposed) onSpawnStateChange("error");
 }
 }
 };

 const initTerminal = () => {
 try {
 const options: ITerminalOptions = {
 cursorBlink: true,
 cursorStyle: "block",
 fontSize: 13,
 fontFamily: 'Menlo, Monaco, "SF Mono", "Geist Mono", "JetBrains Mono", Consolas, "Courier New", monospace',
 fontWeight: "400",
 fontWeightBold: "600",
 customGlyphs: false,
 lineHeight: 1.2,
 letterSpacing: 0,
 theme: buildPaneXtermTheme(),
 allowTransparency: false,
 rightClickSelectsWord: true,
 scrollback: 5000,
 };

 terminal = new XTerm(options);
 const fitAddon = new FitAddon();
 const searchAddon = new SearchAddon();

 terminal.loadAddon(fitAddon);
 terminal.loadAddon(searchAddon);
 fitAddonRef.current = fitAddon;

 terminal.attachCustomKeyEventHandler((arg) => {
 if (arg.ctrlKey && !arg.altKey && !arg.metaKey && arg.code === "KeyC") {
 if (arg.type === "keydown") {
 const selection = terminal?.getSelection();
 if (selection) {
 navigator.clipboard.writeText(selection).catch(() => {});
 } else {
 writeToProcess("\x03");
 }
 }
 arg.preventDefault();
 arg.stopPropagation();
 return false;
 }
 return true;
 });

 terminal.open(terminalRef.current!);
 terminalInstance.current = terminal;

 try {
 const webgl = new WebglAddon();
 terminal.loadAddon(webgl);
 webglAddon = webgl;
 webglRef.current = webgl;
 webgl.onContextLoss(() => {
 if (webglAddon === webgl) webglAddon = null;
 if (webglRef.current === webgl) webglRef.current = null;
 gpuActiveRef.current = false;
 try { webgl.dispose(); } catch (err) { console.warn("[AgentTerminal] op failed:", err); }
 try { terminal?.refresh(0, (terminal.rows ?? 1) - 1); } catch (err) { console.warn("[AgentTerminal] op failed:", err); }
 });
 gpuActiveRef.current = true;
 } catch (e) {
 console.warn("[AgentTerminal] WebGL renderer unavailable:", e);
 }

 const fitAndSync = () => {
 if (resizeDebounce) clearTimeout(resizeDebounce);
 resizeDebounce = setTimeout(() => {
 if (disposed || !terminal) return;
 if (hasValidSize()) {
 try {
 fitAddon.fit();
 } catch (e) {
 console.warn("[AgentTerminal] fit() failed:", e);
 return;
 }
 if (!spawned) {
 const { rows, cols } = terminal;
 if (cols < 10 || rows < 3 || cols !== lastCols || rows !== lastRows) {
 lastCols = cols;
 lastRows = rows;
 fitAndSync();
 return;
 }
 spawnProcess();
 } else {
 if (terminal.rows === lastSyncedRows && terminal.cols === lastSyncedCols) return;
 lastSyncedRows = terminal.rows;
 lastSyncedCols = terminal.cols;
 invoke("resize_terminal", { paneId, rows: terminal.rows, cols: terminal.cols }).catch(console.error);
 }
 }
 }, spawned ? 40 : 150);
 };

 onDataDisposable = terminal.onData((data) => {
 writeToProcess(data);
 });

 unsubscribeResize = onWindowResize(fitAndSync);

 const resizeObserver = new ResizeObserver(() => {
 fitAndSync();
 });
 resizeObserver.observe(terminalRef.current!);
 observerRef = resizeObserver;

 fitAndSync();
 } catch (e) {
 console.error("Failed to initialize Agent terminal:", e);
 }
 };

 initTerminal();

 return () => {
 disposed = true;
 if (stallTimer) clearTimeout(stallTimer);
 if (resizeDebounce) clearTimeout(resizeDebounce);
 if (liveHandoffInterval) clearInterval(liveHandoffInterval);
 if (aliveCheckInterval) clearInterval(aliveCheckInterval);
 unlistenOutput?.();
 syncNowRef.current = null;
 unsubscribeResize?.();
 observerRef?.disconnect();
 onDataDisposable?.dispose();

 saveTranscript(paneId, transcriptRef.current);
 if (!isTrackedAsSpawned(paneId)) {
 saveSessionSummary(transcriptRef.current);
 }

 try {
 webglRef.current = null;
 webglAddon?.dispose();
 webglAddon = null;
 } catch (e) {
 console.warn("[AgentTerminal] Failed to dispose WebGL addon:", e);
 }
 try {
 terminal?.dispose();
 } catch (e) {
 console.warn("[AgentTerminal] Failed to dispose terminal:", e);
 } finally {
 terminalInstance.current = null;
 }
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [paneId, agent.cli, workingDir, agent.id, agent.cliName, agent.leadMode, agent.isLead]);

 return (
 <div
 onClick={onCopy}
 className="flex-1 relative min-h-0 cursor-text"
 >
 <div
 ref={terminalRef}
 className="absolute inset-0 overflow-hidden"
 />
 </div>
 );
}

export default AgentTerminal;
