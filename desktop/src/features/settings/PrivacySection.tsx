"use client";

import {
  ShieldCheck,
  Lock,
  Key,
  EyeOff,
  ServerOff,
  FileCheck,
  HardDrive,
  Cpu,
} from "lucide-react";

export default function PrivacySection() {
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs text-swarm-textDim">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-swarm-border/40 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-swarm-text flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Privacy Policy & Local-First Data Security</span>
          </h3>
          <p className="text-[11px] text-swarm-textMuted mt-0.5">
            Cryptographic guarantees, zero middleman telemetry, and local-first data ownership specifications.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>100% LOCAL-FIRST GUARANTEED</span>
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-sleek pr-2 flex flex-col gap-4">
        {/* 1. Zero Cloud Proxy Guarantee */}
        <div className="p-3.5 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-swarm-text font-bold">
            <ServerOff size={15} className="text-emerald-400" />
            <span>1. Zero Cloud Proxy & Middleman Guarantee</span>
          </div>
          <p className="text-[11px] text-swarm-textDim leading-relaxed">
            Swarm AI maintains <strong>zero proxy servers, zero data ingestion pipelines, and zero telemetry collection</strong>.
            When your agents communicate with model providers (Anthropic, OpenAI, DeepSeek, or local Ollama), all HTTP and WebSocket network sockets originate directly from your localhost machine to the destination API endpoint.
          </p>
          <div className="p-2 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 font-mono text-[10px] text-emerald-400/90">
            ✓ Client &rarr; Direct Model Socket &rarr; Client (No Swarm AI intermediary servers exist)
          </div>
        </div>

        {/* 2. OS-Native Keychain Encryption */}
        <div className="p-3.5 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-swarm-text font-bold">
            <Key size={15} className="text-swarm-gold" />
            <span>2. OS-Native Encrypted Credential Vault</span>
          </div>
          <p className="text-[11px] text-swarm-textDim leading-relaxed">
            API keys and tokens configured in Swarm AI are encrypted at rest using your host operating system's native cryptographic vault:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-1 pl-1 text-[11px] text-swarm-textMuted">
            <li><strong>Apple macOS:</strong> Secure Enclave via Security.framework (Keychain Services).</li>
            <li><strong>Microsoft Windows:</strong> Data Protection API (DPAPI) and Windows Credential Manager.</li>
            <li><strong>Linux Workstations:</strong> FreeDesktop Secret Service API via libsecret / GNOME Keyring.</li>
          </ul>
        </div>

        {/* 3. Sensitive Secret Scrubbing */}
        <div className="p-3.5 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-swarm-text font-bold">
            <EyeOff size={15} className="text-swarm-gold" />
            <span>3. Real-Time Secret & Token Scrubbing</span>
          </div>
          <p className="text-[11px] text-swarm-textDim leading-relaxed">
            Swarm AI's PTY streaming pipeline actively filters stdout and stderr buffers to detect and mask sensitive credentials before they are rendered in terminal frontends or stored in local vector memory:
          </p>
          <div className="grid grid-cols-3 gap-2 mt-1 font-mono text-[10px]">
            <div className="p-2 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 text-center">
              RSA / SSH Private Keys
            </div>
            <div className="p-2 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 text-center">
              JWT Bearer Tokens
            </div>
            <div className="p-2 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 text-center">
              .env Key-Value Pairs
            </div>
          </div>
        </div>

        {/* 4. Local SQLite Vector Memory Ownership */}
        <div className="p-3.5 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-swarm-text font-bold">
            <HardDrive size={15} className="text-swarm-gold" />
            <span>4. Complete Local Data Ownership</span>
          </div>
          <p className="text-[11px] text-swarm-textDim leading-relaxed">
            All project memory, task states, and synapse connections are stored strictly inside your project's local directory (<code>.pheromone/memory.db</code>).
            Deleting this folder immediately purges all local project context without leaving remote traces.
          </p>
        </div>

        {/* 5. Air-Gapped & Offline Compliance */}
        <div className="p-3.5 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-swarm-text font-bold">
            <Lock size={15} className="text-emerald-400" />
            <span>5. Enterprise Air-Gap & Offline Compliance</span>
          </div>
          <p className="text-[11px] text-swarm-textDim leading-relaxed">
            Swarm AI is fully compliant with enterprise air-gapped environments. When configured with local inference engines (Ollama / vLLM / LMStudio), the application operates <strong>100% offline without requiring internet access</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
