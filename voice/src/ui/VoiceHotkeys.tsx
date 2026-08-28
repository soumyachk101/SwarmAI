"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, Check, X, Sparkles, Terminal, Crown, AlertCircle } from "lucide-react";
import { Voice } from "../core.js";
import {
  TauriWhisperEngine, BrowserAudioRecorder,
  whisperStatus, whisperInstall, isVoiceReady, cleanTranscript,
} from "./voiceAdapters.js";
import { swarmVoiceHost } from "./host.js";

const MODEL = "base.en" as const;
export type Mode = "anywhere" | "lead";

interface VoicePhase {
  mode: Mode;
  busy: boolean;
  isInstalling?: boolean;
  error?: string | null;
  isToggle?: boolean;
}

/**
 * Top Floating Voice Island (Dynamic Island style).
 * Supports all terminals, agents, and inputs.
 *
 *   Ctrl+Win / Cmd+Shift+V → dictate into the focused text field or active terminal.
 *   Win+Alt / Ctrl+Alt     → dictate into the Lead chat box.
 *   Or click the Mic button in window header to toggle.
 */
export default function VoiceHotkeys() {
  const [phase, setPhase] = useState<VoicePhase | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  
  const recRef = useRef<BrowserAudioRecorder | null>(null);
  const voiceRef = useRef<Voice | null>(null);
  const recording = useRef(false);
  const activeMode = useRef<Mode | null>(null);
  const pressed = useRef<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  const voice = () => {
    if (!voiceRef.current) {
      recRef.current = new BrowserAudioRecorder();
      voiceRef.current = new Voice({
        engine: new TauriWhisperEngine(),
        recorder: recRef.current,
        modelSize: MODEL,
      });
    }
    return voiceRef.current;
  };

  // Timer while recording
  useEffect(() => {
    if (phase && !phase.busy && !phase.isInstalling && !phase.error) {
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase?.busy, phase?.isInstalling, phase?.error, !!phase]);

  const startVoice = async (mode: Mode, isToggle = false) => {
    if (recording.current) return;
    
    // Check if whisper engine & model are ready
    let s = await whisperStatus().catch(() => null);
    if (!s || !isVoiceReady(s)) {
      setPhase({ mode, busy: true, isInstalling: true, isToggle });
      try {
        s = await whisperInstall(MODEL);
      } catch (err: unknown) {
        setPhase({ mode, busy: false, error: "Voice install error. Check logs.", isToggle });
        setTimeout(() => setPhase(null), 3000);
        return;
      }
      if (!s || !isVoiceReady(s)) {
        setPhase({ mode, busy: false, error: "Whisper engine not ready.", isToggle });
        setTimeout(() => setPhase(null), 3000);
        return;
      }
    }

    try {
      voice();
      await recRef.current!.startRecording();
      recording.current = true;
      activeMode.current = mode;
      setTranscriptPreview(null);
      setPhase({ mode, busy: false, isToggle });
    } catch (err: unknown) {
      const msg = String(err instanceof Error ? err.message : String(err));
      const userMsg = msg.includes("Permission") || msg.includes("permission")
        ? "Microphone access denied"
        : "Failed to open microphone";
      setPhase({ mode, busy: false, error: userMsg, isToggle });
      setTimeout(() => setPhase(null), 3500);
    }
  };

  const finishVoice = async (deliverResult = true) => {
    if (!recording.current) return;
    const mode = activeMode.current!;
    recording.current = false;
    activeMode.current = null;
    
    if (!deliverResult) {
      try {
        await recRef.current!.stopRecording();
 } catch (err) { console.warn("[VoiceHotkeys] stopRecording failed:", err); }
      setPhase(null);
      return;
    }

    setPhase({ mode, busy: true });
    try {
      const path = await recRef.current!.stopRecording();
      const text = cleanTranscript(await voice().voiceCommandTranscribe(path));
      if (text) {
        setTranscriptPreview(text);
        deliver(mode, text);
      } else {
        setTranscriptPreview("No speech detected");
      }
    } catch (err) {
      setTranscriptPreview("Transcription error");
    } finally {
      setTimeout(() => {
        setPhase(null);
        setTranscriptPreview(null);
      }, 1500);
    }
  };

  const cancelVoice = () => {
    finishVoice(false);
  };

  useEffect(() => {
    const modeFor = (): Mode | null => {
      const p = pressed.current;
      const ctrl = p.has("ControlLeft") || p.has("ControlRight");
      const meta = p.has("MetaLeft") || p.has("MetaRight");
      const alt = p.has("AltLeft") || p.has("AltRight");
      const shift = p.has("ShiftLeft") || p.has("ShiftRight");
      const keyV = p.has("KeyV");

      // Cmd+Shift+V or Ctrl+Win
      if ((meta && shift && keyV) || (ctrl && meta && !alt)) return "anywhere";
      // Win+Alt or Ctrl+Alt
      if ((meta && alt && !ctrl) || (ctrl && alt && !meta)) return "lead";
      return null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (recording.current && e.key === "Enter") {
        e.preventDefault();
        finishVoice(true);
        return;
      }
      if (recording.current && e.key === "Escape") {
        e.preventDefault();
        cancelVoice();
        return;
      }

      pressed.current.add(e.code);
      const mode = modeFor();
      if (mode && !recording.current) {
        e.preventDefault();
        startVoice(mode, false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressed.current.delete(e.code);
      if (recording.current && !phase?.isToggle && modeFor() === null) {
        finishVoice(true);
      }
    };

    const onBlur = () => {
      pressed.current.clear();
      if (recording.current && !phase?.isToggle) finishVoice(true);
    };

    const onStartEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: Mode }>;
      const mode = customEvent.detail?.mode || "lead";
      if (recording.current) {
        finishVoice(true);
      } else {
        startVoice(mode, true);
      }
    };

    const onStopEvent = () => {
      if (recording.current) finishVoice(true);
    };

    const onCancelEvent = () => {
      if (recording.current) cancelVoice();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("swarm:voice:toggle", onStartEvent);
    window.addEventListener("swarm:voice:stop", onStopEvent);
    window.addEventListener("swarm:voice:cancel", onCancelEvent);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("swarm:voice:toggle", onStartEvent);
      window.removeEventListener("swarm:voice:stop", onStopEvent);
      window.removeEventListener("swarm:voice:cancel", onCancelEvent);
    };
  }, [phase?.isToggle]);

  if (!phase) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleMode = () => {
    if (phase.busy) return;
    const nextMode: Mode = phase.mode === "lead" ? "anywhere" : "lead";
    activeMode.current = nextMode;
    setPhase({ ...phase, mode: nextMode });
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-2 rounded-full border border-amber-500/40 bg-zinc-950/90 text-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(245,158,11,0.25)] backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-3">
      
      {/* Status Mic or Loader */}
      <div className="flex items-center gap-2">
        <div className={`flex size-6 items-center justify-center rounded-full ${
          phase.error
            ? "bg-red-500/20 text-red-400"
            : phase.busy || phase.isInstalling
            ? "bg-amber-500/20 text-amber-400"
            : "bg-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
        }`}>
          {phase.error ? (
            <AlertCircle className="size-3.5" />
          ) : phase.busy || phase.isInstalling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Mic className="size-3.5 animate-pulse" />
          )}
        </div>

        {/* Live Audio Visualizer Bars */}
        {!phase.busy && !phase.isInstalling && !phase.error && (
          <div className="flex items-center gap-[3px] h-4 px-1">
            <span className="w-[3px] bg-amber-400 rounded-full animate-[voice-bar_0.8s_ease-in-out_infinite_alternate]" style={{ height: '8px', animationDelay: '0ms' }} />
            <span className="w-[3px] bg-amber-400 rounded-full animate-[voice-bar_0.6s_ease-in-out_infinite_alternate]" style={{ height: '14px', animationDelay: '150ms' }} />
            <span className="w-[3px] bg-amber-300 rounded-full animate-[voice-bar_0.9s_ease-in-out_infinite_alternate]" style={{ height: '10px', animationDelay: '300ms' }} />
            <span className="w-[3px] bg-amber-400 rounded-full animate-[voice-bar_0.7s_ease-in-out_infinite_alternate]" style={{ height: '16px', animationDelay: '75ms' }} />
            <span className="w-[3px] bg-amber-400 rounded-full animate-[voice-bar_0.5s_ease-in-out_infinite_alternate]" style={{ height: '6px', animationDelay: '220ms' }} />
          </div>
        )}
      </div>

      {/* Center Label & Transcript Status */}
      <div className="flex items-center gap-2 text-xs font-medium tracking-tight">
        {phase.error ? (
          <span className="text-red-400 font-medium">{phase.error}</span>
        ) : phase.isInstalling ? (
          <span className="text-amber-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-400 animate-pulse" />
            Initializing Voice Model…
          </span>
        ) : phase.busy ? (
          <span className="text-amber-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-400" />
            Transcribing with Whisper.cpp…
          </span>
        ) : transcriptPreview ? (
          <span className="text-emerald-400 font-medium truncate max-w-[280px]">
            &ldquo;{transcriptPreview}&rdquo;
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-zinc-200">Listening…</span>
            <span className="font-mono text-[11px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
              {formatTime(seconds)}
            </span>
          </div>
        )}
      </div>

      {/* Target Selector Pill */}
      <button
        onClick={toggleMode}
        disabled={phase.busy || phase.isInstalling}
        title="Click to switch target destination"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
          phase.mode === "lead"
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
        }`}
      >
        {phase.mode === "lead" ? (
          <>
            <Crown className="size-3 text-amber-400" />
            <span>Target: Lead</span>
          </>
        ) : (
          <>
            <Terminal className="size-3 text-cyan-400" />
            <span>Target: {swarmVoiceHost().getActiveTargetInfo?.().name || "Active Pane"}</span>
          </>
        )}
      </button>

      {/* Action Controls: Send & Cancel */}
      {!phase.busy && !phase.isInstalling && !phase.error && (
        <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
          <button
            onClick={() => finishVoice(true)}
            title="Finish & Transcribe (Enter)"
            className="p-1 rounded-full text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Check className="size-3.5" />
          </button>
          <button
            onClick={cancelVoice}
            title="Cancel (Esc)"
            className="p-1 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}

/** Route text to the focused field (anywhere), active terminal/agent, or the Lead box. */
function deliver(mode: Mode, text: string) {
  if (mode === "lead") {
    typeIntoLead(text);
    return;
  }
  const el = document.activeElement as HTMLElement | null;
  if (insertIntoElement(el, text)) return;

  swarmVoiceHost().deliverToActive(text);
}

/** Type into the Lead's CLI, revealing it first so the user sees it land. */
function typeIntoLead(text: string) {
  swarmVoiceHost().revealLead();
  swarmVoiceHost().deliverToLead(text);
}

/** Insert text at the caret of an input/textarea (React-safe). */
function insertIntoElement(el: HTMLElement | null, text: string): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + text + el.value.slice(end);
    setter?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const pos = start + text.length;
    el.setSelectionRange(pos, pos);
    return true;
  }
  if (el?.isContentEditable) {
    document.execCommand("insertText", false, text);
    return true;
  }
  return false;
}
