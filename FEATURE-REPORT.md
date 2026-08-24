# Swarm AI — Comprehensive Feature & Improvement Report

**Date:** 2026-08-24 
**Scope:** Multi-agent AI orchestration platform (Tauri desktop app, React, Node.js, Rust) 
**Goal:** Identify modifications and new features that make the platform more developer-friendly, user-friendly, and impactful for agent assignment workflows

---

## Executive Summary

Swarm AI already has a strong foundation — shared project memory (Pheromone), git worktree isolation, Lead planner, SwarmMind orchestrator, and 10+ CLI agent adapters. This report identifies **high-impact improvements** across 6 categories:

| Category | Priority Features | Expected Impact |
|----------|------------------|-----------------|
| **Agent Assignment UX** | Natural language task creation, visual agent pairing, one-click dispatch | High — reduces friction at the core workflow |
| **Observability & Transparency** | Real-time agent status dashboard, live log streaming, progress indicators | High — developer trust and debugging |
| **Safety & Guardrails** | Granular permission model, approval gates, audit logs, sandboxing | Critical — fixes C-1/C-2 from audit |
| **Collaboration Features** | Agent-to-agent messaging UI, handoff visualization, shared notes | Medium — improves multi-agent coordination |
| **Productivity Enhancements** | Task templates, agent presets, keyboard shortcuts, batch operations | Medium — speeds up repeat workflows |
| **Developer Experience** | Better error messages, recovery flows, offline mode, plugin marketplace | Medium — reduces cognitive load |

---

## Part 1: Critical Fixes (Block These Before Adding Features)

From the existing AUDIT-REPORT.md, these must be addressed first:

### 1.1 Fix Hardcoded `bypassPermissions` (CRITICAL)
- **Problem:** Every spawned agent gets ALL permission gates removed — no audit trail, no opt-in
- **Fix:** Make permission mode configurable per-task. Default to standard mode. Add an explicit `--allow-dangerous` flag the user must manually enable
- **Impact:** Security vulnerability fix; also improves UX by making agent behavior predictable

### 1.2 Fix Lead MCP Sync Polling Loop (CRITICAL)
- **Problem:** `readFileSync` in a 150ms loop blocks the Node event loop
- **Fix:** Use `fs.watch()` or `fswatch` event-driven approach for message polling
- **Impact:** App performance under load; eliminates hangs when WebSocket/IPC operations compete for the thread

### 1.3 Fix Path Injection on Windows (HIGH)
- **Problem:** `execSync` with string interpolation in `whisper-cpp.ts` allows command injection
- **Fix:** Use `execFileSync` with argument array
- **Impact:** Security fix for Windows users

---

## Part 2: Agent Assignment UX Improvements

### 2.1 Natural Language Task Creation (HIGH Priority)

**Current state:** Users type goals into Lead dock → Lead breaks them down → shows draft cards → user approves → SwarmMind dispatches.

**Improvement:** Allow users to create tasks directly in natural language without waiting for Lead:
- Quick-add input on the Board: "Fix the login timeout bug in auth.service.ts"
- Auto-suggest: CLI agent, role (builder/reviewer/scout), and affected files
- One-click confirmation dispatches immediately

**Why it matters:** Reduces the Lead dependency for simple tasks. Users who know what they want shouldn't need an AI planner as an intermediary.

### 2.2 Visual Agent Pairing & Task Cards (HIGH Priority)

**Current state:** Task cards show basic info (title, status, description).

**Improvement:**
- Show assigned agent avatar/icon on each card
- Color-code by role (Builder=green, Reviewer=blue, Scout=amber, Coordinator=purple)
- Dependency lines between cards (visual graph of task relationships)
- Progress bar per task (agent output tokens, files changed, elapsed time)

**Why it matters:** At a glance, developers understand who's doing what and which tasks block others. This is the #1 UX pattern in tools like Linear and Jira that developers already know.

### 2.3 One-Click Reassign / Re-prioritize (MEDIUM Priority)

**Current state:** Tasks flow through a fixed pipeline: Backlog → Todo → In Progress → Review → Done.

**Improvement:**
- Drag-and-drop reassignment between agents (not just columns)
- Priority slider on each card (P0/P1/P2/P3)
- Quick "move to top of queue" button
- Blocked-on indicator (shows which dependency is holding this task)

**Why it matters:** Real projects need dynamic re-prioritization. Static pipelines break when something urgent comes in.

