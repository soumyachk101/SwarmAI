import {
 type MouseEvent,
 useEffect,
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
 Search,
 Send,
 SlidersHorizontal,
 Sparkles,
 Shield,
 ShieldAlert,
 ShieldCheck,
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
 description?: string;
 is1M?: boolean;
 pricing?: string;
 provider?: string;
 cliFlag?: string;
 probed?: boolean;
 }>;
 detectedSelectedModel?: string;
 isDetectingModels: boolean;
 autoModelDetectionError?: string;
 onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
 onPromptKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
 onSendPrompt: () => void;
 onSelectModel: (modelId: string, modelLabel: string) => void;
 onSelectEffort: (effortId: string, effortLabel?: string) => void;
 supportsPermissions?: boolean;
 permissionLevels?: Array<{ id: string; label: string; desc: string; icon: string; color: string }>;
 permissionMode?: string;
 onSelectPermission?: (mode: string) => void;
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
 supportsPermissions,
 permissionLevels,
 permissionMode,
 onSelectPermission,
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
 const [permissionMenuOpen, setPermissionMenuOpen] = useState(false);
 const promptCardRef = useRef<HTMLDivElement>(null);
 const modelMenuRef = useRef<HTMLDivElement>(null);
 const effortMenuRef = useRef<HTMLDivElement>(null);
 const permissionMenuRef = useRef<HTMLDivElement>(null);
 const settingsMenuRef = useRef<HTMLDivElement>(null);

 const [maxDropdownWidth, setMaxDropdownWidth] = useState<number>(390);

 const cleanBrandName = useMemo(() => {
  return brandName.replace(/\s+models$/i, "").trim() || brandName;
 }, [brandName]);

	useEffect(() => {
		if (!modelMenuOpen) return;
		const updateMax = () => {
			if (promptCardRef.current && modelMenuRef.current) {
				const cardRect = promptCardRef.current.getBoundingClientRect();
				const btnRect = modelMenuRef.current.getBoundingClientRect();
				const available = cardRect.right - btnRect.left;
				setMaxDropdownWidth(Math.max(260, Math.min(410, Math.floor(available - 8))));
			}
		};
		updateMax();

		let ro: ResizeObserver | null = null;
		if (typeof ResizeObserver !== "undefined" && promptCardRef.current) {
			ro = new ResizeObserver(() => {
				updateMax();
			});
			ro.observe(promptCardRef.current);
		}

		window.addEventListener("resize", updateMax);
		return () => {
			if (ro) ro.disconnect();
			window.removeEventListener("resize", updateMax);
		};
	}, [modelMenuOpen]);

	const isSlashCommand = promptInput.startsWith("/") && !promptInput.includes("\n");

	const commands = useMemo(() => filteredCommands, [filteredCommands]);

	const isCurrentSelected = useCallback(
		(m: { id: string; label: string; cliFlag?: string }) => {
			const cur = (currentModel || "").toLowerCase().trim();
			const mId = (m.id || "").toLowerCase();
			const mLabel = (m.label || "").toLowerCase();
			const mFlag = (m.cliFlag || "").toLowerCase();

			if (cur === mId || cur === mLabel || (mFlag && cur === mFlag)) return true;

			// Precision matching for 1M vs standard variants
			if (cur.includes("fable") && (mId.includes("fable") || mLabel.includes("fable") || mFlag.includes("fable"))) {
				const cur1m = cur.includes("1m") || cur.includes("[1m]");
				const m1m = mId.includes("1m") || mLabel.includes("1m") || mFlag.includes("1m");
				return cur1m === m1m;
			}
			if (cur.includes("opus") && (mId.includes("opus") || mLabel.includes("opus") || mFlag.includes("opus"))) {
				const cur1m = cur.includes("1m") || cur.includes("[1m]");
				const m1m = mId.includes("1m") || mLabel.includes("1m") || mFlag.includes("1m");
				return cur1m === m1m;
			}
			if (cur.includes("sonnet") && (mId.includes("sonnet") || mLabel.includes("sonnet") || mFlag.includes("sonnet"))) {
				const cur1m = cur.includes("1m") || cur.includes("[1m]");
				const m1m = mId.includes("1m") || mLabel.includes("1m") || mFlag.includes("1m");
				return cur1m === m1m;
			}
			return false;
		},
		[currentModel],
	);

	const displayModelName = useMemo(() => {
		if (isDetectingModels) return "Detecting...";
		const cur = (currentModel || "").trim();
		if (!cur) return "Select Model";
		const lower = cur.toLowerCase();
		if (lower.includes("fable")) {
			return lower.includes("1m") || lower.includes("[1m]")
				? "Claude Fable 5.1 (1M Context)"
				: "Claude Fable 5.1";
		}
		const matched = detectedModels.find((m) => isCurrentSelected(m));
		if (matched) {
			return matched.label;
		}
		return cur
			.replace(/ \((Reasoning|Routine|Fast|Flagship|Default)\)/gi, "")
			.replace(/\[1m\]/gi, "");
	}, [currentModel, isDetectingModels, detectedModels, isCurrentSelected]);

	const show1MBadge = useMemo(() => {
		if (isDetectingModels) return false;
		const lower = displayModelName.toLowerCase();
		if (lower.includes("1m context") || lower.includes("(1m)") || lower.includes("1m")) {
			return false;
		}
		const curLower = (currentModel || "").toLowerCase();
		return curLower.includes("1m") || curLower.includes("[1m]");
	}, [currentModel, displayModelName, isDetectingModels]);

 // Handle outside clicks for dropdown menus
 useEffect(() => {
 const open = modelMenuOpen || effortMenuOpen || permissionMenuOpen || settingsMenuOpen;
 if (!open) return;
 const onDown = (e: MouseEvent) => {
 const target = e.target as Node;
 if (modelMenuOpen && modelMenuRef.current && !modelMenuRef.current.contains(target)) {
 setModelMenuOpen(false);
 }
 if (effortMenuOpen && effortMenuRef.current && !effortMenuRef.current.contains(target)) {
 setEffortMenuOpen(false);
 }
 if (permissionMenuOpen && permissionMenuRef.current && !permissionMenuRef.current.contains(target)) {
 setPermissionMenuOpen(false);
 }
 if (settingsMenuOpen && settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
 setSettingsMenuOpen(false);
 }
 };
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") {
 setModelMenuOpen(false);
 setEffortMenuOpen(false);
 setPermissionMenuOpen(false);
 setSettingsMenuOpen(false);
 }
 };
 window.addEventListener("click", onDown as any);
 window.addEventListener("keydown", onKey);
 return () => {
 window.removeEventListener("click", onDown as any);
 window.removeEventListener("keydown", onKey);
 };
 }, [modelMenuOpen, effortMenuOpen, permissionMenuOpen, settingsMenuOpen, setModelMenuOpen, setEffortMenuOpen, setSettingsMenuOpen]);

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
 <div className="relative shrink-0 z-20 bg-[#0c0e16] border-t border-white/[0.08] p-2">
 {/* Brand-colored accent glow line */}
 <div
 className="absolute -top-px left-4 right-4 h-px rounded-full"
 style={{
 background: `linear-gradient(90deg, transparent, ${brandColor}90, ${brandColor}50, transparent)`,
 filter: `blur(0.5px) drop-shadow(0 0 3px ${brandColor}60)`,
 }}
 />
 <div
 ref={promptCardRef}
 style={{ backgroundColor: "#121520" }}
 className="relative rounded-2xl border border-white/[0.12] shadow-2xl shadow-black/80 transition-all duration-200 focus-within:border-swarm-gold/60 focus-within:shadow-black/90 p-2.5 flex flex-col gap-2"
 >
 <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

 {/* Top: Slash Command Autocomplete & Textarea */}
 <div className="relative w-full">
 {/* Slash Command Autocomplete */}
 {isSlashCommand && commandSuggestionsOpen && commands.length > 0 && (
 <div
 style={{ backgroundColor: "#151828", opacity: 1, zIndex: 100 }}
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
 className="w-full resize-none bg-transparent text-xs text-swarm-text placeholder:text-swarm-textMuted/50 outline-none leading-relaxed min-h-[22px]"
 />
 </div>

 {/* Bottom Toolbar: Left Selectors + Right Action Buttons */}
 <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
 {/* Left: Model & Effort & Status */}
 <div className="flex items-center gap-1.5 flex-wrap min-w-0">
 {/* Model Selector */}
 <div ref={modelMenuRef} className="relative">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setModelMenuOpen((v) => !v);
 setEffortMenuOpen(false);
 setSettingsMenuOpen(false);
 }}
 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all font-medium cursor-pointer ${
 modelMenuOpen
 ? "bg-swarm-gold/15 border-swarm-gold/50 text-swarm-goldHi shadow-xs"
 : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-zinc-300 hover:text-white"
 }`}
 title={`${cleanBrandName}: ${displayModelName}`}
 >
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2.8" strokeLinecap="round" className="shrink-0">
 <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
 </svg>
 <span className="font-semibold text-swarm-text max-w-[240px] truncate" title={displayModelName}>
 {isDetectingModels ? (
 <span className="flex items-center gap-1">
 <Loader2 size={10} className="animate-spin text-swarm-gold/70" />
 <span className="text-swarm-gold/80">Detecting...</span>
 </span>
 ) : (
 displayModelName
 )}
 </span>
 {show1MBadge && (
 <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 leading-tight">
 1M
 </span>
 )}
 {!isDetectingModels && (
 <ChevronDown size={11} className={`text-zinc-400 transition-transform duration-150 ${modelMenuOpen ? "rotate-180 text-swarm-gold" : ""}`} />
 )}
 </button>

 {modelMenuOpen && (
 <div
 onClick={(e) => e.stopPropagation()}
 style={{
 bottom: "calc(100% + 8px)",
 top: "auto",
 left: 0,
 backgroundColor: "#10131e",
 width: maxDropdownWidth ? `${maxDropdownWidth}px` : "min(410px, calc(100vw - 32px))",
 maxWidth: "calc(100vw - 32px)",
 }}
 className="absolute mb-1.5 rounded-2xl border border-white/[0.14] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.95)] z-[300] animate-scale-in flex flex-col gap-2.5 backdrop-blur-2xl box-border"
 >
 {/* Header section matching Claude Code's terminal /model menu */}
 <div className="flex flex-col gap-1 border-b border-white/[0.08] pb-2.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-white tracking-tight">Select model</span>
 <span
 className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-white/[0.06] border border-white/[0.08]"
 style={{ color: brandColor }}
 >
 {cleanBrandName}
 </span>
 </div>
 <div className="flex items-center gap-2">
 {autoModelDetectionError && (
 <span className="text-[9px] font-mono text-swarm-err" title={autoModelDetectionError}>
 probe failed
 </span>
 )}
 <span className="text-[10px] font-mono text-zinc-400">
 {detectedModels.length} models
 </span>
 </div>
 </div>
 <p className="text-[11px] text-zinc-400 font-normal leading-normal">
 Switch between {cleanBrandName} models. Your pick becomes the default for active and new sessions.
 </p>
 </div>

 {/* Search Input */}
 {detectedModels.length > 4 && (
 <div className="relative flex items-center">
 <Search size={13} className="absolute left-3 text-zinc-400 pointer-events-none" />
 <input
 type="text"
 value={modelSearchQuery}
 onChange={(e) => setModelSearchQuery(e.target.value)}
 placeholder="Filter models or flags..."
 className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] focus:border-swarm-gold/50 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
 onClick={(e) => e.stopPropagation()}
 autoFocus
 />
 {modelSearchQuery && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setModelSearchQuery("");
 }}
 className="absolute right-2.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
 >
 ✕
 </button>
 )}
 </div>
 )}

 {/* Model list */}
 <div className="max-h-[290px] overflow-y-auto scrollbar-sleek flex flex-col gap-1.5 pr-0.5">
 {detectedModels
 .filter((m) => {
 if (!modelSearchQuery.trim()) return true;
 const q = modelSearchQuery.toLowerCase();
 return (
 m.label.toLowerCase().includes(q) ||
 (m.description ? m.description.toLowerCase().includes(q) : false) ||
 (m.cliFlag ? m.cliFlag.toLowerCase().includes(q) : false) ||
 (m.provider && m.provider.toLowerCase().includes(q))
 );
 })
 .map((m, idx) => {
 const isSelected = isCurrentSelected(m);
 return (
 <button
 key={m.id}
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onSelectModel(m.id, m.label);
 setModelMenuOpen(false);
 }}
 className={`group relative flex flex-col gap-1 rounded-xl px-3 py-2 text-left transition-all cursor-pointer border ${
 isSelected
 ? "bg-swarm-gold/15 border-swarm-gold/45 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
 : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.04] hover:border-white/[0.12] text-zinc-300 hover:text-white"
 }`}
 >
 {/* Top Row: Index/Arrow + Title + Badges + Pricing + Checkmark */}
 <div className="flex items-center justify-between gap-2 min-w-0">
 <div className="flex items-center gap-1.5 min-w-0 flex-1">
 <span
 className={`font-mono text-xs shrink-0 ${
 isSelected
 ? "text-swarm-gold font-bold"
 : "text-zinc-500 group-hover:text-zinc-300"
 }`}
 >
 {isSelected ? "›" : `${idx + 1}.`}
 </span>
 <span
 className={`text-xs truncate ${
 isSelected
 ? "font-semibold text-swarm-goldHi"
 : "font-medium text-zinc-100 group-hover:text-white"
 }`}
 title={m.label}
 >
 {m.label}
 </span>
 {m.is1M && (
 <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 leading-tight">
 1M
 </span>
 )}
 {idx === 0 && !m.probed && (
 <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/[0.08] text-zinc-300 border border-white/[0.12] leading-tight">
 Default
 </span>
 )}
 {m.probed && (
 <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/25 leading-tight">
 Probed
 </span>
 )}
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {m.pricing && (
 <span
 className={`text-[10px] font-mono tabular-nums whitespace-nowrap ${
 isSelected ? "text-swarm-gold/90 font-semibold" : "text-zinc-400"
 }`}
 >
 {m.pricing}
 </span>
 )}
 {isSelected ? (
 <Check size={13} className="text-swarm-gold stroke-[2.8] shrink-0" />
 ) : (
 <div className="w-3.5 h-3.5 shrink-0" />
 )}
 </div>
 </div>

 {/* Bottom Row: Subtitle / Description */}
 {m.description ? (
 <div className="text-[11px] text-zinc-400 group-hover:text-zinc-300 pl-4 font-normal leading-snug line-clamp-2">
 {m.description}
 </div>
 ) : m.cliFlag ? (
 <div className="text-[10px] font-mono text-zinc-500 pl-4">
 --model {m.cliFlag}
 </div>
 ) : null}
 </button>
 );
 })}
 </div>

 {/* Footer tip */}
 <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] text-zinc-500 px-1 min-w-0">
 <span className="truncate">
 For other models, specify with <code className="font-mono text-zinc-400">/model &lt;name&gt;</code>
 </span>
 <span className="font-mono text-[9px] text-zinc-500 shrink-0 whitespace-nowrap">Esc to close</span>
 </div>
 </div>
 )}
 </div>

 {/* Effort Selector */}
 {supportsEffort && effortLevels && effortLevels.length > 0 && (
 <div ref={effortMenuRef} className="relative">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setEffortMenuOpen((v) => !v);
 setModelMenuOpen(false);
 setSettingsMenuOpen(false);
 }}
 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all font-medium cursor-pointer ${
 effortMenuOpen
 ? "bg-swarm-gold/15 border-swarm-gold/50 text-swarm-goldHi shadow-xs"
 : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-zinc-300 hover:text-white"
 }`}
 title="Reasoning Effort (/effort)"
 >
 <span className="font-semibold text-swarm-text">{currentEffort || "Max"}</span>
 <ChevronDown size={11} className={`text-swarm-textMuted transition-transform duration-150 ${effortMenuOpen ? "rotate-180 text-swarm-gold" : ""}`} />
 </button>

 {effortMenuOpen && (
 <div
 onClick={(e) => e.stopPropagation()}
 style={{ bottom: "calc(100% + 8px)", top: "auto", left: 0, backgroundColor: "#141724" }}
 className="absolute mb-1.5 min-w-[160px] rounded-xl border border-white/[0.16] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,1)] z-[300] animate-scale-in"
 >
 <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-swarm-gold uppercase tracking-wider border-b border-white/[0.08] mb-1 flex items-center justify-between">
 <span>Effort Level</span>
 <span className="text-[9px] font-normal text-zinc-500 font-sans">/effort</span>
 </div>
 {effortLevels.map((eff) => {
 const isSelected =
 (currentEffort || "").toLowerCase() === eff.id.toLowerCase() ||
 (currentEffort || "").toLowerCase() === eff.label.toLowerCase();
 return (
 <button
 key={eff.id}
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onSelectEffort(eff.id, eff.label);
 setEffortMenuOpen(false);
 }}
 className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
 isSelected
 ? "bg-swarm-gold/20 text-swarm-goldHi font-bold"
 : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
 }`}
 >
 <span className={eff.isHighlight ? "font-bold text-swarm-goldHi" : ""}>{eff.label}</span>
 {isSelected && <Check size={13} className="text-swarm-gold stroke-[2.5]" />}
 </button>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* Permission Selector */}
 {supportsPermissions && onSelectPermission && permissionLevels && (
 <div ref={permissionMenuRef} className="relative">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setPermissionMenuOpen((v) => !v);
 setModelMenuOpen(false);
 setEffortMenuOpen(false);
 setSettingsMenuOpen(false);
 }}
 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all font-medium cursor-pointer ${
 permissionMenuOpen
 ? "bg-swarm-gold/15 border-swarm-gold/50 text-swarm-goldHi shadow-xs"
 : (permissionLevels.find(p => p.id === permissionMode)?.color === "text-amber-400" || permissionMode === "bypass")
 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
 : (permissionLevels.find(p => p.id === permissionMode)?.color === "text-sky-400" || permissionMode === "acceptEdits")
 ? "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
 : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/[0.16] text-zinc-300 hover:text-white"
 }`}
 title="Execution Permissions (/permissions)"
 >
 {(permissionMode === "bypass" || (permissionLevels.find(p => p.id === permissionMode)?.id === "bypass")) ? (
 <ShieldAlert size={12} className="text-amber-400" />
 ) : (permissionMode === "acceptEdits" || (permissionLevels.find(p => p.id === permissionMode)?.id === "acceptEdits")) ? (
 <Shield size={12} className="text-sky-400" />
 ) : (
 <ShieldCheck size={12} className="text-emerald-400" />
 )}
 <span className="font-semibold">
 {permissionLevels.find(p => p.id === (permissionMode || "default"))?.label ||
 (permissionMode === "bypass" ? "Bypass" : permissionMode === "acceptEdits" ? "Accept Edits" : "Safe")}
 </span>
 <ChevronDown size={11} className={`text-swarm-textMuted transition-transform duration-150 ${permissionMenuOpen ? "rotate-180 text-swarm-gold" : ""}`} />
 </button>

 {permissionMenuOpen && (
 <div
 onClick={(e) => e.stopPropagation()}
 style={{ bottom: "calc(100% + 8px)", top: "auto", left: 0, backgroundColor: "#141724" }}
 className="absolute mb-1.5 min-w-[200px] rounded-xl border border-white/[0.16] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,1)] z-[300] animate-scale-in"
 >
 <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-swarm-gold uppercase tracking-wider border-b border-white/[0.08] mb-1 flex items-center justify-between">
 <span>Permissions</span>
 <span className="text-[9px] font-normal text-zinc-500 font-sans">/permissions</span>
 </div>
 {permissionLevels.map((p) => {
 const isSelected = (permissionMode || "default") === p.id;
 return (
 <button
 key={p.id}
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onSelectPermission(p.id);
 setPermissionMenuOpen(false);
 }}
 className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
 isSelected
 ? "bg-swarm-gold/20 text-swarm-goldHi font-bold"
 : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
 }`}
 >
 <Shield size={14} className={`shrink-0 mt-0.5 ${p.color}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <span className={isSelected ? "text-swarm-goldHi font-semibold" : "text-zinc-200"}>{p.label}</span>
 {isSelected && <Check size={12} className="text-swarm-gold stroke-[2.5]" />}
 </div>
 <div className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5">{p.desc}</div>
 </div>
 </button>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* Usage Speedometer */}
 <button
 onClick={onCheckUsage}
 className="flex size-7 items-center justify-center rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] text-swarm-textMuted hover:text-swarm-text transition-all cursor-pointer"
 title="Check Model & Token Usage (/status)"
 >
 <Gauge size={13} className="text-slate-400" />
 </button>
 </div>

 {/* Right Actions: Tools Menu + Send Button */}
 <div className="flex items-center gap-1.5 shrink-0">
 {/* CLI Shortcuts / Tools */}
 <div ref={settingsMenuRef} className="relative">
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSettingsMenuOpen((v) => !v);
 setModelMenuOpen(false);
 setEffortMenuOpen(false);
 }}
 className="flex size-7 items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
 title="CLI Shortcuts & Tools"
 >
 <SlidersHorizontal size={13} />
 </button>

 {settingsMenuOpen && (
 <div
 onClick={(e) => e.stopPropagation()}
 style={{ bottom: "calc(100% + 8px)", top: "auto", right: 0, backgroundColor: "#141724" }}
 className="absolute mb-1.5 min-w-[185px] rounded-xl border border-white/[0.16] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,1)] z-[300] animate-scale-in"
 >
 <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted/70 tracking-wider uppercase border-b border-swarm-border/50 mb-1">
 Commands
 </div>
 {[
 { label: "Status & Model (/status)", cmd: "\x15/status\r" },
 { label: "Compact History (/compact)", cmd: "\x15/compact\r" },
 { label: "Cost & Tokens (/cost)", cmd: "\x15/cost\r" },
 { label: "Clear Screen (/clear)", cmd: "\x15/clear\r" },
 { label: "Review Diff (/review)", cmd: "\x15/review\r" },
 { label: "Reset Session (/reset)", cmd: "\x15/reset\r" },
 ].map((item) => (
 <button
 key={item.label}
 onClick={() => {
 sendTerminal(item.cmd);
 setSettingsMenuOpen(false);
 }}
 className="flex w-full items-center px-2 py-1.5 text-xs text-swarm-textDim hover:bg-white/[0.06] hover:text-swarm-text rounded-md text-left transition-colors cursor-pointer"
 >
 {item.label}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Send Button */}
 <button
 onClick={onSendPrompt}
 disabled={!promptInput.trim()}
 className={`flex size-7 items-center justify-center rounded-lg transition-all ${
 promptInput.trim()
 ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 cursor-pointer"
 : "bg-white/[0.03] border border-white/[0.06] text-zinc-600 cursor-not-allowed opacity-50"
 }`}
 title="Send to agent (Enter)"
 >
 <Send size={12} className={promptInput.trim() ? "fill-current ml-0.5" : "ml-0.5"} />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

export default AgentPromptBar;
