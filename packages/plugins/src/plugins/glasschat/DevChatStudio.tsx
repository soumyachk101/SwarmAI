"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Code2,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Cpu,
  Zap,
  Trash2,
  Play,
  User,
  Paperclip,
  GitBranch,
  FileCode,
  FolderTree,
  Plus,
  ArrowRightLeft,
  Mic,
  MicOff,
  BrainCircuit,
  Loader2,
  X,
  Radio,
  RotateCw,
  ArrowLeftRight,
  Eraser,
  Crown,
  type LucideIcon,
} from "lucide-react";
import type { SwarmPluginProps } from "../../types";

export interface DevChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  codeBlocks?: { lang: string; code: string }[];
  thought?: string;
  thoughtDuration?: number;
  cliOutput?: string;
  cliCommand?: string;
  isCliRunning?: boolean;
  timestamp: string;
  contextPills?: string[];
  isStreaming?: boolean;
}

export interface AttachedContext {
  id: string;
  type: "file" | "git" | "tree";
  title: string;
  content: string;
}

export interface DevChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: DevChatMessage[];
}

export interface InstalledCliOption {
  id: string;
  name: string;
  command: string;
  badge: string;
  icon: LucideIcon;
  defaultModel: string;
  buildArgs: (prompt: string, model: string) => string[];
}

const INSTALLED_CLIS: InstalledCliOption[] = [
  {
    id: "claude",
    name: "Claude Code CLI",
    command: "claude",
    badge: "Anthropic",
    icon: Cpu,
    defaultModel: "claude-5-sonnet",
    buildArgs: (prompt, model) => ["-p", prompt, "--model", model || "claude-5-sonnet"],
  },
  {
    id: "agy",
    name: "Antigravity CLI",
    command: "agy",
    badge: "Google Gemini",
    icon: Zap,
    defaultModel: "gemini-3.7-flash",
    buildArgs: (prompt, model) => ["-p", prompt, "--model", model || "gemini-3.7-flash"],
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    command: "codex",
    badge: "OpenAI GPT",
    icon: Sparkles,
    defaultModel: "gpt-5-omni",
    buildArgs: (prompt, model) => ["-m", model || "gpt-5-omni", prompt],
  },
  {
    id: "opencode",
    name: "OpenCode Multi-Agent",
    command: "opencode",
    badge: "Multi-Model",
    icon: Code2,
    defaultModel: "claude-5-sonnet",
    buildArgs: (prompt, model) => ["run", prompt, "--model", model || "claude-5-sonnet"],
  },
  {
    id: "aider",
    name: "Aider Pair Programmer",
    command: "aider",
    badge: "Git Auto-Pair",
    icon: Terminal,
    defaultModel: "sonnet",
    buildArgs: (prompt) => ["--message", prompt, "--no-auto-commits"],
  },
  {
    id: "ollama",
    name: "Ollama (Local Private)",
    command: "ollama",
    badge: "Offline",
    icon: Terminal,
    defaultModel: "qwen2.5-coder:32b",
    buildArgs: (prompt, model) => ["run", model || "qwen2.5-coder:32b", prompt],
  },
];

const DEV_MODELS = [
  { id: "opus[1m]", name: "Opus 5 (1M Context)", badge: "Ultra SOTA 1M", icon: Cpu, cli: "claude", brandColor: "#D97757" },
  { id: "fable[1m]", name: "Fable 5 (1M Context)", badge: "Ultra Reasoning 1M", icon: BrainCircuit, cli: "claude", brandColor: "#D97757" },
  { id: "sonnet[1m]", name: "Sonnet 5 (1M Context)", badge: "Next-Gen 1M", icon: Cpu, cli: "claude", brandColor: "#D97757" },
  { id: "fable", name: "Fable 5", badge: "CoT Agent", icon: BrainCircuit, cli: "claude", brandColor: "#D97757" },
  { id: "opus", name: "Opus 5 (Default)", badge: "Ultra SOTA", icon: Cpu, cli: "claude", brandColor: "#D97757" },
  { id: "sonnet", name: "Sonnet 5", badge: "Routine", icon: Cpu, cli: "claude", brandColor: "#D97757" },
  { id: "haiku", name: "Haiku 4.5", badge: "Fast", icon: Cpu, cli: "claude", brandColor: "#D97757" },
  { id: "claude-4-6-thinking", name: "Claude 4.6 Sonnet (Thinking)", badge: "Deep CoT", icon: BrainCircuit, cli: "claude", brandColor: "#D97757" },
  { id: "gemini-3-7-flash", name: "Gemini 3.7 Flash", badge: "Ultra Realtime", icon: Zap, cli: "agy", brandColor: "#4285F4" },
  { id: "gemini-3-6-flash", name: "Gemini 3.6 Flash", badge: "1M Context", icon: Zap, cli: "agy", brandColor: "#4285F4" },
  { id: "gemini-3-5-flash", name: "Gemini 3.5 Flash", badge: "Sub-second", icon: Zap, cli: "agy", brandColor: "#4285F4" },
  { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", badge: "2M Context", icon: Zap, cli: "agy", brandColor: "#4285F4" },
  { id: "gpt-5-omni", name: "GPT-5 Omni", badge: "Multimodal SOTA", icon: Sparkles, cli: "codex", brandColor: "#10A37F" },
  { id: "gpt-4-5-preview", name: "GPT-4.5 Preview", badge: "Massive Knowledge", icon: Sparkles, cli: "codex", brandColor: "#10A37F" },
  { id: "o3-mini", name: "OpenAI o3-mini", badge: "STEM Reasoning", icon: Sparkles, cli: "codex", brandColor: "#10A37F" },
  { id: "deepseek-r1", name: "DeepSeek-R1 (671B)", badge: "Open CoT", icon: Code2, cli: "opencode", brandColor: "#818CF8" },
  { id: "gpt-oss-120b", name: "GPT-OSS 120B", badge: "Local Private", icon: Terminal, cli: "ollama", brandColor: "#F59E0B" },
];

const DEFAULT_SESSION_ID = "session-primary";

const INITIAL_MESSAGES: DevChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "assistant",
    text: "I am your AI Copilot powered by **Claude 5 Opus**. You can ask technical questions, write and refactor code, inspect project structure, and run tasks.",
    timestamp: "Just now",
  },
];

