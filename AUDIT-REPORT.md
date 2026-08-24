# Swarm-AI Monorepo — Comprehensive Bug Audit Report

**Date:** 2026-08-24
**Auditor:** Deep-research multi-agent analysis
**Scope:** Full monorepo (pnpm workspaces, Tauri backend, React renderer, CLI agents, MCP servers)
**Mode:** Read-only — no code modified

---

## Summary

**18 findings** across 4 severity levels:

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 2 | Hardcoded permission bypass, sync-blocking MCP poll loop |
| HIGH | 8 | Drag listener leak, TOCTOU race, plaintext API keys, unbounded memory, ID collisions, missing CDP timeout, path injection, settings overwrite |
| MEDIUM | 6 | Cursor style leak, stale closure interval churn, deprecated base64, `any` assertions, state mutation via splice, VoiceHotkeys timer race |
| LOW | 2 | Deprecated `atob`/`btoa`, unguarded shell detection call |

---

## CRITICAL Findings

### C-1: Hardcoded `bypassPermissions` Injected into Every Spawned Claude Code Instance

**File:** `agents/src/cli-configs/claude-code.ts` (lines 64, 99)
**Risk:** Security / Privilege Escalation

Every Claude Code CLI spawned by the swarm has `"defaultMode": "bypassPermissions"` written into its `.claude/settings.local.json`. This means every sub-agent has **all permission gates removed** — it can read/write any file, run any shell command, make any network request, without any human approval step.

```typescript
// Line 64 (interactive config):
perms.defaultMode = 'bypassPermissions';

// Line 99 (background config):
perms.defaultMode = 'bypassPermissions';
```

This is applied unconditionally — there's no per-task opt-in, no audit log, no way for the parent to revoke it once the sub-process is running. A single compromised or rogue sub-agent can do anything on the host machine.

**Fix:** Make permission mode configurable per-task (default to `"default"`), add a `--allow-dangerous` flag the user must explicitly pass, and never write `bypassPermissions` to disk silently.

---

### C-2: Lead MCP Server Blocks Node Event Loop with 150ms `readFileSync` Poll Loop

**File:** `pheromone/pheromone-mcp/src/tools/lead.ts`
**Risk:** Performance / Liveness

The Lead MCP server polls for agent messages using a synchronous file read inside a 150ms-interval loop:

```typescript
while (elapsed < 120_000) {
 const data = readFileSync(messagesPath, 'utf-8');
 const parsed = JSON.parse(data);
 // ... check for responses
 await new Promise(r => setTimeout(r, 150));
}
```

`readFileSync` blocks the event loop for the entire duration of the call. Combined with the 150ms interval, this creates a constant liveness hazard — if any other operation touches the same thread (WebSocket handler, IPC call), it will be delayed by each `readFileSync` call. Over 120 seconds, this is thousands of blocking calls.

**Fix:** Use `fs.promises.readFile` (async) with a `watch`/`fswatch` event-driven approach, or at minimum replace the loop with recursive `setTimeout` + `await readFile`.

---

## HIGH Severity Findings

### H-1: Drag Handler Adds Window Listeners on Every mousedown, Cleanup Only Runs on Unmount

**File:** `swarm/src/features/panes/PlaneHost.tsx` (lines 272-275)
**Risk:** Memory Leak / Duplicate Events

```typescript
const handleMouseDown = (e: React.MouseEvent) => {
 // ...
 window.addEventListener('mousemove', handleMouseMove);
 window.addEventListener('mouseup', handleMouseUp);
 // cleanup stored in endDrag.current — only invoked on unmount
};
```

If the user clicks and drags 50 times, they accumulate 50 `mousemove` and 50 `mouseup` listeners. They're only removed when the component unmounts. During the drag, every mousemove fires 50 handlers.

**Fix:** Remove listeners in the mouseup handler (or use `{ once: true }`).

---

### H-2: TOCTOU Race Condition in Worktree Creation

