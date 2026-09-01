import { useEffect, useRef, useState, useMemo, memo } from "react";
import {
 Trash2,
 AlertTriangle,
 Minimize2,
 Maximize2,
 Check,
 Copy,
 Eraser,
 ExternalLink,
 Loader2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { BrandGlyph, cliBrand, AgentMark } from "@swarm/board";
import { envForCli, type ApiKeys } from "../cli-configs/env.js";
import { agentsHost } from "./host.js";
import { useAgentsStore } from "./agentsStore.js";
import { withPermissionBypass, normaliseEffort } from "../cli-configs/index.js";
import { getDefaultModelForCli, getModelById } from "../cli-configs/model-catalog.js";
import { useAutoModelDetection } from "../hooks/useAutoModelDetection.js";
import { CLI_BY_COMMAND } from "../index.js";
import { excerptForHandoff, looksLikeTerminalGarbage, stripTerminalNoise } from "./sanitizeHandoff.js";
import { isAlreadySpawned, isTrackedAsSpawned, markSpawned, saveTranscript, takeTranscript } from "./spawnGuard.js";
import { withHandoffLock } from "./handoffQueue.js";
import { TauriPheromone as Pheromone } from "@swarm/pheromone/tauri";
import { LeadCrown, PANE_HEADER_CLASS, PANE_TITLE_CLASS, themeForKind } from "@swarm/board";
import type { LeadMode } from "@swarm/lead";
import {
 THEME_CHANGE_EVENT,
 buildXtermThemeFromDom,
 swarmHex,
} from "./themeColors.js";
import { onWindowResize } from "./paneResize.js";
// Sub-components
import TerminalHeader from "./TerminalHeader.js";
import AgentControls from "./AgentControls.js";
import AgentTerminal, { type AgentInfo } from "./AgentTerminal.js";
import AgentStatusIndicator from "./AgentStatusIndicator.js";
import AgentPromptBar from "./AgentPromptBar.js";
import { Terminal as XTerm, ITerminalOptions } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentPaneProps {
 paneId: string;
 workingDir?: string | null;
 agent: AgentInfo;
 onClose?: () => void;
 onToggleMaximize?: () => void;
 isMaximized?: boolean;
 onRename?: () => void;
 isEditing?: boolean;
 editValue?: string;
 onEditChange?: (value: string) => void;
 onCancelRename?: () => void;
 headerExtra?: React.ReactNode;
 sharedMemoryDir?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STALL_HINT_MS = 8000;

// ---------------------------------------------------------------------------
// CLI Brand Meta
// ---------------------------------------------------------------------------

interface EffortOption {
 id: string;
 label: string;
 isHighlight?: boolean;
}

const CLI_BRAND_META: Record<string, { brandName: string; brandColor: string; supportsEffort: boolean; effortLevels?: EffortOption[]; defaultEffort?: string }> = {
 claude: { brandName: "Claude Code Models", brandColor: "#D97757", supportsEffort: true, defaultEffort: "UltraCode", effortLevels: [
 { id: "ultracode", label: "UltraCode", isHighlight: true },
 { id: "max", label: "Max" },
 { id: "high", label: "High" },
 { id: "medium", label: "Medium" },
 { id: "low", label: "Low" },
 ]},
 codex: { brandName: "Codex Models", brandColor: "#10A37F", supportsEffort: true, defaultEffort: "High", effortLevels: [
 { id: "xhigh", label: "Extra High", isHighlight: true },
 { id: "high", label: "High" },
 { id: "medium", label: "Medium" },
 { id: "low", label: "Low" },
 ]},
 opencode: { brandName: "OpenCode Models", brandColor: "#A855F7", supportsEffort: false },
 agy: { brandName: "AGY Models", brandColor: "#4285F4", supportsEffort: false },
 aider: { brandName: "Aider Models", brandColor: "#14B8A6", supportsEffort: false },
 cline: { brandName: "Cline Models", brandColor: "#6C5CE7", supportsEffort: false },
 kilo: { brandName: "Kilo Models", brandColor: "#F59E0B", supportsEffort: false },
};

function getCliBrandMeta(cli: string) {
 const c = (cli || "").toLowerCase();
 return CLI_BRAND_META[c] ?? { brandColor: "#E5A93C", supportsEffort: false };
}

// ---------------------------------------------------------------------------
// Command suggestions
// ---------------------------------------------------------------------------

export interface CommandSuggestion {
 name: string;
 description: string;
 syntax?: string;
 category?: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
 { name: "/model", description: "Switch AI model (Opus 1M, Sonnet 1M, etc.)", syntax: "/model <name>", category: "Model" },
 { name: "/effort", description: "Set reasoning effort (UltraCode, Max, High...)", syntax: "/effort <level>", category: "Reasoning" },
 { name: "/status", description: "Check model, 1M context memory & session details", category: "Diagnostics" },
 { name: "/cost", description: "Check current session tokens and cost breakdown", category: "Diagnostics" },
 { name: "/compact", description: "Compact context window to save tokens", category: "Context" },
 { name: "/clear", description: "Clear conversation history / session transcript", category: "Context" },
 { name: "/doctor", description: "Run environment and health diagnostics", category: "Diagnostics" },
 { name: "/review", description: "Review pending diffs and file changes", category: "Tools" },
 { name: "/pr", description: "Create or summarize pull request", category: "Tools" },
 { name: "/init", description: "Initialize project settings and configs", category: "Tools" },
 { name: "/help", description: "Show all available commands and help", category: "General" },
 { name: "/memory", description: "Inspect or manage agent long-term memory", category: "Memory" },
];

// ---------------------------------------------------------------------------
// AgentPane
// ---------------------------------------------------------------------------

function AgentPane({
 paneId,
 workingDir,
 agent,
 onClose,
 onToggleMaximize,
 isMaximized,
 onRename,
 isEditing,
 editValue,
 onEditChange,
 onCancelRename,
 headerExtra,
 sharedMemoryDir,
}: AgentPaneProps) {
 // ---- State ----
 const [spawnState, setSpawnState] = useState<"connecting" | "running" | "error" | "notFound">("connecting");
 const [stalled, setStalled] = useState(false);
 const [syncing, setSyncing] = useState(false);
 const [lastSync, setLastSync] = useState<number | null>(null);
 const [paneWidth, setPaneWidth] = useState(0);
 const [menuOpen, setMenuOpen] = useState(false);
 const [copied, setCopied] = useState(false);

 // Prompt bar state
 const [promptInput, setPromptInput] = useState("");
 const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
 const [commandSuggestionsOpen, setCommandSuggestionsOpen] = useState(false);
 const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

 // Menu state
 const [modelMenuOpen, setModelMenuOpen] = useState(false);
 const [modelSearchQuery, setModelSearchQuery] = useState("");
 const [effortMenuOpen, setEffortMenuOpen] = useState(false);
 const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
 const [handoffMenuOpen, setHandoffMenuOpen] = useState(false);
 const [handoffSuccess, setHandoffSuccess] = useState<string | null>(null);

 // Model / effort
 const [currentModel, setCurrentModel] = useState(agent.model || "");
 const [currentEffort, setCurrentEffort] = useState(agent.effort || "Max");

 // Refs
 const terminalInstance = useRef<XTerm | null>(null);
 const fitAddonRef = useRef<FitAddon | null>(null);
 const webglRef = useRef<WebglAddon | null>(null);
 const gpuActiveRef = useRef(false);
 const syncNowRef = useRef<null | (() => Promise<void>)>(null);
 const sharedDirRef = useRef<string | null | undefined>(sharedMemoryDir);
 sharedDirRef.current = sharedMemoryDir;
 const menuRef = useRef<HTMLDivElement>(null);
 const modelMenuRef = useRef<HTMLDivElement>(null);
 const effortMenuRef = useRef<HTMLDivElement>(null);
 const settingsMenuRef = useRef<HTMLDivElement>(null);
 const handoffMenuRef = useRef<HTMLDivElement>(null);

 // Store selectors
 const setAgentStatus = useAgentsStore((s) => s.setAgentStatus);
 const refitCount = useAgentsStore((s) => s.refitCount);
 const promoteToLead = useAgentsStore((s) => s.promoteToLead);
 const demoteLead = useAgentsStore((s) => s.demoteLead);
 const apiKeys = agentsHost().apiKeys();

 // Derived values
 const brandMeta = getCliBrandMeta(agent.cli);
 const compactHeader = paneWidth > 0 && paneWidth < 240;
 const displayName = agent.customName || agent.cliName;

 // Sync currentModel with agent.model or default
 useEffect(() => {
 if (agent.model) {
 const entry = getModelById(agent.cli, agent.model) || detectedModels.find((m) => m.id === agent.model || m.label === agent.model);
 setCurrentModel(entry ? entry.label : agent.model);
 } else {
 const defaultModel = getDefaultModelForCli(agent.cli);
 if (defaultModel) {
 setCurrentModel(defaultModel.label);
 }
 }
 }, [agent.cli, agent.model]);

 // Sync currentEffort with agent.effort or default
 useEffect(() => {
 if (agent.effort && agent.effort !== "UltraCode") {
 setCurrentEffort(agent.effort);
 } else {
 const defaultEff = brandMeta.defaultEffort || "Max";
 setCurrentEffort(defaultEff);
 }
 }, [agent.cli, agent.effort, brandMeta.defaultEffort]);

 // Auto-detect models
 const autoModelDetection = useAutoModelDetection(agent.cli, paneId);
 const detectedModels = autoModelDetection.detectedModels;
 const detectedSelectedModel = autoModelDetection.selectedModel;
 const isDetectingModels = autoModelDetection.isDetecting;
 const autoModelDetectionError = autoModelDetection.error;

 // Crown state
 const leadId = useAgentsStore(
 (s) => s.agents.find((b) => b.isLead && b.workspaceId === agent.workspaceId)?.id ?? null,
 );
 const isLead = leadId === agent.id;
 const leadTaken = leadId !== null && !isLead;
 const allAgents = useAgentsStore((s) => s.agents);
 const otherAgents = allAgents.filter(
 (a) => a.id !== agent.id && (!agent.workspaceId || a.workspaceId === agent.workspaceId),
 );

 // Update global agent status when spawn state changes
 useEffect(() => {
 setAgentStatus(
 agent.id,
 spawnState === "running" ? "running" : spawnState === "connecting" ? "launching" : "error",
 );
 }, [spawnState, agent.id, setAgentStatus]);

 // Stall timer
 useEffect(() => {
 if (spawnState !== "connecting") return;
 const timer = setTimeout(() => setStalled(true), STALL_HINT_MS);
 return () => clearTimeout(timer);
 }, [spawnState]);

 // Close pane-level dropdowns on outside click / Escape
 useEffect(() => {
 const open = handoffMenuOpen || commandSuggestionsOpen;
 if (!open) return;
 const onDown = (e: globalThis.MouseEvent) => {
 const target = e.target as Node;
 if (handoffMenuOpen && !handoffMenuRef.current?.contains(target)) setHandoffMenuOpen(false);
 if (commandSuggestionsOpen && !promptTextareaRef.current?.contains(target)) setCommandSuggestionsOpen(false);
 };
 const onKey = (e: globalThis.KeyboardEvent) => {
 if (e.key === "Escape") {
 setHandoffMenuOpen(false);
 setCommandSuggestionsOpen(false);
 }
 };
 window.addEventListener("mousedown", onDown);
 window.addEventListener("keydown", onKey);
 return () => {
 window.removeEventListener("mousedown", onDown);
 window.removeEventListener("keydown", onKey);
 };
 }, [handoffMenuOpen, commandSuggestionsOpen, promptTextareaRef]);

 // ---- Handlers ----

 const sendTerminal = (data: string) => {
 invoke("write_to_terminal", { paneId, data }).catch(console.error);
 terminalInstance.current?.focus();
 };

 const handleCopy = () => {
 const selection = terminalInstance.current?.getSelection();
 if (selection) {
 navigator.clipboard.writeText(selection);
 setCopied(true);
 setTimeout(() => setCopied(false), 1800);
 }
 };

 const handleClear = () => {
 terminalInstance.current?.clear();
 terminalInstance.current?.focus();
 };

 const handleSelectModel = (modelId: string, modelLabel: string) => {
 setCurrentModel(modelLabel);
 setModelMenuOpen(false);
 setModelSearchQuery("");
 autoModelDetection.markUserChosen();
 useAgentsStore.getState().updateAgent(paneId, { model: modelId });
 const entry = getModelById(agent.cli, modelId) || detectedModels.find((m) => m.id === modelId);
 const cliFlag = entry?.cliFlag || modelId;
 sendTerminal(`\x15/model ${cliFlag}\r`);
 };

 const handleSelectEffort = (effortId: string, effortLabel?: string) => {
 const label = effortLabel || effortId;
 setCurrentEffort(label);
 setEffortMenuOpen(false);
 useAgentsStore.getState().updateAgent(paneId, { effort: label });
 const cleanCmd = normaliseEffort(effortId) || effortId.toLowerCase().split(" ")[0];
 sendTerminal(`\x15/effort ${cleanCmd}\r`);
 };

 const handleCheckUsage = () => sendTerminal(`\x15/status\r`);

 const handleSelectCommand = (cmd: CommandSuggestion) => {
 if (cmd.syntax && cmd.syntax.includes("<")) {
 setPromptInput(cmd.name + " ");
 setCommandSuggestionsOpen(false);
 if (promptTextareaRef.current) {
 promptTextareaRef.current.focus();
 promptTextareaRef.current.style.height = "auto";
 }
 } else {
 setPromptInput("");
 setCommandSuggestionsOpen(false);
 if (promptTextareaRef.current) {
 promptTextareaRef.current.style.height = "auto";
 }
 sendTerminal(`\x15${cmd.name}\r`);
 }
 };

 const handleSendPrompt = () => {
 if (!promptInput.trim()) return;
 const text = promptInput;
 setPromptInput("");
 setCommandSuggestionsOpen(false);
 if (promptTextareaRef.current) {
 promptTextareaRef.current.style.height = "auto";
 }
 sendTerminal(text + "\r");
 };

 const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 const val = e.target.value;
 setPromptInput(val);
 if (promptTextareaRef.current) {
 promptTextareaRef.current.style.height = "auto";
 promptTextareaRef.current.style.height = `${Math.min(140, promptTextareaRef.current.scrollHeight)}px`;
 }
 if (val.startsWith("/")) {
 setCommandSuggestionsOpen(true);
 setSelectedCommandIndex(0);
 } else {
 setCommandSuggestionsOpen(false);
 }
 };

 const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 const isSlash = promptInput.startsWith("/") && !promptInput.includes("\n");
 const filtered = isSlash
 ? COMMAND_SUGGESTIONS.filter(
 (cmd) =>
 cmd.name.toLowerCase().startsWith(promptInput.split(" ")[0].toLowerCase()) ||
 cmd.description.toLowerCase().includes(promptInput.split(" ")[0].toLowerCase().replace("/", "")),
 )
 : [];

 if (isSlash && commandSuggestionsOpen && filtered.length > 0) {
 if (e.key === "ArrowDown") {
 e.preventDefault();
 setSelectedCommandIndex((i) => (i + 1) % filtered.length);
 return;
 }
 if (e.key === "ArrowUp") {
 e.preventDefault();
 setSelectedCommandIndex((i) => (i - 1 + filtered.length) % filtered.length);
 return;
 }
 if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
 e.preventDefault();
 const targetCmd = filtered[selectedCommandIndex] || filtered[0];
 if (targetCmd) {
 handleSelectCommand(targetCmd);
 return;
 }
 }
 if (e.key === "Escape") {
 e.preventDefault();
 setCommandSuggestionsOpen(false);
 return;
 }
 }

 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSendPrompt();
 }
 };

 const handleHandoff = (target: { id: string; customName?: string; cliName?: string; cli: string }) => {
 setHandoffMenuOpen(false);
 const targetName = target.customName || target.cliName || target.cli;
 setHandoffSuccess(targetName);
 setTimeout(() => setHandoffSuccess(null), 3000);

 const sourceName = agent.customName || agent.cliName || agent.cli;
 const handoffPayload = `\x15[Swarm Handoff from ${sourceName}]: Continuing task. Let's proceed with current workspace goals.\r`;
 invoke("write_to_terminal", { paneId: target.id, data: handoffPayload }).catch(console.error);
 };

 // View actions
 const viewActions = useMemo(
 () => [
 ...(onToggleMaximize
 ? [{
 key: "maximize",
 icon: isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />,
 label: isMaximized ? "Restore" : "Maximize",
 run: onToggleMaximize,
 }]
 : []),
 {
 key: "copy",
 icon: copied ? <Check size={12} className="text-swarm-gold" /> : <Copy size={12} />,
 label: copied ? "Copied to clipboard!" : "Copy selection",
 run: handleCopy,
 },
 { key: "clear", icon: <Eraser size={12} />, label: "Clear terminal", run: handleClear },
 ],
 [onToggleMaximize, isMaximized, copied, handleCopy, handleClear],
 );

 // Filtered commands for autocomplete
 const slashCommandQuery = promptInput.startsWith("/") && !promptInput.includes("\n")
 ? promptInput.split(" ")[0].toLowerCase()
 : "";
 const filteredCommands = useMemo(() => {
 if (!promptInput.startsWith("/") || promptInput.includes("\n")) return [];
 const query = promptInput.split(" ")[0].toLowerCase();
 return COMMAND_SUGGESTIONS.filter(
 (cmd) =>
 cmd.name.toLowerCase().startsWith(query) ||
 cmd.description.toLowerCase().includes(query.replace("/", "")),
 );
 }, [promptInput]);

 // ---- Render ----
 const accentColor = themeForKind("agent").accent;
 const failed = spawnState === "error" || spawnState === "notFound";

 return (
 <div
 onMouseDown={() => useAgentsStore.getState().setActivePaneId(paneId)}
 onFocus={() => useAgentsStore.getState().setActivePaneId(paneId)}
 className="flex flex-col h-full glass-body overflow-hidden"
 >
 {/* Header */}
 <TerminalHeader
 paneId={paneId}
 displayName={displayName}
 spawnState={spawnState}
 isEditing={Boolean(isEditing)}
 editValue={editValue ?? ""}
 agent={{ id: agent.id, cli: agent.cli, cliName: agent.cliName, role: agent.role, branchName: agent.branchName }}
 currentModel={currentModel}
 currentEffort={currentEffort}
 paneWidth={paneWidth}
 autoModelDetectionError={autoModelDetectionError ?? undefined}
 onEditChange={onEditChange ?? (() => {})}
 onRename={onRename}
 onCancelRename={onCancelRename}
 headerExtra={headerExtra}
 controls={
 <AgentControls
 paneId={paneId}
 agent={{ ...agent, cliName: agent.cliName }}
 isLead={isLead}
 leadTaken={leadTaken}
 syncing={syncing}
 lastSync={lastSync}
 otherAgents={otherAgents}
 compactHeader={compactHeader}
 menuOpen={menuOpen}
 handoffMenuOpen={handoffMenuOpen}
 viewActions={viewActions}
 onClose={onClose}
 isMaximized={isMaximized}
 promoteToLead={promoteToLead}
 demoteLead={demoteLead}
 setMenuOpen={setMenuOpen}
 setHandoffMenuOpen={setHandoffMenuOpen}
 setHandoffSuccess={setHandoffSuccess}
 handleHandoff={handleHandoff}
 syncNowRef={syncNowRef}
 />
 }

 {/* Terminal */}
 <AgentTerminal
 paneId={paneId}
 agent={agent}
 workingDir={workingDir}
 apiKeys={apiKeys}
 sharedMemoryDir={sharedMemoryDir}
 onSpawnStateChange={setSpawnState}
 onSetStalled={setStalled}
 onSetSyncing={setSyncing}
 onSetLastSync={setLastSync}
 onCopy={handleCopy}
 onClear={handleClear}
 />

 {/* CLI not found — install card */}
 {spawnState === "notFound" && (
 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 z-10">
 <div className="flex flex-col items-center gap-2 text-center">
 <div className="w-12 h-12 rounded-2xl border border-swarm-border bg-swarm-surface flex items-center justify-center text-swarm-gold">
 {cliBrand(CLI_BY_COMMAND[agent.cli]?.id) ? (
 <BrandGlyph brand={cliBrand(CLI_BY_COMMAND[agent.cli]?.id)!} size={24} />
 ) : (
 <AgentMark size={24} />
 )}
 </div>
 <div>
 <p className="text-sm font-semibold text-swarm-text">
 {CLI_BY_COMMAND[agent.cli]?.name ?? agent.cliName} not installed
 </p>
 <p className="text-mini text-swarm-textMuted mt-0.5">
 {CLI_BY_COMMAND[agent.cli]?.description ?? `Could not find \`${agent.cli}\` on PATH`}
 </p>
 </div>
 </div>

 {CLI_BY_COMMAND[agent.cli] && (
 <div className="w-full max-w-[340px] space-y-2">
 <p className="text-mini text-swarm-textDim uppercase tracking-wide font-semibold">
 Install command
 </p>
 <div className="relative rounded-xl glass-inset border border-swarm-border/70 overflow-hidden">
 <pre className="text-mini font-mono text-swarm-gold px-3 py-2.5 pr-10 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
 {CLI_BY_COMMAND[agent.cli].installCmd}
 </pre>
 <CopyInstallButton installCmd={CLI_BY_COMMAND[agent.cli].installCmd!} />
 </div>
 </div>
 )}

 <div className="flex items-center gap-2 flex-wrap justify-center">
 {CLI_BY_COMMAND[agent.cli]?.docsUrl && (
 <a
 href={CLI_BY_COMMAND[agent.cli].docsUrl}
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-swarm-gold/10 border border-swarm-gold/25 text-swarm-goldHi hover:bg-swarm-gold/20 transition-colors"
 >
 <ExternalLink size={12} />
 Open docs
 </a>
 )}
 {onClose && (
 <button
 onClick={onClose}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-swarm-surface border border-swarm-border/70 text-swarm-textDim hover:text-swarm-text transition-colors"
 >
 <Trash2 size={12} />
 Remove pane
 </button>
 )}
 </div>
 </div>
 )}

 {/* Loading / error overlay */}
 {spawnState !== "running" && spawnState !== "notFound" && (
 <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none glass-inset px-4 text-center z-10">
 {spawnState === "error" ? (
 <>
 <AlertTriangle size={18} className="text-swarm-err" />
 <span className="text-xs text-swarm-textDim">
 {displayName} failed to start
 </span>
 <span className="text-mini text-swarm-textMuted max-w-[240px]">
 Running <code className="font-mono">{agent.cli}</code> in this
 folder failed. Check the console for the spawn error, then
 remove and re-add the pane.
 </span>
 </>
 ) : (
 <>
 <Loader2 size={18} className="text-swarm-gold animate-spin" />
 <span className="text-xs text-swarm-textMuted">
 Starting {displayName}…
 </span>
 {stalled && (
 <span className="text-mini text-swarm-warn max-w-[220px]">
 Still nothing after {STALL_HINT_MS / 1000}s — is{" "}
 <code className="font-mono">{agent.cli}</code> installed
 and on your PATH?
 </span>
 )}
 </>
 )}
 </div>
 )}

 {/* Prompt bar */}
 {spawnState === "running" && (
 <AgentPromptBar
 paneId={paneId}
 agent={{ cli: agent.cli, cliName: agent.cliName }}
 brandColor={brandMeta.brandColor}
 brandName={brandMeta.brandName}
 supportsEffort={brandMeta.supportsEffort}
 effortLevels={brandMeta.effortLevels}
 currentModel={currentModel}
 currentEffort={currentEffort}
 promptInput={promptInput}
 commandSuggestionsOpen={commandSuggestionsOpen}
 selectedCommandIndex={selectedCommandIndex}
 filteredCommands={filteredCommands}
 promptTextareaRef={promptTextareaRef}
 detectedModels={detectedModels}
 detectedSelectedModel={detectedSelectedModel ?? undefined}
 isDetectingModels={isDetectingModels}
 autoModelDetectionError={autoModelDetectionError ?? undefined}
 onPromptChange={handlePromptChange}
 onPromptKeyDown={handlePromptKeyDown}
 onSendPrompt={handleSendPrompt}
 onSelectModel={handleSelectModel}
 onSelectEffort={handleSelectEffort}
 onCheckUsage={handleCheckUsage}
 setModelMenuOpen={setModelMenuOpen}
 setEffortMenuOpen={setEffortMenuOpen}
 setSettingsMenuOpen={setSettingsMenuOpen}
 setCommandSuggestionsOpen={setCommandSuggestionsOpen}
 setModelSearchQuery={setModelSearchQuery}
 modelMenuOpen={modelMenuOpen}
 effortMenuOpen={effortMenuOpen}
 settingsMenuOpen={settingsMenuOpen}
 modelSearchQuery={modelSearchQuery}
 sendTerminal={sendTerminal}
 />
 )}
 </div>
 );
}

