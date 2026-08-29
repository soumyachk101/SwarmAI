"use client";

import { useState } from "react";
import {
  User,
  Users,
  Wrench,
  Network,
  Check,
  Sparkles,
  SquareTerminal,
  FolderOpen,
  Play,
  Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandGlyph, cliBrand, shellBrand } from "@swarm/board";
import { useWorkspaceStore } from "@swarm/workspace";
import { launchPresetSession, type PresetType } from "./presetLauncher";

interface SessionLauncherProps {
  onLaunched?: () => void;
  activeMode?: "agent" | "code" | "chat";
  onModeChange?: (mode: "agent" | "code" | "chat") => void;
}

interface PresetItem {
  id: PresetType;
  title: string;
  count: number;
  description: string;
  Icon: LucideIcon;
}

const PRESETS: PresetItem[] = [
  {
    id: "solo",
    title: "Solo",
    count: 1,
    description: "One agent in one terminal.",
    Icon: User,
  },
  {
    id: "pair",
    title: "Pair",
    count: 2,
    description: "One builds, one reviews the same tree.",
    Icon: Users,
  },
  {
    id: "workbench",
    title: "Workbench",
    count: 2,
    description: "An agent plus a shell for git and tests.",
    Icon: Wrench,
  },
  {
    id: "swarm",
    title: "Swarm",
    count: 4,
    description: "Four agents fan out on parallel work.",
    Icon: Network,
  },
];

interface AgentOption {
  id: string;
  name: string;
  cliId?: string;
  isTerminal?: boolean;
}

const AGENT_OPTIONS: AgentOption[] = [
  { id: "claude-code", name: "Claude Code", cliId: "claude-code" },
  { id: "codex-cli", name: "Codex", cliId: "codex-cli" },
  { id: "cursor", name: "Cursor Agent", cliId: "cursor" },
  { id: "gemini-cli", name: "Gemini CLI", cliId: "gemini-cli" },
  { id: "droid", name: "Droid", cliId: "droid" },
  { id: "opencode", name: "OpenCode", cliId: "opencode" },
  { id: "deepseek-harness", name: "DeepSeek Harness", cliId: "deepseek-harness" },
  { id: "grok-build", name: "Grok Build", cliId: "grok-build" },
  { id: "antigravity-cli", name: "Antigravity", cliId: "antigravity-cli" },
  { id: "terminal", name: "Terminal", isTerminal: true },
];

