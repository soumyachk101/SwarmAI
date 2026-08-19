/**
 * Built-in report templates.
 */

import type { ReportTemplate } from "./types.js";

export const BUILTIN_TEMPLATES: ReportTemplate[] = [
 {
 id: "daily-standup",
 name: "Daily Standup",
 description: "What agents did yesterday, what they're doing today, blockers",
 icon: "📋",
 defaultSections: [
 {
 title: "Agent Activity Summary",
 source: "summary",
 bodyTemplate:
 "# Agent Activity Summary\n\n" +
 "**Period:** {{from}} → {{to}}\n\n" +
 "{{#each sessions}}\n" +
 "- **{{agentName}}** ({{agentType}}): {{outcome}} — {{preview}}\n" +
 "{{/each}}\n",
 },
 {
 title: "Completed Tasks",
 source: "cards",
 filter: "column:done",
 bodyTemplate:
 "# Completed Tasks\n\n" +
 "{{#each cards}}\n" +
 "- ✅ **{{title}}** — completed by {{assignedCli}}\n" +
 "{{/each}}\n",
 },
 {
 title: "In Progress",
 source: "cards",
 filter: "column:in-progress",
 bodyTemplate:
 "# In Progress\n\n" +
 "{{#each cards}}\n" +
 "- 🔄 **{{title}}** — assigned to {{assignedRole}}\n" +
 "{{/each}}\n",
 },
 {
 title: "Blockers",
 source: "cards",
 filter: "has:blockingReason",
 bodyTemplate:
 "# Blockers\n\n" +
 "{{#each cards}}\n" +
 "- 🚫 **{{title}}**: {{blockingReason}}\n" +
 "{{/each}}\n",
 },
 ],
 requiresApproval: true,
 defaultApprovalChain: 1,
 },
 {
 id: "sprint-summary",
 name: "Sprint Summary",
 description: "Sprint-level overview with metrics, velocity, and outcomes",
 icon: "📊",
 defaultSections: [
 {
 title: "Sprint Overview",
 source: "summary",
 bodyTemplate:
 "# Sprint Summary\n\n" +
 "**Sprint:** {{sprintName}}\n" +
 "**Period:** {{from}} → {{to}}\n" +
 "**Total Tasks:** {{totalCards}}\n" +
 "**Completed:** {{completedCards}}\n" +
 "**Agents Active:** {{agentCount}}\n",
 },
 {
 title: "Key Deliverables",
 source: "cards",
 filter: "column:done",
 bodyTemplate:
 "# Key Deliverables\n\n" +
 "{{#each cards}}\n" +
 "- ✅ **{{title}}**\n" +
 "{{/each}}\n",
 },
 {
 title: "Velocity Metrics",
 source: "commits",
 bodyTemplate:
 "# Velocity Metrics\n\n" +
 "**Commits:** {{totalCommits}}\n" +
 "**Lines Added:** {{totalAdditions}}\n" +
 "**Lines Removed:** {{totalDeletions}}\n" +
 "**Files Changed:** {{uniqueFilesChanged}}\n",
 },
 ],
 requiresApproval: true,
 defaultApprovalChain: 1,
 },
 {
 id: "security-audit",
 name: "Security Audit",
 description: "Security-focused review findings and recommendations",
 icon: "🔒",
 defaultSections: [
 {
 title: "Audit Scope",
 source: "summary",
 bodyTemplate:
 "# Security Audit\n\n" +
 "**Auditor:** {{leadName}}\n" +
 "**Period:** {{from}} → {{to}}\n" +
 "**Scope:** {{projectName}}\n",
 },
 {
 title: "Findings",
 source: "custom",
 bodyTemplate:
 "# Findings\n\n" +
 "{{#each findings}}\n" +
 "### {{severity}}: {{title}}\n\n" +
 "{{description}}\n\n" +
 "**Recommendation:** {{recommendation}}\n\n" +
 "---\n" +
 "{{/each}}\n",
 },
 {
 title: "Recommendations",
 source: "custom",
 bodyTemplate:
 "# Recommendations\n\n" +
 "{{#each recommendations}}\n" +
 "{{.}}\n" +
 "{{/each}}\n",
 },
 ],
 requiresApproval: true,
 defaultApprovalChain: 2,
 },
 {
 id: "code-review",
 name: "Code Review",
 description: "Review of diffs and changes made by agents",
 icon: "🔍",
 defaultSections: [
 {
 title: "Review Summary",
 source: "summary",
 bodyTemplate:
 "# Code Review\n\n" +
 "**Reviewer:** {{reviewerName}}\n" +
 "**Period:** {{from}} → {{to}}\n" +
 "**Commits Reviewed:** {{totalCommits}}\n",
 },
 {
 title: "Changes",
 source: "commits",
 bodyTemplate:
 "# Changes\n\n" +
 "{{#each commits}}\n" +
 "- **{{shortHash}}** — {{message}} ({{author}})\n" +
 "{{/each}}\n",
 },
 {
 title: "Review Verdict",
 source: "custom",
 bodyTemplate:
 "# Review Verdict\n\n" +
 "**Status:** {{verdict}}\n\n" +
 "{{notes}}\n",
 },
 ],
 requiresApproval: true,
 defaultApprovalChain: 1,
 },
 {
 id: "mission-report",
 name: "Mission Report",
 description: "High-level mission execution report from Lead agent",
 icon: "🎯",
 defaultSections: [
 {
 title: "Mission Outcome",
 source: "summary",
 bodyTemplate:
 "# Mission Report\n\n" +
 "**Mission:** {{missionTitle}}\n" +
 "**Lead:** {{leadName}}\n" +
 "**Status:** {{status}}\n" +
 "**Agents Deployed:** {{agentCount}}\n" +
 "**Duration:** {{duration}}\n",
 },
 {
 title: "Agent Contributions",
 source: "sessions",
 bodyTemplate:
 "# Agent Contributions\n\n" +
 "{{#each sessions}}\n" +
 "## {{agentName}} ({{agentType}})\n\n" +
 "{{output}}\n\n" +
 "**Outcome:** {{outcome}}\n\n" +
 "---\n" +
 "{{/each}}\n",
 },
 {
 title: "Deliverables",
 source: "cards",
 filter: "column:done",
 bodyTemplate:
 "# Deliverables\n\n" +
 "{{#each cards}}\n" +
 "- ✅ **{{title}}**\n" +
 "{{/each}}\n",
 },
 ],
 requiresApproval: true,
 defaultApprovalChain: 1,
 },
 {
 id: "agent-performance",
 name: "Agent Performance",
 description: "Performance metrics and statistics for each agent",
 icon: "📈",
 defaultSections: [
 {
 title: "Performance Overview",
 source: "summary",
 bodyTemplate:
 "# Agent Performance\n\n" +
 "**Period:** {{from}} → {{to}}\n" +
 "**Total Agents:** {{totalAgents}}\n" +
 "**Total Sessions:** {{totalSessions}}\n",
 },
 {
 title: "Agent Breakdown",
 source: "sessions",
 bodyTemplate:
 "# Agent Breakdown\n\n" +
 "{{#each agentGroups}}\n" +
 "## {{name}}\n\n" +
 "- Sessions: {{count}}\n" +
 "- Avg messages: {{avgMessages}}\n" +
 "- Success rate: {{successRate}}%\n\n" +
 "{{/each}}\n",
 },
 ],
 requiresApproval: false,
 defaultApprovalChain: 0,
 },
 {
 id: "custom",
 name: "Custom Report",
 description: "Start from scratch and build your own report",
 icon: "📝",
 defaultSections: [],
 requiresApproval: true,
 defaultApprovalChain: 1,
 },
];
