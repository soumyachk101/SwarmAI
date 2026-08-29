"use client";

import { useState, useRef } from "react";
import {
  ChevronDown,
  ClipboardList,
  Search,
  ShieldCheck,
  Send,
  Mic,
  Sparkles,
  Zap,
  Bot,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { LeadMode } from "../modes.js";
import { LeadCrown } from "@swarm/board";
import { leadHost } from "./host.js";

const MODE_ICONS: Record<LeadMode, LucideIcon> = {
  Steward: ClipboardList,
  Forager: Search,
  Stinger: ShieldCheck,
};

const MODE_LABELS: Record<LeadMode, string> = {
  Steward: "Steward (Architect & Dispatcher)",
  Forager: "Forager (Autonomous Bug Hunter)",
  Stinger: "Stinger (Deep Security Auditor)",
};

const MODES = ["Steward", "Forager", "Stinger"] as const;

/**
 * Role picker for the reigning Lead.
 */
export function LeadModeSelect() {
  const host = leadHost();
  const lead = host.useLead(host.useActiveWorkspaceId());
  const [open, setOpen] = useState(false);

  if (!lead) return null;

  const mode: LeadMode = lead.leadMode ?? "Steward";
  const ModeIcon = MODE_ICONS[mode];

  const applyMode = (next: LeadMode) => {
    setOpen(false);
    host.setLeadMode(lead.id, next);
    host.publishRole(next);
  };

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white transition-all hover:bg-white/[0.12] hover:border-white/30 cursor-pointer shadow-xs"
        title={`${lead.customName || lead.cliName} leads as ${mode} — switch role`}
      >
        <ModeIcon size={13} className="text-slate-300" />
        <span>{mode}</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[130] mt-1 min-w-56 animate-fade-in rounded-2xl p-1.5 shadow-2xl shadow-black/90 border border-white/[0.14] bg-[#0d0f17]/98 backdrop-blur-2xl">
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <button
                key={m}
                onClick={() => applyMode(m)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-all cursor-pointer ${
                  mode === m
                    ? "bg-white/[0.12] text-white font-semibold border border-white/[0.18]"
                    : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon size={14} className="shrink-0 text-slate-300" />
                <div className="flex-1">
                  <div className="font-semibold leading-tight">{m}</div>
                  <div className="text-[10px] text-zinc-400 font-normal leading-tight">{MODE_LABELS[m]}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * The Lead tab and Mission Dispatch Hub.
 */
export default function LeadPanel() {
  const host = leadHost();
  const activeWsId = host.useActiveWorkspaceId();
  const lead = host.useLead(activeWsId);
  const workingDir = host.useActiveFolder();
  const [missionInput, setMissionInput] = useState("");
  const [workerCli, setWorkerCli] = useState<string>("auto");
  const [isDispatching, setIsDispatching] = useState(false);
  const [summoningCli, setSummoningCli] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSummon = async (cli: string, name: string) => {
    setSummoningCli(cli);
    try {
      await host.summonLead(activeWsId, cli, name);
      if (missionInput.trim()) {
        setTimeout(() => {
          handleDispatchToLead();
        }, 1200);
      }
    } finally {
      setTimeout(() => setSummoningCli(null), 1000);
    }
  };

  /** Send strict orchestration directive to the Lead CLI */
  const handleDispatchToLead = async (customGoal?: string) => {
    const goal = (customGoal || missionInput).trim();
    if (!goal || !lead) {
      inputRef.current?.focus();
      return;
    }
    setMissionInput("");
    setIsDispatching(true);

    try {
      const command = `CRITICAL DIRECTIVE: You are the Lead Steward orchestrator. DO NOT WRITE CODE OR EDIT FILES DIRECTLY. You MUST call the "dispatch_goal" MCP tool to break this goal into parallel tasks, create git worktrees, and spawn worker CLI agents: "${goal}"\r`;
      await invoke("write_to_terminal", { paneId: lead.id, data: command });
    } catch (e) {
      console.error("[Lead] Failed to dispatch mission to Lead:", e);
    } finally {
      setIsDispatching(false);
    }
  };

  /** Instant parallel worker spawn via SwarmMind engine */
  const handleInstantParallelDispatch = async () => {
    const goal = missionInput.trim();
    if (!goal) {
      inputRef.current?.focus();
      return;
    }
    if (!workingDir) return;

    setMissionInput("");
    setIsDispatching(true);

    try {
      await host.dispatchGoal(goal, workingDir, activeWsId, workerCli);
    } catch (e) {
      console.error("[Lead] Failed instant parallel dispatch:", e);
    } finally {
      setIsDispatching(false);
    }
  };

  const applyPreset = (presetText: string) => {
    setMissionInput(presetText);
    inputRef.current?.focus();
  };

  if (!lead) {
    return (
      <div className="flex h-full flex-col overflow-y-auto scrollbar-sleek p-4 sm:p-5 bg-[#090a0f] text-zinc-200">
        {/* Dynamic Glowing Crown Hero */}
        <div className="flex flex-col items-center text-center mt-2 mb-5">
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400/20 to-amber-500/5 border border-amber-400/30 shadow-[0_0_30px_rgba(251,191,36,0.2)] mb-3">
            <LeadCrown size={28} className="text-amber-400 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-amber-500" />
            </span>
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Autonomous Lead Orchestrator</h3>
          <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
            Decomposes missions into subtasks, provisions git worktrees, and orchestrates parallel worker CLIs.
          </p>
        </div>

        {/* Quick Goal Input before summoning */}
        <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#11131a] p-2.5 shadow-md">
          <label className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider block mb-1">
            Initial Mission Directive:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={missionInput}
            onChange={(e) => setMissionInput(e.target.value)}
            placeholder="Type mission (e.g. Build multi-tenant auth)..."
            className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none font-sans"
          />
        </div>

        {/* Summon Lead Options Grid */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Select Lead Orchestrator Engine:
          </div>

          {/* Claude Code Lead */}
          <button
            onClick={() => handleSummon("claude", "Claude Lead")}
            disabled={summoningCli !== null}
            className="group flex items-center justify-between p-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] hover:bg-amber-500/[0.09] hover:border-amber-400/50 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                  Claude Code Lead
                </div>
                <div className="text-[11px] text-zinc-400 truncate">Claude 3.7 Sonnet / Opus 5 &middot; Strategic Architect</div>
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-mono">
              {summoningCli === "claude" ? "Summoning…" : "Summon"}
            </span>
          </button>

          {/* OpenCode Zen Lead */}
          <button
            onClick={() => handleSummon("opencode", "OpenCode Lead")}
            disabled={summoningCli !== null}
            className="group flex items-center justify-between p-3 rounded-xl border border-purple-500/25 bg-purple-500/[0.04] hover:bg-purple-500/[0.09] hover:border-purple-400/50 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Bot size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-purple-300 transition-colors">
                  OpenCode Zen Lead
                </div>
                <div className="text-[11px] text-zinc-400 truncate">Free Autonomous Swarm &middot; Nemotron Core</div>
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-purple-400/15 text-purple-300 border border-purple-400/30 px-2 py-0.5 text-[10px] font-mono">
              {summoningCli === "opencode" ? "Summoning…" : "Free AI"}
            </span>
          </button>

          {/* Codex CLI Lead */}
          <button
            onClick={() => handleSummon("codex", "Codex Lead")}
            disabled={summoningCli !== null}
            className="group flex items-center justify-between p-3 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.09] hover:border-cyan-400/50 transition-all cursor-pointer text-left shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Zap size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                  Codex CLI Lead
                </div>
                <div className="text-[11px] text-zinc-400 truncate">OpenAI GPT-5 Core &middot; High Velocity</div>
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-mono">
              {summoningCli === "codex" ? "Summoning…" : "Fast"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#090a0f]">
      {/* Lead Mission Control Header Bar with Obsidian Luxury Styling */}
      <div className="border-b border-white/[0.06] bg-[#0d0e15]/95 px-3 py-2.5 flex flex-col gap-2 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-amber-400/15 text-amber-400 border border-amber-400/30 shadow-xs">
              <LeadCrown size={13} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">
                  {lead.customName || lead.cliName}
                </span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Autonomous Orchestrator</span>
            </div>
          </div>
          <LeadModeSelect />
        </div>

        {/* Dynamic Mission Commander Dock */}
        <div className="flex flex-col gap-2 bg-[#12141d] border border-white/[0.08] rounded-xl p-2.5 focus-within:border-amber-400/40 focus-within:ring-1 focus-within:ring-amber-400/20 transition-all shadow-inner">
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={missionInput}
              onChange={(e) => setMissionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDispatchToLead();
              }}
              placeholder="Type mission directive (e.g. Build authentication flow)..."
              className="flex-1 min-w-0 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
            />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("swarm:voice:toggle", { detail: { mode: "lead" } }))}
              className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
              title="Dictate with voice"
            >
              <Mic size={13} />
            </button>
            <button
              onClick={() => handleDispatchToLead()}
              disabled={isDispatching}
              className="p-1.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-30 transition-colors shrink-0 cursor-pointer font-bold shadow-xs"
              title="Send mission directive to Lead Agent"
            >
              <Send size={12} className="fill-black" />
            </button>
          </div>

          {/* Quick Mission Preset Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              "Full-stack feature",
              "Fix bugs & tests",
              "Security audit",
              "Refactor code",
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.05] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Engine Selector & Instant Parallel Dispatch */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-white/[0.04]">
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono shrink-0">
              <span>Workers:</span>
            </div>
            <select
              value={workerCli}
              onChange={(e) => setWorkerCli(e.target.value)}
              className="flex-1 min-w-0 bg-black/50 text-[11px] font-mono text-zinc-300 border border-white/[0.08] rounded-md px-1.5 py-0.5 focus:outline-none focus:border-amber-400/40 cursor-pointer"
              title="Choose which CLI engine to dispatch worker tasks to"
            >
              <option value="auto">Auto (Board CLI)</option>
              <option value="claude">Claude Code</option>
              <option value="opencode">OpenCode Zen</option>
              <option value="codex">Codex CLI</option>
              <option value="agy">Antigravity</option>
              <option value="aider">Aider</option>
            </select>
            <button
              onClick={handleInstantParallelDispatch}
              disabled={isDispatching}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.16] text-white border border-white/[0.12] transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              title="Instant parallel dispatch: decompose & launch worker agents in worktrees immediately"
            >
              <Layers size={12} className="text-amber-400" />
              <span>Parallel Swarm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Lead CLI Pane */}
      <div className="flex-1 min-h-0">
        <host.LeadPane paneId={lead.id} workingDir={workingDir} />
      </div>
    </div>
  );
}
