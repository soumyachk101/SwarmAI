import {
 type MouseEvent,
 useRef,
 useState,
 useMemo,
 useCallback,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import {
 Check,
 ChevronDown,
 Gauge,
 Loader2,
 Send,
 SlidersHorizontal,
 Sparkles,
} from "lucide-react";
import { useAutoModelDetection } from "../hooks/useAutoModelDetection.js";
import { getDefaultModelForCli, getModelById } from "../cli-configs/model-catalog.js";
import { normaliseEffort } from "../cli-configs/index.js";
import type { CommandSuggestion } from "./AgentPane.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentPromptBarProps {
 paneId: string;
 agent: {
 cli: string;
 cliName: string;
 };
 brandColor: string;
 brandName: string;
 supportsEffort: boolean;
 effortLevels?: Array<{ id: string; label: string; isHighlight?: boolean }>;
 currentModel: string;
 currentEffort: string;
 promptInput: string;
 commandSuggestionsOpen: boolean;
 selectedCommandIndex: number;
 filteredCommands: CommandSuggestion[];
 promptTextareaRef: { current: HTMLTextAreaElement | null };
 detectedModels: Array<{
 id: string;
 label: string;
 is1M?: boolean;
 pricing?: string;
 provider?: string;
 cliFlag?: string;
 }>;
 detectedSelectedModel?: string;
 isDetectingModels: boolean;
 autoModelDetectionError?: string;
 onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
 onPromptKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
 onSendPrompt: () => void;
 onSelectModel: (modelId: string, modelLabel: string) => void;
 onSelectEffort: (effortId: string, effortLabel?: string) => void;
 onCheckUsage: () => void;
 setModelMenuOpen: Dispatch<SetStateAction<boolean>>;
 setEffortMenuOpen: Dispatch<SetStateAction<boolean>>;
 setSettingsMenuOpen: Dispatch<SetStateAction<boolean>>;
 setCommandSuggestionsOpen: Dispatch<SetStateAction<boolean>>;
 setModelSearchQuery: Dispatch<SetStateAction<string>>;
 modelMenuOpen: boolean;
 effortMenuOpen: boolean;
 settingsMenuOpen: boolean;
 modelSearchQuery: string;
 sendTerminal: (data: string) => void;
}

// ---------------------------------------------------------------------------
// AgentPromptBar
// ---------------------------------------------------------------------------

