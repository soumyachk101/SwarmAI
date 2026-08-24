"use client";

import { useState } from "react";
import {
  X,
  Layers,
  Bug,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useWorkspaceStore } from "@swarm/workspace";
import type { TaskCard } from "@swarm/tasks";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  icon: typeof Bug;
  description: string;
  tasks: Array<{ title: string; role: "builder" | "reviewer" | "scout" | "coordinator"; description: string }>;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: "bugfix",
    title: "Bug Fix & Verification Workflow",
    category: "Maintenance",
    icon: Bug,
    description: "Multi-agent loop: scout locates root cause, builder implements fix, reviewer verifies tests.",
    tasks: [
      { title: "Investigate and isolate bug root cause", role: "scout", description: "Search logs, inspect stack trace and identify faulty module." },
      { title: "Implement bug fix and regression test", role: "builder", description: "Apply code changes and ensure regression test case passes." },
      { title: "Code review & edge case audit", role: "reviewer", description: "Check edge cases, type safety and security impacts." },
    ],
  },
  {
    id: "feature",
    title: "Full-Stack Feature Implementation",
    category: "Development",
    icon: Sparkles,
    description: "End-to-end flow: lead coordinates, builder drafts UI & API, reviewer runs quality checks.",
    tasks: [
      { title: "Architecture breakdown & interface design", role: "coordinator", description: "Define data schemas, component contracts and subtasks." },
      { title: "Implement frontend components and styling", role: "builder", description: "Build interactive React UI matching design specs." },
      { title: "Implement backend logic and API endpoints", role: "builder", description: "Connect database and backend handlers." },
      { title: "End-to-end integration and UX audit", role: "reviewer", description: "Test the user flow end to end." },
    ],
  },
  {
    id: "security",
    title: "Security & Vulnerability Audit",
    category: "Safety",
    icon: ShieldCheck,
    description: "Deep audit of dependencies, inputs, auth tokens and file system access points.",
    tasks: [
      { title: "Scan dependencies and package configs", role: "scout", description: "Identify outdated or vulnerable packages." },
      { title: "Review auth flows and input sanitization", role: "reviewer", description: "Check SQL injection, XSS and path traversal vectors." },
      { title: "Generate audit report and remediation patch", role: "builder", description: "Draft report with security patch recommendations." },
    ],
  },
  {
    id: "refactor",
    title: "Codebase Exploration & Refactoring",
    category: "Architecture",
    icon: Compass,
    description: "Discover legacy patterns, decouple modules, and optimize bundle/build speed.",
    tasks: [
      { title: "Analyze dependency graph and circular imports", role: "scout", description: "Map out module interdependencies." },
      { title: "Refactor core modules to clean abstractions", role: "builder", description: "Extract reusable utilities and improve typing." },
      { title: "Verify backwards compatibility and benchmarks", role: "reviewer", description: "Confirm existing features and tests run without regression." },
    ],
  },
];

export default function TaskTemplatesModal({ open, onClose }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(TEMPLATES[0]);
  const [applied, setApplied] = useState(false);

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleApply = () => {
    if (!activeWorkspace) return;
    const now = Date.now();
    const newCards: TaskCard[] = selectedTemplate.tasks.map((t, idx) => ({
      id: `task-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title: t.title,
      description: t.description,
      column: "todo",
      sortOrder: (activeWorkspace.taskCards?.length ?? 0) + idx,
      assignedRole: t.role,
      owns: [],
      reads: [],
      dependsOn: [],
      createdAt: now,
      updatedAt: now,
    }));

    useWorkspaceStore.setState((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === activeWorkspaceId
          ? { ...w, taskCards: [...(w.taskCards ?? []), ...newCards] }
          : w
      ),
    }));

    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4">
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl glass-rail border border-swarm-gold/30 shadow-2xl overflow-hidden bg-swarm-canvas/95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-swarm-border/50 bg-swarm-surface/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-swarm-gold/15 border border-swarm-gold/30 flex items-center justify-center text-swarm-gold">
              <Layers className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-swarm-text flex items-center gap-2">
                Multi-Agent Task Templates
              </h2>
              <p className="text-micro text-swarm-textMuted">
                Instant pre-configured workflows tailored for builder, reviewer, and scout roles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-surface transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden min-h-[360px]">
          {/* Template Selection List */}
          <div className="w-72 border-r border-swarm-border/40 p-3 bg-swarm-surface/20 flex flex-col gap-2 overflow-y-auto shrink-0">
            <span className="text-micro uppercase font-semibold text-swarm-textMuted px-2 py-1">
              Select Template
            </span>
            {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isSel = selectedTemplate.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg text-left transition-all ${
                    isSel
                      ? "bg-swarm-gold/20 text-swarm-goldHi border border-swarm-gold/40 shadow-sm"
                      : "hover:bg-swarm-surface/60 text-swarm-textDim hover:text-swarm-text"
                  }`}
                >
                  <div className={`p-1.5 rounded-md shrink-0 ${isSel ? "bg-swarm-gold/20 text-swarm-goldHi" : "bg-swarm-surface text-swarm-textMuted"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{tmpl.title}</div>
                    <div className="text-micro text-swarm-textMuted line-clamp-1">{tmpl.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Template Preview */}
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto scrollbar-sleek">
            <div className="space-y-4">
              <div>
                <span className="text-micro font-mono uppercase text-swarm-goldHi bg-swarm-gold/10 px-2 py-0.5 rounded border border-swarm-gold/20">
                  {selectedTemplate.category}
                </span>
                <h3 className="text-base font-bold text-swarm-text mt-2">{selectedTemplate.title}</h3>
                <p className="text-xs text-swarm-textMuted mt-1">{selectedTemplate.description}</p>
              </div>

              <div className="space-y-2">
                <span className="text-micro font-semibold uppercase tracking-wider text-swarm-textDim">
                  Included Subtasks ({selectedTemplate.tasks.length})
                </span>

                <div className="space-y-2">
                  {selectedTemplate.tasks.map((task, i) => (
                    <div key={i} className="glass-inset rounded-lg p-3 border border-swarm-border/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-swarm-text flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-swarm-gold" />
                          {task.title}
                        </span>
                        <span className="text-micro uppercase font-semibold text-swarm-gold px-1.5 py-0.5 rounded bg-swarm-gold/10 border border-swarm-gold/20">
                          {task.role}
                        </span>
                      </div>
                      <p className="text-micro text-swarm-textMuted leading-relaxed">{task.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-swarm-border/30 flex justify-end">
              <button
                onClick={handleApply}
                disabled={applied}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-swarm-gold text-swarm-canvas hover:bg-swarm-goldHi text-xs font-bold transition-all shadow-md"
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Applied to Board!</span>
                  </>
                ) : (
                  <>
                    <span>Apply Template to Board</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
