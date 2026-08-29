"use client";

import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { ArrowRight, RefreshCw, X } from "lucide-react";
import { BrandGlyph, cliBrand, AgentMark } from "@swarm/board";
import { CLI_BY_COMMAND } from "../index.js";
import { resetsIn } from "./usageWindows.js";

// What the agent CLIs actually record on disk. Claude Code writes per-message
// token counts; Codex writes sessions but no tokens; none of them writes its
// plan's quota anywhere local. So this shows measured usage, and turns it into
// a percentage only against a budget the user typed in — never an invented one.
export interface UsageWindow {
 /** Cost-equivalent tokens (cache reads weighted down) — see lib.rs. */
 tokens: number;
 input_tokens: number;
 output_tokens: number;
 cache_write_tokens: number;
 cache_read_tokens: number;
 messages: number;
 sessions: number;
 /** Unix millis of the first entry in the window — when the block opened. */
 started_at: number;
}

export interface CliUsage {
 cli: string;
 name: string;
 installed: boolean;
 has_token_data: boolean;
 five_hour: UsageWindow;
 weekly: UsageWindow;
 last_activity: number;
 plan?: string | null;
}

/** CLIs whose transcripts Swarm knows how to read. */
const TRACKED = ["claude", "agy", "codex", "opencode"];

const BUDGET_KEY = "swarm_cli_budgets";

/** Where each CLI shows the authoritative numbers behind these meters. */
const USAGE_PAGE: Record<string, string> = {
 claude: "https://claude.ai/settings/usage",
 codex: "https://platform.openai.com/usage",
 agy: "https://aistudio.google.com/",
};

// A tile per CLI, carrying that CLI's own logo. The tile *plate* stays in the
// swarm palette so the panel reads as one surface; the mark on it is the
// vendor's, so a row is identifiable before you read the name.
const TILE: Record<string, { bg: string }> = {
 claude: { bg: "bg-swarm-gold/10" },
 agy: { bg: "bg-blue-500/10" },
 codex: { bg: "bg-swarm-border/50" },
 opencode: { bg: "bg-swarm-amber/10" },
};

type Budgets = Record<string, { fiveHour?: number; weekly?: number }>;

function loadBudgets(): Budgets {
 try {
 return JSON.parse(localStorage.getItem(BUDGET_KEY) || "{}");
 } catch {
 return {};
 }
}

function compact(n: number): string {
 if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
 if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
 return String(n);
}

function Meter({
 label, used, budget, resets, tokens, window, note,
}: {
 label: string;
 used: number;
 budget?: number;
 resets: string | null;
 tokens: boolean;
 window?: UsageWindow;
 /** Shown instead of "resets in" when the window is rolling, not anchored. */
 note?: string;
}) {
 // A bar needs a denominator. Without a budget there isn't one, so the track
 // stays empty rather than implying a fraction of a limit nobody knows.
 const pct = budget ? Math.min(100, Math.round((used / budget) * 100)) : null;
 const left = pct === null ? null : 100 - pct;
 // Semantic steps come from the theme's own warm scale, not stock red/amber.
 const tone =
 left === null ? "text-swarm-text"
 : left < 15 ? "text-swarm-err"
 : left < 40 ? "text-swarm-warn"
 : left < 60 ? "text-swarm-gold"
 : "text-swarm-text";
 const fill =
 left === null ? "bg-swarm-border"
 : left < 15 ? "bg-swarm-err"
 : left < 40 ? "bg-swarm-warn"
 : left < 60 ? "bg-swarm-gold"
 : "bg-swarm-text";
 return (
 <div className="space-y-1.5">
 <div className="flex items-baseline gap-1.5">
 <span className="text-xs text-swarm-textDim">{label}</span>
 <span className={`ml-auto text-xs font-bold tabular-nums ${tone}`}>
 {left !== null ? `${left}% left` : `${compact(used)} ${tokens ? "tokens" : "msgs"}`}
 </span>
 {note ? (
 <span className="text-mini text-swarm-textMuted">· {note}</span>
 ) : resets ? (
 <span className="text-mini text-swarm-textMuted">· resets in {resets}</span>
 ) : null}
 </div>
 {/* A bar with no denominator is a decoration. Only draw the track once a
 budget exists, otherwise the numbers speak for themselves. */}
 {pct !== null && (
 <div className="h-2 overflow-hidden rounded-full bg-swarm-border/40">
 <div
 className={`h-full rounded-full transition-all duration-500 ${fill}`}
 style={{ width: `${pct}%` }}
 />
 </div>
 )}
 {window && tokens && (
 <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-micro tabular-nums text-swarm-textMuted">
 <span>{compact(window.input_tokens)} in</span>
 <span>{compact(window.output_tokens)} out</span>
 <span>{compact(window.cache_write_tokens)} cache write</span>
 <span>{compact(window.cache_read_tokens)} cache read</span>
 <span className="text-swarm-textMuted/70">
 · {window.messages} msg{window.messages === 1 ? "" : "s"} in {window.sessions} session
 {window.sessions === 1 ? "" : "s"}
 </span>
 </div>
 )}
 </div>
 );
}

