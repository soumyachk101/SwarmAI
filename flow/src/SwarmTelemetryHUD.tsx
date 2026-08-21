"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Activity, Zap, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { type FlowAgentMeta } from "./FlowCanvas.js";

interface UsageWindow {
  tokens: number;
  input_tokens: number;
  output_tokens: number;
  cache_write_tokens: number;
  cache_read_tokens: number;
  messages: number;
  sessions: number;
}

interface CliUsage {
  cli: string;
  name: string;
  installed: boolean;
  has_token_data: boolean;
  five_hour: UsageWindow;
  weekly: UsageWindow;
  last_activity: number;
}

const TRACKED_CLIS = ["claude", "agy", "codex", "opencode"];

export default function SwarmTelemetryHUD({ agents = [] }: { agents?: FlowAgentMeta[] }) {
  const [expanded, setExpanded] = useState(false);
  const [sessionTokens, setSessionTokens] = useState<number>(0);
  const [liveVelocity, setLiveVelocity] = useState<number>(0);
  const [sessionCost, setSessionCost] = useState<number>(0);
  const [cacheHitPct, setCacheHitPct] = useState<string>("0.0");

  const baselineTokensRef = useRef<number | null>(null);
  const lastTokensRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());

  const isAnyRunning = agents.some((a) => a.status === "running" || a.status === "launching" || a.status === "busy");

  const fetchRealUsage = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        const tauri = (window as any).__TAURI_INTERNALS__;
        if (tauri && typeof tauri.invoke === "function") {
          const rows: CliUsage[] = await tauri.invoke("cli_usage", { clis: TRACKED_CLIS });
          if (Array.isArray(rows)) {
            const rawTotal = rows.reduce((acc: number, r: CliUsage) => acc + (r.five_hour?.tokens || r.weekly?.tokens || 0), 0);

            // Initialize baseline on first read
            if (baselineTokensRef.current === null) {
              baselineTokensRef.current = rawTotal;
              lastTokensRef.current = rawTotal;
              setSessionTokens(0);
              setSessionCost(0);
              setLiveVelocity(0);
              return;
            }

            // Calculate delta generated strictly in this active project session
            const currentSession = Math.max(0, rawTotal - baselineTokensRef.current);
            setSessionTokens(currentSession);

            // Compute session cost accurately ($3.00/M input, $15.00/M output avg ~ $4.50/M tokens)
            const cost = (currentSession / 1_000_000) * 4.5;
            setSessionCost(cost);

            // Compute strictly measured live stream velocity from elapsed delta
            const now = Date.now();
            const elapsedSec = Math.max(0.5, (now - (lastTimeRef.current || now)) / 1000);
            if (lastTokensRef.current > 0 && rawTotal > lastTokensRef.current) {
              const delta = rawTotal - lastTokensRef.current;
              setLiveVelocity(Math.round(delta / elapsedSec));
            } else {
              setLiveVelocity(0);
            }
            lastTimeRef.current = now;
            lastTokensRef.current = rawTotal;

            // Prompt cache read ratio
            const inTok = rows.reduce((acc: number, r: CliUsage) => acc + (r.five_hour?.input_tokens || 0), 0);
            const cacheTok = rows.reduce((acc: number, r: CliUsage) => acc + (r.five_hour?.cache_read_tokens || 0), 0);
            if (inTok + cacheTok > 0) {
              setCacheHitPct(((cacheTok / (inTok + cacheTok)) * 100).toFixed(1));
            } else {
              setCacheHitPct("0.0");
            }
          }
        }
      }
    } catch {
      // Fallback
    }
  }, [isAnyRunning]);

  useEffect(() => {
    fetchRealUsage();
    const interval = setInterval(fetchRealUsage, isAnyRunning ? 1500 : 3500);
    return () => clearInterval(interval);
  }, [fetchRealUsage, isAnyRunning]);

  const handleResetSession = () => {
    baselineTokensRef.current = lastTokensRef.current;
    setSessionTokens(0);
    setSessionCost(0);
    setLiveVelocity(0);
  };

  return (
    <div className="absolute bottom-3 left-3 z-30 pointer-events-auto select-none font-sans">
      {expanded && (
        <div className="mb-2 w-88 rounded-2xl border border-swarm-borderHi/40 bg-swarm-surface/98 backdrop-blur-2xl p-4 shadow-2xl shadow-black/90 animate-fade-in text-xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-swarm-border/40 pb-2.5">
            <span className="font-semibold text-swarm-text flex items-center gap-2">
              <Activity size={15} className={isAnyRunning ? "text-emerald-400 animate-pulse" : "text-swarm-gold"} />
              <span>Project Live Session Telemetry</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetSession}
                className="p-1 rounded-md text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-surfaceHi transition-colors"
                title="Reset active project session counter"
              >
                <RotateCcw size={12} />
              </button>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                  isAnyRunning
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold animate-pulse"
                    : "bg-swarm-surfaceHi text-swarm-textMuted border-swarm-border/40"
                }`}
              >
                {isAnyRunning ? "LIVE STREAMING" : "IDLE · READY"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col">
              <span className="text-[10px] text-swarm-textMuted font-mono uppercase">Project Session Tok</span>
              <span className="text-sm font-bold font-mono text-swarm-text mt-0.5">
                {sessionTokens >= 1_000_000
                  ? `${(sessionTokens / 1_000_000).toFixed(2)}M`
                  : sessionTokens >= 1000
                  ? `${(sessionTokens / 1000).toFixed(1)}k`
                  : `${sessionTokens}`}{" "}
                <span className="text-[10px] font-normal text-swarm-textMuted">tok</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col">
              <span className="text-[10px] text-swarm-textMuted font-mono uppercase">Live Velocity</span>
              <span className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                <Zap size={12} className={isAnyRunning ? "animate-bounce" : ""} />
                {liveVelocity} tok/s
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col">
              <span className="text-[10px] text-swarm-textMuted font-mono uppercase">Session Cost</span>
              <span className="text-sm font-bold font-mono text-swarm-goldHi mt-0.5">
                ${sessionCost.toFixed(3)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col">
              <span className="text-[10px] text-swarm-textMuted font-mono uppercase">Prompt Cache Hit</span>
              <span className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                {cacheHitPct}%
              </span>
            </div>
          </div>

          {/* Active Canvas Nodes */}
          {agents.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-swarm-border/40">
              <div className="flex items-center justify-between text-[10px] font-mono text-swarm-textMuted uppercase tracking-wider">
                <span>Active Project Nodes ({agents.length})</span>
                <span>{isAnyRunning ? "Streaming" : "Idle"}</span>
              </div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-sleek">
                {agents.map((a) => {
                  const isRunning = a.status === "running" || a.status === "launching" || a.status === "busy";
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-swarm-surfaceHi/40 border border-swarm-border/30 text-[11px]"
                    >
                      <span className="flex items-center gap-1.5 font-medium text-swarm-text truncate">
                        <span
                          className={`size-2 rounded-full shrink-0 ${
                            isRunning
                              ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                              : "bg-swarm-gold"
                          }`}
                        />
                        <span className="truncate">{a.name}</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md ${
                          isRunning
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                            : "text-swarm-textMuted bg-swarm-surface"
                        }`}
                      >
                        {isRunning ? `${liveVelocity} tok/s` : "Idle"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed HUD Pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-swarm-borderHi/40 bg-swarm-surface/95 backdrop-blur-2xl shadow-2xl text-xs font-mono text-swarm-text hover:text-white hover:border-swarm-borderHi hover:bg-swarm-surfaceHi transition-all cursor-pointer shadow-black/80"
        title="Toggle Project Live Session Telemetry"
      >
        <span
          className={`size-2 rounded-full ${
            isAnyRunning
              ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              : "bg-swarm-gold"
          }`}
        />
        <span className="font-semibold text-swarm-text font-sans text-xs">HUD</span>
        <span className="text-swarm-borderHi">·</span>
        <span className="text-swarm-textDim">
          {sessionTokens >= 1_000_000
            ? `${(sessionTokens / 1_000_000).toFixed(1)}M`
            : sessionTokens >= 1000
            ? `${(sessionTokens / 1000).toFixed(1)}k`
            : `${sessionTokens}`}{" "}
          tok
        </span>
        <span className="text-swarm-borderHi">·</span>
        <span className={isAnyRunning ? "text-emerald-400 font-bold animate-pulse" : "text-swarm-textMuted font-bold"}>
          {liveVelocity} t/s
        </span>
        <span className="text-swarm-borderHi">·</span>
        <span className="text-swarm-gold">${sessionCost.toFixed(3)}</span>
        {expanded ? (
          <ChevronDown size={13} className="text-swarm-textMuted ml-0.5" />
        ) : (
          <ChevronUp size={13} className="text-swarm-textMuted ml-0.5" />
        )}
      </button>
    </div>
  );
}