**File:** `swarmmind/src/node.ts` — `NodeWorktreeManager.create()`
**Risk:** Reliability / Duplicate Worktrees

```typescript
// Check phase 1
const existing = worktreePathForBranch(name, branch);
if (existing) throw new Error('already exists');

// Check phase 2
if (fs.existsSync(path)) throw new Error('already exists');

// Between phase 2 and this call, another process could create the worktree
execFileSync('git', ['worktree', 'add', ...]);
```

Two separate checks followed by a non-atomic `git worktree add`. Between the `fs.existsSync` check and the actual `git worktree add` call, another invocation could create the same worktree. The retry loop (20 attempts) masks this in testing but doesn't fix the underlying race.

**Fix:** Use `git worktree add` with a `-f` flag on retry, or lock the worktree creation with a mutex.

---

### H-3: Plaintext API Keys Stored in localStorage

**File:** `swarm/src/features/settings/settingsStore.ts` (Zustand persist middleware)
**Files:** `swarm/src/features/settings/ProvidersSection.tsx`, `swarmplugins/src/plugins/glasschat/GlassChatEmbed.tsx`
**Risk:** Security / Credential Exposure

All provider API keys (Anthropic, OpenAI, Google, , ) and the GlassChat API key are persisted to `localStorage` in plaintext. Any XSS, malicious extension, or local process can read them directly. No encryption at rest.

