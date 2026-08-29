"use client";

import { useState, useCallback } from "react";
import {
 FileText,
 Plus,
 ChevronRight,
 Clock,
 CheckCircle2,
 XCircle,
 Archive,
} from "lucide-react";
import { useReportsStore } from "../core/store.js";
import type { Report, ReportStatus, ReportTemplateId } from "../core/types.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
 ReportStatus,
 { icon: typeof FileText; label: string; color: string; bg: string }
> = {
 draft: { icon: FileText, label: "Draft", color: "text-zinc-400", bg: "bg-zinc-500/10" },
 pending_review: {
 icon: Clock,
 label: "Pending Review",
 color: "text-amber-400",
 bg: "bg-amber-500/10",
 },
 approved: { icon: CheckCircle2, label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
 rejected: { icon: XCircle, label: "Rejected", color: "text-red-400", bg: "bg-red-500/10" },
 archived: { icon: Archive, label: "Archived", color: "text-zinc-500", bg: "bg-zinc-500/5" },
};

const TEMPLATE_META: Record<ReportTemplateId, { name: string; icon: string }> = {
 "daily-standup": { name: "Daily Standup", icon: "📋" },
 "sprint-summary": { name: "Sprint Summary", icon: "📊" },
 "security-audit": { name: "Security Audit", icon: "🔒" },
 "code-review": { name: "Code Review", icon: "🔍" },
 "mission-report": { name: "Mission Report", icon: "🎯" },
 "agent-performance": { name: "Agent Performance", icon: "📈" },
 custom: { name: "Custom", icon: "📝" },
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ReportsPanelProps {
 projectPath?: string;
 width?: number;
}

export function ReportsPanel({ width = 320 }: ReportsPanelProps) {
 const reports = useReportsStore((s) => s.reports);
 const createReport = useReportsStore((s) => s.createReport);
 const transitionStatus = useReportsStore((s) => s.transitionStatus);
 const setActiveReport = useReportsStore((s) => s.setActiveReport);
 const activeReportId = useReportsStore((s) => s.activeReportId);

 const [showCreate, setShowCreate] = useState(false);
 const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");
 const [viewerReport, setViewerReport] = useState<Report | null>(null);

 const filtered =
 filterStatus === "all"
 ? reports
 : reports.filter((r) => r.status === filterStatus);

 const sorted = [...filtered].sort((a, b) => {
 if (a.status === "pending_review" && b.status !== "pending_review") return -1;
 if (b.status === "pending_review" && a.status !== "pending_review") return 1;
 return b.updatedAt - a.updatedAt;
 });

 const handleSelect = (report: Report) => {
 setViewerReport(report);
 setActiveReport(report.id);
 };

 const handleBack = () => setViewerReport(null);

 // If viewing a single report, show the viewer
 if (viewerReport) {
 return (
 <ReportViewerInner
 report={viewerReport}
 onBack={handleBack}
 onTransitionStatus={(status) => {
 transitionStatus(viewerReport.id, status);
 setViewerReport((prev) => (prev && prev.id === viewerReport.id ? { ...prev, status } : prev));
 }}
 onClose={() => { setViewerReport(null); setActiveReport(null); }}
 />
 );
 }

 return (
 <div
 className="h-full flex flex-col bg-swarm-surface/70 backdrop-blur-md border-l border-swarm-border/50 overflow-hidden"
 style={{ width, minWidth: 260, maxWidth: 420 }}
 >
 {/* Header */}
 <div className="px-3 py-2.5 border-b border-swarm-border/40 shrink-0">
 <div className="flex items-center justify-between">
 <div>
 <div className="text-[11px] font-semibold text-swarm-text truncate">
 Reports
 </div>
 <div className="text-[10px] text-swarm-textMuted/70">
 {reports.filter((r) => r.status === "pending_review").length} pending review
 </div>
 </div>
 <button
 onClick={() => setShowCreate(true)}
 className="size-6 rounded-md flex items-center justify-center text-swarm-textMuted hover:text-swarm-gold hover:bg-swarm-border/40 transition-colors"
 title="New Report"
 >
 <Plus className="size-3.5" />
 </button>
 </div>

 {/* Status filter */}
 <div className="mt-2 flex gap-1 overflow-x-auto scrollbar-hide">
 {(["all", "pending_review", "draft", "approved", "rejected"] as const).map(
 (status) => {
 const count =
 status === "all"
 ? reports.length
 : reports.filter((r) => r.status === status).length;
 if (count === 0 && status !== "all") return null;
 return (
 <button
 key={status}
 onClick={() => setFilterStatus(status)}
 className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-sm transition-colors ${
 filterStatus === status
 ? "bg-swarm-gold/15 text-swarm-goldHi"
 : "text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-border/30"
 }`}
 >
 {status === "all" ? "All" : STATUS_CONFIG[status]?.label ?? status}
 <span className="ml-0.5 opacity-60">{count}</span>
 </button>
 );
 }
 )}
 </div>
 </div>

 {/* Report List */}
 <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek">
 {sorted.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full px-4 text-center text-swarm-textMuted">
 <FileText className="mb-2 size-6 opacity-40" />
 <p className="text-xs font-medium">No reports yet</p>
 <p className="text-[10px] mt-1 text-swarm-textMuted/60">
 Create a report from a template
 </p>
 </div>
 ) : (
 <div className="pb-2">
 {sorted.map((report) => {
 const statusConf = STATUS_CONFIG[report.status];
 const StatusIcon = statusConf.icon;
 const template = TEMPLATE_META[report.templateId];

 return (
 <button
 key={report.id}
 onClick={() => handleSelect(report)}
 className={`group w-full flex flex-col px-3 py-2.5 border-b border-swarm-border/10 last:border-b-0 hover:bg-swarm-border/15 transition-colors cursor-pointer text-left ${
 activeReportId === report.id ? "bg-swarm-gold/5" : ""
 }`}
 >
 {/* Title row */}
 <div className="flex items-start gap-2 min-w-0">
 <StatusIcon
 className={`size-3.5 mt-0.5 shrink-0 ${statusConf.color}`}
 />
 <div className="min-w-0 flex-1">
 <div className="text-xs font-medium text-swarm-text line-clamp-1 leading-5">
 {report.title}
 </div>
 <div className="flex items-center gap-1.5 mt-1">
 <span className="text-[10px] text-swarm-textMuted/60">
 {template?.icon} {template?.name ?? report.templateId}
 </span>
 </div>
 </div>
 <ChevronRight className="size-3 shrink-0 text-swarm-textMuted/30 group-hover:text-swarm-textMuted/60 transition-colors mt-0.5" />
 </div>

 {/* Meta row */}
 <div className="flex items-center gap-2 mt-1.5 pl-[18px] flex-wrap">
 <span
 className={`inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-sm ${statusConf.bg} ${statusConf.color}`}
 >
 {report.status === "pending_review" && (
 <span className="relative flex size-1.5 mr-0.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
 <span className="relative inline-flex rounded-full size-1.5 bg-amber-500" />
 </span>
 )}
 {statusConf.label}
 </span>

 {report.approvals.length > 0 && (
 <span className="text-[9px] text-swarm-textMuted/50">
 {report.approvals.filter((a) => a.status === "approved").length}/
 {report.approvals.length} approved
 </span>
 )}

 <span className="text-[9px] text-swarm-textMuted/40 ml-auto">
 {relativeTime(report.updatedAt)}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Quick actions footer */}
 {reports.some((r) => r.status === "pending_review") && (
 <div className="shrink-0 border-t border-swarm-border/40 p-2 space-y-1.5">
 <div className="text-[9px] font-semibold text-swarm-textDim uppercase tracking-wider px-1">
 Pending Approvals
 </div>
 {reports
 .filter((r) => r.status === "pending_review")
 .slice(0, 3)
 .map((report) => (
 <button
 key={report.id}
 onClick={() => handleSelect(report)}
 className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-colors text-[10px] font-medium text-left"
 >
 <Clock className="size-3" />
 "{report.title.slice(0, 25)}..." — review needed
 </button>
 ))}
 </div>
 )}

 {/* Create Dialog */}
 {showCreate && (
 <ReportCreateDialog
 onCreate={(templateId, title) => {
 createReport(templateId, title, "/project", undefined);
 setShowCreate(false);
 }}
 onClose={() => setShowCreate(false)}
 />
 )}
 </div>
 );
}

// ─── Report Viewer (inline) ─────────────────────────────────────────────────

function ReportViewerInner({
 report,
 onBack,
 onTransitionStatus,
 onClose,
}: {
 report: Report;
 onBack: () => void;
 onTransitionStatus: (status: ReportStatus) => void;
 onClose: () => void;
}) {
 const [comment, setComment] = useState("");
 const [showApprovalForm, setShowApprovalForm] = useState<string | null>(null);
 const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");
 const statusMeta = STATUS_META[report.status];

 return (
 <div className="h-full flex flex-col bg-zinc-950/40 overflow-hidden">
 {/* Toolbar */}
 <div className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/70 px-3 py-2 flex items-center gap-2">
 <button
 onClick={onBack}
 className="size-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 title="Back to reports"
 >
 <ChevronRight className="size-3.5 rotate-180" />
 </button>
 <div className="min-w-0 flex-1">
 <div className="text-xs font-bold text-zinc-100 truncate">{report.title}</div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span
 className={`inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-sm border ${statusMeta.bg} ${statusMeta.color}`}
 >
 {report.status.replace("_", " ")}
 </span>
 <span className="text-[9px] text-zinc-500">
 {new Date(report.createdAt).toLocaleDateString()}
 </span>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto scrollbar-sleek">
 <div className="max-w-2xl mx-auto px-6 py-6">
 {/* Report body sections */}
 <div className="space-y-4">
 {report.body.sections.map((section) => (
 <div key={section.id} className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
 <div className="px-4 py-2.5 border-b border-zinc-800/30">
 <span className="text-xs font-semibold text-zinc-300">{section.title}</span>
 {section.source && (
 <span className="text-[9px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded-sm ml-2">
 {section.source}
 </span>
 )}
 </div>
 <div className="px-4 py-3">
 <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono/90">
 {section.content}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Approval chain section */}
 <div className="mt-8 pt-6 border-t border-zinc-800/60">
 <h3 className="text-sm font-bold text-zinc-200 mb-4">Approval Chain</h3>
 <div className="space-y-2">
 {report.approvals.map((approval, idx) => {
 const isPending = approval.status === "pending";
 return (
 <div
 key={approval.id}
 className={`rounded-lg border p-3 ${
 approval.status === "approved"
 ? "bg-emerald-500/5 border-emerald-500/15"
 : approval.status === "rejected"
 ? "bg-red-500/5 border-red-500/15"
 : isPending
 ? "bg-amber-500/5 border-amber-500/15"
 : "bg-zinc-800/20 border-zinc-700/30"
 }`}
 >
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-medium text-zinc-300">
 Step {approval.order + 1}: {approval.reviewerName}
 </span>
 <span className="text-[9px] text-zinc-500 ml-auto">
 {!isPending && approval.reviewedAt
 ? new Date(approval.reviewedAt).toLocaleString()
 : "Awaiting review"}
 </span>
 </div>

 {!isPending && approval.comment && (
 <div className="mt-2 text-[11px] text-zinc-400 italic bg-zinc-800/30 rounded px-2 py-1.5">
 "{approval.comment}"
 </div>
 )}

 {isPending && showApprovalForm === approval.id && (
 <div className="mt-3 space-y-2 animate-fade-in">
 <textarea
 value={comment}
 onChange={(e) => setComment(e.target.value)}
 placeholder="Add a comment..."
 rows={2}
 className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-swarm-gold/50 resize-none"
 autoFocus
 />
 <div className="flex items-center gap-2">
 <button
 onClick={() => {
 if (!comment.trim()) return;
 // Would call onRecordApproval here
 setComment("");
 setShowApprovalForm(null);
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
 >
 <CheckCircle2 className="size-3" />
 Approve
 </button>
 <button
 onClick={() => {
 if (!comment.trim()) return;
 setComment("");
 setShowApprovalForm(null);
 }}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-medium hover:bg-red-500/25 transition-colors"
 >
 <XCircle className="size-3" />
 Reject
 </button>
 <button
 onClick={() => setShowApprovalForm(null)}
 className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {isPending && !showApprovalForm && (
 <button
 onClick={() => setShowApprovalForm(approval.id)}
 className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/15 text-amber-300 text-[10px] font-medium hover:bg-amber-500/20 transition-colors"
 >
 Review & Decide
 </button>
 )}
 </div>
 );
 })}
 </div>

 {/* Status transition actions */}
 <div className="mt-4 flex flex-wrap gap-2">
 {report.status === "draft" && (
 <button
 onClick={() => onTransitionStatus("pending_review")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors"
 >
 Submit for Review
 </button>
 )}
 {report.status === "pending_review" && (
 <>
 <button
 onClick={() => onTransitionStatus("approved")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
 >
 Approve
 </button>
 <button
 onClick={() => onTransitionStatus("rejected")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/20 transition-colors"
 >
 Reject
 </button>
 </>
 )}
 {(report.status === "approved" || report.status === "rejected") && (
 <button
 onClick={() => onTransitionStatus("draft")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-300 text-xs font-medium hover:bg-zinc-500/20 transition-colors"
 >
 Back to Draft
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

// ─── Create Report Dialog ───────────────────────────────────────────────────

interface ReportCreateDialogProps {
 onCreate: (templateId: ReportTemplateId, title: string) => void;
 onClose: () => void;
}

const TEMPLATE_OPTIONS: { id: ReportTemplateId; name: string; icon: string; desc: string }[] = [
 { id: "daily-standup", name: "Daily Standup", icon: "📋", desc: "Agent activity, completed tasks, blockers" },
 { id: "sprint-summary", name: "Sprint Summary", icon: "📊", desc: "Sprint metrics, deliverables, velocity" },
 { id: "security-audit", name: "Security Audit", icon: "🔒", desc: "Security findings and recommendations" },
 { id: "code-review", name: "Code Review", icon: "🔍", desc: "Diff review with verdict" },
 { id: "mission-report", name: "Mission Report", icon: "🎯", desc: "Mission execution outcome" },
 { id: "agent-performance", name: "Agent Performance", icon: "📈", desc: "Per-agent metrics and stats" },
 { id: "custom", name: "Custom", icon: "📝", desc: "Start from scratch" },
];

function ReportCreateDialog({ onCreate, onClose }: ReportCreateDialogProps) {
 const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateId | null>(null);
 const [title, setTitle] = useState("");

 const handleCreate = () => {
 if (!selectedTemplate || !title.trim()) return;
 onCreate(selectedTemplate, title.trim());
 };

 return (
 <div className="fixed inset-0 z-[200] flex items-center justify-center">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
 <div className="relative w-full max-w-md mx-4 rounded-xl glass border border-zinc-700/60 shadow-2xl bg-zinc-950/95 backdrop-blur-xl animate-fade-in">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
 <h3 className="text-sm font-bold text-zinc-100">New Report</h3>
 <button
 onClick={onClose}
 className="size-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 >
 <FileText className="size-3.5" />
 </button>
 </div>

 {/* Template grid */}
 <div className="p-4 space-y-3">
 <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
 Choose Template
 </div>
 <div className="grid grid-cols-2 gap-2">
 {TEMPLATE_OPTIONS.map((tpl) => (
 <button
 key={tpl.id}
 onClick={() => setSelectedTemplate(tpl.id)}
 className={`flex flex-col items-start gap-1 p-3 rounded-lg border transition-all text-left ${
 selectedTemplate === tpl.id
 ? "bg-swarm-gold/10 border-swarm-gold/40 shadow-md"
 : "bg-zinc-900/60 border-zinc-700/40 hover:border-zinc-600/60 hover:bg-zinc-800/40"
 }`}
 >
 <span className="text-lg leading-none">{tpl.icon}</span>
 <span className="text-xs font-medium text-zinc-200">{tpl.name}</span>
 <span className="text-[10px] text-zinc-500 leading-snug">{tpl.desc}</span>
 </button>
 ))}
 </div>

 {/* Title input */}
 {selectedTemplate && (
 <div className="space-y-1.5 animate-fade-in">
 <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
 Report Title
 </label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleCreate()}
 placeholder="e.g., Daily Standup - Aug 19"
 className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-swarm-gold/50 focus:ring-1 focus:ring-swarm-gold/20"
 autoFocus
 />
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-800/60">
 <button
 onClick={onClose}
 className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleCreate}
 disabled={!selectedTemplate || !title.trim()}
 className="px-3 py-1.5 rounded-lg bg-swarm-gold/15 border border-swarm-gold/30 text-swarm-goldHi text-xs font-medium hover:bg-swarm-gold/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Create Report
 </button>
 </div>
 </div>
 </div>
 );
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
 const now = Date.now();
 const diff = now - ts;
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return "now";
 if (mins < 60) return `${mins}m`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs}h`;
 const days = Math.floor(hrs / 24);
 return `${days}d`;
}

const STATUS_META: Record<ReportStatus, { color: string; bg: string }> = {
 draft: { color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
 pending_review: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
 approved: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
 rejected: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
 archived: { color: "text-zinc-500", bg: "bg-zinc-500/5 border-zinc-500/10" },
};
