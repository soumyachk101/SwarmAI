/**
 * Report Engine — builds reports, manages lifecycle, handles approvals.
 *
 * Zero runtime dependencies. Pure TypeScript.
 */

import type {
 Report,
 ReportBody,
 ReportSection,
 ReportApproval,
 ReportStatus,
 ApprovalStatus,
 ReportAggregation,
 ReportBuildOptions,
 ReportTemplate,
} from "./types.js";
import { BUILTIN_TEMPLATES } from "./templates.js";
import {
 newReportId,
 newSectionId,
 newApprovalId,
} from "./types.js";

// ─── Internal helpers ────────────────────────────────────────────────────────

interface ApprovalEntry {
 id: string;
 reviewerId: string;
 reviewerName: string;
 status: ApprovalStatus;
 comment?: string;
 reviewedAt?: number;
 order: number;
}

const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
 draft: ["pending_review", "archived"],
 pending_review: ["approved", "rejected", "draft"],
 approved: ["archived"],
 rejected: ["draft", "archived"],
 archived: [],
};

// ─── Engine ─────────────────────────────────────────────────────────────────

export function createReportEngine(): {
 buildReport(data: ReportAggregation, options: ReportBuildOptions): Report;
 addSection(report: Report, section: ReportSection): Report;
 updateSection(report: Report, sectionId: string, content: string): Report;
 transitionStatus(report: Report, newStatus: ReportStatus, actorId?: string, comment?: string): Report;
 addApprover(report: Report, reviewerId: string, reviewerName: string, order: number): Report;
 recordApproval(report: Report, approvalId: string, status: ApprovalStatus, comment?: string): Report;
 getTemplates(): ReportTemplate[];
 getTemplate(id: string): ReportTemplate | undefined;
 toMarkdown(report: Report): string;
 toJSON(report: Report): string;
} {
 const templates = new Map<string, ReportTemplate>();
 for (const t of BUILTIN_TEMPLATES) {
 templates.set(t.id, t);
 }

 function buildSections(template: ReportTemplate, data: ReportAggregation): ReportSection[] {
 const sections: ReportSection[] = [];

 for (const tpl of template.defaultSections) {
 const content = renderSection(tpl, data);
 sections.push({
 id: newSectionId(),
 title: tpl.title,
 content,
 source: tpl.source,
 order: sections.length,
 });
 }

 return sections;
 }

 function renderSection(
 tpl: { source: string; filter?: string; bodyTemplate: string },
 data: ReportAggregation
 ): string {
 let ctx: Record<string, unknown> = {
 from: new Date(data.fromTimestamp).toLocaleDateString(),
 to: new Date(data.toTimestamp).toLocaleDateString(),
 projectName: data.projectName,
 projectPath: data.projectPath,
 };

 switch (tpl.source) {
 case "sessions":
 ctx.sessions = data.sessions.map((s) => ({
 agentName: s.agentName,
 agentType: s.agentType,
 preview: s.preview ?? "(no output)",
 outcome: s.outcome ?? "unknown",
 }));
 break;
 case "cards":
 ctx.cards = filterCards(data.cards, tpl.filter);
 break;
 case "commits": {
 const additions = data.commits.reduce((s, c) => s + (c.additions ?? 0), 0);
 const deletions = data.commits.reduce((s, c) => s + (c.deletions ?? 0), 0);
 ctx.commits = data.commits.map((c) => ({
 shortHash: c.shortHash,
 message: c.message,
 author: c.author,
 }));
 ctx.totalCommits = data.commits.length;
 ctx.totalAdditions = additions;
 ctx.totalDeletions = deletions;
 break;
 }
 case "summary": {
 const doneCards = data.cards.filter((c) => c.column === "done").length;
 const agentTypes = new Set(data.sessions.map((s) => s.agentType));
 ctx.totalCards = data.cards.length;
 ctx.completedCards = doneCards;
 ctx.agentCount = agentTypes.size;
 ctx.totalSessions = data.sessions.length;
 break;
 }
 }

 return renderTemplate(tpl.bodyTemplate, ctx);
 }

 function renderTemplate(template: string, ctx: Record<string, unknown>): string {
 let result = template;
 for (const [key, value] of Object.entries(ctx)) {
 if (Array.isArray(value)) {
 const replaced = (value as unknown[]).map((item) => {
 if (typeof item === "string") return item;
 const lines: string[] = [];
 for (const [, v] of Object.entries(item as Record<string, unknown>)) {
 if (v !== null && v !== undefined) lines.push(String(v));
 }
 return lines.join("\n");
 }).join("\n");
 result = result.replace(
 new RegExp(`\\{\\{#each ${key}\\}\\}[\\s\\S]*?\\{\\{/each\\}\\}`, "g"),
 replaced
 );
 }
 }
 for (const [key, value] of Object.entries(ctx)) {
 if (!Array.isArray(value) && typeof value === "string") {
 result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
 }
 }
 return result.trim();
 }

 function filterCards(
 cards: { column: string; blockingReason?: string; title: string }[],
 filter?: string
 ): Array<Record<string, unknown>> {
 if (!filter) return cards.map((c) => ({ title: c.title, column: c.column }));
 if (filter.startsWith("column:")) {
 const col = filter.slice(7);
 return cards.filter((c) => c.column === col).map((c) => ({ title: c.title, column: c.column }));
 }
 if (filter === "has:blockingReason") {
 return cards.filter((c) => c.blockingReason).map((c) => ({ title: c.title, blockingReason: c.blockingReason }));
 }
 return cards.map((c) => ({ title: c.title, column: c.column }));
 }

 function buildApprovalChain(count: number): ApprovalEntry[] {
 const approvals: ApprovalEntry[] = [];
 for (let i = 0; i < count; i++) {
 approvals.push({
 id: newApprovalId(),
 reviewerId: "",
 reviewerName: `Reviewer ${i + 1}`,
 status: "pending",
 order: i,
 });
 }
 return approvals;
 }

 function extractContributorIds(data: ReportAggregation): string[] {
 const ids: string[] = [];
 for (const s of data.sessions) ids.push(s.id);
 for (const c of data.cards) { if (c.assignedCli) ids.push(c.assignedCli); }
 return ids;
 }

 // ─── Public API ───────────────────────────────────────────────────────────

 return {
 buildReport(data: ReportAggregation, options: ReportBuildOptions): Report {
 const template = templates.get(options.templateId) ?? templates.get("custom")!;
 const now = Date.now();
 const sections = buildSections(template, data);
 const approvals = buildApprovalChain(template.defaultApprovalChain);

 const report: Report = {
 id: newReportId(),
 title: options.title,
 templateId: options.templateId,
 status: "draft",
 description: options.description,
 body: { sections },
 approvals: approvals as ReportApproval[],
 projectPath: options.projectPath,
 workspaceId: options.workspaceId,
 projectName: data.projectName ?? options.projectPath.split(/[\\/]/).filter(Boolean).pop() ?? "project",
 tags: options.tags ?? [template.id],
 contributorIds: extractContributorIds(data),
 createdAt: now,
 updatedAt: now,
 };

 if (options.customSections?.length) {
 for (const cs of options.customSections) {
 report.body.sections.push({
 id: newSectionId(),
 title: cs.title,
 content: renderTemplate(cs.bodyTemplate, { ...data, _sections: sections }),
 source: cs.source,
 order: report.body.sections.length,
 });
 }
 }

 return report;
 },

 addSection(report: Report, section: ReportSection): Report {
 report.body.sections.push(section);
 report.updatedAt = Date.now();
 return report;
 },

 updateSection(report: Report, sectionId: string, content: string): Report {
 report.body.sections = report.body.sections.map((s) =>
 s.id === sectionId ? { ...s, content } : s
 );
 report.updatedAt = Date.now();
 return report;
 },

 transitionStatus(report: Report, newStatus: ReportStatus, actorId?: string, comment?: string): Report {
 const allowed = STATUS_TRANSITIONS[report.status];
 if (!allowed.includes(newStatus)) {
 throw new Error(`Cannot transition report ${report.id} from ${report.status} to ${newStatus}`);
 }

 if (newStatus === "pending_review") {
 const realApprovals = report.approvals.filter((a) => (a as ApprovalEntry).reviewerId !== "");
 if (realApprovals.length === 0) {
 report.approvals.push({
 id: newApprovalId(),
 reviewerId: actorId ?? "system",
 reviewerName: "Pending Assignment",
 status: "pending",
 order: 0,
 } as ReportApproval);
 }
 }

 if (newStatus === "approved") {
 report.finalizedAt = Date.now();
 report.finalizedBy = actorId;
 for (const a of report.approvals) {
 if (a.status === "pending") (a as ApprovalEntry).status = "skipped";
 }
 }

 if (newStatus === "rejected" && comment) {
 const first = report.approvals.find((a) => (a as ApprovalEntry).status === "pending");
 if (first) {
 (first as ApprovalEntry).status = "rejected";
 (first as ApprovalEntry).comment = comment;
 (first as ApprovalEntry).reviewedAt = Date.now();
 }
 }

 (report as { status: ReportStatus }).status = newStatus;
 report.updatedAt = Date.now();
 return report;
 },

 addApprover(report: Report, reviewerId: string, reviewerName: string, order: number): Report {
 // Remove any auto-generated placeholder approvals when a real approver is added
 report.approvals = report.approvals.filter((a) => (a as ApprovalEntry).reviewerId !== "");
 if (report.approvals.some((a) => (a as ApprovalEntry).reviewerId === reviewerId)) return report;
 report.approvals.push({
 id: newApprovalId(),
 reviewerId,
 reviewerName,
 status: "pending",
 order,
 } as ReportApproval);
 report.updatedAt = Date.now();
 return report;
 },

 recordApproval(report: Report, approvalId: string, status: ApprovalStatus, comment?: string): Report {
 const approval = report.approvals.find((a) => a.id === approvalId);
 if (!approval) throw new Error(`Approval ${approvalId} not found`);
 const ap = approval as ApprovalEntry;
 if (ap.status !== "pending") throw new Error(`Approval already ${ap.status}`);

 ap.status = status;
 ap.comment = comment;
 ap.reviewedAt = Date.now();

 const realApprovals = report.approvals.filter((a) => (a as ApprovalEntry).reviewerId !== "");
 const anyRejected = realApprovals.some((a) => (a as ApprovalEntry).status === "rejected");
 const allApproved = realApprovals.every((a) => (a as ApprovalEntry).status === "approved");

 if (anyRejected) {
 (report as { status: ReportStatus }).status = "rejected";
 } else if (allApproved && realApprovals.length > 0) {
 (report as { status: ReportStatus }).status = "approved";
 report.finalizedAt = Date.now();
 }

 report.updatedAt = Date.now();
 return report;
 },

 getTemplates(): ReportTemplate[] {
 return Array.from(templates.values());
 },

 getTemplate(id: string): ReportTemplate | undefined {
 return templates.get(id);
 },

 toMarkdown(report: Report): string {
 const lines: string[] = [];
 lines.push(`# ${report.title}`);
 lines.push("");
 lines.push(`> **Status:** ${statusLabel(report.status)}`);
 lines.push(`> **Project:** ${report.projectName}`);
 lines.push(`> **Template:** ${templates.get(report.templateId)?.name ?? report.templateId}`);
 lines.push(`> **Created:** ${new Date(report.createdAt).toLocaleString()}`);
 if (report.description) lines.push(`> **Description:** ${report.description}`);
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

 lines.push("## Approvals");
 lines.push("");
 for (const a of report.approvals) {
 const ap = a as ApprovalEntry;
 lines.push(`- ${approvalIcon(ap.status)} **${ap.reviewerName}** — ${approvalLabel(ap.status)}`);
 if (ap.comment) lines.push(` > ${ap.comment}`);
 if (ap.reviewedAt) lines.push(` > *${new Date(ap.reviewedAt).toLocaleString()}*`);
 }
 lines.push("");

 if (report.tags.length) lines.push(`**Tags:** ${report.tags.join(", ")}`);

 return lines.join("\n");
 },

 toJSON(report: Report): string {
 return JSON.stringify(report, null, 2);
 },
 };
}

// ─── Display Helpers ────────────────────────────────────────────────────────

function statusLabel(status: ReportStatus): string {
 const labels: Record<ReportStatus, string> = {
 draft: "Draft",
 pending_review: "Pending Review",
 approved: "Approved",
 rejected: "Rejected",
 archived: "Archived",
 };
 return labels[status] ?? status;
}

function approvalLabel(status: ApprovalStatus): string {
 const labels: Record<ApprovalStatus, string> = {
 pending: "Pending",
 approved: "Approved",
 rejected: "Rejected",
 skipped: "Skipped",
 };
 return labels[status] ?? status;
}

function approvalIcon(status: ApprovalStatus): string {
 const icons: Record<ApprovalStatus, string> = {
 pending: "⏳",
 approved: "✅",
 rejected: "❌",
 skipped: "⏭️",
 };
 return icons[status] ?? "❓";
}