**Fix:** Use the OS keychain (Tauri's `@tauri-apps/plugin-secure-store` on desktop, `Credential Management API` in browser). At minimum, encrypt before persisting.

---

### H-4: Unbounded Screenshot Storage in Zustand

**File:** `swarm/src/features/browser/browserStore.ts`
**Risk:** Memory Exhaustion

```typescript
setScreenshot: (dataUrl: string) => set((s) => ({
 screenshots: [...s.screenshots, dataUrl] // appends forever, no eviction
})),
```

Each CDP screencast frame is a base64 PNG (hundreds of KB). At 30fps, this fills memory in minutes. The store has no max size, no LRU eviction, no timestamp-based pruning.

**Fix:** Cap at N frames (e.g., 60), evict oldest when full. Use `OffscreenCanvas` compression or store as `Blob` references instead of base64 strings.

---

### H-5: Collision-Prone ID Generation in Multiple Locations

**Files:**
- `swarmmind/src/orchestrator.ts` (line 78): `agent-${task.id}-${Date.now()}`
- `reports/src/core/store.ts` (line 121): `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`

Both rely on millisecond timestamps and/or short random suffixes. Under load (multiple agents created in the same millisecond, or report sections created rapidly), IDs collide silently.

**Fix:** Use `crypto.randomUUID()` (available in Node 19+), or `nanoid`/`uuid` library. For agent IDs, include the orchestrator PID.

---

### H-6: CDP Client Has No Per-Request Timeout

**File:** `swarm/src/features/browser/cdp.ts` — `CdpClient.send()`
**Risk:** Hanging Promises

```typescript
send(method: string, params?: any): Promise<any> {
 return new Promise((resolve, reject) => {
 this.ws.send(JSON.stringify({ id: ++this.msgId, method, params }));
 this.callbacks.set(this.msgId, { resolve, reject });
 // ← no timeout. If the browser tab crashes, the promise hangs forever.
 });
}
```

If the CDP target disconnects while a command is in-flight, the promise never resolves. Any `await client.send(...)` will hang indefinitely, potentially freezing the entire UI.

**Fix:** Add a per-request timeout (e.g., 10s for normal commands, 30s for navigation). Set a `setTimeout` that calls `reject(new Error('CDP timeout'))` and removes the callback.

---

### H-7: Windows Path Injection via PowerShell Command String Interpolation

**File:** `voice/src/engine/whisper-cpp.ts` (lines 28-31)
**Risk:** Command Injection

```typescript
const cmd = `powershell.exe -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`;
execSync(cmd, { encoding: 'utf-8' });
```

`archivePath` and `destDir` are interpolated directly into a PowerShell command string. If either contains PowerShell metacharacters (e.g., `"; malicious-command #`), arbitrary commands execute. No escaping is performed.

**Fix:** Use `execFileSync` with an argument array, or properly escape with single quotes doubled per PowerShell rules.

---

### H-8: Zustand Settings Overwrite During Merge Loses Unrecognized Keys

**File:** `workspace/src/toolbox.ts` — `mergeMcpJson()` (lines 61-90)
**Risk:** Data Loss

The MCP config merger does a shallow merge of `servers` objects. If the persisted settings contain a provider key not present in the incoming toolbox config, it's silently dropped. Similarly, toolbox-only keys that the user hasn't added to settings are lost on the reverse merge.

**Fix:** Deep merge with array concatenation for `args`/`env`. Never remove keys that exist only in one side.

---

## MEDIUM Severity Findings

### M-1: Cursor Style Set on `document.body` but Only Cleaned Up When `isResizing` Flips False

**File:** `swarm/src/features/dock/RightDock.tsx` (lines 613-635)
**Risk:** Visual Artifact on Unmount

```typescript
document.body.style.cursor = "col-resize";
// cleanup:
return () => { if (isResizing) document.body.style.cursor = ""; };
// ^^^ — isResizing is a stale closure value
```

If the component unmounts while `isResizing` is `false` (e.g., resize completed just before unmount), the cleanup runs but leaves the cursor stuck as `col-resize` because the condition is false.

**Fix:** Always reset cursor in cleanup: `document.body.style.cursor = ""` unconditionally.

---

### M-2: Stale `refresh` Dependency Causes Interval Churn

**File:** `swarm/src/features/dock/RightDock.tsx` (lines 205-211)
**Risk:** Performance / Multiple Intervals

```typescript
useEffect(() => {
 const id = setInterval(() => fetchAndRefresh(), 5000);
 return () => clearInterval(id);
}, [refresh]); // ← refresh changes on every fetch → old interval destroyed, new one created
```

If `refresh` is an object or function that gets recreated on every render, this effect re-runs every 5 seconds, tearing down and recreating the interval. This creates a cascade of unnecessary re-renders.

**Fix:** Ensure `refresh` is a stable reference (use `useRef` or `useCallback`), or remove it from the dependency array if it's only needed for manual triggers.

---

### M-3: `btoa`/`atob` Used for Binary Data (Deprecated / Limited)

**Files:** `swarm/src/features/browser/browserStore.ts`, `voice/src/engine/whisper-cpp.ts`
**Risk:** Encoding Failures with Non-ASCII Data

`btoa()` only handles Latin1 characters — it throws `InvalidCharacterError` on UTF-8 strings with characters outside the 0-255 range. If any provider returns model names with special characters, encoding breaks.

**Fix:** Use `Buffer.from(str, 'utf-8').toString('base64')` in Node, or a proper base64 library in the browser.

---

### M-4: `any` Type Assertions Hide Type Errors in Hot Paths

**Files:** `swarmmind/src/node.ts`, `swarmmind/src/orchestrator.ts`, `swarm/src/features/panes/PlaneHost.tsx`
**Risk:** Silent Type Errors

`as any` casts in critical paths (worktree results, agent orchestration, drag handlers) bypass TypeScript's type safety. If a function's return type changes upstream, these casts silently accept the wrong shape.

**Fix:** Replace `as any` with proper interfaces. If a third-party type is genuinely untyped, use a branded type or `unknown` + runtime validation.

---

### M-5: State Mutation via `splice()` on Array Reference

**File:** `tasks/src/cards.ts` (line 101)
**Risk:** React Rendering Bugs

```typescript
const rest = cards.filter((c) => c.id !== cardId);
const target = cardsByColumn(rest, toColumn);
target.splice(at, 0, updated); // ← mutates the array returned by cardsByColumn
```

If `cardsByColumn` returns a reference to an array that's also held elsewhere (e.g., in React state), `splice` mutates it in place. React's `setState` does a shallow comparison — if the reference is unchanged, the component won't re-render.

**Fix:** Use `[...target.slice(0, at), updated, ...target.slice(at)]` to create a new array instead of splicing.

---

### M-6: VoiceHotkeys Timer Effect Has a Race Between Clear and Set

**File:** `voice/src/ui/VoiceHotkeys.tsx` (lines 56-68)
**Risk:** Multiple Concurrent Timers

```typescript
useEffect(() => {
 if (phase && !phase.busy && !phase.isInstalling && !phase.error) {
 setSeconds(0);
 timerRef.current = window.setInterval(() => {
 setSeconds((s) => s + 1);
 }, 1000);
 } else {
 if (timerRef.current) clearInterval(timerRef.current);
 }
 return () => { if (timerRef.current) clearInterval(timerRef.current); };
}, [phase?.busy, phase?.isInstalling, phase?.error, !!phase]);
```

When `phase` transitions from active to inactive, the `else` branch clears the timer. But if `phase` toggles rapidly (e.g., during install → ready → error), the effect runs multiple times in quick succession. The `setSeconds(0)` at the top runs before the previous timer is cleared, potentially creating a brief window where two timers run concurrently.

**Fix:** Clear the timer at the top of the effect before any conditional logic, not just in the else branch.

---

## LOW Severity Findings

### L-1: Index-Based Keys in React Lists (Multiple Files, 7+ Instances)

**Files:** `tasks/src/cards.ts` (line 105), plus 6 additional locations across pane and list components
**Risk:** Rendering Inefficiency / State Loss on Reorder

Using `index` as the React `key` causes the entire list to re-render when any item is inserted, removed, or reordered. It also causes input focus loss, checkbox state resets, and animation glitches.

**Fix:** Use stable IDs (`card.id`, `agent.id`, etc.) as keys.

---

### L-2: Unguarded `invoke("detect_shells")` Call

**File:** `swarm/src/features/panes/PlaneHost.tsx` (line 287)
**Risk:** IPC Error / Unhandled Rejection

```typescript
invoke("detect_shells"); // no await, no .catch()
```

Called without `await` or `.catch()`. If the Tauri backend command throws (e.g., on a platform without shell detection), the unhandled rejection crashes the renderer. There's no error boundary or fallback.

**Fix:** Add `.catch(console.error)` or handle with a try-catch inside an async IIFE. Consider making it optional behind a feature flag.

---

## Recommendations by Priority

### Immediate (before any production use)
1. **C-1:** Remove hardcoded `bypassPermissions` — this is a security vulnerability
2. **C-2:** Fix the Lead MCP sync polling loop — it will block the entire app under load
3. **H-7:** Fix path injection in `whisper-cpp.ts` — this is a code execution vector on Windows
4. **H-3:** Encrypt API keys before persisting to localStorage

### Short-term (next sprint)
5. **H-1:** Fix drag listener accumulation
6. **H-5:** Replace timestamp-based IDs with `crypto.randomUUID()`
7. **H-6:** Add CDP request timeouts
8. **H-4:** Cap screenshot storage with LRU eviction
9. **M-5:** Fix splice-based state mutation

### Medium-term
10. **H-2:** Add mutex to worktree creation
11. **H-8:** Deep-merge MCP configs instead of shallow replace
12. **M-1, M-2, M-6:** Fix cursor leak, stale closure, timer race
13. **L-1:** Replace all index-based React keys

### Technical debt (no urgency)
14. **M-3, M-4:** Replace deprecated `btoa`/`atob`, remove `any` casts
15. **L-2:** Add error handling to unguarded IPC calls

---

*This report covers 18 findings from a full-codebase audit. No files were modified. Findings are based on static analysis only — runtime behavior may reveal additional issues.*
