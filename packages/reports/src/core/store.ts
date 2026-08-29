/**
 * Zustand store for reports state.
 *
 * Follows the same pattern as @swarm/agents and @swarm/workspace stores.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createReportEngine } from "./engine.js";
import type { Report, ReportStatus, ReportTemplateId, ReportApproval, ReportSection } from "./types.js";

// ─── Storage ────────────────────────────────────────────────────────────────

const storage = {
 getItem: (key: string) => {
 try {
 const item = localStorage.getItem(key);
 return item ? JSON.parse(item) : null;
 } catch { return null; }
 },
 setItem: (key: string, value: unknown) => {
 localStorage.setItem(key, JSON.stringify(value));
 },
 removeItem: (key: string) => {
 localStorage.removeItem(key);
 },
};

// ─── Store ──────────────────────────────────────────────────────────────────

interface ReportsState {
 reports: Report[];
 activeReportId: string | null;

 // Actions
 createReport: (templateId: ReportTemplateId, title: string, projectPath: string, workspaceId?: string) => Report;
 deleteReport: (reportId: string) => void;
 transitionStatus: (reportId: string, status: ReportStatus) => void;
 recordApproval: (reportId: string, approvalId: string, status: "approved" | "rejected", comment?: string) => void;
 addSection: (reportId: string, title: string, content: string) => void;
 updateSection: (reportId: string, sectionId: string, content: string) => void;
 addApprover: (reportId: string, reviewerId: string, reviewerName: string) => void;
 setActiveReport: (reportId: string | null) => void;
 getActiveReport: () => Report | undefined;
 /** Generate a report from aggregated project data. */
 buildFromAggregation: (
 templateId: ReportTemplateId,
 title: string,
 aggregation: {
 sessions: Report["contributorIds"];
 cards: { title: string; column: string; assignedCli?: string; blockingReason?: string }[];
 commits: { shortHash: string; message: string; author: string }[];
 },
 projectPath: string,
 workspaceId?: string
 ) => Report;
}

const engine = createReportEngine();

export const useReportsStore = create<ReportsState>()(
 persist(
 (set, get) => ({
 reports: [],
 activeReportId: null,

 createReport: (templateId, title, projectPath, workspaceId) => {
 const report = engine.buildReport(
 {
 sessions: [],
 cards: [],
 commits: [],
 projectName: projectPath.split(/[\\/]/).filter(Boolean).pop() ?? "project",
 projectPath,
 fromTimestamp: Date.now() - 86400000,
 toTimestamp: Date.now(),
 },
 {
 templateId,
 title,
 projectPath,
 workspaceId,
 }
 );

 set((s) => ({
 reports: [...s.reports, report],
 activeReportId: report.id,
 }));
 return report;
 },

 deleteReport: (reportId) => {
 set((s) => ({
 reports: s.reports.filter((r) => r.id !== reportId),
 activeReportId: s.activeReportId === reportId ? null : s.activeReportId,
 }));
 },

 transitionStatus: (reportId, status) => {
 set((s) => ({
 reports: s.reports.map((r) =>
 r.id === reportId ? engine.transitionStatus(r, status) : r
 ),
 }));
 },

 recordApproval: (reportId, approvalId, status, comment) => {
 set((s) => ({
 reports: s.reports.map((r) =>
 r.id === reportId ? engine.recordApproval(r, approvalId, status, comment) : r
 ),
 }));
 },

 addSection: (reportId, title, content) => {
 set((s) => ({
 reports: s.reports.map((r) => {
 if (r.id !== reportId) return r;
 const section = {
 id: `sec-${crypto.randomUUID()}`,
 title,
 content,
 source: "custom" as const,
 order: r.body.sections.length,
 };
 return engine.addSection(r, section);
 }),
 }));
 },

 updateSection: (reportId, sectionId, content) => {
 set((s) => ({
 reports: s.reports.map((r) =>
 r.id === reportId ? engine.updateSection(r, sectionId, content) : r
 ),
 }));
 },

 addApprover: (reportId, reviewerId, reviewerName) => {
 set((s) => ({
 reports: s.reports.map((r) =>
 r.id === reportId ? engine.addApprover(r, reviewerId, reviewerName, r.approvals.length) : r
 ),
 }));
 },

 setActiveReport: (reportId) => {
 set({ activeReportId: reportId });
 },

 getActiveReport: () => {
 const state = get();
 return state.reports.find((r) => r.id === state.activeReportId);
 },

 buildFromAggregation: (templateId, title, aggregation, projectPath, workspaceId) => {
 const report = engine.buildReport(
 {
 sessions: aggregation.sessions.map((id) => ({
 id,
 agentType: "unknown",
 agentName: id,
 title: "Session",
 timestamp: Date.now(),
 outcome: "success" as const,
 })),
 cards: aggregation.cards.map((c) => ({
 id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
 title: c.title,
 description: c.title,
 column: c.column,
 assignedCli: c.assignedCli,
 blockingReason: c.blockingReason,
 createdAt: Date.now(),
 updatedAt: Date.now(),
 })),
 commits: aggregation.commits.map((c) => ({
 hash: c.shortHash,
 shortHash: c.shortHash,
 author: c.author,
 message: c.message,
 timestamp: Date.now(),
 additions: 0,
 deletions: 0,
 })),
 projectName: projectPath.split(/[\\/]/).filter(Boolean).pop() ?? "project",
 projectPath,
 fromTimestamp: Date.now() - 86400000,
 toTimestamp: Date.now(),
 },
 { templateId, title, projectPath, workspaceId }
 );

 set((s) => ({
 reports: [...s.reports, report],
 activeReportId: report.id,
 }));
 return report;
 },
 }),
 {
 name: "swarm-reports-storage",
 storage,
 }
 )
);
