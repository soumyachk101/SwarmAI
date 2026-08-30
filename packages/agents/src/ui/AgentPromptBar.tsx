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

 // Handle outside clicks for dropdown menus
 useEffect(() => {
   const open = modelMenuOpen || effortMenuOpen || settingsMenuOpen;
   if (!open) return;
   const onDown = (e: MouseEvent) => {
     const target = e.target as Node;
     if (modelMenuOpen && modelMenuRef.current && !modelMenuRef.current.contains(target)) {
       setModelMenuOpen(false);
     }
     if (effortMenuOpen && effortMenuRef.current && !effortMenuRef.current.contains(target)) {
       setEffortMenuOpen(false);
     }
     if (settingsMenuOpen && settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
       setSettingsMenuOpen(false);
     }
   };
   const onKey = (e: KeyboardEvent) => {
     if (e.key === "Escape") {
       setModelMenuOpen(false);
       setEffortMenuOpen(false);
       setSettingsMenuOpen(false);
     }
   };
   window.addEventListener("click", onDown as any);
   window.addEventListener("keydown", onKey);
   return () => {
     window.removeEventListener("click", onDown as any);
     window.removeEventListener("keydown", onKey);
   };
 }, [modelMenuOpen, effortMenuOpen, settingsMenuOpen, setModelMenuOpen, setEffortMenuOpen, setSettingsMenuOpen]);

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
              title={`${brandName}: ${currentModel}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2.8" strokeLinecap="round" className="shrink-0">
                <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
              </svg>
              <span className="font-semibold text-swarm-text max-w-[150px] truncate">
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
                <ChevronDown size={11} className={`text-zinc-400 transition-transform duration-150 ${modelMenuOpen ? "rotate-180 text-swarm-gold" : ""}`} />
              )}
            </button>

            {modelMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ bottom: "calc(100% + 8px)", top: "auto", left: 0, backgroundColor: "#141724" }}
                className="absolute mb-1.5 min-w-[270px] max-w-[340px] rounded-xl border border-white/[0.16] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,1)] z-[300] animate-scale-in flex flex-col"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center justify-between border-b border-white/[0.08] mb-1">
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
                      className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-swarm-gold/50"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                )}

                <div className="max-h-[260px] overflow-y-auto scrollbar-sleek flex flex-col gap-0.5">
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
                    .map((m) => {
                      const isSelected =
                        currentModel === m.id ||
                        currentModel === m.label ||
                        currentModel.toLowerCase() === m.label.toLowerCase() ||
                        currentModel.toLowerCase() === m.id.toLowerCase();
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectModel(m.id, m.label);
                            setModelMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-swarm-gold/20 text-swarm-goldHi font-bold"
                              : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                          }`}
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
                              <span className="text-[10px] tabular-nums text-zinc-500">
                                {m.pricing}
                              </span>
                            )}
                            {isSelected && <Check size={12} className="text-swarm-gold stroke-[2.5]" />}
                          </div>
                        </button>
                      );
                    })}
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
