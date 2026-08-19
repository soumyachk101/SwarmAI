/**
 * @swarm/reports/core — Pure TypeScript report generation engine.
 *
 * Zero runtime dependencies (no Node.js, no React, no fs).
 * Can be tested without mocks, ported to any runtime.
 */

// ─── Status Enums ───────────────────────────────────────────────────────────

export type ReportStatus = "draft" | "pending_review" | "approved" | "rejected" | "archived";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "skipped";

export type ReportTemplateId =
 | "daily-standup"
 | "sprint-summary"
 | "security-audit"
 | "code-review"
 | "mission-report"
 | "agent-performance"
 | "custom";

// ─── Core Types ─────────────────────────────────────────────────────────────

/** A single approval entry in an approval chain. */
export interface ReportApproval {
 id: string;
 reviewerId: string;
 reviewerName: string;
 status: ApprovalStatus;
 comment?: string;
 reviewedAt?: number;
 /** Order in the chain — 0 = first reviewer. */
 order: number;
}

/** A section within a report body. */
export interface ReportSection {
 id: string;
 title: string;
 /** Markdown content of this section. */
 content: string;
 /** Optional metadata (agent that produced it, source file, etc.). */
 source?: string;
 /** Display order within the report. */
 order: number;
}

/** The body of a report — a list of ordered sections. */
export interface ReportBody {
 sections: ReportSection[];
 summary?: string;
}

/** The full report entity. */
export interface Report {
 id: string;
 title: string;
 templateId: ReportTemplateId;
 status: ReportStatus;

 /** Human-readable description of the report scope. */
 description?: string;

 body: ReportBody;
 approvals: ReportApproval[];

 /** Which workspace / project this belongs to. */
 projectPath: string;
 workspaceId?: string;
 /** Project name (last segment of projectPath). */
 projectName: string;

 /** Tags for categorization and filtering. */
 tags: string[];

 /** The agent(s) that contributed to this report. */
 contributorIds: string[];

 /** Final approval timestamp. */
 finalizedAt?: number;
 /** Who finalized (approved) it. */
 finalizedBy?: string;

 createdAt: number;
 updatedAt: number;
}

// ─── Aggregation Inputs ─────────────────────────────────────────────────────

/** One agent session, fed from Pheromone. */
export interface AgentSessionInput {
 id: string;
 agentType: string;
 agentName: string;
 title: string;
 preview?: string;
 messageCount?: number;
 branch?: string;
 timestamp: number;
 /** Raw terminal output excerpt. */
 output?: string;
 /** Session outcome: success, error, partial. */
 outcome?: "success" | "error" | "partial";
}

/** One board card, fed from the task board. */
export interface BoardCardInput {
 id: string;
 title: string;
 description: string;
 column: string;
 assignedRole?: string;
 assignedCli?: string;
 createdAt: number;
 updatedAt: number;
 /** Blocking reason if any. */
 blockingReason?: string;
 /** Files this card owns. */
 owns?: string[];
 /** Files this card reads. */
 reads?: string[];
}

/** One git commit, fed from git log. */
export interface GitCommitInput {
 hash: string;
 shortHash: string;
 author: string;
 message: string;
 timestamp: number;
 /** Files changed in this commit. */
 filesChanged?: string[];
 /** Added / removed line counts. */
 additions?: number;
 deletions?: number;
}

/** Aggregated data from all sources for report generation. */
export interface ReportAggregation {
 /** Agent sessions since a given timestamp. */
 sessions: AgentSessionInput[];
 /** Board cards (current state). */
 cards: BoardCardInput[];
 /** Git commits since a given timestamp. */
 commits: GitCommitInput[];
 /** Project-level metadata. */
 projectName: string;
 projectPath: string;
 /** Time window for the report. */
 fromTimestamp: number;
 toTimestamp: number;
 /** Optional custom data (e.g., security scan results). */
 customData?: Record<string, unknown>;
}

// ─── Template Definition ────────────────────────────────────────────────────

export interface ReportTemplate {
 id: ReportTemplateId;
 name: string;
 description: string;
 icon: string;
 /** Sections this template generates by default. */
 defaultSections: TemplateSection[];
 /** Whether this template requires approval before publishing. */
 requiresApproval: boolean;
 /** Default approval chain length (0 = no approval needed). */
 defaultApprovalChain: number;
}

export interface TemplateSection {
 title: string;
 /** Which aggregation source(s) feed this section. */
 source: "sessions" | "cards" | "commits" | "custom" | "summary";
 /** Optional filter on the source data. */
 filter?: string;
 /** Markdown template for the section body. Uses {{variable}} syntax. */
 bodyTemplate: string;
}

// ─── Builder / Engine ───────────────────────────────────────────────────────

export interface ReportBuildOptions {
 templateId: ReportTemplateId;
 title: string;
 description?: string;
 projectPath: string;
 workspaceId?: string;
 tags?: string[];
 /** Custom sections appended after template sections. */
 customSections?: TemplateSection[];
 /** Pre-fill the body with existing content (for re-generation). */
 existingBody?: ReportBody;
}

export interface ReportEngine {
 /** Build a new report from aggregated data. */
 buildReport(data: ReportAggregation, options: ReportBuildOptions): Report;
 /** Append a section to an existing draft. */
 addSection(report: Report, section: ReportSection): Report;
 /** Update section content. */
 updateSection(report: Report, sectionId: string, content: string): Report;
 /** Transition a report through its lifecycle. */
 transitionStatus(report: Report, newStatus: ReportStatus, actorId?: string, comment?: string): Report;
 /** Add a reviewer to the approval chain. */
 addApprover(report: Report, reviewerId: string, reviewerName: string, order: number): Report;
 /** Record an approval decision. */
 recordApproval(report: Report, approvalId: string, status: ApprovalStatus, comment?: string): Report;
 /** Get available templates. */
 getTemplates(): ReportTemplate[];
 /** Get a specific template. */
 getTemplate(id: ReportTemplateId): ReportTemplate | undefined;
 /** Serialize report to Markdown. */
 toMarkdown(report: Report): string;
 /** Serialize report to JSON. */
 toJSON(report: Report): string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function newReportId(): string {
 return `rpt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newSectionId(): string {
 return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newApprovalId(): string {
 return `appr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
