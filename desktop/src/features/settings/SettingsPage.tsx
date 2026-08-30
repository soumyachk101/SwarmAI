"use client";

import { useEffect, useState } from "react";
import {
  X,
  Server,
  Puzzle,
  Download,
  BookOpen,
  ShieldCheck,
  FolderOpen,
  FolderGit2,
  Activity,
  Layers,
  FileDiff,
  Blocks,
  Gauge,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import ProvidersSection from "./ProvidersSection";
import ModelsSection from "./ModelsSection";
import UpdatesSection from "./UpdatesSection";
import UserGuideSection from "./UserGuideSection";
import PrivacySection from "./PrivacySection";

interface SettingsPageProps {
  onClose: () => void;
  onOpenProject?: () => void;
  onOpenGit?: () => void;
  onOpenDashboard?: () => void;
  onOpenTemplates?: () => void;
  onOpenDiff?: () => void;
  onOpenExtensions?: () => void;
  onOpenUsage?: () => void;
}

type SectionId = "tools" | "models" | "providers" | "guide" | "privacy" | "updates";

interface NavItem {
  id: SectionId;
  label: string;
  icon: any;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "tools", label: "Tools & Workflows", icon: Sparkles },
  { id: "models", label: "Models & Defaults", icon: Server },
  { id: "providers", label: "API Providers", icon: Puzzle },
  { id: "guide", label: "User Guide & Docs", icon: BookOpen },
  { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
  { id: "updates", label: "Updates & Releases", icon: Download },
];

export default function SettingsPage({
  onClose,
  onOpenProject,
  onOpenGit,
  onOpenDashboard,
  onOpenTemplates,
  onOpenDiff,
  onOpenExtensions,
  onOpenUsage,
}: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("tools");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const renderToolsSection = () => {
    const tools = [
      {
        id: "open",
        title: "Open Workspace / Project",
        desc: "Open a folder or switch the active codebase workspace",
        icon: FolderOpen,
        color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        action: () => { onClose(); onOpenProject?.(); },
      },
      {
        id: "git",
        title: "Git & GitHub Hub",
        desc: "Commit, push, pull, view branches and inspect repository status",
        icon: FolderGit2,
        color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
        action: () => { onClose(); onOpenGit?.(); },
      },
      {
        id: "dashboard",
        title: "Swarm Dashboard",
        desc: "Live agent telemetry, execution metrics, cost and event stream",
        icon: Activity,
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        action: () => { onClose(); onOpenDashboard?.(); },
      },
      {
        id: "templates",
        title: "Task Templates",
        desc: "Launch pre-configured multi-agent pipelines & specialized presets",
        icon: Layers,
        color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
        action: () => { onClose(); onOpenTemplates?.(); },
      },
      {
        id: "diff",
        title: "Diff & Changes Preview",
        desc: "Inspect worktree modifications and side-by-side file differences",
        icon: FileDiff,
        color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
        action: () => { onClose(); onOpenDiff?.(); },
      },
      {
        id: "extensions",
        title: "Extensions & Tools",
        desc: "Discover, install and manage agents and plugins from Open-VSX",
        icon: Blocks,
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        action: () => { onClose(); onOpenExtensions?.(); },
      },
      {
        id: "usage",
        title: "Token Usage & Plan Limits",
        desc: "Track token consumption, CLI limits, and API spending analytics",
        icon: Gauge,
        color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
        action: () => { onClose(); onOpenUsage?.(); },
      },
    ];

    return (
      <div className="space-y-4" data-testid="tools-section">
        <div>
          <h2 className="text-sm font-bold text-white">Tools & Workflows</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Quick-launch system tools, project manager, repository workflows and extensions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={tool.action}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-swarm-gold/40 text-left transition-all group cursor-pointer"
              >
                <div className={`p-2 rounded-lg border ${tool.color} shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-swarm-goldHi transition-colors">
                      {tool.title}
                    </span>
                    <ExternalLink size={11} className="text-zinc-500 group-hover:text-zinc-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "tools":
        return renderToolsSection();
      case "providers":
        return <div data-testid="providers-section"><ProvidersSection /></div>;
      case "guide":
        return <div data-testid="guide-section"><UserGuideSection /></div>;
      case "privacy":
        return <div data-testid="privacy-section"><PrivacySection /></div>;
      case "updates":
        return <div data-testid="updates-section"><UpdatesSection /></div>;
      case "models":
      default:
        return <div data-testid="models-section"><ModelsSection /></div>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-md" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="flex h-[80vh] max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl glass-hi border border-white/[0.14] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-swarm-border/50 flex-shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Settings & Tools</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-2.5 py-1 rounded-lg text-micro bg-swarm-gold/10 border border-swarm-gold/20 text-swarm-goldHi hover:bg-swarm-gold/20 transition-colors cursor-pointer font-medium"
              title="Reload the app window"
            >
              Reload
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors ml-2 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <nav className="w-[220px] flex-shrink-0 border-r border-swarm-border/50 overflow-y-auto p-2.5 space-y-1 bg-white/[0.01]">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer font-medium ${
                    active
                      ? "bg-swarm-gold/15 text-swarm-goldHi border border-swarm-gold/30 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <Icon size={14} className={`flex-shrink-0 ${active ? "text-swarm-gold" : "text-zinc-400"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto scrollbar-sleek p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}

