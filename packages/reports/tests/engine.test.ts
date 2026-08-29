/**
 * Tests for the report engine core.
 */

import { describe, it, expect } from "vitest";
import { createReportEngine, BUILTIN_TEMPLATES } from "../src/core/engine.js";

describe("createReportEngine", () => {
 const engine = createReportEngine();

 // ─── Template Registry ─────────────────────────────────────────────────────

 describe("getTemplates", () => {
 it("returns all built-in templates", () => {
 const templates = engine.getTemplates();
 expect(templates.length).toBe(7);
 expect(templates.map((t) => t.id)).toEqual(
 expect.arrayContaining([
 "daily-standup",
 "sprint-summary",
 "security-audit",
 "code-review",
 "mission-report",
 "agent-performance",
 "custom",
 ])
 );
 });
 });

 describe("getTemplate", () => {
 it("returns a specific template by id", () => {
 const t = engine.getTemplate("daily-standup");
 expect(t).toBeDefined();
 expect(t?.name).toBe("Daily Standup");
 expect(t?.requiresApproval).toBe(true);
 expect(t?.defaultApprovalChain).toBe(1);
 });

 it("returns undefined for unknown template", () => {
 expect(engine.getTemplate("nonexistent" as any)).toBeUndefined();
 });
 });

 // ─── Report Building ───────────────────────────────────────────────────────

 describe("buildReport", () => {
 const now = Date.now();
 const day = 86400000;

 const sampleAggregation = {
 sessions: [
 {
 id: "s1",
 agentType: "claude-code",
 agentName: "Claude Lead",
 title: "Implemented auth module",
 preview: "Added JWT auth with refresh tokens",
 messageCount: 42,
 timestamp: now - day,
 outcome: "success" as const,
 },
 {
 id: "s2",
 agentType: "codex-cli",
 agentName: "Codex Worker",
 title: "Wrote stripe webhook tests",
 preview: "4 test cases for webhook retries",
 messageCount: 18,
 timestamp: now - day / 2,
 outcome: "success" as const,
 },
 ],
 cards: [
 {
 id: "c1",
 title: "Add JWT auth",
 description: "Implement JWT-based authentication",
 column: "done",
 assignedCli: "claude-code",
 assignedRole: "Steward",
 createdAt: now - day * 2,
 updatedAt: now - day,
 },
 {
 id: "c2",
 title: "Write Stripe webhook tests",
 description: "Unit tests for webhook handling",
 column: "done",
 assignedCli: "codex-cli",
 createdAt: now - day,
 updatedAt: now - day / 2,
 },
 {
 id: "c3",
 title: "Implement dark mode toggle",
 description: "Add dark mode support to settings",
 column: "in-progress",
 assignedRole: "Builder",
 createdAt: now - day / 2,
 updatedAt: now - day / 4,
 },
 {
 id: "c4",
 title: "Fix login redirect loop",
 description: "Users get stuck in redirect after login",
 column: "backlog",
 blockingReason: "Waiting for auth module merge",
 createdAt: now - day / 3,
 updatedAt: now - day / 3,
 },
 ],
 commits: [
 {
 hash: "abc123def456",
 shortHash: "abc123d",
 author: "Claude Lead",
 message: "feat: implement JWT auth with refresh tokens",
 timestamp: now - day,
 filesChanged: ["src/auth/token.service.ts", "src/auth/middleware.ts"],
 additions: 120,
 deletions: 5,
 },
 ],
 projectName: "my-app",
 projectPath: "/Users/dev/my-app",
 fromTimestamp: now - day * 2,
 toTimestamp: now,
 };

 it("builds a daily standup report", () => {
 const report = engine.buildReport(sampleAggregation, {
 templateId: "daily-standup",
 title: "Daily Standup - Aug 19",
 description: "Team progress and blockers",
 projectPath: "/Users/dev/my-app",
 tags: ["daily", "standup"],
 });

 expect(report.id).toBeTruthy();
 expect(report.title).toBe("Daily Standup - Aug 19");
 expect(report.status).toBe("draft");
 expect(report.templateId).toBe("daily-standup");
 expect(report.tags).toEqual(["daily", "standup"]);
 expect(report.body.sections.length).toBeGreaterThan(0);
 expect(report.approvals.length).toBe(1);
 expect(report.approvals[0].status).toBe("pending");
 });

 it("builds a sprint summary report", () => {
 const report = engine.buildReport(sampleAggregation, {
 templateId: "sprint-summary",
 title: "Sprint 12 Summary",
 projectPath: "/Users/dev/my-app",
 });

 expect(report.templateId).toBe("sprint-summary");
 expect(report.body.sections.length).toBeGreaterThanOrEqual(3);
 });

 it("builds a security audit report with 2-level approval chain", () => {
 const report = engine.buildReport(sampleAggregation, {
 templateId: "security-audit",
 title: "Security Audit - Auth Module",
 projectPath: "/Users/dev/my-app",
 });

 expect(report.templateId).toBe("security-audit");
 expect(report.approvals.length).toBe(2);
 expect(report.approvals[0].order).toBe(0);
 expect(report.approvals[1].order).toBe(1);
 });

 it("generates sections with filtered cards", () => {
 const report = engine.buildReport(sampleAggregation, {
 templateId: "daily-standup",
 title: "Test",
 projectPath: "/Users/dev/my-app",
 });

 // Should have a "Blockers" section that filters cards with blockingReason
 const blockersSection = report.body.sections.find((s) => s.title === "Blockers");
 expect(blockersSection).toBeDefined();
 expect(blockersSection!.content).toContain("login redirect loop");
 });

 it("extracts contributor IDs from sessions and cards", () => {
 const report = engine.buildReport(sampleAggregation, {
 templateId: "mission-report",
 title: "Mission Test",
 projectPath: "/Users/dev/my-app",
 });

 expect(report.contributorIds).toContain("s1");
 expect(report.contributorIds).toContain("claude-code");
 });
 });

 // ─── Section Management ────────────────────────────────────────────────────

 describe("addSection", () => {
 it("appends a section to a report", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 const beforeCount = report.body.sections.length;
 engine.addSection(report, {
 id: "sec-new",
 title: "Added Section",
 content: "Custom content here",
 source: "custom",
 order: report.body.sections.length,
 });

 expect(report.body.sections.length).toBe(beforeCount + 1);
 expect(report.body.sections[report.body.sections.length - 1].title).toBe("Added Section");
 });
 });

 describe("updateSection", () => {
 it("updates section content by id", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 // custom template has no default sections — add one
 engine.addSection(report, {
 id: "sec-1",
 title: "Intro",
 content: "Original content",
 source: "custom",
 order: 0,
 });

 const sectionId = report.body.sections[0].id;
 engine.updateSection(report, sectionId, "Updated content");

 expect(report.body.sections[0].content).toBe("Updated content");
 });
 });

 // ─── Status Transitions ────────────────────────────────────────────────────

 describe("transitionStatus", () => {
 it("transitions from draft to pending_review", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 expect(report.status).toBe("draft");
 const updated = engine.transitionStatus(report, "pending_review");
 expect(updated.status).toBe("pending_review");
 });

 it("transitions from pending_review to approved", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 const underReview = engine.transitionStatus(report, "pending_review");
 const approved = engine.transitionStatus(underReview, "approved", "user-1");
 expect(approved.status).toBe("approved");
 expect(approved.finalizedAt).toBeDefined();
 expect(approved.finalizedBy).toBe("user-1");
 });

 it("transitions from pending_review to rejected with comment", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 const underReview = engine.transitionStatus(report, "pending_review");
 const rejected = engine.transitionStatus(underReview, "rejected", "user-2", "Needs more detail");
 expect(rejected.status).toBe("rejected");
 const approval = rejected.approvals[0];
 expect(approval.status).toBe("rejected");
 expect(approval.comment).toBe("Needs more detail");
 });

 it("rejects invalid transitions", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 expect(() => engine.transitionStatus(report, "approved")).toThrow();
 });
 });

 // ─── Approval Management ───────────────────────────────────────────────────

 describe("addApprover", () => {
 it("adds an approver to the chain", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 const updated = engine.addApprover(report, "user-3", "Alice", 0);
 expect(updated.approvals.length).toBeGreaterThanOrEqual(1);
 expect(updated.approvals.some((a) => a.reviewerId === "user-3")).toBe(true);
 });

 it("does not add duplicate approvers", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 const once = engine.addApprover(report, "user-4", "Bob", 0);
 const twice = engine.addApprover(once, "user-4", "Bob", 1);
 expect(twice.approvals.filter((a) => a.reviewerId === "user-4").length).toBe(1);
 });
 });

 describe("recordApproval", () => {
 it("records an approval decision", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test" }
 );

 const underReview = engine.transitionStatus(report, "pending_review");
 const approvalId = underReview.approvals[0].id;
 const decided = engine.recordApproval(underReview, approvalId, "approved", "Looks good");

 expect(decided.approvals[0].status).toBe("approved");
 expect(decided.approvals[0].comment).toBe("Looks good");
 expect(decided.approvals[0].reviewedAt).toBeDefined();
 });

 it("auto-transitions to approved when all approvals are done", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test", customSections: [] }
 );

 // Manually add a 2-step approval chain
 let r = engine.addApprover(report, "r1", "Reviewer 1", 0);
 r = engine.addApprover(r, "r2", "Reviewer 2", 1);
 r = engine.transitionStatus(r, "pending_review");

 // First reviewer approves
 r = engine.recordApproval(r, r.approvals[0].id, "approved");
 expect(r.status).toBe("pending_review"); // still waiting for r2

 // Second reviewer approves — should auto-transition
 r = engine.recordApproval(r, r.approvals[1].id, "approved");
 expect(r.status).toBe("approved");
 });

 it("rejects if any reviewer rejects", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "Test", projectPath: "/test", customSections: [] }
 );

 let r = engine.addApprover(report, "r1", "Reviewer 1", 0);
 r = engine.addApprover(r, "r2", "Reviewer 2", 1);
 r = engine.transitionStatus(r, "pending_review");

 r = engine.recordApproval(r, r.approvals[0].id, "rejected", "Not good enough");
 expect(r.status).toBe("rejected");
 });
 });

 // ─── Serialization ─────────────────────────────────────────────────────────

 describe("toMarkdown", () => {
 it("produces valid markdown output", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test-project",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "My Report", projectPath: "/test" }
 );

 const md = engine.toMarkdown(report);
 expect(md).toContain("# My Report");
 expect(md).toContain("**Status:** Draft");
 expect(md).toContain("**Project:** test");
 });
 });

 describe("toJSON", () => {
 it("serializes to valid JSON", () => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: "test",
 projectPath: "/test",
 fromTimestamp: Date.now() - 1000,
 toTimestamp: Date.now(),
 },
 { templateId: "custom", title: "JSON Test", projectPath: "/test" }
 );

 const json = engine.toJSON(report);
 const parsed = JSON.parse(json);
 expect(parsed.title).toBe("JSON Test");
 expect(parsed.status).toBe("draft");
 expect(parsed.id).toBe(report.id);
 });
 });
});
