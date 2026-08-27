"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, FolderOpen, Terminal, Mic, Settings, Sparkles } from "lucide-react";

const STEPS = [
 {
 id: "welcome",
 title: "Welcome to Swarm AI",
 description: "Your AI-first terminal workspace. Multiple AI agents, infinite panes, and a Lead orchestrator that runs the fleet for you.",
 icon: <Sparkles size={28} className="text-amber-400" />,
 highlight: null,
 },
 {
 id: "folder",
 title: "Open a Project",
 description: "Click Open Project to load a codebase. Swarm creates a workspace that keeps its own agents, branches, board, and memory — and remembers them next time.",
 icon: <FolderOpen size={24} className="text-blue-400" />,
 highlight: '[data-onboarding="open-project"]',
 },
 {
 id: "agents",
 title: "Spawn AI Agents",
 description: "Use the command palette (Ctrl+K) to summon Claude Code, OpenCode, Codex CLI, or a plain shell. Each gets its own pane with a real PTY.",
 icon: <Terminal size={24} className="text-emerald-400" />,
 highlight: '[data-onboarding="agent-pane"]',
 },
 {
 id: "lead",
 title: "Let the Lead Orchestrate",
 description: "Crown a Lead Steward that plans, routes tasks, and delegates to specialist agents. Switch between Steward, Forager, and Stinger modes.",
 icon: <Sparkles size={24} className="text-purple-400" />,
 highlight: '[data-onboarding="lead-dock"]',
 },
 {
 id: "voice",
 title: "Voice Dictation",
 description: "Press Win+Alt or Ctrl+Win to start voice input. The Lead can speak its plans, and you can dictate tasks directly.",
 icon: <Mic size={24} className="text-rose-400" />,
 highlight: '[data-onboarding="voice"]',
 },
 {
 id: "settings",
 title: "Configure & Extend",
 description: "Set API keys, default models, and install extensions from Open-VSX. Everything lives locally — your data never leaves your machine.",
 icon: <Settings size={24} className="text-zinc-300" />,
 highlight: '[data-onboarding="settings"]',
 },
];

const SEEN_KEY = "swarm-onboarding-seen";
const STEPS_KEY = "swarm-onboarding-steps";

export function useOnboarding() {
 const [seen, setSeen] = useState<boolean>(() => {
 try { return localStorage.getItem(SEEN_KEY) === "true"; } catch { return true; }
 });
 const [step, setStep] = useState<number>(() => {
 try { return parseInt(localStorage.getItem(STEPS_KEY) || "0", 10); } catch { return 0; }
 });
 const show = seen ? false : step < STEPS.length;

 const complete = () => {
 localStorage.setItem(SEEN_KEY, "true");
 setSeen(true);
 };

 const next = () => setStep((s) => s + 1);
 const prev = () => setStep((s) => Math.max(0, s - 1));
 const reset = () => {
 localStorage.removeItem(SEEN_KEY);
 localStorage.removeItem(STEPS_KEY);
 setSeen(false);
 setStep(0);
 };

 return { show, step, next, prev, complete, reset, total: STEPS.length };
}

export default function OnboardingModal() {
 const { show, step, next, prev, complete } = useOnboarding();
 const s = STEPS[step];
 const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

 useEffect(() => {
 if (!show || !s.highlight) { setHighlightRect(null); return; }
 const el = document.querySelector(s.highlight) as HTMLElement | null;
 if (!el) { setHighlightRect(null); return; }
 const update = () => {
 const r = el.getBoundingClientRect();
 setHighlightRect(r);
 };
 update();
 const ro = new ResizeObserver(update);
 ro.observe(el);
 window.addEventListener("scroll", update, true);
 return () => { ro.disconnect(); window.removeEventListener("scroll", update, true); };
 }, [show, step, s.highlight]);

 if (!show) return null;

 return (
 <>
 {/* Backdrop */}
 <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" />

 {/* Spotlight cutout (CSS mask) */}
 {highlightRect && (
 <div
 className="fixed inset-0 z-[2001] pointer-events-none"
 style={{
 maskImage: `radial-gradient(circle 180px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 100%, black 100%)`,
 WebkitMaskImage: `radial-gradient(circle 180px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 100%, black 100%)`,
 }}
 />
 )}

 {/* Dialog */}
 <div className="fixed inset-0 z-[2002] flex items-center justify-center animate-in zoom-in-95 duration-300 pointer-events-none">
 <div className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl border border-zinc-700/60 bg-[#0d0f14]/98 shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden">
 {/* Progress dots */}
 <div className="flex items-center gap-1.5 px-5 pt-4">
 {STEPS.map((_, i) => (
 <div
 key={i}
 className={`h-1 rounded-full transition-all duration-300 ${i <= step ? "bg-amber-400 w-6" : "bg-zinc-700 w-3"}`}
 />
 ))}
 </div>

 <div className="p-6 pt-5">
 <div className="flex items-center justify-center mb-4">
 <div className="size-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center">
 {s.icon}
 </div>
 </div>
 <h2 className="text-base font-semibold text-zinc-100 text-center font-sans">{s.title}</h2>
 <p className="mt-2 text-xs text-zinc-400 text-center leading-relaxed max-w-[320px] mx-auto font-sans">{s.description}</p>
 </div>

 <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800/60">
 <span className="text-[11px] text-zinc-500 font-mono">
 {step + 1} / {STEPS.length}
 </span>
 <div className="flex items-center gap-2">
 {step > 0 && (
 <button
 onClick={prev}
 className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors font-mono"
 >
 Back
 </button>
 )}
 <button
 onClick={step === STEPS.length - 1 ? complete : next}
 className="flex items-center gap-1.5 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-4 py-1.5 rounded-lg transition-all font-mono"
 >
 {step === STEPS.length - 1 ? "Get Started" : <>Next <ChevronRight size={13} /></>}
 </button>
 </div>
 </div>

 {/* Skip */}
 <button
 onClick={complete}
 className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800/50"
 title="Skip onboarding"
 >
 <X size={14} />
 </button>
 </div>
 </div>
 </>
 );
}
