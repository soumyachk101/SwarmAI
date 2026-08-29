# Swarm AI — Comprehensive Codebase Analysis Report

**Date:** 2026-08-28 
**Analyzer:** Claude Opus 5 (1M context) 
**Repository:** `/Users/soumyachakraborty/Documents/Projects-939/AI-Agents/swarm-ai` 
**Repo type:** pnpm monorepo · Tauri desktop app · 14 workspace packages

---

## Executive Summary

Swarm AI is a Tauri desktop application for multi-agent AI coding orchestration. It manages 10 CLI coding agents (Claude Code, Codex, Aider, Cursor, etc.) through a unified pane-based UI, using git worktrees for isolation and a pheromone memory system for cross-agent handoffs. The codebase is functional and ambitious but carries **4 critical security vulnerabilities**, **6 high-severity bugs**, and **significant architectural debt** around ports-and-adapters boundaries. The single highest-impact fix is routing whisper-cpp process spawning through Tauri commands (currently uses `child_process` directly from the renderer). Overall health: **62/100** — productive for internal use, not ready for public distribution.

---

## 1. Architecture Assessment

### 1.1 Package Structure

| Package | Role | Tech |
|---------|------|------|
| `swarm` | App shell (React UI) | React 18, Vite, xterm.js |
| `swarmmind` | Orchestrator (core logic) | TypeScript, ports-and-adapters |
| `agents` | CLI agent adapters + PTY | TypeScript, zustand v5 |
| `lead` | Planning / goal breakdown | TypeScript |
| `pheromone` | Memory, search, injection | TypeScript, sql.js WASM |
| `voice` | Whisper STT | TypeScript |
| `workspace` | Git worktree management | TypeScript |
| `tasks` | Task board | TypeScript, **React 19** |
| `swarmplugins` | Plugin system | TypeScript, React |
| `swarmextension` | VS Code extension | TypeScript |
| `flow` | Canvas | TypeScript |
| `board` | UI primitives | TypeScript, React |
| `reports` | Reporting | TypeScript |

### 1.2 Critical: React Version Conflict

**`tasks/package.json`** lists `react: ^19.0.0` while **every other package** uses `react: ^18.3.0`. This will cause:

- Hook incompatibilities if `tasks` components receive React 18 internals
- Duplicate React copies in the bundle (breaking context, refs, and concurrent features)
- Build failures or silent runtime bugs depending on bundler resolution

**Fix:** Align all packages to React 18 (`^18.3.0`). Upgrade the monoreo together when ready.

### 1.3 Ports-and-Adapt ers Pattern

`swarmmind` correctly defines side-effect interfaces in `ports.ts`:

- `WorktreeOps` — git worktree operations (Node impl in `node.ts`, Tauri impl in `tauri/worktree.ts`)
- `HandoffFs` — filesystem surface for handoff files (minimal: mkdir, writeFile, readFile, readDir)
- `joinPath()` — forward-slash path joining (deliberately not `node:path`)

**Gap:** `pheromone/src/memory/index.ts` and `pheromone/src/plans/index.ts` import `node:fs` and `node:path` directly. This breaks renderer compatibility. The `db/index.ts` also uses `node:fs` directly. These three files need a `FileSystemPort` abstraction (same pattern as `HandoffFs`) with a `NodeFileSystem` implementation.

### 1.4 Build System

- pnpm workspaces + turbo for build orchestration ✓
- TypeScript project references partially configured
- Tauri v2 for desktop packaging ✓
- Vite configs are per-package (not shared), which leads to divergent bundler settings

---

## 2. Security Findings

### 2.1 CRITICAL: Renderer Process Spawns Child Processes (whisper-cpp.ts)

**File:** `voice/src/engine/whisper-cpp.ts` 
**Severity:** CRITICAL

The WhisperCppEngine uses `child_process.spawn()` and `child_process.execFile()` directly from the Tauri renderer (webview) process. Tauri's security model explicitly blocks `node:child_process` in the renderer for this reason:

1. **Bypasses Tauri capability system** — process spawning should go through `invoke()` + Rust `#[tauri::command]`
2. **Shell injection risk** — the `Expand-Archive` PowerShell command interpolates the binary path into a shell string
3. **Escape hatch from sandbox** — a compromised renderer could spawn arbitrary system commands