### 2.4 Agent Workload Balancing (MEDIUM Priority)

**Current state:** SwarmMind dispatches based on file locks and dependencies, not agent capacity.

**Improvement:**
- Show agent workload (tasks assigned, tokens used, time active)
- SwarmMind auto-balances: if Agent A has 3 tasks and Agent B has 0, prefer B for new tasks
- "Busy" indicator on agent panes when they're actively processing

**Why it matters:** Prevents one agent from becoming a bottleneck while others idle.

---

## Part 3: Observability & Transparency

### 3.1 Real-Time Agent Status Dashboard (HIGH Priority)

**Current state:** Agents appear as terminal panes. Status is visible only by watching the pane.

**Improvement:**
- Dedicated "Swarm" plane showing all active agents in a grid
- Per-agent: status badge (idle/thinking/writing/error), task name, elapsed time, tokens used
- Click to expand → shows last 5 actions, current file being edited
- Global view: total tasks, completion rate, estimated time to finish

**Why it matters:** Developers need to know "is the swarm making progress?" without watching 6 terminal panes. This is the single most requested feature in multi-agent tools.

### 3.2 Live Log Streaming & Search (HIGH Priority)

**Current state:** Agent output streams to terminal panes only. No centralized logging.

**Improvement:**
- Central log view that captures output from ALL agents
- Filter by agent, task, log level (info/warning/error)
- Search across all agent logs with Pheromone (existing search infrastructure)
- Pin/unpin important log entries
- Export logs for debugging

**Why it matters:** When something goes wrong, developers need to find the error across multiple agents. Terminal panes make this impossible at scale.

### 3.3 Agent Thought Visualization (MEDIUM Priority)

**Current state:** Agent reasoning is hidden inside the terminal.

**Improvement:**
- When Claude Code (or other agents) emits thinking blocks, surface them in a collapsible panel
- Show "Currently planning..." / "Writing file X..." / "Running test Y" as structured status updates
- Parse agent output for tool calls (Read, Write, Bash, Edit) and display as an action timeline

**Why it matters:** Developers want to understand agent reasoning without reading full terminal output. This reduces anxiety about what agents are doing.

### 3.4 Diff Preview Before Merge (MEDIUM Priority)

**Current state:** SwarmMind merges worktrees automatically after approval. Diff is generated but not visually presented.

**Improvement:**
- Side-by-side diff view before merge approval
- Per-file diff with syntax highlighting
- "Accept all" / "Review file by file" / "Reject" buttons
- Show which agent wrote each change

**Why it matters:** The #1 developer concern is "what did this agent change?" A visual diff before merge builds trust.

---

## Part 4: Safety & Guardrails (Beyond the Audit Fixes)

### 4.1 Granular Permission Modes (HIGH Priority)

**Current state:** Binary — either bypassPermissions or not.

**Improvement:**
- 4 permission levels per agent:
 - **Read-only:** Can read files, search, but not write or execute
 - **Workspace:** Can read/write within the project folder only
 - **Network-allowed:** Can also make HTTP requests (for API calls)
 - **Full access:** Can run shell commands, install packages, modify system
- Per-task permission assignment (task board shows current permission level)
- Permission escalation requires user approval with one-click button

**Why it matters:** Different tasks need different trust levels. A "scout" agent should never have write access. A "builder" shouldn't run arbitrary shell commands without approval.

### 4.2 Human-in-the-Loop Checkpoints (MEDIUM Priority)

**Current state:** Human approves the plan once, then agents run autonomously.

**Improvement:**
- Configurable checkpoints: agent pauses after N tool calls, after file writes, or at task completion
- "Approve / Modify / Cancel" options at each checkpoint
- Suggested action preview: "Agent wants to run `npm test` — approve?"

**Why it matters:** Especially for longer tasks, developers want to steer the agent mid-flight without killing the whole process.

### 4.3 Rollback & Recovery (MEDIUM Priority)

**Current state:** If a merge goes wrong, developer must manually fix.

**Improvement:**
- Auto-commit before each agent starts work
- One-click rollback to pre-agent state
- Agent session replay: re-run the agent's actions step by step
- Failed task → automatic branch preservation with clear label

**Why it matters:** Developers need confidence that they can undo anything an agent does. Without rollback, they'll never trust agents with real code.

### 4.4 Sandboxed Execution Environment (MEDIUM Priority)

