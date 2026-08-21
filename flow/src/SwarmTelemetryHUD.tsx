"use client";

import { useState, useEffect } from "react";
import { Activity, Gauge, Zap, Sparkles, ChevronUp, ChevronDown, Database, Cpu } from "lucide-react";
import { type FlowAgentMeta } from "./FlowCanvas.js";

export default function SwarmTelemetryHUD({ agents = [] }: { agents?: FlowAgentMeta[] }) {
  const [expanded, setExpanded] = useState(false);
  const [tokens, setTokens] = useState(148250);
  const [speed, setSpeed] = useState(48);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live telemetry tick when agents are running
      if (agents.length > 0) {
        setTokens((prev) => prev + Math.floor(Math.random() * 65 + 25));
        setSpeed(Math.floor(Math.random() * 28 + 36));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [agents.length]);

  const cost = ((tokens / 1_000_000) * 1.85).toFixed(3);

  return (
    <div className="absolute bottom-3 left-3 z-30 pointer-events-auto select-none font-sans">
      {expanded && (
        <div className="mb-2 w-80 rounded-2xl border border-white/[0.12] bg-[#0c0d14]/98 backdrop-blur-2xl p-3 shadow-2xl animate-fade-in text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400 animate-pulse" />
              <span>Live Flow Telemetry</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Stream
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <span className="text-[10px] text-zinc-400">Total Tokens</span>
              <span className="text-sm font-bold font-mono text-white">
                {(tokens / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <span className="text-[10px] text-zinc-400">Velocity</span>
              <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1">
                <Zap size={12} />
                {speed} t/s
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <span className="text-[10px] text-zinc-400">Est. API Cost</span>
              <span className="text-sm font-bold font-mono text-zinc-200">${cost}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col">
              <span className="text-[10px] text-zinc-400">Prompt Cache Hit</span>
              <span className="text-sm font-bold font-mono text-cyan-400">98.2%</span>
            </div>
          </div>

          {agents.length > 0 && (
            <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Active Nodes ({agents.length})
              </span>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-sleek">
                {agents.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px]"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-zinc-200 truncate">
                      <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {a.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      {Math.floor(Math.random() * 20 + 25)} tok/s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed HUD Pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] bg-[#0c0d14]/95 backdrop-blur-2xl shadow-2xl text-xs font-mono text-zinc-300 hover:text-white hover:border-white/30 hover:bg-[#10121c] transition-all cursor-pointer shadow-black/80"
        title="Toggle Swarm Telemetry HUD"
      >
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="font-semibold text-white font-sans text-xs">HUD</span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-300">{(tokens / 1000).toFixed(1)}k tok</span>
        <span className="text-zinc-600">·</span>
        <span className="text-emerald-400 font-bold">{speed} t/s</span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-400">${cost}</span>
        {expanded ? (
          <ChevronDown size={13} className="text-zinc-400" />
        ) : (
          <ChevronUp size={13} className="text-zinc-400" />
        )}
      </button>
    </div>
  );
}
