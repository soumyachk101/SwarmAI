"use client";

import { useState } from "react";
import {
 X,
 CheckCircle2,
 XCircle,
 Send,
 MessageSquare,
 ChevronDown,
 ChevronRight,
 Copy,
 Download,
 ArrowLeft,
 Archive,
} from "lucide-react";
import type { Report, ReportSection, ReportApproval, ReportStatus } from "../core/types.js";

// ─── Status Helpers ─────────────────────────────────────────────────────────

const STATUS_FLOW: Record<ReportStatus, { next: ReportStatus[]; label: string }> = {
 draft: { next: ["pending_review", "archived"], label: "Submit for Review" },
 pending_review: { next: ["approved", "rejected", "draft"], label: "Submit for Review" },
 approved: { next: ["archived"], label: "Archive" },
 rejected: { next: ["draft", "archived"], label: "Revise (Back to Draft)" },
 archived: { next: [], label: "Archived" },
};

const STATUS_META: Record<ReportStatus, { color: string; bg: string }> = {
 draft: { color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
 pending_review: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
 approved: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
 rejected: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
 archived: { color: "text-zinc-500", bg: "bg-zinc-500/5 border-zinc-500/10" },
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ReportViewerProps {
 report: Report;
 /** Called when the user wants to go back to the list. */
 onBack: () => void;
 /** Transition the report to a new status. */
 onTransitionStatus: (reportId: string, status: ReportStatus) => void;
 /** Record an approval decision. */
 onRecordApproval: (reportId: string, approvalId: string, status: "approved" | "rejected", comment?: string) => void;
 /** Copy report markdown to clipboard. */
 onCopy: (content: string) => void;
}

export function ReportViewer({
 report,
 onBack,
 onTransitionStatus,
 onRecordApproval,
 onCopy,
}: ReportViewerProps) {
 const [comment, setComment] = useState("");
 const [showApprovalForm, setShowApprovalForm] = useState<string | null>(null);
 const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");

 const mdContent = reportToMarkdown(report);
 const statusMeta = STATUS_META[report.status];

 const handleSubmitApproval = (approvalId: string) => {
 if (!comment.trim()) return;
 onRecordApproval(report.id, approvalId, approvalAction, comment.trim());
 setComment("");
 setShowApprovalForm(null);
 };

 const canAct =
 report.status === "pending_review" &&
 report.approvals.some((a) => a.status === "pending" && a.reviewerId === "");

 return (
 <div className="h-full flex flex-col bg-zinc-950/40 overflow-hidden">
 {/* Toolbar */}
 <div className="shrink-0 border-b border-zinc-800/80 bg-zinc-950/70 px-3 py-2 flex items-center gap-2">
 <button
 onClick={onBack}
 className="size-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 title="Back to reports"
 >
 <ArrowLeft className="size-3.5" />
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

 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={() => onCopy(mdContent)}
 className="size-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 title="Copy as Markdown"
 >
 <Copy className="size-3.5" />
 </button>
 <button
 onClick={() => downloadMarkdown(report)}
 className="size-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 title="Download .md"
 >
 <Download className="size-3.5" />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto scrollbar-sleek">
 <div className="max-w-2xl mx-auto px-6 py-6">
 {/* Report body sections */}
 <div className="space-y-6">
 {report.body.sections.map((section) => (
 <ReportSectionBlock key={section.id} section={section} />
 ))}
 </div>

 {/* Approval chain section */}
 <div className="mt-10 pt-6 border-t border-zinc-800/60">
 <h3 className="text-sm font-bold text-zinc-200 mb-4">
 Approval Chain
 </h3>
 <div className="space-y-2">
 {report.approvals.map((approval, idx) => (
 <ApprovalRow
 key={approval.id}
 approval={approval}
 index={idx}
 reportStatus={report.status}
 showForm={showApprovalForm === approval.id}
 onApprove={() => {
 setApprovalAction("approved");
 setShowApprovalForm(approval.id);
 }}
 onReject={() => {
 setApprovalAction("rejected");
 setShowApprovalForm(approval.id);
 }}
 onCancelForm={() => setShowApprovalForm(null)}
 onSubmitComment={() => handleSubmitApproval(approval.id)}
 comment={comment}
 onCommentChange={setComment}
 />
 ))}
 </div>

 {/* Status transition actions */}
 {STATUS_FLOW[report.status].next.length > 0 && (
 <div className="mt-4 flex flex-wrap gap-2">
 {STATUS_FLOW[report.status].next.includes("pending_review") && (
 <button
 onClick={() => onTransitionStatus(report.id, "pending_review")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors"
 >
 <Send className="size-3" />
 Submit for Review
 </button>
 )}
 {STATUS_FLOW[report.status].next.includes("approved") && (
 <button
 onClick={() => onTransitionStatus(report.id, "approved")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
 >
 <CheckCircle2 className="size-3" />
 Approve
 </button>
 )}
 {STATUS_FLOW[report.status].next.includes("rejected") && (
 <button
 onClick={() => onTransitionStatus(report.id, "rejected")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/20 transition-colors"
 >
 <XCircle className="size-3" />
 Reject
 </button>
 )}
 {STATUS_FLOW[report.status].next.includes("draft") && (
 <button
 onClick={() => onTransitionStatus(report.id, "draft")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-300 text-xs font-medium hover:bg-zinc-500/20 transition-colors"
 >
 <ArrowLeft className="size-3" />
 Back to Draft
 </button>
 )}
 {STATUS_FLOW[report.status].next.includes("archived") && (
 <button
 onClick={() => onTransitionStatus(report.id, "archived")}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-xs font-medium hover:bg-zinc-500/20 transition-colors"
 >
 <Archive className="size-3" />
 Archive
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}

// ─── Section Block ──────────────────────────────────────────────────────────

function ReportSectionBlock({ section }: { section: ReportSection }) {
 const [expanded, setExpanded] = useState(true);

 return (
 <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
 <button
 onClick={() => setExpanded(!expanded)}
 className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-zinc-800/30 transition-colors"
 >
 {expanded ? (
 <ChevronDown className="size-3.5 text-zinc-500 shrink-0" />
 ) : (
 <ChevronRight className="size-3.5 text-zinc-500 shrink-0" />
 )}
 <h4 className="text-xs font-semibold text-zinc-300">{section.title}</h4>
 {section.source && (
 <span className="text-[9px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded-sm">
 {section.source}
 </span>
 )}
 </button>
 {expanded && (
 <div className="px-4 pb-4 pt-1">
 <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono/90">
 {section.content}
 </div>
 </div>
 )}
 </div>
 );
}

// ─── Approval Row ───────────────────────────────────────────────────────────

interface ApprovalRowProps {
 approval: ReportApproval;
 index: number;
 reportStatus: ReportStatus;
 showForm: boolean;
 onApprove: () => void;
 onReject: () => void;
 onCancelForm: () => void;
 onSubmitComment: () => void;
 comment: string;
 onCommentChange: (v: string) => void;
}

function ApprovalRow({
 approval,
 showForm,
 onApprove,
 onReject,
 onCancelForm,
 onSubmitComment,
 comment,
 onCommentChange,
}: ApprovalRowProps) {
 const isPending = approval.status === "pending";
 const isDecided = !isPending;

 return (
 <div
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
 {isDecided && approval.reviewedAt
 ? new Date(approval.reviewedAt).toLocaleString()
 : "Awaiting review"}
 </span>
 </div>

 {isDecided && approval.comment && (
 <div className="mt-2 text-[11px] text-zinc-400 italic bg-zinc-800/30 rounded px-2 py-1.5">
 "{approval.comment}"
 </div>
 )}

 {isPending && showForm && (
 <div className="mt-3 space-y-2 animate-fade-in">
 <textarea
 value={comment}
 onChange={(e) => onCommentChange(e.target.value)}
 placeholder="Add a comment..."
 rows={2}
 className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-swarm-gold/50 resize-none"
 autoFocus
 />
 <div className="flex items-center gap-2">
 <button
 onClick={onApprove}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
 >
 <CheckCircle2 className="size-3" />
 Approve
 </button>
 <button
 onClick={onReject}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-medium hover:bg-red-500/25 transition-colors"
 >
 <XCircle className="size-3" />
 Reject
 </button>
 <button
 onClick={onCancelForm}
 className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {isPending && !showForm && (
 <button
 onClick={onApprove}
 className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/15 text-amber-300 text-[10px] font-medium hover:bg-amber-500/20 transition-colors"
 >
 <MessageSquare className="size-3" />
 Review & Decide
 </button>
 )}
 </div>
 );
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function reportToMarkdown(report: Report): string {
 const lines: string[] = [];
 lines.push(`# ${report.title}`);
 lines.push("");
 lines.push(`> **Status:** ${report.status.replace("_", " ")}`);
 lines.push(`> **Template:** ${report.templateId}`);
 lines.push(`> **Created:** ${new Date(report.createdAt).toLocaleString()}`);
 lines.push("");
 lines.push("---");
 lines.push("");

 for (const section of report.body.sections) {
 lines.push(`## ${section.title}`);
 lines.push("");
 lines.push(section.content);
 lines.push("");
 lines.push("---");
 lines.push("");
 }

 for (const a of report.approvals) {
 const icon = a.status === "approved" ? "✅" : a.status === "rejected" ? "❌" : "⏳";
 lines.push(`- ${icon} **${a.reviewerName}** — ${a.status}${a.comment ? `: "${a.comment}"` : ""}`);
 }

 return lines.join("\n");
}

function downloadMarkdown(report: Report): void {
 const md = reportToMarkdown(report);
 const blob = new Blob([md], { type: "text/markdown" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `${report.title.replace(/[^a-z0-9]/gi, "_")}.md`;
 a.click();
 URL.revokeObjectURL(url);
}