export default function SessionLauncher({
  onLaunched,
  activeMode = "agent",
  onModeChange,
}: SessionLauncherProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("solo");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("claude-code");
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [taskPrompt, setTaskPrompt] = useState<string>("");
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const workspaces = useWorkspaceStore((s) => s.workspaces) ?? [];
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const activeWorkspace = Array.isArray(workspaces) ? workspaces.find((w) => w.id === activeWorkspaceId) : undefined;
  const rawProjectPath = activeWorkspace?.boundProjectPath || "~/Desktop/SwarmAI";
  const displayPath = rawProjectPath.replace(/^\/(Users|home)\/[^/]+/, "~");

  const handleLaunch = () => {
    setIsLaunching(true);
    try {
      launchPresetSession({
        preset: selectedPreset,
        selectedCliId: selectedAgentId,
        sessionCount,
        taskPrompt,
        workingDir: activeWorkspace?.boundProjectPath || null,
      });
      if (onLaunched) {
        onLaunched();
      }
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="@container flex h-full w-full flex-col overflow-y-auto bg-[#0b0d14] text-[#e2e8f0] scrollbar-sleek select-none">
      {/* Top Segmented Mode Selector Bar */}
      <div className="flex items-center justify-center pt-3 pb-2 sm:pt-5 sm:pb-3 shrink-0">
        <div className="flex items-center rounded-xl bg-[#141824] p-1 border border-white/[0.08] shadow-lg shadow-black/20">
          <button
            onClick={() => onModeChange?.("agent")}
            className={`px-4 sm:px-5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeMode === "agent"
                ? "bg-[#252c42] text-white shadow-md border border-white/[0.12]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Agent
          </button>
          <button
            onClick={() => onModeChange?.("code")}
            className={`px-4 sm:px-5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeMode === "code"
                ? "bg-[#252c42] text-white shadow-md border border-white/[0.12]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Code
          </button>
          <button
            onClick={() => onModeChange?.("chat")}
            className={`px-4 sm:px-5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeMode === "chat"
                ? "bg-[#252c42] text-white shadow-md border border-white/[0.12]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-8 pb-4 flex flex-col gap-4 sm:gap-5 flex-1">
        {/* Title Header */}
        <div className="flex items-center gap-2 text-xs sm:text-sm shrink-0">
          <span className="font-semibold text-slate-200 tracking-normal font-sans">New session</span>
          <span className="truncate text-slate-500 font-mono text-[11px] sm:text-xs">{displayPath}</span>
        </div>

        {/* ── PRESET Section ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase font-sans">
            PRESET
          </label>
          <div className="grid grid-cols-2 @[560px]:grid-cols-4 gap-2.5 sm:gap-3">
            {PRESETS.map((p) => {
              const active = selectedPreset === p.id;
              const Icon = p.Icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 min-h-[85px] sm:min-h-[105px] ${
                    active
                      ? "bg-[#161e36] border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50"
                      : "bg-[#111420]/90 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#151928]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon
                        className={`size-3.5 sm:size-4 shrink-0 ${
                          active ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span className={`text-xs sm:text-sm font-semibold truncate ${active ? "text-white" : "text-slate-200"}`}>
                        {p.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                        active
                          ? "bg-blue-500/20 text-blue-300 font-bold"
                          : "bg-white/[0.06] text-slate-400"
                      }`}
                    >
                      {p.count}
                    </span>
                  </div>
                  <p className="text-[10.5px] sm:text-[11.5px] text-slate-400 leading-snug line-clamp-2">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── AGENT Section ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
            AGENT
          </label>
          <div className="grid grid-cols-2 @[520px]:grid-cols-3 @[720px]:grid-cols-4 gap-2">
            {AGENT_OPTIONS.map((opt) => {
              const active = selectedAgentId === opt.id;
              const brand = opt.cliId ? cliBrand(opt.cliId) : undefined;

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedAgentId(opt.id)}
                  className={`flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-left transition-all duration-150 ${
                    active
                      ? "bg-[#192038]/90 border-blue-500/80 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50"
                      : "bg-[#131622]/80 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#161a2b]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                      {opt.isTerminal ? (
                        <SquareTerminal className="size-3.5 sm:size-4 text-emerald-400" />
                      ) : brand ? (
                        <BrandGlyph brand={brand} size={14} />
                      ) : (
                        <Bot className="size-3.5 sm:size-4 text-slate-300" />
                      )}
                    </div>
                    <span
                      className={`truncate text-[11px] sm:text-xs font-semibold ${
                        active ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {opt.name}
                    </span>
                  </div>

                  {active && (
                    <div className="flex size-3.5 sm:size-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ml-1">
                      <Check className="size-2 sm:size-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── HOW MANY Section ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
            HOW MANY
          </label>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const active = sessionCount === num;
              return (
                <button
                  key={num}
                  onClick={() => setSessionCount(num)}
                  className={`flex size-7 sm:size-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-[#192038] border border-blue-500/80 text-blue-400 ring-1 ring-blue-500/40 shadow-sm"
                      : "bg-[#131622] border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-[#181d2e]"
                  }`}
                >
                  {num}
                </button>
              );
            })}
            <span className="text-xs text-slate-400 font-medium ml-1">
              {sessionCount === 1 ? "session" : "sessions"}
            </span>
          </div>
        </div>

        {/* ── TASK - OPTIONAL Section ─────────────────────────────────── */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
            TASK — OPTIONAL
          </label>
          <textarea
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            placeholder="What should it work on?"
            rows={2}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#131622]/90 px-3.5 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 outline-none leading-relaxed transition-all shadow-inner"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleLaunch();
              }
            }}
          />
        </div>

        {/* ── Launch Action Footer (Sticky) ────────────────────────────── */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-[#0b0d14]/95 backdrop-blur-md border-t border-white/[0.08] mt-auto shadow-2xl z-20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400">
            <Sparkles className="size-3.5 text-blue-400 shrink-0" />
            <span>Press <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">⌘+Enter</kbd> to launch</span>
          </div>

          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:brightness-110 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Play className="size-3.5 fill-current" />
            <span>Start Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