**Current state:** Agents run with full system access (via bypassPermissions).

**Improvement:**
- Option to run agents in a containerized sandbox (Docker/Podman)
- Network restrictions: block external connections for read-only agents
- Filesystem sandbox: agents can only access the project directory
- Auto-cleanup: sandbox destroyed when agent finishes

**Why it matters:** For teams or less-trusted agents, sandboxing prevents accidental (or malicious) system changes.

---

## Part 5: Collaboration Features

### 5.1 Agent Messaging UI (MEDIUM Priority)

**Current state:** Agents communicate via file-based handoffs and JSONL message bus. No visual interface.

**Improvement:**
- Show message bus activity in real-time
- Click on a message → see full handoff content
- Agent-to-agent messages appear as notification cards
- Thread view: follow a conversation between two agents

**Why it matters:** The message bus exists but is invisible. Making it visible helps developers understand how agents coordinate.

### 5.2 Shared Scratchpad / Whiteboard (LOW-MEDIUM Priority)

**Current state:** Agents share memory via Pheromone, but there's no shared scratch space.

**Improvement:**
- Shared markdown scratchpad per project
- Agents can read/write to scratchpad (like a shared notebook)
- Human can pin important notes that all agents see
- Scratchpad changes appear as live updates

**Why it matters:** Sometimes you want to jot a quick note ("don't touch the auth module") that every agent should see. Pheromone is for structured knowledge; scratchpad is for ephemeral context.

### 5.3 Agent Profile & Specialization (LOW-MEDIUM Priority)

**Current state:** All agents are generic — same capabilities regardless of task.

**Improvement:**
- Create named agent profiles: "Frontend Specialist", "Test Writer", "Security Reviewer"
- Each profile has: preferred CLI, role, file patterns it owns, tool permissions
- Profiles persist across sessions and can be shared between projects
- Auto-suggest profile based on task description

**Why it matters:** In real teams, people specialize. Giving agents specializations improves quality and reduces conflicts.

---

## Part 6: Productivity Enhancements

### 6.1 Task Templates (MEDIUM Priority)

**Current state:** Every task is created fresh from Lead's decomposition.

**Improvement:**
- Save task configurations as templates: "Bug fix workflow", "Feature implementation", "Code review"
- Templates include: CLI agent, role, permission level, required steps
- One-click template application: select template, fill in description, dispatch
- Community templates (import/export)

**Why it matters:** Developers repeat the same workflows. Templates reduce setup time from minutes to seconds.

### 6.2 Keyboard-Driven Workflow (MEDIUM Priority)

**Current state:** Mouse-heavy UI for task management and agent dispatch.

**Improvement:**
- Command palette (Cmd+K) for all actions:
 - "Create task: fix login bug"
 - "Dispatch all ready tasks"
 - "Approve task #3"
 - "Switch to Agent 2 pane"
- Keyboard shortcuts for board navigation (j/k to move between cards, Enter to expand)
- Voice commands for common actions (via existing Whisper infrastructure)

**Why it matters:** Developers prefer keyboard-driven workflows. A command palette is the #1 UX pattern in developer tools (VS Code, Linear, Slack).

### 6.3 Batch Operations (LOW-MEDIUM Priority)

**Current state:** One task at a time for approve/reject/retry.

**Improvement:**
- Select multiple tasks → batch approve/reject
- "Approve all ready" button
- Bulk reassign tasks to different agents
- "Retry all failed tasks" with one click

**Why it matters:** When you have 10 tasks in review, approving one by one is tedious.

### 6.4 Smart Notifications (LOW Priority)

**Current state:** No notification system for agent events.

**Improvement:**
- Desktop notification when: agent finishes, task needs review, agent encounters error
- Notification grouping: "3 tasks completed" instead of 3 separate notifications
- Quiet hours: don't notify during focus time
- Per-agent notification preferences

**Why it matters:** Developers shouldn't have to watch the board constantly. Smart notifications let them focus and get alerted only when action is needed.

---

## Part 7: Plugin & Extension Ecosystem

### 7.1 Plugin Marketplace (LOW-MEDIUM Priority)

**Current state:** SwarmPlugins registry exists but no UI for browsing/installing.

**Improvement:**
- Marketplace pane with categories: "Productivity", "Agents", "Integrations", "Themes"
- One-click install from marketplace
- Plugin ratings and reviews
- Auto-update for installed plugins