```typescript
// CURRENT (DANGEROUS):
const proc = spawn(whisperBinary, args, { cwd: workDir });

// CORRECT (Tauri command):
const result = await invoke('spawn_whisper_process', { binaryPath, args, cwd });
```

**Remediation:** Add Rust commands `spawn_whisper_process` and `kill_whisper_process` to `src-tauri/src/lib.rs`, call them via `@tauri-apps/api/core` `invoke()`.

### 2.2 CRITICAL: API Keys Stored in localStorage

**File:** `swarmplugins/src/plugins/glasschat/GlassChatEmbed.tsx:76-91, 170-176` 
**Severity:** CRITICAL

GlassChat partner credentials (API key, session token, app ID) are persisted in `localStorage`, which is:

1. **Plaintext** — accessible via DevTools, browser extensions, XSS
2. **Not encrypted** — OS keychain would protect against offline access
3. **Shared across contexts** — any script on any origin in the webview can read it

The component writes credentials on every session mint:
```typescript
localStorage.setItem(STORAGE_KEYS.TOKEN, session.token); // plaintext!
localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey); // plaintext!
```

**Remediation:** Implement a `SecureStorage` module that uses `@tauri-apps/plugin-secure-store` (OS keychain) with `localStorage` as development fallback. Include a migration helper to move existing localStorage secrets on first load. See `secureStorage.ts` for the abstraction.

### 2.3 HIGH: MCP Config Silently Destroyed on Parse Failure

**Files:** `agents/src/cli-configs/opencode.ts:13`, `agents/src/cli-configs/kilo-code.ts` 
**Severity:** HIGH

```typescript
try {
 config = JSON.parse(existingConfig);
} catch {
 config = {}; // Destroys all existing MCP servers, plugins, settings
}
```

If the user's existing config has a trailing comma or non-standard JSON, the entire MCP configuration is wiped. No warning, no backup.

**Remediation:** On parse failure, keep the original string, surface the error to the user, and write back the original unchanged. Never silently replace user config.

### 2.4 HIGH: OAuth URL Rewriting + window.open Interceptor

**File:** `swarm/src/main.tsx` 
**Severity:** HIGH

The app intercepts `window.open` and rewrites OAuth callback URLs to strip tenant IDs. While likely intentional (multi-tenant routing), this pattern:

1. Could intercept auth tokens if the regex is too broad
2. Breaks standard OAuth flows where the callback URL is the identity anchor
3. Makes it impossible to add new OAuth providers without modifying the interceptor

**Remediation:** Use explicit provider registration instead of URL pattern matching. Each OAuth provider declares its callback URL pattern.

### 2.5 MEDIUM: Case-Sensitive Path Keys on Case-Insensitive Filesystems

**File:** `swarmmind/src/tauri/dispatch.ts` 
**Severity:** MEDIUM

The `agentTasks` Map uses `taskId` as key, but `resolveWorktreeDir` and `listWorktrees` use case-sensitive string comparison. On macOS/Windows (case-insensitive FS), `Task-1` and `task-1` resolve to the same path but are different Map keys, causing duplicate worktrees.

### 2.6 MEDIUM: External Script Injection

**File:** `swarmplugins/src/plugins/glasschat/GlassChatEmbed.tsx:116` 
**Severity:** MEDIUM

```typescript
existingScript.src = `${baseUrl}/embed/glasschat.embed.js`;
```

A remote script is loaded without Subresource Integrity (SRI) hash verification. If `glasschat.app` is compromised, arbitrary code executes in the app's webview context with full Tauri API access.

**Remediation:** Pin the script with an SRI hash or bundle it locally.

### 2.7 LOW: No Input Sanitization in PTY Output

**File:** `agents/src/ui/TerminalPane.tsx:197-204` 
**Severity:** LOW

PTY output is written directly to the xterm terminal via `terminal.write()`. While xterm.js handles most control sequences, a malicious agent could inject ANSI escape sequences that affect the host terminal (e.g., OSC 8 hyperlinks to phishing URLs, or BEL sequences).

---

## 3. Bug Findings

### 3.1 CRITICAL: Orchestrator Race Condition in Approve Flow

**File:** `swarmmind/src/orchestrator.ts:112-126` 
**Severity:** CRITICAL

```typescript
async approve(taskId: string) {
 // BUG: Status set to 'merged' BEFORE merge happens
 this.registry.set(taskId, { ...this.registry.get(taskId)!, status: 'merged' });
 await this.worktrees.mergeAndRemove(worktreePath, branchName);
 // If mergeAndRemove throws, status is already 'merged' but worktree still exists
}
```