function AgentPromptBar({
 paneId,
 agent,
 brandColor,
 brandName,
 supportsEffort,
 effortLevels,
 currentModel,
 currentEffort,
 promptInput,
 commandSuggestionsOpen,
 selectedCommandIndex,
 filteredCommands,
 promptTextareaRef,
 detectedModels,
 detectedSelectedModel,
 isDetectingModels,
 autoModelDetectionError,
 onPromptChange,
 onPromptKeyDown,
 onSendPrompt,
 onSelectModel,
 onSelectEffort,
 onCheckUsage,
 setModelMenuOpen,
 setEffortMenuOpen,
 setSettingsMenuOpen,
 setCommandSuggestionsOpen,
 setModelSearchQuery,
 modelMenuOpen,
 effortMenuOpen,
 settingsMenuOpen,
 modelSearchQuery,
 sendTerminal,
}: AgentPromptBarProps) {
 const modelMenuRef = useRef<HTMLDivElement>(null);
 const effortMenuRef = useRef<HTMLDivElement>(null);
 const settingsMenuRef = useRef<HTMLDivElement>(null);

 const isSlashCommand = promptInput.startsWith("/") && !promptInput.includes("\n");

 const commands = useMemo(() => filteredCommands, [filteredCommands]);

 const handleSelectCommand = useCallback(
 (cmd: CommandSuggestion) => {
 if (cmd.syntax && cmd.syntax.includes("<")) {
 setCommandSuggestionsOpen(false);
 if (promptTextareaRef.current) {
 promptTextareaRef.current.focus();
 promptTextareaRef.current.style.height = "auto";
 }
 } else {
 setCommandSuggestionsOpen(false);
 if (promptTextareaRef.current) {
 promptTextareaRef.current.style.height = "auto";
 }
 sendTerminal(`\x15${cmd.name}\r`);
 }
 },
 [promptTextareaRef, sendTerminal, setCommandSuggestionsOpen],
 );

 return (
 <div className="relative shrink-0 z-20">
 {/* Brand-colored accent glow line */}
 <div
 className="absolute -top-px left-4 right-4 h-px rounded-full"
 style={{
 background: `linear-gradient(90deg, transparent, ${brandColor}90, ${brandColor}50, transparent)`,
 filter: `blur(0.5px) drop-shadow(0 0 3px ${brandColor}60)`,
 }}
 />
 <div className="p-2.5 pt-3">
 <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0e14]/[0.97] backdrop-blur-2xl shadow-2xl shadow-black/50 transition-all duration-200 focus-within:border-white/[0.18] focus-within:shadow-black/60 flex items-center gap-2.5 px-3.5 py-2.5">
 <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
 <div className="flex-1 flex flex-col justify-between min-w-0 gap-2 relative">
 {/* Slash Command Autocomplete */}
 {isSlashCommand && commandSuggestionsOpen && commands.length > 0 && (
 <div
 style={{ backgroundColor: "#151824", opacity: 1, zIndex: 100 }}
 className="absolute bottom-full left-0 mb-2 w-full max-h-[240px] overflow-y-auto rounded-2xl border border-white/[0.2] p-2 shadow-[0_20px_60px_rgba(0,0,0,1)] scrollbar-sleek"
 >
 <div className="px-2.5 py-1.5 text-[10px] font-bold text-white/50 tracking-wider uppercase flex items-center justify-between border-b border-white/[0.1] mb-1.5">
 <span className="flex items-center gap-1.5 text-swarm-gold font-semibold">
 <Sparkles size={12} className="text-swarm-gold shrink-0" />
 Commands
 </span>
 <span className="text-[10px] font-mono text-white/40">↑↓ navigate · Tab/↵ select · Esc close</span>
 </div>
 <div className="space-y-0.5">
 {commands.map((cmd, idx) => {
 const active = idx === selectedCommandIndex;
 return (
 <button
 key={cmd.name}
 type="button"
 style={{ backgroundColor: active ? "#252b3d" : "transparent" }}
 onMouseDown={(e) => {
 e.preventDefault();
 handleSelectCommand(cmd);
 }}
 className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
 active ? "text-white ring-1 ring-white/[0.25]" : "text-white/80 hover:text-white"
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="font-mono text-xs font-bold text-[#E5A93C] shrink-0">
 {cmd.name}
 </span>
 <span className="truncate text-xs text-white/70 font-normal">
 {cmd.description}
 </span>
 </div>
 {cmd.category && (
 <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.1] text-white/80 border border-white/[0.1]">
 {cmd.category}
 </span>
 )}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Prompt Text Input */}
 <textarea
 ref={promptTextareaRef}
 value={promptInput}
 onChange={onPromptChange}
 onKeyDown={onPromptKeyDown}
 placeholder={`Prompt ${agent.cliName}... (Type / for commands)`}
 rows={1}
 className="w-full resize-none bg-transparent text-xs text-swarm-text placeholder:text-swarm-textMuted/45 outline-none leading-relaxed"
 />

 {/* Bottom Controls Row */}
 <div className="flex items-center gap-3 pt-0.5">
 {/* Model Selector */}
 <div ref={modelMenuRef} className="relative">
 <button
 onClick={() => {
 setModelMenuOpen((v) => !v);
 setEffortMenuOpen(false);
 setSettingsMenuOpen(false);
 }}
 className="flex items-center gap-1.5 text-xs text-swarm-textDim hover:text-swarm-text transition-colors font-medium group"
 title={`${brandName}: ${currentModel}`}
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2.8" strokeLinecap="round" className="shrink-0">
 <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
 </svg>
 <span className="font-semibold text-swarm-text/90 max-w-[150px] truncate">
 {isDetectingModels ? (
 <span className="flex items-center gap-1">
 <Loader2 size={10} className="animate-spin text-swarm-gold/70" />
 <span className="text-swarm-gold/80">Detecting...</span>
 </span>
 ) : (
 currentModel.replace(" (1M Context)", " 1M").replace(" (1M)", " 1M")
 )}
 </span>
 {!isDetectingModels && (
 <ChevronDown size={12} className="text-swarm-textMuted/70 group-hover:text-swarm-text shrink-0" />
 )}
 </button>

 {modelMenuOpen && (
 <div className="absolute bottom-full left-0 mb-2 min-w-[260px] max-w-[340px] rounded-xl border border-white/[0.12] bg-[#141720] p-1.5 shadow-2xl z-50 animate-fade-in flex flex-col">
 <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted/70 tracking-wider uppercase flex items-center justify-between">
 <span style={{ color: brandColor }}>{brandName}</span>
 <div className="flex items-center gap-1.5">
 {autoModelDetectionError && (
 <span className="text-[9px] font-mono text-swarm-err" title={autoModelDetectionError}>
 probe failed
 </span>
 )}
 <span className="text-[9px] font-mono text-swarm-gold">{`${detectedModels.length} models`}</span>
 </div>
 </div>

 {detectedModels.length > 5 && (
 <div className="px-1 py-1">
 <input
 type="text"
 value={modelSearchQuery}
 onChange={(e) => setModelSearchQuery(e.target.value)}
 placeholder="Search models..."
 className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-swarm-text placeholder:text-swarm-textMuted/50 focus:outline-none focus:border-swarm-gold/50"
 onClick={(e) => e.stopPropagation()}
 autoFocus
 />
 </div>
 )}

 <div className="max-h-[260px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
 {detectedModels
 .filter((m) => {
 if (!modelSearchQuery.trim()) return true;
 const q = modelSearchQuery.toLowerCase();
 return (
 m.label.toLowerCase().includes(q) ||
 (m.cliFlag ? m.cliFlag.toLowerCase().includes(q) : false) ||
 (m.provider && m.provider.toLowerCase().includes(q))
 );
 })
 .map((m) => (
 <button
 key={m.id}
 onClick={() => onSelectModel(m.id, m.label)}
 className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left text-swarm-textDim hover:bg-white/[0.08] hover:text-swarm-text transition-colors group"
 >
 <div className="flex items-center gap-1.5 min-w-0 pr-2">
 <span className="truncate">{m.label}</span>
 {m.is1M && (
 <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
 1M
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 {m.pricing && (
 <span className="text-[10px] tabular-nums text-swarm-textMuted/60 group-hover:text-swarm-textMuted/90">
 {m.pricing}
 </span>
 )}
 {(currentModel === m.id || currentModel === m.label || detectedSelectedModel === m.id) && (
 <Check size={12} className="text-swarm-gold ml-0.5" />
 )}
 </div>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Effort Selector */}
 {supportsEffort && effortLevels && effortLevels.length > 0 && (
 <div ref={effortMenuRef} className="relative">
 <button
 onClick={() => {
 setEffortMenuOpen((v) => !v);
 setModelMenuOpen(false);
 setSettingsMenuOpen(false);
 }}
 className="flex items-center gap-1 text-xs text-swarm-textDim hover:text-swarm-text transition-colors font-medium"
 title="Reasoning Effort"
 >
 <span className="font-semibold text-swarm-text/90">{currentEffort}</span>
 <ChevronDown size={13} className="text-swarm-textMuted/70" />
 </button>

 {effortMenuOpen && (
 <div className="absolute bottom-full left-0 mb-2 min-w-[130px] rounded-xl border border-white/[0.12] bg-[#141720] p-1.5 shadow-2xl z-50 animate-fade-in">
 <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted/70 tracking-wider uppercase">
 Effort Level
 </div>
 {effortLevels.map((eff) => (
 <button
 key={eff.id}
 onClick={() => onSelectEffort(eff.id, eff.label)}
 className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left text-swarm-textDim hover:bg-white/[0.08] hover:text-swarm-text transition-colors"
 >
 <span className={eff.isHighlight ? "font-bold text-swarm-goldHi" : ""}>{eff.label}</span>
 {currentEffort === eff.label && <Check size={12} className="text-swarm-gold" />}
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Usage Speedometer */}
 <button
 onClick={onCheckUsage}
 className="flex size-5 items-center justify-center text-swarm-textMuted hover:text-swarm-text transition-colors"
 title="Check Model & Token Usage (/status)"
 >
 <Gauge size={14} className="text-swarm-textMuted/80" />
 </button>
 </div>

 {/* Right Actions: Tools Menu + Send Button */}
 <div className="flex items-center gap-1.5 shrink-0 self-end pb-0.5">
 {/* CLI Shortcuts / Tools */}
 <div ref={settingsMenuRef} className="relative">
 <button
 onClick={() => {
 setSettingsMenuOpen((v) => !v);
 setModelMenuOpen(false);
 setEffortMenuOpen(false);
 }}
 className="flex size-7 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-swarm-textMuted hover:text-swarm-text hover:bg-white/[0.08] transition-colors"
 title="CLI Shortcuts & Tools"
 >
 <SlidersHorizontal size={13} />
 </button>

 {settingsMenuOpen && (
 <div className="absolute bottom-full right-0 mb-2 min-w-[185px] rounded-xl border border-white/[0.12] bg-[#141720] p-1.5 shadow-2xl z-50 animate-fade-in">
 <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted/70 tracking-wider uppercase border-b border-white/[0.06] mb-1">
 Commands
 </div>
 {[
 { label: "Status & Model (/status)", cmd: "\x15/status\r" },
 { label: "Check Cost (/cost)", cmd: "\x15/cost\r" },
 { label: "Compact Context (/compact)", cmd: "\x15/compact\r" },
 { label: "Clear Session (/clear)", cmd: "\x15/clear\r" },
 { label: "Doctor Diagnostic (/doctor)", cmd: "\x15/doctor\r" },
 { label: "Review Diffs (/review)", cmd: "\x15/review\r" },
 ].map((sc) => (
 <button
 key={sc.label}
 onClick={() => {
 setSettingsMenuOpen(false);
 sendTerminal(sc.cmd);
 }}
 className="flex w-full items-center rounded-lg px-2 py-1.5 text-xs text-left text-swarm-textDim hover:bg-white/[0.08] hover:text-swarm-text transition-colors"
 >
 {sc.label}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Send Button */}
 <button
 onClick={onSendPrompt}
 disabled={!promptInput.trim()}
 className="flex size-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 hover:text-amber-200 disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:text-swarm-textDim disabled:bg-white/[0.04] disabled:border-white/[0.08] transition-all cursor-pointer"
 title="Send to agent (Enter)"
 >
 <Send size={13} className="ml-0.5" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

export default AgentPromptBar;