**Why it matters:** An ecosystem drives adoption. If developers can extend Swarm AI with custom agents, workflows, and integrations, the platform becomes more valuable.

### 7.2 VS Code Extension Improvements (LOW Priority)

**Current state:** Extension exists but is private and basic.

**Improvement:**
- Two-way sync: open file in Swarm AI → opens in VS Code
- Agent suggestions in VS Code: "Run Swarm AI on current file"
- Status bar integration: show task status, agent activity
- Command palette integration for VS Code users

**Why it matters:** Many developers live in VS Code. Tight integration reduces context switching.

---

## Part 8: Data & Analytics

### 8.1 Session Analytics Dashboard (LOW Priority)

**Current state:** No analytics on how the platform is used.

**Improvement:**
- Track: tasks completed per session, agent success rate, average task duration, token usage
- Weekly/monthly reports: productivity trends, most-used agents, common failure modes
- Comparison: "You completed 23 tasks this week, 15% more than last week"
- Export data for personal analysis

**Why it matters:** Data-driven insights help developers optimize their workflow and understand where agents help most.

---

## Prioritized Implementation Roadmap

### Phase 1 — Foundation (Week 1-2)
**Must fix before production use**
1. Fix C-1: Granular permission model (replace bypassPermissions)
2. Fix C-2: Event-driven MCP polling (replace sync readFile loop)
3. Fix H-7: Path injection in whisper-cpp.ts
4. Fix H-3: Encrypt API keys in localStorage

### Phase 2 — Core UX (Week 3-4)
**Highest developer impact**
5. Real-time agent status dashboard (3.1)
6. Live log streaming & search (3.2)
7. Diff preview before merge (3.4)
8. Natural language task creation (2.1)
9. Visual agent pairing on task cards (2.2)

### Phase 3 — Safety & Trust (Week 5-6)
**Build developer confidence**
10. Granular permission modes (4.1)
11. Human-in-the-loop checkpoints (4.2)
12. Rollback & recovery (4.3)
13. Diff preview before merge (3.4 — moved here for safety focus)

### Phase 4 — Collaboration (Week 7-8)
**Enable team-scale usage**
14. Agent messaging UI (5.1)
15. Agent workload balancing (2.4)
16. Agent profiles & specialization (5.3)
17. Task templates (6.1)

### Phase 5 — Polish (Week 9-10)
**Productivity and ecosystem**
18. Keyboard-driven workflow / command palette (6.2)
19. Batch operations (6.3)
20. Smart notifications (6.4)
21. Plugin marketplace UI (7.1)

---

## Quick Wins (Implement in 1-2 Days Each)

These are small changes with outsized impact:

| Feature | Effort | Impact |
|---------|--------|--------|
| Agent status emoji in pane titles (🟢 idle / 🟡 thinking / 🔴 error) | 2 hours | High — immediate visibility |
| Task card progress indicators (tokens, time, files changed) | 4 hours | High — transparency |
| Keyboard shortcut for "Dispatch all ready tasks" | 2 hours | Medium — power user delight |
| Color-coded task cards by role | 3 hours | Medium — visual clarity |
| Desktop notification on task completion | 3 hours | Medium — async workflow support |
| "New Task" button on the Board | 2 hours | Medium — reduces friction |
| Agent pane labels with task name | 1 hour | Low-Medium — context awareness |
| Recent agents dropdown for quick re-launch | 3 hours | Low-Medium — speed |

---

## Summary: Top 10 Features by Developer Impact

1. **Real-time agent dashboard** — See what the swarm is doing at a glance
2. **Granular permissions** — Trust agents appropriately per task
3. **Diff preview before merge** — Review changes before they hit your codebase
4. **Live log streaming** — Debug multi-agent workflows without 6 terminal panes
5. **Natural language task creation** — Skip the planner when you know what you want
6. **Rollback & recovery** — Confidence to let agents touch your code
7. **Agent messaging UI** — Understand how agents coordinate
8. **Task templates** — Repeat workflows in seconds
9. **Keyboard-driven workflow** — Power user speed
10. **Checkpoint approvals** — Steer agents mid-flight

---

## Sources

- Swarm AI README and architecture docs (project source)
- CrewAI documentation on multi-agent orchestration patterns
- Industry UX patterns from Linear, VS Code, and modern developer tools
- Security best practices for AI agent permission models
- Observability patterns from distributed systems and multi-agent frameworks
