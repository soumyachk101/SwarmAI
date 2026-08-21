import React, { useState } from "react";
import { useCanvasStore } from "./canvasStore.js";
import {
  Zap,
  Send,
  GitFork,
  Radio,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Minus,
  CheckCircle2,
} from "lucide-react";

export interface FlowAgentTarget {
  id: string;
  name: string;
  cli?: string;
  isLead?: boolean;
}

interface Props {
  agents: FlowAgentTarget[];
  onDispatch: (params: {
    prompt: string;
    mode: "broadcast" | "pipeline";
    targetIds: string[];
  }) => Promise<void>;
  isDispatching?: boolean;
}

export default function FlowCommandBar({ agents, onDispatch, isDispatching = false }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"broadcast" | "pipeline">("broadcast");
  const [selectedIds, setSelectedIds] = useState<string[]>(agents.map((a) => a.id));
  const [showPresets, setShowPresets] = useState(false);
  const edges = useCanvasStore((s) => s.edges);

  const toggleTarget = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (!prompt.trim() || isDispatching) return;
    onDispatch({
      prompt: prompt.trim(),
      mode,
      targetIds: selectedIds.length > 0 ? selectedIds : agents.map((a) => a.id),
    });
    setPrompt("");
  };

  const PRESETS = [
    {
      title: "Parallel Sprint (All Models Race)",
      prompt: "Implement and optimize current task with clean unit tests and benchmarks.",
      mode: "broadcast" as const,
      icon: Zap,
    },
    {
      title: "Architect to Worker Delegation",
      prompt: "Lead Architect: Decompose workspace architecture, assign subtasks, and dispatch implementation down the flow pipeline.",
      mode: "pipeline" as const,
      icon: GitFork,
    },
    {
      title: "Code Generation + Auto-Reviewer",
      prompt: "Workers: Implement core business logic. Reviewer CLI: Inspect git diff, verify syntax, and provide code review.",
      mode: "pipeline" as const,
      icon: Layers,
    },
  ];

  if (isCollapsed) {
    return (
      <div className="pointer-events-auto absolute top-3 inset-x-0 z-40 mx-auto w-fit px-4 flex justify-center select-none animate-fade-in">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/[0.2] bg-[#10121a]/95 backdrop-blur-2xl shadow-2xl text-xs font-semibold text-zinc-200 hover:border-white/50 hover:bg-[#141724] hover:text-white cursor-pointer group transition-all duration-200"
          title="Expand Swarm Command Hub"
        >
          <Zap size={14} className="text-slate-100 animate-pulse" />
          <span className="font-mono text-slate-100 font-bold">Swarm Flow Hub</span>
          <span className="size-1 rounded-full bg-zinc-600" />
          <span className="text-[11px] text-zinc-400 font-mono">{agents.length} CLIs</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.16] text-[10px] text-slate-200 font-mono">
            {mode === "broadcast" ? "Broadcast" : `Pipeline (${edges.length})`}
          </span>
          <ChevronDown size={14} className="text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute top-3 inset-x-0 z-40 mx-auto max-w-2xl px-4 flex flex-col items-center gap-2 select-none animate-fade-in">
      <div className="w-full rounded-2xl border border-swarm-borderHi/40 bg-swarm-surface/95 backdrop-blur-2xl shadow-2xl p-2.5 flex flex-col gap-2 transition-all">
        {/* Top Control Bar: Mode Toggle + Target Chips + Collapse */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-swarm-border/40 pb-2 text-mini">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 font-semibold text-swarm-text px-2 py-0.5 rounded-md bg-swarm-surfaceHi/60 border border-swarm-borderHi/30">
              <Zap size={13} className="text-swarm-gold animate-pulse" />
              <span>Swarm Flow Hub</span>
            </span>

            {/* Mode Switcher */}
            <div className="flex items-center rounded-lg bg-swarm-canvas/60 p-0.5 border border-swarm-border/80">
              <button
                onClick={() => setMode("broadcast")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mode === "broadcast"
                    ? "bg-swarm-gold text-swarm-canvas shadow-xs font-bold"
                    : "text-swarm-textDim hover:text-swarm-text"
                }`}
                title="Send same prompt simultaneously to all active CLIs"
              >
                <Radio size={11} />
                <span>Broadcast All</span>
              </button>

              <button
                onClick={() => setMode("pipeline")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  mode === "pipeline"
                    ? "bg-swarm-gold text-swarm-canvas shadow-xs font-bold"
                    : "text-swarm-textDim hover:text-swarm-text"
                }`}
                title={`Follow ${edges.length} active wire pipeline connections`}
              >
                <GitFork size={11} />
                <span>Wire Pipeline ({edges.length})</span>
              </button>
            </div>
          </div>

          {/* Right Action Cluster: Presets + Collapse button */}
          <div className="flex items-center gap-1.5">
            {/* Preset dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 text-xs text-swarm-textDim hover:text-swarm-text hover:bg-swarm-surfaceHi transition-colors cursor-pointer"
              >
                <Sparkles size={12} className="text-swarm-gold" />
                <span>Presets</span>
                <ChevronDown size={11} className="text-swarm-textMuted" />
              </button>

              {showPresets && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-swarm-borderHi/40 bg-swarm-surfaceHi p-1.5 shadow-2xl z-50 animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted tracking-wider uppercase">
                    Flow Orchestration Presets
                  </div>
                  {PRESETS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.title}
                        onClick={() => {
                          setPrompt(p.prompt);
                          setMode(p.mode);
                          setShowPresets(false);
                        }}
                        className="flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.08] text-xs transition-colors group cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-swarm-text group-hover:text-swarm-gold">
                          <Icon size={12} className="text-swarm-gold shrink-0" />
                          <span>{p.title}</span>
                        </span>
                        <span className="text-[10px] text-swarm-textDim line-clamp-1 pl-4.5">
                          {p.prompt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="size-7 flex items-center justify-center rounded-lg bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 text-swarm-textDim hover:text-swarm-text hover:bg-swarm-surfaceHi transition-colors cursor-pointer"
              title="Collapse Swarm Flow Hub"
              aria-label="Collapse Swarm Flow Hub"
            >
              <ChevronUp size={14} />
            </button>
          </div>
        </div>

        {/* Target Agent Selector Chips */}
        {agents.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-swarm-textMuted font-mono">Targets:</span>
            {agents.map((a) => {
              const isSelected = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleTarget(a.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? "bg-swarm-surfaceHi text-swarm-text border border-swarm-borderHi/60 font-semibold"
                      : "bg-swarm-canvas/40 text-swarm-textMuted border border-swarm-border/40 hover:text-swarm-text"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${isSelected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
                  <span>{a.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Prompt Input + Dispatch Button */}
        <div className="flex items-center gap-2 bg-swarm-canvas/60 rounded-xl border border-swarm-border/80 p-1.5 focus-within:border-swarm-gold transition-colors">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              mode === "broadcast"
                ? `Broadcast prompt to ${selectedIds.length} connected CLIs in parallel...`
                : `Dispatch pipeline prompt down active wire chain...`
            }
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-swarm-text placeholder-swarm-textMuted focus:outline-hidden"
          />

          <button
            onClick={handleSend}
            disabled={!prompt.trim() || isDispatching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              prompt.trim() && !isDispatching
                ? "bg-swarm-gold text-swarm-canvas hover:brightness-110 active:scale-95 cursor-pointer"
                : "bg-swarm-surfaceHi text-swarm-textMuted cursor-not-allowed opacity-60"
            }`}
          >
            {isDispatching ? (
              <>
                <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send size={12} />
                <span>{mode === "broadcast" ? "Broadcast All" : "Execute Pipeline"}</span>
              </>
            )}
          </button>
        </div>

        {/* Live Active Pipeline Wire Trail */}
        {mode === "pipeline" && edges.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 border border-white/[0.06] text-[11px] overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-zinc-500 font-mono shrink-0">Pipeline:</span>
            {edges.map((e, idx) => {
              const fromAgent = agents.find((a) => a.id === e.from);
              const toAgent = agents.find((a) => a.id === e.to);
              return (
                <div key={e.id} className="flex items-center gap-1 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.10] border border-white/[0.20] text-slate-200 font-mono text-[10px]">
                    {fromAgent?.name || e.from}
                  </span>
                  <div className="flex items-center text-slate-300">
                    <span className="w-2.5 h-px bg-slate-300/80 animate-pulse" />
                    <span className="text-[9px] font-bold">➔</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-[10px]">
                    {toAgent?.name || e.to}
                  </span>
                  {idx < edges.length - 1 && <span className="text-zinc-600 px-0.5">·</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