If `mergeAndRemove()` fails (conflict, disk full, etc.), the registry claims the task is merged but the worktree directory still exists on disk. Subsequent operations will be inconsistent.

**Fix:** Set status to `'merged'` only after `mergeAndRemove()` succeeds. Use a transitional status `'merging'` if the UI needs feedback during the operation.

### 3.2 HIGH: AgentLauncher Mutates Command Args via splice()

**File:** `agents/src/launcher.ts:69-73` 
**Severity:** HIGH

```typescript
const proc = spawn(binary, args.splice(0, 2), { cwd });
// args.splice MUTATES the original array — subsequent calls see truncated args
```

The adapter's `command.args` array is mutated in place. If the same adapter instance is reused (e.g., after a crash/reconnect), subsequent spawns get a truncated or empty args array.

**Fix:** Use `args.slice(0, 2)` or destructuring instead of `splice()`.

### 3.3 HIGH: Date.now()-Based Session IDs

**File:** `agents/src/launcher.ts:39` 
**Severity:** HIGH

```typescript
const sessionId = `${adapterName}-${Date.now()}`;
```

`Date.now()` has millisecond resolution. Spawning 2+ agents in the same millisecond produces duplicate session IDs, causing session map collisions and PTY output routing to the wrong pane.

**Fix:** Use `crypto.randomUUID()` or a monotonically incrementing counter.

### 3.4 HIGH: TerminalPane Listener Leak

**File:** `agents/src/ui/TerminalPane.tsx:205` 
**Severity:** HIGH

The `unlistenOutput` variable is assigned after an `await` (line 208). If the component unmounts between the `await listen()` call and the assignment, the cleanup function in the `useEffect` return sees `unlistenOutput === null` and cannot unsubscribe the listener. The Tauri event listener persists, writing to a disposed terminal reference.

```typescript
const fn = await listen<...>("pty-output", handler);
unlistenOutput = fn; // RACE: component may unmount here
if (disposed) {
 unlistenOutput?.(); // cleanup runs, but only if assigned before disposed check
}
```

**Fix:** Assign `unlistenOutput` before any await, or use a ref that's set synchronously.

### 3.5 MEDIUM: Unreachable Throw in NodeWorktreeManager

**File:** `swarmmind/src/node.ts:96` 
**Severity:** MEDIUM

```typescript
throw new Error(`Failed to create worktree after ${MAX_RETRIES} attempts`);
```

This `throw` is unreachable because the preceding `for` loop either returns successfully or calls `process.exit(1)`. Dead code that masks error handling intent.

### 3.6 MEDIUM: snake_case vs camelCase Field Mismatch

**File:** `swarmmind/src/tauri/dispatch.ts` 
**Severity:** MEDIUM

`WorktreeInfo` is redefined locally with `task_id` (snake_case) instead of the canonical `taskId` (camelCase) from `ports.ts`. This creates two incompatible type shapes for the same concept, leading to:

- Compile-time type mismatches that `any` casts hide
- Runtime bugs where `task_id` is undefined but code reads `taskId`

**Fix:** Remove the local redefinition, import from `ports.ts`.

### 3.7 MEDIUM: activeSessions Map Has No Eviction

**File:** `agents/src/launcher.ts` 
**Severity:** MEDIUM

The `activeSessions` Map grows without bound. Sessions are never removed on agent exit, crash, or disconnect. In a long-running session with many agent spawns, this leaks memory.

**Fix:** Remove sessions on `'pty-exit'` events. Add a TTL sweep (e.g., remove entries not accessed in 1 hour).

---

## 4. Performance Issues

### 4.1 HIGH: vectorSearch Full-Table Scan

**File:** `pheromone/src/search/index.ts` 
**Severity:** HIGH (performance)

```typescript
const rows = this.db.prepare(
 `SELECT chunk_id, embedding FROM chunks WHERE embedding IS NOT NULL`
).all(); // Fetches ALL rows every query
```

With 200+ chunks, this scans the entire table on every search. The `LIMIT 200` hardcodes the result cap without actually limiting the scan.

**Fix:** Add a `rowid >= ?` anchor using the last-seen rowid from the previous query, or pre-filter by `created_at > ?` for recent-first search. Consider HNSW index via `sqlite-vec` extension.