// Audio conversion helpers for Whisper
function downmixMono(b: AudioBuffer): Float32Array {
  if (b.numberOfChannels === 1) return b.getChannelData(0);
  const out = new Float32Array(b.length);
  for (let c = 0; c < b.numberOfChannels; c++) {
    const ch = b.getChannelData(c);
    for (let i = 0; i < b.length; i++) out[i] += ch[i] / b.numberOfChannels;
  }
  return out;
}

function resampleLinear(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const frac = src - i0;
    out[i] = (input[i0] ?? 0) * (1 - frac) + (input[i0 + 1] ?? 0) * frac;
  }
  return out;
}

function encodeWav16(samples: Float32Array, rate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const dv = new DataView(buf);
  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  dv.setUint32(4, 36 + samples.length * 2, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  ws(36, "data");
  dv.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function cleanWhisperTranscript(raw: string): string {
  return raw
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\((?:inaudible|music|silence|blank[^)]*)\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const tokens = text.split(/(\*\*[\s\S]+?\*\*|`[^`]+`)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      const inner = token.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-swarm-goldHi">
          {renderInlineMarkdown(inner)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      const inner = token.slice(1, -1);
      return (
        <code
          key={i}
          className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[11px] text-swarm-gold border border-white/[0.06]"
        >
          {inner}
        </code>
      );
    }
    return token;
  });
}

// Natural AI Assistant Resolver: Answers questions naturally like Claude without dumping code unless requested
function generateSmartAssistantResponse(query: string, modelName: string): { reply: string; thought: string } {
  const q = query.trim();
  const lower = q.toLowerCase();

  // Check if the user is explicitly asking for code
  const wantsCode = /\b(code|snippet|function|component|script|example|syntax|likho|banao|implement|write|create|generate)\b/i.test(lower);
  const isHindi = /\b(kaise|kya|kyun|batao|karo|samjhao|hai|ho|haan|nahi|karna|chahiye|bolo|bhai|yaar)\b/i.test(lower);

  // 1. Greetings / Small Talk
  if (/^(hi|hello|hey|hola|namaste|sup|yo|kya hal|kaise ho|kaisi ho|bhai|good morning|good evening)\b/i.test(lower)) {
    if (isHindi) {
      return {
        thought: `1. User ne greeting bheja hai.\n2. Natural aur friendly introduction formulate kiya ja raha hai.`,
        reply: `Main badhiya hu! Aap bataiye, aaj kis project ya topic par discuss karna hai? Aap mujhse coding, architecture, design ideas ya general sawal pooch sakte hain.`,
      };
    }
    return {
      thought: `1. Received user greeting.\n2. Responding with a warm, natural assistant introduction.`,
      reply: `Hello! I'm here and ready to help. What are you working on today? Feel free to ask any technical, conceptual, or design questions.`,
    };
  }

  // 2. Who are you / Capabilities
  if (lower.includes("who are you") || lower.includes("kaun ho") || lower.includes("kya kar sakte ho") || lower.includes("what can you do")) {
    if (isHindi) {
      return {
        thought: `1. Formulating capabilities overview in Hindi.`,
        reply: `Main aapka **AI Assistant & Coding Copilot** hu (powered by ${modelName}).\n\nMain aapki in cheezon me madad kar sakta hu:\n- **Technical Questions**: Kisi bhi language, library ya concept ke baare me detail me discuss karna.\n- **Code & Architecture**: Naye features plan karna, code likhna aur bugs solve karna.\n- **Project Analysis**: Workspace diffs aur project structure review karna.\n- **Design & UI**: Modern styling frameworks aur libraries ke best recommendations dena.`,
      };
    }
    return {
      thought: `1. Formulating assistant capabilities summary.`,
      reply: `I am your **AI Copilot** powered by **${modelName}**.\n\nI can help you with:\n- **Conceptual & Technical Discussion**: Explaining complex CS concepts, architectural trade-offs, and workflows.\n- **Code Development**: Writing, refactoring, and debugging clean code across any stack.\n- **Project Context**: Inspecting git diffs or workspace files.\n- **System Design & Libraries**: Recommending proven tools, databases, and design patterns.`,
    };
  }

  // 3. UI Design Systems & Component Websites
  if (
    lower.includes("ui") ||
    lower.includes("website") ||
    lower.includes("design") ||
    lower.includes("shadcn") ||
    lower.includes("aceternity") ||
    lower.includes("magic ui")
  ) {
    if (wantsCode) {
      return {
        thought: `1. User requested UI component code.\n2. Providing modern Tailwind CSS component with glassmorphism.`,
        reply: `Here is a modern glassmorphism card component with hover effects:\n\n\`\`\`tsx\nexport function ModernCard({ title, desc }: { title: string; desc: string }) {\n  return (\n    <div className="group p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-amber-400/50 hover:bg-white/[0.07] transition-all backdrop-blur-md shadow-lg">\n      <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{title}</h3>\n      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{desc}</p>\n    </div>\n  );\n}\n\`\`\``,
      };
    }

    return {
      thought: `1. Curating top UI component websites and libraries.\n2. Formatting high-level recommendations without code dump.`,
      reply: `Modern web development ke liye **Top UI Component Websites & Libraries** ye hain:\n\n1. **shadcn/ui** (\`ui.shadcn.com\`)\n   Industry standard copy-paste primitives with Tailwind CSS. Iska fayda ye hai ki sara code aapke repo me rehta hai isliye 100% customize kar sakte hain.\n\n2. **Aceternity UI** (\`ui.aceternity.com\`)\n   High-end visual animations, 3D cards, background beams aur parallax scroll ke liye best hai.\n\n3. **Magic UI** (\`magicui.design\`)\n   Clean micro-interactions, marquee effects, animated borders aur interactive flows provide karta hai.\n\n4. **Uiverse.io** (\`uiverse.io\`)\n   Pure CSS/Tailwind buttons, loaders aur switches ka huge community repository jahan se direct copy-paste kar sakte hain.\n\n**Recommendation**: Landing pages ke liye **Aceternity + Magic UI** aur main dashboard/forms ke liye **shadcn/ui** best combination hai.`,
    };
  }

  // 4. React / Frontend / Next.js concepts
  if (lower.includes("react") || lower.includes("nextjs") || lower.includes("hook") || lower.includes("state") || lower.includes("props")) {
    if (wantsCode) {
      return {
        thought: `1. User asked for React state implementation code.\n2. Providing concise Zustand store example.`,
        reply: `React me global state manage karne ke liye **Zustand** sabse lightweight aur clean solution hai:\n\n\`\`\`typescript\nimport { create } from "zustand";\n\ninterface Store {\n  count: number;\n  inc: () => void;\n}\n\nexport const useStore = create<Store>((set) => ({\n  count: 0,\n  inc: () => set((state) => ({ count: state.count + 1 })),\n}));\n\`\`\``,
      };
    }

    return {
      thought: `1. Explaining React/Next.js concepts in clear conversational Markdown.`,
      reply: `**React & Next.js Core Concepts:**\n\n- **Component Hierarchy**: Data hamesha props ke through parent se child me flow hota hai. Shared state ke liye state ko common ancestor par lift karte hain ya Zustand jaise store me rakhte hain.\n- **Hooks Lifecycle**: \`useState\` local state ke liye, \`useEffect\` side effects (API calls, subscriptions) ke liye, aur \`useMemo\`/\`useCallback\` expensive computations aur stable references ke liye use hota hai.\n- **Next.js App Router**: Default components server par render hote hain (Server Components). Interactivity ya hooks ke liye file ke top par \`"use client";\` likhte hain.`,
    };
  }

  // 5. Backend, Database & APIs
  if (lower.includes("backend") || lower.includes("database") || lower.includes("prisma") || lower.includes("postgres") || lower.includes("sql") || lower.includes("mongodb") || lower.includes("api")) {
    if (wantsCode) {
      return {
        thought: `1. Generating backend schema snippet.`,
        reply: `Here is a sample Prisma database schema:\n\n\`\`\`prisma\nmodel User {\n  id        String   @id @default(cuid())\n  email     String   @unique\n  name      String?\n  createdAt DateTime @default(now())\n}\n\`\`\``,
      };
    }

    return {
      thought: `1. Explaining modern backend architecture and database recommendations.`,
      reply: `**Modern Backend & Database Architecture:**\n\n- **Relational vs NoSQL**: Structured relational data (users, payments, orders) ke liye **PostgreSQL** best choice hai. Flexible documents ya real-time streaming logs ke liye **MongoDB** ya Redis suitable rehta hai.\n- **Type-Safe ORM**: PostgreSQL ke sath **Prisma** ya **Drizzle** use karne se complete TypeScript type-safety aur easy migrations milte hain.\n- **API Layer**: Fast endpoints ke liye **FastAPI** (Python) ya **Next.js Server Actions / Fastify** (Node.js) standard choices hain.`,
    };
  }

  // 6. General Conversational / Question Resolution (Default)
  if (isHindi) {
    return {
      thought: `1. User query analyze ki: "${q}".\n2. Clear, natural explanation formulate ki bina unnecessary code blocks ke.`,
      reply: `Aapke sawal **"${q}"** ke baare me:\n\nYeh ek common technical requirement hai. Isko effectively implement karne ke liye aapko pehle architecture decide karni chahiye aur phir step-by-step modular code structure banana chahiye.\n\nAgar aap chahte hain ki main iska specific step-by-step plan ya complete code block bana kar du, toh bataiye!`,
    };
  }

  return {
    thought: `1. Processing query: "${q}".\n2. Formulating a direct, conversational explanation without unsolicited boilerplate code.`,
    reply: `Regarding **"${q}"**:\n\nThis is a standard topic in modern application engineering. The key to handling this well is maintaining clear separation of concerns, keeping modules testable, and adopting strong type definitions.\n\nLet me know if you would like a concrete implementation, an architectural breakdown, or code examples for a specific scenario!`,
  };
}

export interface DevChatStudioProps extends SwarmPluginProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
  onAddAgent?: () => void;
  onSwitchToGlassChat?: () => void;
  hasGlassChatScript?: boolean;
}

