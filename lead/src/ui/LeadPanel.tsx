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
        className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-micro font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
        title={`${lead.customName || lead.cliName} leads as ${mode} — switch role`}
      >
        <ModeIcon size={12} className="text-amber-400" />
        <span className="font-semibold">{mode}</span>
        <ChevronDown size={10} className="opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[130] mt-1 min-w-56 animate-fade-in rounded-lg glass-hi p-1.5 shadow-2xl border border-zinc-700/60 bg-zinc-950/95 backdrop-blur-xl">
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <button
                key={m}
                onClick={() => applyMode(m)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-all ${
                  mode === m
                    ? "bg-amber-500/15 text-amber-300 font-semibold"
                    : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                }`}
              >
                <Icon size={14} className="shrink-0 text-amber-400" />
                <span>{MODE_LABELS[m]}</span>
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSummon = (cli: string, name: string) => {
    host.summonLead(activeWsId, cli, name);
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

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center bg-zinc-950/40">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] mb-3">
          <LeadCrown size={28} className="text-amber-400 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-zinc-100 mb-1">Autonomous Lead Orchestrator</h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
          The Lead agent decomposes high-level missions, creates Kanban tasks, allocates git worktrees, and orchestrates worker CLIs without writing code itself.
        </p>

        <div className="w-full max-w-xs flex flex-col gap-2">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 text-left px-1">
            Summon a Lead Agent:
          </div>

          <button
            onClick={() => handleSummon("claude", "Claude Lead")}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:scale-[1.01] transition-all text-xs font-semibold shadow-md text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-amber-400" />
              <div>
                <div>Claude Code Lead</div>
                <div className="text-[10px] text-amber-400/70 font-normal">Opus 5 &middot; Strategic Planner</div>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
              <Sparkles size={10} /> Lead
            </span>
          </button>

          <button
            onClick={() => handleSummon("opencode", "OpenCode Lead")}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:scale-[1.01] transition-all text-xs font-semibold shadow-md text-left"
          >
            <div className="flex items-center gap-2.5">
              <Bot size={16} className="text-purple-400" />
              <div>
                <div>OpenCode Zen Lead</div>
                <div className="text-[10px] text-purple-400/70 font-normal">Nemotron Free &middot; Autonomous</div>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono">Free AI</span>
          </button>

          <button
            onClick={() => handleSummon("codex", "Codex Lead")}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:scale-[1.01] transition-all text-xs font-semibold shadow-md text-left"
          >
            <div className="flex items-center gap-2.5">
              <Zap size={16} className="text-cyan-400" />
              <div>
                <div>Codex CLI Lead</div>
                <div className="text-[10px] text-cyan-400/70 font-normal">OpenAI GPT-5 Core</div>
              </div>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md font-mono">Fast</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Lead Mission Control Header Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/70 px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
              <LeadCrown size={12} />
            </div>
            <span className="text-xs font-bold text-zinc-100">
              {lead.customName || lead.cliName}
            </span>
          </div>
          <LeadModeSelect />
        </div>

        {/* Quick Goal Dispatch Input */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={missionInput}
            onChange={(e) => setMissionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleDispatchToLead();
            }}
            placeholder="Type mission here (e.g. Build premium portfolio UI with animations)..."
            className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
          />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("swarm:voice:toggle", { detail: { mode: "lead" } }))}
            className="p-1 rounded-md text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors shrink-0"
            title="Dictate with voice"
          >
            <Mic size={14} />
          </button>
          <select
            value={workerCli}
            onChange={(e) => setWorkerCli(e.target.value)}
            className="bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-700/60 rounded-md px-2 py-1 focus:outline-none focus:border-amber-500/50 cursor-pointer shrink-0"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/35 hover:border-amber-500/60 hover:bg-amber-500/30 transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-amber-500/10 active:scale-95"
            title="Instant parallel dispatch: decompose & launch worker agents in worktrees immediately"
          >
            <Layers size={13} className="text-amber-400" />
            <span>Parallel Dispatch</span>
          </button>
          <button
            onClick={() => handleDispatchToLead()}
            disabled={isDispatching}
            className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-amber-500/20 hover:text-amber-300 border border-zinc-700/60 hover:border-amber-500/30 transition-colors shrink-0 cursor-pointer shadow-sm"
            title="Send mission directive to Lead Agent"
          >
            <Send size={13} />
          </button>
        </div>
      </div>

      {/* Main Lead CLI Pane */}
      <div className="flex-1 min-h-0">
        <host.LeadPane paneId={lead.id} workingDir={workingDir} />
      </div>
    </div>
  );
}