### 4.2 MEDIUM: Oversized Components

- `agents/src/ui/AgentPane.tsx` — 694 lines (xterm terminal + controls + AI prompt bar)
- `swarm/src/app/HomePage.tsx` — 709 lines (main page with sidebar, tabs, modals)
- `agents/src/ui/TerminalPane.tsx` — 661 lines (terminal initialization, resize, WebGL, PTY)

These components handle too many concerns. Splitting into sub-components would:
- Enable `React.memo` on expensive subtrees (xterm terminal)
- Reduce re-render scope when unrelated state changes
- Make individual features testable in isolation

### 4.3 MEDIUM: No React.memo on Terminal

The xterm.js terminal component re-renders on every parent state change. xterm.js is not designed for React reconciliation — each re-render can cause a full canvas redraw. Wrap the terminal container in `React.memo` and ensure `terminal.write()` calls bypass React's render cycle (they already do via refs, but the surrounding JSX still re-evaluates).

### 4.4 LOW: 384-dim Character N-Gram Embeddings

**File:** `pheromone/src/search/index.ts` 
**Severity:** LOW (performance)

The embedding model produces 384-dimensional vectors from character n-grams. For the typical pheromone corpus (a few thousand markdown chunks), this is over-provisioned. A 128-dim model would halve memory usage and query time with minimal accuracy loss.

---

## 5. Test Coverage Gaps

| Component | Critical Path | Tests | Risk |
|-----------|--------------|-------|------|
| Orchestrator (plan/dispatch/approve/reject) | Full lifecycle | None | CRITICAL |
| LockRegistry (acquireMany rollback) | Concurrent lock acquisition | None | HIGH |
| Handoff format (parse/write) | Agent handoff protocol | None | HIGH |
| Search RRF fusion | Hybrid search ranking | None | HIGH |
| AgentLauncher (adapter dispatch) | 10 CLI adapters | None | HIGH |
| NodeWorktreeManager | Git worktree isolation | None | MEDIUM |
| WhisperCppEngine | STT pipeline | None | MEDIUM |
| MemoryManager (parseMarkdownToChunks) | Knowledge extraction | None | MEDIUM |

Existing test directories (`agents/tests/`, `swarm/tests/`) exist but contain only 2 test files (AgentPane.test.tsx, TerminalPane.test.tsx). The comprehensive audit (ULTRA-REVIEW.md) ran 349 browser-level tests via Playwright, which is a good foundation, but unit tests for core logic are entirely absent.

**Recommendation:** Add unit tests for `swarmmind` (orchestrator, locks, handoffs) as the highest priority — these have the most complex state transitions and the highest blast radius from bugs.

---

## 6. Dependency Analysis

### 6.1 Workspace Dependencies

```
swarmmind → none (core)
pheromone → sql.js, unified, remark-parse, gray-matter
agents → @swarm/board, @swarm/lead, @swarm/pheromone, zustand@^5
swarm → @swarm/board, @swarm/lead, @swarm/pheromone, @swarm/agents, react@^18
tasks → @swarm/board, react@^19 ← MISMATCH
```

### 6.2 Missing Dependency

`@tauri-apps/plugin-secure-store` is not installed or configured. This plugin is required for the API key storage fix in GlassChatEmbed.

Install: `pnpm add -w @tauri-apps/plugin-secure-store` and register in `src-tauri/Cargo.toml` and `tauri.conf.json`.

### 6.3 Duplicate React Risk

With `tasks` on React 19 and everything else on React 18, bundlers may include both versions. Verify with `pnpm why react` and dedupe before release.

---

## 7. Prioritized Action Plan