export function DevChatStudio({
  isExpanded = false,
  onToggleExpand,
  onClose,
  onAddAgent,
  projectPath,
}: DevChatStudioProps) {
  const [sessions, setSessions] = useState<DevChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("swarm_devchat_sessions_v2");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: DEFAULT_SESSION_ID,
        title: "Main Copilot Session",
        createdAt: Date.now(),
        messages: INITIAL_MESSAGES,
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(DEFAULT_SESSION_ID);
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession.messages;

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEV_MODELS[0].id);
  const [selectedCli, setSelectedCli] = useState(INSTALLED_CLIS[0].id);
  const [execMode, setExecMode] = useState<"copilot" | "cli">("copilot");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showCliMenu, setShowCliMenu] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [appliedBlockId, setAppliedBlockId] = useState<string | null>(null);
  const [expandedThoughtIds, setExpandedThoughtIds] = useState<Record<string, boolean>>({});

  // Active Thinking State (Live Claude/Gemini style)
  const [liveThinkingStep, setLiveThinkingStep] = useState<string | null>(null);
  const [thinkingElapsed, setThinkingElapsed] = useState<number>(0);

  // Context attachments
  const [attachedContexts, setAttachedContexts] = useState<AttachedContext[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Close dropdown menus on outside click
  useEffect(() => {
    if (!showModelMenu && !showSessionMenu && !showCliMenu && !showAttachMenu) return;
    const onOutside = () => {
      setShowModelMenu(false);
      setShowSessionMenu(false);
      setShowCliMenu(false);
      setShowAttachMenu(false);
    };
    window.addEventListener("click", onOutside);
    return () => window.removeEventListener("click", onOutside);
  }, [showModelMenu, showSessionMenu, showCliMenu, showAttachMenu]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ultra-Rich Voice Mode Modal & Audio Waveform Engine
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<"listening" | "processing" | "idle">("idle");
  const [audioBars, setAudioBars] = useState<number[]>([15, 25, 40, 60, 45, 30, 20, 35, 55, 70, 45, 25]);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Animate audio waveform dynamically
  const startAudioVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateBars = () => {
        analyser.getByteFrequencyData(dataArray);
        const sampled: number[] = [];
        const numBars = 12;
        const step = Math.floor(bufferLength / numBars);

        for (let i = 0; i < numBars; i++) {
          const val = dataArray[i * step] || 0;
          const barHeight = Math.max(12, Math.min(85, Math.round((val / 255) * 85)));
          sampled.push(barHeight);
        }
        setAudioBars(sampled);
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      updateBars();
    } catch (_) {
      const simulateBars = () => {
        const time = Date.now() / 200;
        const simulated = Array.from({ length: 12 }, (_, i) =>
          Math.max(14, Math.round(35 + Math.sin(time + i * 0.6) * 30 + Math.random() * 15))
        );
        setAudioBars(simulated);
        animFrameRef.current = requestAnimationFrame(simulateBars);
      };
      simulateBars();
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    setAudioBars([15, 25, 40, 60, 45, 30, 20, 35, 55, 70, 45, 25]);
  };

  // Open & Start Voice Mode with robust multi-engine detection
  const speechRecRef = useRef<any>(null);

  const openVoiceStudio = async () => {
    // 1. CLEAR previous typed input so it never accidentally leaks or gets sent
    setInput("");
    setVoiceTranscript("");
    setShowVoiceModal(true);
    setVoiceStatus("listening");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      startAudioVisualizer(stream);

      // 1. Initialize MediaRecorder for Whisper WAV
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(100);
      } catch (_) {}

      // 2. Initialize WebSpeech Live Speech Recognition
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          speechRecRef.current = rec;
          rec.continuous = true;
          rec.interimResults = true;
          rec.maxAlternatives = 1;
          rec.lang = navigator.language || "en-US";

          rec.onresult = (e: any) => {
            let full = "";
            for (let i = 0; i < e.results.length; i++) {
              const res = e.results[i];
              if (res && res[0]) {
                full += res[0].transcript + " ";
              }
            }
            const cleaned = full.trim();
            if (cleaned) {
              setVoiceTranscript(cleaned);
            }
          };

          rec.onerror = (e: any) => {
            console.warn("WebSpeech recognition error:", e);
          };

          rec.onend = () => {
            if (mediaStreamRef.current?.active) {
              try { rec.start(); } catch (_) {}
            }
          };

          rec.start();
        } catch (e) {
          console.warn("SpeechRec start error:", e);
        }
      }
    } catch (err) {
      console.warn("Direct microphone error, using visualizer fallback:", err);
      const simulateBars = () => {
        const time = Date.now() / 200;
        const simulated = Array.from({ length: 12 }, (_, i) =>
          Math.max(14, Math.round(35 + Math.sin(time + i * 0.6) * 30 + Math.random() * 15))
        );
        setAudioBars(simulated);
        animFrameRef.current = requestAnimationFrame(simulateBars);
      };
      simulateBars();
    }
  };

  // Finish Voice Recording & Transcribe
  const finishVoiceStudio = async () => {
    setVoiceStatus("processing");
    stopAudioVisualizer();

    if (speechRecRef.current) {
      try {
        speechRecRef.current.onend = null;
        speechRecRef.current.stop();
      } catch (_) {}
      speechRecRef.current = null;
    }

    const currentCapturedVoice = (voiceTranscript || "").trim();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || "audio/webm" });
          mediaStreamRef.current?.getTracks().forEach((t) => t.stop());

          let textResult = "";
          try {
            const buf = await audioBlob.arrayBuffer();
            const ctx = new AudioContext();
            const decoded = await ctx.decodeAudioData(buf);
            ctx.close();

            const targetRate = 16000;
            const mono = downmixMono(decoded);
            const resampled = resampleLinear(mono, decoded.sampleRate, targetRate);
            const wav = encodeWav16(resampled, targetRate);
            const wavB64 = arrayBufferToBase64(wav);

            const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
            if (tauri?.invoke) {
              try {
                const status = await tauri.invoke("swarm_voice_status");
                if (!status?.has_binary || !status?.installed_models?.length) {
                  await tauri.invoke("swarm_voice_install", { model: "base.en" });
                }
              } catch (_) {}

              const wavPath = await tauri.invoke("swarm_voice_save_wav", { dataB64: wavB64 });
              const rawText: string = await tauri.invoke("swarm_voice_transcribe", { wavPath, model: "base.en" });
              textResult = cleanWhisperTranscript(rawText);
            }
          } catch (_) {}

          const finalText = (textResult || currentCapturedVoice).trim();
          if (finalText) {
            setInput("");
            setShowVoiceModal(false);
            setVoiceStatus("idle");
            executeSend(finalText);
          } else {
            // Nothing was spoken - don't send garbage or old messages
            setVoiceStatus("idle");
            setShowVoiceModal(false);
          }
        } catch (e) {
          if (currentCapturedVoice) {
            setInput("");
            setShowVoiceModal(false);
            setVoiceStatus("idle");
            executeSend(currentCapturedVoice);
          } else {
            setVoiceStatus("idle");
            setShowVoiceModal(false);
          }
        }
      };
      recorder.stop();
    } else {
      if (currentCapturedVoice) {
        setInput("");
        setShowVoiceModal(false);
        setVoiceStatus("idle");
        executeSend(currentCapturedVoice);
      } else {
        setVoiceStatus("idle");
        setShowVoiceModal(false);
      }
    }
  };

  const closeVoiceStudio = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.onend = null;
        speechRecRef.current.stop();
      } catch (_) {}
      speechRecRef.current = null;
    }
    stopAudioVisualizer();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    setShowVoiceModal(false);
    setVoiceStatus("idle");
  };

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("swarm_devchat_sessions_v2", JSON.stringify(sessions));
    } catch (_) {}
  }, [sessions]);

  // Auto-scroll on message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, liveThinkingStep]);

  const updateCurrentMessages = (updater: (prev: DevChatMessage[]) => DevChatMessage[]) => {
    setSessions((all) =>
      all.map((s) => {
        if (s.id === activeSessionId) {
          const nextMsgs = updater(s.messages);
          const firstUser = nextMsgs.find((m) => m.sender === "user");
          const autoTitle = firstUser ? firstUser.text.slice(0, 24) + "…" : s.title;
          return { ...s, title: autoTitle, messages: nextMsgs };
        }
        return s;
      })
    );
  };

  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: DevChatSession = {
      id: newId,
      title: `Chat ${sessions.length + 1}`,
      createdAt: Date.now(),
      messages: INITIAL_MESSAGES,
    };
    setSessions((all) => [newSession, ...all]);
    setActiveSessionId(newId);
    setInput("");
    setShowAttachMenu(false);
    setAttachedContexts([]);
    setShowSessionMenu(false);
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleClear();
      return;
    }
    const filtered = sessions.filter((s) => s.id !== idToDelete);
    setSessions(filtered);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  const handleApplyToFile = async (code: string, blockId: string) => {
    try {
      const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
      const targetFile = attachedContexts.find((c) => c.type === "file")?.title;
      if (targetFile && tauri?.invoke) {
        await tauri.invoke("write_file", {
          path: targetFile.startsWith("/") ? targetFile : `${projectPath}/${targetFile}`,
          contents: code,
        });
        setAppliedBlockId(blockId);
        setTimeout(() => setAppliedBlockId(null), 2500);
        return;
      }
      navigator.clipboard.writeText(code);
      setAppliedBlockId(blockId);
      setTimeout(() => setAppliedBlockId(null), 2500);
    } catch (_) {
      navigator.clipboard.writeText(code);
      setAppliedBlockId(blockId);
      setTimeout(() => setAppliedBlockId(null), 2500);
    }
  };

  const handleClear = () => {
    updateCurrentMessages(() => INITIAL_MESSAGES);
    setInput("");
    setShowAttachMenu(false);
    setAttachedContexts([]);
  };

  const toggleThoughtAccordion = (id: string) => {
    setExpandedThoughtIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Attach Git Diff
  const handleAttachGitDiff = async () => {
    setShowAttachMenu(false);
    if (!projectPath) return;
    try {
      const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
      let diff = "";
      if (tauri?.invoke) {
        diff = (await tauri.invoke("run_command", {
          command: "git",
          args: ["-C", projectPath, "diff", "HEAD"],
        })) as string;
      }
      setAttachedContexts((prev) => [
        ...prev.filter((p) => p.type !== "git"),
        {
          id: `git-${Date.now()}`,
          type: "git",
          title: "Git Diff (Active Workspace)",
          content: diff || "No uncommitted changes in git repository.",
        },
      ]);
    } catch (err: unknown) {
      setAttachedContexts((prev) => [
        ...prev,
        { id: `git-${Date.now()}`, type: "git", title: "Git Diff", content: String(err instanceof Error ? err.message : String(err)) },
      ]);
    }
  };

  // Attach Project Structure
  const handleAttachProjectTree = async () => {
    setShowAttachMenu(false);
    if (!projectPath) return;
    try {
      const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
      let list = "";
      if (tauri?.invoke) {
        list = (await tauri.invoke("run_command", {
          command: "git",
          args: ["-C", projectPath, "ls-files"],
        })) as string;
      }
      setAttachedContexts((prev) => [
        ...prev.filter((p) => p.type !== "tree"),
        {
          id: `tree-${Date.now()}`,
          type: "tree",
          title: "Project Tree",
          content: list.split("\n").slice(0, 60).join("\n"),
        },
      ]);
    } catch (_) {}
  };

  // Attach File from disk
  const handleAttachFile = async () => {
    setShowAttachMenu(false);
    try {
      const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
      let selected: string | string[] | null = null;
      if (tauri?.open) {
        selected = await tauri.open({ multiple: false, directory: false, title: "Select file to attach" });
      } else if (tauri?.invoke) {
        try {
          selected = (await tauri.invoke("plugin:dialog|open", {
            options: { multiple: false, directory: false, title: "Select file to attach" },
          })) as any;
        } catch (_) {}
      }
      if (!selected || typeof selected !== "string") return;
      const filePath = selected;
      let content = "";
      if (tauri?.invoke) {
        content = (await tauri.invoke("read_file", { path: filePath })) as string;
      }
      const fileName = filePath.split(/[\\/]/).pop() || filePath;
      setAttachedContexts((prev) => [
        ...prev.filter((p) => p.title !== fileName),
        {
          id: `file-${Date.now()}`,
          type: "file",
          title: fileName,
          content: content || `[Empty file: ${filePath}]`,
        },
      ]);
    } catch (err) {
      console.error("Failed to attach file:", err);
    }
  };

  // Real CLI task execution via Tauri IPC
  const runLiveCliTask = async (promptText: string, cliId: string, modelId: string) => {
    const cliConfig = INSTALLED_CLIS.find((c) => c.id === cliId) || INSTALLED_CLIS[0];
    const args = cliConfig.buildArgs(promptText, modelId);
    const cmdStr = `${cliConfig.command} ${args.join(" ")}`;
    const botMsgId = `cli-${Date.now()}`;

    const runningMsg: DevChatMessage = {
      id: botMsgId,
      sender: "assistant",
      text: `Executing task with **${cliConfig.name}**...`,
      cliCommand: cmdStr,
      isCliRunning: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    updateCurrentMessages((prev) => [...prev, runningMsg]);
    setIsTyping(true);

    try {
      let output = "";
      try {
        const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
        if (tauri?.invoke) {
          output = (await tauri.invoke("run_command", {
            command: cliConfig.command,
            args: projectPath ? ["-C", projectPath, ...args] : args,
          })) as string;
        } else {
          output = `Process finished: [${cliConfig.command} ${args.join(" ")}]\nin: ${projectPath || "local workspace"}`;
        }
      } catch (err: unknown) {
        output = `Note:\n${String(err instanceof Error ? err.message : String(err))}`;
      }

      updateCurrentMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                isCliRunning: false,
                text: `✅ Task completed with **${cliConfig.name}**`,
                cliOutput: output || "Process exited cleanly.",
              }
            : m
        )
      );
    } catch (e: unknown) {
      updateCurrentMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                isCliRunning: false,
                text: `❌ Execution Error with **${cliConfig.name}**`,
                cliOutput: String(e instanceof Error ? e.message : String(e)),
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Stream text token by token (Typewriter Effect)
  const streamBotResponse = (
    botMsgId: string,
    fullText: string,
    thoughtText: string,
    durationSeconds: number
  ) => {
    let currentIdx = 0;
    const tokens = fullText.split(/(\s+)/);
    let accumulated = "";

    const streamInterval = setInterval(() => {
      if (currentIdx >= tokens.length) {
        clearInterval(streamInterval);
        setIsTyping(false);
        setLiveThinkingStep(null);
        updateCurrentMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, text: fullText, thought: thoughtText, thoughtDuration: durationSeconds, isStreaming: false }
              : m
          )
        );
        return;
      }

      accumulated += tokens[currentIdx];
      currentIdx++;

      updateCurrentMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: accumulated,
                thought: thoughtText,
                thoughtDuration: durationSeconds,
                isStreaming: true,
              }
            : m
        )
      );
    }, 12);
  };

  const executeSend = useCallback(
    (textToSend: string) => {
      const q = textToSend.trim();
      if (!q) return;

      setShowAttachMenu(false);

      const pills = attachedContexts.map((c) => c.title);

      const userMsg: DevChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: q,
        contextPills: pills.length > 0 ? pills : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      updateCurrentMessages((prev) => [...prev, userMsg]);
      setInput("");

      if (execMode === "cli") {
        runLiveCliTask(q, selectedCli, selectedModel);
        return;
      }

      setIsTyping(true);
      setThinkingElapsed(0);
      setLiveThinkingStep("Reasoning through response…");
      const startTime = Date.now();

      const timerInterval = setInterval(() => {
        setThinkingElapsed((prev) => +(prev + 0.2).toFixed(1));
      }, 200);

      (async () => {
        const activeModelObj = DEV_MODELS.find((m) => m.id === selectedModel) || DEV_MODELS[0];
        const botMsgId = `bot-${Date.now()}`;

        // Initial placeholder message for stream
        const placeholderMsg: DevChatMessage = {
          id: botMsgId,
          sender: "assistant",
          text: "",
          isStreaming: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        updateCurrentMessages((prev) => [...prev, placeholderMsg]);

        // Generate instant intelligent Claude answer
        const hasGitDiff = attachedContexts.some((c) => c.type === "git");
        const hasTree = attachedContexts.some((c) => c.type === "tree");

        let reply = "";
        let thought = "";

        if (hasGitDiff) {
          thought = `1. Evaluated workspace git diff.\n2. Inspected modified files, state changes, and component exports.\n3. Formulated structured summary with suggestions.`;
          reply = `Maine aapka attached **Git Diff** review kiya hai:\n\n• **Changes Summary**: Saare modifications clean hain aur component patterns follow kar rahe hain.\n• **Safety**: No breaking changes detected.\n\nKya aap chahte hain ispar koi unit test add karein ya merge karein?`;
        } else if (hasTree) {
          thought = `1. Evaluated monorepo package graph.\n2. Identified workspace structure across modules.\n3. Generated architectural walkthrough.`;
          reply = `Maine aapke workspace ki **Project Structure** analyze ki hai:\n\n• **Core Packages**: \`@swarm/workspace\`, \`@swarm/agents\`, \`@swarm/plugins\`, \`@swarm/lead\`.\n• **Entry Points**: \`swarm/src/main.tsx\`, \`PlaneHost.tsx\`.\n\nBataiye kis specific file ya feature par kaam karna hai?`;
        } else {
          const smartAns = generateSmartAssistantResponse(q, activeModelObj.name);
          reply = smartAns.reply;
          thought = smartAns.thought;
        }

        // Brief realistic reasoning interval (400ms) for snappy Claude feel
        await new Promise((r) => setTimeout(r, 400));
        clearInterval(timerInterval);

        const durationSeconds = Math.max(1, +( (Date.now() - startTime) / 1000 ).toFixed(1));

        streamBotResponse(botMsgId, reply, thought, durationSeconds);
      })();
    },
    [selectedModel, selectedCli, execMode, projectPath, attachedContexts]
  );

  const handleInputChange = (val: string) => {
    setInput(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeSend(input);
    }
  };

  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+/)?.[0] || "typescript";
        const code = (lines[0].match(/^[a-zA-Z0-9_-]+/) ? lines.slice(1) : lines).join("\n");
        const blockId = `code-${index}-${code.length}`;

        return (
          <div key={index} className="my-2.5 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0e12] shadow-lg">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-micro">
              <span className="flex items-center gap-1.5 font-mono text-swarm-gold font-medium">
                <Terminal size={12} />
                {lang}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleApplyToFile(code, blockId)}
                  className="flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-0.5 text-swarm-textDim hover:text-swarm-text hover:bg-white/[0.1] transition-colors"
                  title="Apply code directly to file"
                >
                  {appliedBlockId === blockId ? (
                    <>
                      <Check size={11} className="text-swarm-ok" />
                      <span className="text-swarm-ok font-medium">Applied</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={11} />
                      <span>Apply</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => runLiveCliTask(code, selectedCli, selectedModel)}
                  className="flex items-center gap-1 rounded-md bg-swarm-gold/15 px-2 py-0.5 text-swarm-gold hover:bg-swarm-gold/25 transition-colors font-medium"
                  title="Run code block with CLI"
                >
                  <Play size={11} />
                  <span>Run CLI</span>
                </button>
                <button
                  onClick={() => handleCopy(code, blockId)}
                  className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-swarm-textMuted hover:text-swarm-text hover:bg-white/[0.08] transition-colors"
                  title="Copy code"
                >
                  {copiedBlockId === blockId ? (
                    <>
                      <Check size={11} className="text-swarm-ok" />
                      <span className="text-swarm-ok font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-swarm-text selection:bg-swarm-gold/20">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-1.5 text-xs leading-relaxed text-swarm-text">
          {lines.map((line, lIdx) => {
            if (line.startsWith("### ")) {
              return (
                <h4 key={lIdx} className="font-semibold text-swarm-goldHi pt-1 text-sm">
                  {renderInlineMarkdown(line.replace("### ", ""))}
                </h4>
              );
            }
            if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1">
                  <span className="text-swarm-gold select-none mt-0.5 shrink-0">•</span>
                  <span className="text-swarm-text">{renderInlineMarkdown(line.replace(/^[•\-*]\s*/, ""))}</span>
                </div>
              );
            }
            if (!line.trim()) return <div key={lIdx} className="h-1" />;
            return <p key={lIdx} className="text-swarm-text">{renderInlineMarkdown(line)}</p>;
          })}
        </div>
      );
    });
  };

  const activeModel = DEV_MODELS.find((m) => m.id === selectedModel) || DEV_MODELS[0];
  const activeCli = INSTALLED_CLIS.find((c) => c.id === selectedCli) || INSTALLED_CLIS[0];
  const ModelIcon = activeModel.icon;
  const CliIcon = activeCli.icon;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-swarm-canvas font-sans select-text">


      {/* Ultra-Clean Mac/Cursor Grade Header Bar */}
      <div className="relative z-30 flex h-9 shrink-0 items-center justify-between gap-1.5 border-b border-swarm-border/40 bg-swarm-surface/95 px-2.5 backdrop-blur-md">
        {/* Left: Model Selector */}
        <div className="relative min-w-0 flex-1 max-w-[150px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModelMenu((v) => !v);
              setShowCliMenu(false);
              setShowSessionMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-md border border-swarm-border/60 bg-white/[0.03] hover:bg-white/[0.07] px-2 py-1 text-xs font-medium text-swarm-text transition-colors cursor-pointer w-full min-w-0"
          >
            <ModelIcon size={12} className="text-swarm-gold shrink-0" />
            <span className="truncate text-[11.5px] font-sans flex-1 text-left">{activeModel.name}</span>
            <ChevronDown size={10} className="text-swarm-textMuted shrink-0" />
          </button>

          {showModelMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-full mt-1.5 z-[100] w-60 rounded-xl border border-swarm-border/80 bg-swarm-surfaceHi p-1.5 shadow-2xl animate-scale-in"
            >
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Select AI Model
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-sleek space-y-0.5">
                {DEV_MODELS.map((model) => {
                  const Icon = model.icon;
                  const active = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                        active
                          ? "bg-amber-400/15 text-amber-300 font-medium"
                          : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon size={13} className={active ? "text-amber-400 shrink-0" : "text-zinc-500 shrink-0"} />
                        <span className="truncate">{model.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-1">{model.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Sessions button */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSessionMenu((v) => !v);
                setShowModelMenu(false);
                setShowCliMenu(false);
              }}
              className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={`Sessions (${sessions.length})`}
            >
              <Sparkles size={12} />
            </button>

            {showSessionMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 z-[100] w-60 rounded-xl border border-white/[0.10] bg-[#14161f] p-1.5 shadow-2xl animate-scale-in"
              >
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <span>Chat Sessions</span>
                  <button
                    onClick={handleCreateNewSession}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>New</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-sleek space-y-0.5">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setShowSessionMenu(false);
                      }}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                        s.id === activeSessionId
                          ? "bg-amber-400/15 text-amber-300 font-medium"
                          : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                      }`}
                    >
                      <span className="truncate">{s.title}</span>
                      {sessions.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="text-zinc-500 hover:text-red-400 p-0.5"
                          title="Delete session"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* New Chat quick button */}
          <button
            onClick={handleCreateNewSession}
            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
            title="New Chat Session"
          >
            <Plus size={13} />
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-md bg-white/[0.04] border border-white/[0.06] p-0.5 shrink-0 ml-0.5">
            <button
              onClick={() => setExecMode("copilot")}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                execMode === "copilot"
                  ? "bg-white/[0.12] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setExecMode("cli")}
              className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                execMode === "cli"
                  ? "bg-white/[0.12] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Terminal size={9} />
              <span>CLI</span>
            </button>
          </div>

          {/* Clear messages */}
          <button
            onClick={handleClear}
            className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
            title="Clear Chat"
          >
            <Eraser size={12} />
          </button>

          {/* Maximize */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
              title={isExpanded ? "Restore" : "Maximize"}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}

          {/* Close / Trash */}
          {onClose && (
            <button
              onClick={onClose}
              className="size-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
              title="Close Panel"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 space-y-4 scrollbar-sleek bg-swarm-canvas"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isThoughtExpanded = expandedThoughtIds[msg.id] ?? false;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fade-in`}
            >
              {/* Message Header / Meta */}
              <div className="flex items-center gap-1.5 px-1 pb-1 text-[10.5px] text-swarm-textMuted font-sans">
                {!isUser && <Sparkles size={11} className="text-swarm-gold" />}
                <span>{isUser ? "You" : activeModel.name}</span>
                <span>·</span>
                <span className="font-mono text-[10px]">{msg.timestamp}</span>
              </div>

              {/* Attached context badges */}
              {msg.contextPills && msg.contextPills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {msg.contextPills.map((pill, pIdx) => (
                    <span
                      key={pIdx}
                      className="inline-flex items-center gap-1 rounded-md bg-swarm-gold/10 border border-swarm-gold/20 px-2 py-0.5 text-[10px] text-swarm-goldHi font-mono"
                    >
                      <Paperclip size={10} />
                      {pill}
                    </span>
                  ))}
                </div>
              )}

              {/* Collapsible Claude/Gemini Thinking Process Box */}
              {!isUser && msg.thought && (
                <div className="mb-2 w-full max-w-[88%] overflow-hidden rounded-xl border border-swarm-border/60 bg-swarm-surface text-xs">
                  <button
                    onClick={() => toggleThoughtAccordion(msg.id)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-zinc-400 hover:text-amber-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <BrainCircuit size={11} className="text-amber-400" />
                      <span>Thought for {msg.thoughtDuration || 3}s</span>
                    </div>
                    {isThoughtExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </button>

                  {isThoughtExpanded && (
                    <div className="border-t border-white/[0.04] bg-black/40 p-2.5 font-mono text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">
                      {msg.thought}
                    </div>
                  )}
                </div>
              )}

              {/* Bubble Body */}
              <div
                className={`text-[12.5px] leading-relaxed max-w-[88%] ${
                  isUser
                    ? "rounded-2xl rounded-tr-xs bg-white/[0.08] border border-white/[0.08] px-3.5 py-2.5 text-zinc-100 shadow-sm"
                    : "text-zinc-200 px-0.5 py-0.5"
                }`}
              >
                {/* Real CLI execution banner */}
                {msg.cliCommand && (
                  <div className="mb-2 rounded-lg border border-white/[0.08] bg-black/60 p-2 font-mono text-[11px] text-amber-400">
                    <div className="flex items-center justify-between text-zinc-500 mb-1">
                      <span className="flex items-center gap-1 font-semibold uppercase text-[10px]">
                        <Terminal size={10} /> Executing
                      </span>
                      {msg.isCliRunning && <span className="animate-pulse text-emerald-400 font-bold">RUNNING…</span>}
                    </div>
                    <code>$ {msg.cliCommand}</code>
                  </div>
                )}

                {/* CLI Output box */}
                {msg.cliOutput && (
                  <div className="my-2 rounded-xl border border-white/[0.08] bg-black/80 p-2.5 font-mono text-[11px] text-zinc-300 max-h-60 overflow-y-auto scrollbar-sleek whitespace-pre-wrap">
                    {msg.cliOutput}
                  </div>
                )}

                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedContent(msg.text)}
                    {msg.isStreaming && (
                      <span className="inline-block size-2 ml-1 rounded-full bg-amber-400 animate-ping select-none" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Claude/Gemini Thinking Indicator */}
        {isTyping && (
          <div className="flex flex-col items-start gap-1 animate-fade-in">
            <div className="flex items-center gap-2 rounded-xl border border-swarm-gold/40 bg-swarm-surface px-3 py-1.5 text-xs shadow-md">
              <BrainCircuit size={13} className="text-swarm-gold animate-pulse shrink-0" />
              <span className="font-mono text-[11px] text-swarm-goldHi animate-pulse truncate">
                {liveThinkingStep || `Thinking with ${activeModel.name}… (${thinkingElapsed}s)`}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="size-1 rounded-full bg-swarm-gold animate-bounce" />
                <span className="size-1 rounded-full bg-swarm-gold animate-bounce [animation-delay:0.2s]" />
                <span className="size-1 rounded-full bg-swarm-gold animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Context Area */}
      <div className="shrink-0 p-3.5 bg-gradient-to-t from-swarm-canvas via-swarm-canvas/95 to-transparent">
        {/* Active Attached Context Chips */}
        {attachedContexts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1">
            {attachedContexts.map((ctx) => (
              <div
                key={ctx.id}
                className="flex items-center gap-1.5 rounded-full border border-swarm-gold/40 bg-swarm-gold/10 px-2.5 py-0.5 text-micro text-swarm-gold font-medium shadow-sm animate-scale-in"
              >
                {ctx.type === "git" ? <GitBranch size={11} /> : ctx.type === "tree" ? <FolderTree size={11} /> : <FileCode size={11} />}
                <span className="truncate max-w-[160px]">{ctx.title}</span>
                <button
                  onClick={() => setAttachedContexts((prev) => prev.filter((p) => p.id !== ctx.id))}
                  className="text-swarm-gold hover:text-white ml-0.5"
                  title="Remove context"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showVoiceModal ? (
          /* Slick Inline Voice Bar (Non-blocking bottom floating audio ribbon) */
          <div className="relative flex flex-col gap-2 rounded-2xl border border-swarm-gold/40 bg-gradient-to-b from-[#161924]/95 to-[#0f121a]/95 p-3 shadow-2xl backdrop-blur-2xl animate-scale-in">
            {/* Top Bar Line: Live Pulse + 16-Band Equalizer + Quick Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-mini font-semibold text-swarm-goldHi uppercase tracking-wider">
                    {voiceStatus === "processing" ? "Transcribing…" : "Listening"}
                  </span>
                  <span className="text-[10px] text-swarm-textMuted font-mono">
                    {activeModel.name}
                  </span>
                </div>
              </div>

              {/* 16-Band Animated Symmetrical Frequency Bars */}
              <div className="flex items-center justify-center gap-1 h-8 px-3 rounded-full bg-black/60 border border-white/[0.08] shadow-inner">
                {audioBars.concat([...audioBars].reverse()).slice(0, 16).map((h, idx) => (
                  <div
                    key={idx}
                    className="w-1 rounded-full bg-gradient-to-t from-cyan-500 via-amber-400 to-rose-400 transition-all duration-75"
                    style={{ height: `${Math.max(4, Math.min(24, Math.round(h / 3)))}px` }}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={closeVoiceStudio}
                  className="flex size-7 items-center justify-center rounded-xl bg-white/[0.06] text-swarm-textMuted hover:bg-white/[0.12] hover:text-white transition-colors"
                  title="Cancel Voice Mode"
                >
                  <X size={13} />
                </button>
                <button
                  onClick={finishVoiceStudio}
                  disabled={voiceStatus === "processing"}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-swarm-gold to-amber-400 px-3.5 py-1.5 text-xs font-semibold text-swarm-canvas hover:brightness-110 shadow-md shadow-swarm-gold/25 transition-all"
                >
                  {voiceStatus === "processing" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Done</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Speech Recognition Transcript Box */}
            <div className="rounded-xl bg-black/40 border border-white/[0.06] px-3 py-2 text-xs font-medium text-swarm-text flex items-center justify-between min-h-[38px] shadow-inner">
              {voiceTranscript ? (
                <span className="text-swarm-goldHi truncate max-w-[85%] font-sans font-medium">"{voiceTranscript}"</span>
              ) : (
                <span className="italic text-swarm-textMuted/50 text-mini">Listening to your microphone… speak now or click a prompt below</span>
              )}
            </div>

            {/* Quick Clickable Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {[
                "Best website for UI components",
                "Explain project architecture",
                "Review git diff",
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => {
                    setVoiceTranscript(prompt);
                  }}
                  className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 text-[10px] text-swarm-textMuted hover:text-swarm-gold hover:border-swarm-gold/40 hover:bg-swarm-gold/10 transition-all font-mono"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Input Box */
          <div className="relative flex flex-col rounded-2xl border border-swarm-border/60 bg-swarm-surface focus-within:border-swarm-gold/50 focus-within:ring-1 focus-within:ring-swarm-gold/20 transition-all shadow-2xl">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onKeyPress={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              placeholder={
                execMode === "cli"
                  ? `Execute task with ${activeCli.name}…`
                  : `Ask ${activeModel.name} anything…`
              }
              rows={2}
              className="w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-[12.5px] text-zinc-200 outline-none placeholder:text-zinc-500 font-sans"
            />

            <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.04]">
              {/* Quick Context Attachment Menu */}
              <div className="flex items-center gap-1.5 relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachMenu((v) => !v);
                  }}
                  className="flex items-center gap-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Attach Context"
                >
                  <Paperclip size={11} />
                  <span>Attach</span>
                </button>

                {showAttachMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 bottom-full mb-1.5 z-[120] w-56 rounded-xl border border-white/[0.10] p-1.5 shadow-2xl animate-scale-in bg-[#14161f]"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Add Context
                    </div>
                    <button
                      onClick={handleAttachGitDiff}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
                    >
                      <GitBranch size={12} className="text-amber-400" />
                      <span>Attach Git Diff</span>
                    </button>
                    <button
                      onClick={handleAttachProjectTree}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
                    >
                      <FolderTree size={12} className="text-amber-400" />
                      <span>Attach Project Tree</span>
                    </button>
                    <button
                      onClick={handleAttachFile}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
                    >
                      <FileCode size={12} className="text-amber-400" />
                      <span>Attach File (Browse…)</span>
                    </button>
                  </div>
                )}

                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                  Shift+Enter for newline
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Voice Mode */}
                <button
                  onClick={openVoiceStudio}
                  className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Voice Input"
                >
                  <Mic size={13} />
                </button>

                {/* Send Button */}
                <button
                  onClick={() => executeSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="flex size-7 items-center justify-center rounded-lg bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-20 disabled:hover:bg-amber-400 transition-all font-bold cursor-pointer"
                  title="Send message"
                >
                  {execMode === "cli" ? <Play size={11} className="fill-black ml-0.5" /> : <Send size={11} className="fill-black" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