function estimateCost(r: CliUsage): number {
 const w = r.weekly;
 if (!w || !r.has_token_data) return 0;
 if (r.cli === "claude") {
 return (
 (w.input_tokens / 1_000_000) * 3.0 +
 (w.output_tokens / 1_000_000) * 15.0 +
 (w.cache_write_tokens / 1_000_000) * 3.75 +
 (w.cache_read_tokens / 1_000_000) * 0.3
 );
 }
 if (r.cli === "agy") {
 return (w.input_tokens / 1_000_000) * 0.15 + (w.output_tokens / 1_000_000) * 0.6;
 }
 return (w.input_tokens / 1_000_000) * 2.5 + (w.output_tokens / 1_000_000) * 10.0;
}

/**
 * Plan limits for every agent CLI installed on this machine, read from the
 * transcripts they keep in the user's home directory.
 */
export default function CliUsagePanel({ onClose }: { onClose?: () => void }) {
 const [rows, setRows] = useState<CliUsage[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [checkedAt, setCheckedAt] = useState<Date | null>(null);
 const [budgets, setBudgets] = useState<Budgets>(loadBudgets);
 const [editing, setEditing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
  setRows(await invoke<CliUsage[]>("cli_usage", { clis: TRACKED }));
  setCheckedAt(new Date());
  } catch (e: unknown) {
  const msg = String(e instanceof Error ? e.message : String(e));
  setError(msg);
  } finally {
  setLoading(false);
  }
  }, []);

 useEffect(() => { refresh(); }, [refresh]);

 const setBudget = (cli: string, field: "fiveHour" | "weekly", value: number | undefined) => {
 const next = { ...budgets, [cli]: { ...budgets[cli], [field]: value } };
 setBudgets(next);
 localStorage.setItem(BUDGET_KEY, JSON.stringify(next));
 };

 const totalTokensWeekly = rows.reduce((acc, r) => acc + (r.weekly?.tokens || 0), 0);
 const totalCostWeekly = rows.reduce((acc, r) => acc + estimateCost(r), 0);
 const totalMessagesWeekly = rows.reduce((acc, r) => acc + (r.weekly?.messages || 0), 0);

 const detailsFor = rows.find((r) => r.installed && USAGE_PAGE[r.cli]);

 return (
 <div className="flex w-[380px] flex-col overflow-hidden rounded-2xl glass-hi glass-sheen shadow-2xl shadow-black/80 font-sans antialiased border border-white/[0.12]">
 <div className="flex items-center gap-2 px-4 pb-2 pt-3.5 border-b border-white/[0.06]">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold uppercase tracking-[0.12em] text-swarm-text">
 Swarm Token & Budget Mind
 </span>
 </div>
 <button
 onClick={refresh}
 className="ml-auto rounded-lg p-1.5 text-swarm-textMuted transition-colors hover:bg-swarm-border/40 hover:text-swarm-text"
 title="Rescan transcripts"
 aria-label="Rescan transcripts"
 >
 <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-swarm-gold" : ""}`} />
 </button>
 {onClose && (
 <button
 onClick={onClose}
 className="rounded-lg p-1.5 text-swarm-textMuted transition-colors hover:bg-swarm-border/40 hover:text-swarm-text"
 title="Close"
 aria-label="Close plan limits"
 >
 <X className="size-3.5" />
 </button>
 )}
 </div>

 {/* Aggregate Cost & Metric HUD */}
 <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-black/40 border-b border-white/[0.06]">
 <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 text-center">
 <div className="text-[10px] uppercase font-semibold text-swarm-textMuted tracking-wider">Est. Cost</div>
 <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
 ${totalCostWeekly.toFixed(2)}
 </div>
 </div>
 <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 text-center">
 <div className="text-[10px] uppercase font-semibold text-swarm-textMuted tracking-wider">Weekly Tokens</div>
 <div className="text-sm font-bold font-mono text-swarm-goldHi mt-0.5">
 {compact(totalTokensWeekly)}
 </div>
 </div>
 <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 text-center">
 <div className="text-[10px] uppercase font-semibold text-swarm-textMuted tracking-wider">Messages</div>
 <div className="text-sm font-bold font-mono text-swarm-text mt-0.5">
 {compact(totalMessagesWeekly)}
 </div>
 </div>
 </div>

 <div className="max-h-[60vh] divide-y divide-swarm-border/30 overflow-y-auto scrollbar-sleek">
 {error && <p className="px-4 py-3 text-mini text-swarm-err">{error}</p>}
 {/* The first scan walks every transcript on disk and can take a second.
 Without this the panel opened as an empty box under a header and
 read as broken rather than busy. */}
 {!error && rows.length === 0 && loading && (
 <p className="px-4 py-3 text-mini text-swarm-textMuted">Reading transcripts…</p>
 )}
 {!error && rows.length === 0 && !loading && (
 <p className="px-4 py-3 text-mini text-swarm-textMuted">
 No tracked CLI found on this machine.
 </p>
 )}

 {rows.map((r) => {
 const meta = CLI_BY_COMMAND[r.cli];
 const name = meta?.name ?? r.name;
 const tile = TILE[r.cli] ?? TILE.opencode;
 const brand = cliBrand(meta?.id);
 const b = budgets[r.cli] ?? {};
 const idle = r.weekly.messages === 0;
 return (
 <div key={r.cli} className="space-y-3 px-4 py-3.5">
 <div className="flex items-center gap-2.5">
 <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-swarm-textDim ${tile.bg}`}>
 {brand ? <BrandGlyph brand={brand} size={17} /> : <AgentMark size={17} />}
 </div>
 {/* The name comes from the CLI's own metadata, so it is not
 length-bounded. Unclamped it pushed the plan chip and the
 budget button off the 360px panel. */}
 <span className="min-w-0 truncate text-lg font-bold text-swarm-text" title={name}>{name}</span>
 {r.plan && (
 <span className="shrink-0 rounded-full border border-swarm-gold/25 bg-swarm-gold/10 px-1.5 py-px text-micro font-semibold uppercase tracking-wide text-swarm-goldHi">
 {r.plan}
 </span>
 )}
 <button
 onClick={() => setEditing(editing === r.cli ? null : r.cli)}
 aria-expanded={editing === r.cli}
 className="ml-auto shrink-0 text-micro text-swarm-textMuted transition-colors hover:text-swarm-gold"
 title="Set your plan's allowance to see % left"
 >
 budget
 </button>
 </div>

 {!r.installed ? (
 <p className="text-xs text-swarm-textMuted">Not installed.</p>
 ) : idle ? (
 <p className="text-xs text-swarm-textMuted">No recent {name} sessions</p>
 ) : (
 <div className="space-y-2.5">
 <Meter
 label="5-hour block"
 used={r.has_token_data ? r.five_hour.tokens : r.five_hour.messages}
 budget={b.fiveHour}
 resets={resetsIn(r.five_hour.started_at, 5 * 3_600_000)}
 tokens={r.has_token_data}
 window={r.five_hour}
 />
 <Meter
 label="Last 7 days"
 used={r.has_token_data ? r.weekly.tokens : r.weekly.messages}
 budget={b.weekly}
 resets={null}
 // Not a quota block: it is a window that slides with the
 // clock, so there is no reset moment to count down to.
 note="rolling window"
 tokens={r.has_token_data}
 window={r.weekly}
 />
 </div>
 )}

 {editing === r.cli && (
 <div className="space-y-1.5 rounded-lg border border-swarm-border/50 glass-inset p-2.5">
 <p className="text-micro leading-relaxed text-swarm-textMuted">
 Counts are cost-equivalent tokens: cache reads weigh a tenth
 and cache writes a quarter more, because a cached context is
 re-read every turn. No CLI publishes its quota locally, so
 "% left" needs your plan's allowance. Blank keeps raw counts.
 </p>
 {(["fiveHour", "weekly"] as const).map((field) => (
 <label key={field} className="flex items-center gap-2 text-micro text-swarm-textDim">
 <span className="w-12">{field === "fiveHour" ? "5-hour" : "Weekly"}</span>
 <input
 type="number"
 min={0}
 value={b[field] ?? ""}
 onChange={(e) =>
 setBudget(r.cli, field, e.target.value ? Number(e.target.value) : undefined)
 }
 placeholder={r.has_token_data ? "tokens" : "messages"}
 className="min-w-0 flex-1 rounded border border-swarm-border/60 glass-inset px-1.5 py-0.5 text-micro text-swarm-text outline-none focus:border-swarm-gold/50"
 />
 </label>
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>

 <div className="flex flex-col items-center gap-1 border-t border-swarm-border/30 px-4 py-3">
 {detailsFor && (
 <button
 onClick={() => shellOpen(USAGE_PAGE[detailsFor.cli]).catch(() => {})}
 className="flex items-center gap-1.5 text-xs font-medium text-swarm-textDim transition-colors hover:text-swarm-gold"
 >
 View usage details
 <ArrowRight className="size-3.5" />
 </button>
 )}
 <span className="text-micro text-swarm-textMuted/70">
 {checkedAt ? `updated ${checkedAt.toLocaleTimeString()}` : "reading transcripts…"}
 </span>
 </div>
 </div>
 );
}