| # | Priority | Effort | Component | Fix |
|---|----------|--------|-----------|-----|
| 1 | **CRITICAL** | M | `voice/src/engine/whisper-cpp.ts` | Move process spawning to Tauri backend commands (`spawn_whisper_process`, `kill_whisper_process`). Add Rust commands in `src-tauri/src/lib.rs`. Remove `node:child_process` from renderer entirely. |
| 2 | **CRITICAL** | S | `swarmmind/src/orchestrator.ts:112-126` | Move `registry.set(status: 'merged')` to AFTER `mergeAndRemove()` succeeds. Add `'merging'` transitional status. |
| 3 | **CRITICAL** | M | `swarmplugins/.../GlassChatEmbed.tsx` | Replace `localStorage` credential storage with `@tauri-apps/plugin-secure-store`. Add migration helper for existing users. |
| 4 | **HIGH** | S | `agents/src/cli-configs/opencode.ts`, `kilo-code.ts` | On JSON parse failure, preserve original config and surface error. Never silently replace user data. |
| 5 | **HIGH** | S | `agents/src/launcher.ts:69-73` | Change `args.splice(0, 2)` to `args.slice(0, 2)` to avoid mutating the adapter's args array. |
| 6 | **HIGH** | S | `agents/src/launcher.ts:39` | Replace `Date.now()` session IDs with `crypto.randomUUID()`. |
| 7 | **HIGH** | S | `agents/src/ui/TerminalPane.tsx:205` | Fix listener leak: assign `unlistenOutput` before the `await listen()` or use a ref. |
| 8 | **HIGH** | L | `tasks/package.json` | Align React version to `^18.3.0` to match all other packages. Verify with `pnpm why react`. |
| 9 | **HIGH** | L | `pheromone/src/memory/index.ts`, `plans/index.ts`, `db/index.ts` | Introduce `FileSystemPort` interface (follow `HandoffFs` pattern). Remove direct `node:fs`/`node:path` imports. |
| 10 | **MEDIUM** | S | `swarmmind/src/tauri/dispatch.ts` | Remove local `WorktreeInfo` redefinition. Import canonical type from `ports.ts`. Fix case-sensitive path keys. |
| 11 | **MEDIUM** | S | `swarmmind/src/node.ts:96` | Remove unreachable `throw`. Clarify retry exhaustion behavior (exit vs. throw). |
| 12 | **MEDIUM** | M | `agents/src/launcher.ts` | Add session eviction: remove from `activeSessions` on `'pty-exit'` events. Add TTL cleanup. |
| 13 | **MEDIUM** | M | `pheromone/src/search/index.ts` | Add rowid-anchor pagination to `vectorSearch`. Replace full-table scan with incremental queries. |
| 14 | **MEDIUM** | M | Multiple 600+ line components | Split `AgentPane`, `TerminalPane`, `HomePage` into focused sub-components. Add `React.memo` to terminal. |
| 15 | **LOW** | S | `GlassChatEmbed.tsx:116` | Add SRI hash to external script loader, or bundle `glasschat.embed.js` locally. |

---

## 8. Strengths

1. **Ports-and-adapters in swarmmind** — the core orchestrator correctly abstracts all side effects behind interfaces. This is the right pattern and should be extended to pheromone.
2. **Lock rollback already implemented** — `acquireMany()` in `swarmmind/src/locks/index.ts` correctly rolls back partial acquisitions. The ULTRA-REVIEW.md finding was already addressed.
3. **TOCTOU fix in node.ts** — the `stat` + `mkdir` race was already fixed with the commented retry loop.
4. **Gray-matter frontmatter** — using structured frontmatter for memory files enables rich metadata (type, tags, agent attribution) without schema migrations.
5. **Hybrid search (RRF)** — combining FTS4 keyword search with vector embeddings using Reciprocal Rank Fusion is a solid approach for the knowledge retrieval problem.
6. **WebGL renderer with context loss recovery** — the terminal gracefully falls back from GPU rendering, preventing blank panes.

---

## 9. Recommended Upgrade Path

### Phase 1 (Week 1): Stop the Bleeding
- Fix #1 (whisper Tauri commands) — eliminates the most dangerous security gap
- Fix #2 (orchestrator race) — prevents state corruption
- Fix #5 (args splice) — one-line fix preventing agent crashes

### Phase 2 (Week 2): Secure the Surface
- Fix #3 (secure storage) — protects credentials
- Fix #4 (MCP config) — prevents data loss
- Fix #8 (React version) — eliminates duplicate React risk
- Add `@tauri-apps/plugin-secure-store`

### Phase 3 (Week 3-4): Strengthen Foundations
- Fix #9 (pheromone FileSystemPort) — enables renderer compatibility
- Fix #7 (listener leak) — prevents memory leaks
- Fix #13 (vector search pagination) — scales search
- Add unit tests for orchestrator and locks

### Phase 4 (Ongoing): Polish
- Fix #14 (component splitting) — improves maintainability
- Fix #15 (SRI hash) — supply chain security
- Fix #11 (unreachable throw) — code hygiene