// ---------------------------------------------------------------------------
// Small inline component for the CLI not-found card's copy button
// ---------------------------------------------------------------------------

function CopyInstallButton({ installCmd }: { installCmd: string }) {
 const [copied, setCopied] = useState(false);
 return (
 <button
 onClick={() => {
 navigator.clipboard.writeText(installCmd);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }}
 className="absolute top-2 right-2 p-1.5 rounded-md bg-swarm-border/40 hover:bg-swarm-gold/20 text-swarm-textDim hover:text-swarm-gold transition-colors"
 title="Copy install command"
 aria-label="Copy install command"
 >
 {copied ? <Check size={11} className="text-swarm-gold" /> : <Copy size={11} />}
 </button>
 );
}

export default memo(AgentPane, function areEqual(prev: AgentPaneProps, next: AgentPaneProps) {
 // Re-render when the pane identity or agent config changes
 if (prev.paneId !== next.paneId) return false;
 if (prev.agent.id !== next.agent.id) return false;
 if (prev.agent.cli !== next.agent.cli) return false;
 if (prev.agent.model !== next.agent.model) return false;
 if (prev.agent.effort !== next.agent.effort) return false;
 if (prev.isMaximized !== next.isMaximized) return false;
 if (prev.isEditing !== next.isEditing) return false;
 if (prev.editValue !== next.editValue) return false;
 if (prev.workingDir !== next.workingDir) return false;
 if (prev.sharedMemoryDir !== next.sharedMemoryDir) return false;
 if (prev.onClose !== next.onClose) return false;
 if (prev.onToggleMaximize !== next.onToggleMaximize) return false;
 if (prev.onRename !== next.onRename) return false;
 if (prev.onCancelRename !== next.onCancelRename) return false;
 if (prev.headerExtra !== next.headerExtra) return false;
 if (prev.agent.role !== next.agent.role) return false;
 if (prev.agent.branchName !== next.agent.branchName) return false;
 if (prev.agent.workspaceId !== next.agent.workspaceId) return false;
 if (prev.agent.isLead !== next.agent.isLead) return false;
 if (prev.agent.leadMode !== next.agent.leadMode) return false;
 return true;
});
