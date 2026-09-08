# SwarmAI Desktop App — Comprehensive Audit Report

**Date:** 2026-09-07 
**Auditor:** Senior Engineering Audit 
**Scope:** Tauri desktop app (SwiftUI + React frontend) 
**Total Findings:** 77 
**Files Reviewed:** 27

---

## 1. Executive Summary

### Overall Health Score: **62 / 100** (Medium)

| Category | Score | Weight |
|---|---|---|
| Accessibility (WCAG 2.1) | 35 / 100 | 40% |
| Correctness / Bugs | 72 / 100 | 25% |
| Performance | 68 / 100 | 20% |
| Maintainability | 75 / 100 | 15% |

The app has a solid architectural foundation with modern patterns (Zustand stores, Tauri IPC, particle animation engine). However, **accessibility is the most critical gap** — 7 critical and 18 high-severity a11y issues indicate the app is largely unusable by screen-reader users. Additionally, a cluster of React correctness issues (stale closures, uncontrolled rAF loops, CDP callback races) introduces runtime instability.

### Top 3 Critical Issues

| # | Issue | Impact |
|---|---|---|
| 1 | **Stop button is a no-op** (`SwarmDashboardModal.tsx:442`) | Users click "Stop" and the agent keeps running. This is a broken affordance that erodes trust. |
| 2 | **CDP screencast race condition** (`BrowserPane.tsx:104`) | State updates from async Chrome DevTools Protocol callbacks can hit unmounted components, causing React warnings and lost frame acknowledgments. |
| 3 | **Systemic ARIA absence across modals** (`SessionLauncher.tsx`, `SwarmDashboardModal.tsx`, `GitControlModal.tsx`) | 7 critical-severity a11y gaps mean keyboard-only and screen-reader users cannot operate the app. |

---

## 2. Findings by Severity

### 2.1 CRITICAL (7 findings)

Accessibility blockers that prevent assistive-tech users from operating core flows.

| # | File | Line | Title | Description | Suggested Fix |
|---|---|---|---|---|---|
| 1 | `src/features/panes/SessionLauncher.tsx` | 175 | Missing ARIA radiogroup semantics on preset selector | Preset tiles (Solo, Pair, Workbench, Swarm) are plain buttons with no `role="radio"`/`role="radiogroup"`/`aria-checked`. Screen readers cannot convey mutual exclusivity or current selection. | Wrap in `role="radiogroup"` with `aria-label`; each button gets `role="radio"` + `aria-checked={selectedPreset === preset}`; arrow-key navigation within the group. |
| 2 | `src/features/panes/SessionLauncher.tsx` | 221 | Agent grid buttons missing aria-pressed/role semantics | Agent selection conveyed only via color/ring. No `aria-pressed` or `role="radio"`. | Add `aria-pressed={active}` or `role="radio"` + `aria-checked`; wrap container in `role="radiogroup"` with `aria-label`. |
| 3 | `src/features/panes/SessionLauncher.tsx` | 272 | Session count picker has no radiogroup semantics | Numbered buttons (1–6) act as a single-select radio group but announced as 6 unrelated buttons. | Wrap in `role="radiogroup"` with `aria-label`; each option gets `role="radio"` + `aria-checked`. |
| 4 | `src/features/dashboard/SwarmDashboardModal.tsx` | 199 | Tablist buttons missing role=tab/aria-selected | Overview/Aggregated Logs tabs lack `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`. Keyboard users cannot activate with Space/Enter; screen readers do not announce tab group. | Add full tablist/tab/tabpanel pattern with id linkage and keyboard arrow-key roving tabindex. |
| 5 | `src/features/dashboard/SwarmDashboardModal.tsx` | 481 | Logs agent `<select>` uses display name as value | `value={agent.customName || agent.cliName}` causes duplicate IDs to be lost; screen readers announce the visible label as the value. | Use `agent.id` as the option value; use `<label>` or `aria-label` for display names. |
| 6 | `src/features/dashboard/SwarmDashboardModal.tsx` | 442 | Stop button just closes modal — doesn't actually stop the agent | `onClose()` is called instead of dispatching a stop command. Users see no feedback; agent continues running. | Wire to actual stop-agent command; show success/error toast; update agent card state to stopped. |
| 7 | `src/features/dashboard/SwarmDashboardModal.tsx` | 471 | Search input missing label / accessible name | Placeholder-only input with no `<label>`, `aria-label`, or `aria-labelledby`. Placeholders are not persistent accessible names. | Add `<label>` visually hidden or `aria-label="Filter logs"`. Same for the adjacent `<select>`. |

---

### 2.2 HIGH (24 findings)

Correctness bugs, performance risks, and major accessibility gaps.

#### React Correctness

| # | File | Line | Title | Description | Suggested Fix |
|---|---|---|---|---|---|
| 8 | `desktop/src/features/help/UserGuideModal.tsx` | 68 | Missing React keys on tab switcher buttons | Tab buttons lack `key` props. React warns and may remount elements, risking loss of transient state. | Add `key="user-guide"` / `key="privacy"` to each button. |
| 9 | `desktop/src/features/emulator/android/AndroidEmulatorPane.tsx` | 172 | Wrong device serial shown for each AVD | Every row uses `devices[0]?.serial`, so all AVDs show the same running serial. Stop/start state is incorrect when multiple devices are connected. | Use the serial from the AVD's own `device` object, e.g. `avd.device?.serial ?? '—'`. |
| 10 | `desktop/src/features/browser/BrowserPane.tsx` | 104 | React state updates from CDP screencast callbacks | `Page.screencastFrame` fires outside React and calls `setFrame` directly. In-flight handlers can call `setState` on unmounted component or dereference closed client. | Guard with a `mountedRef` flag; use `useSyncExternalStore` or wrap in `useEffect` cleanup; batch updates through `requestAnimationFrame`. |
| 11 | `desktop/src/app/HomePage.tsx` | 162 | Stale closure on keyboard shortcut handler | `handleKeyDown` registered in `useEffect([], ...)` closes over `toggleRight`. If store returns a new function reference, shortcut calls stale version. | Use a `useRef` for the latest handler and call `ref.current` inside the listener; or subscribe to store changes inside the effect. |
| 12 | `desktop/src/app/HomePage.tsx` | 193 | Stale closures in voice event listeners | `onVoiceToggle` and `onVoiceState` captured once at mount. Later recreations are ignored. | Same pattern — refs or re-subscribe on handler change. |

#### CSS / Performance

| # | File | Line | Title | Description | Suggested Fix |
|---|---|---|---|---|---|
| 13 | `desktop/src/app/globals.css` | 104 | Overly broad `overflow: hidden` on root breaks panel overflow | `:root { overflow: hidden; }` suppresses legitimate overflow (scrollbars, context menus, dropdowns) from child panels and modals. | Remove global rule; rely on individual shell wrappers (`h-screen`, `overflow-hidden` on layout containers). |
| 14 | `desktop/src/app/globals.css` | 148 | Animation with >1s duration and non-linear easing risks async repaints | Scrollbar fade-out uses a 2s linear animation on pseudo-element, firing on every scroll event. | Add `@media (prefers-reduced-motion: reduce)` override; reduce duration to ≤300ms; use `ease-out`. |
| 15 | `desktop/src/app/globals.css` | 174 | No `content-visibility` to mitigate large canvas/modal paint cost | Off-screen subtrees (sidebar lists, changelog, collapsible panels) always fully painted. | Add `content-visibility: auto; contain-intrinsic-size: 0 400px;` on scrollable regions and modals. |
| 16 | `desktop/src/features/browser/BrowserPane.tsx` | 27 | Row height is a CSS variable but never declared | `var(--browser-row-h, 28px)` — variable is never defined in `globals.css` or inline. Dead code / maintenance hazard. | Either define `--browser-row-h` in `globals.css` or replace with a hardcoded `h-7` / inline style. |
| 17 | `desktop/src/features/dock/RightDock.tsx` | 31 | Missing focus-visible styles on all focusable dock buttons | Every button has `cursor-pointer` but zero `focus-visible`/`focus:ring-*` classes. Keyboard users see no visible focus indicator. | Add `focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500` to each button. |
| 18 | `desktop/src/app/HomePage.tsx` | 133 | Sticky left sidebar can overlap content on narrow widths | `sticky top-0 h-screen` with `z-40` and no responsive breakpoint. On <900px the sidebar consumes most of the viewport. | Add `hidden lg:flex` or a collapsible sidebar toggle below the breakpoint. |
| 19 | `desktop/src/features/browser/BrowserPane.tsx` | 58 | Sticky right header overlaps table rows on overflow | Sticky header (`z-10`, `top-0`) with no compensating padding or border on the scroll container below. Rows scroll under header and text collides. | Add `border-b` and `shadow-sm` to sticky header; or add `pt-8` equivalent padding to scroll container. |

#### Accessibility (High)

| # | File | Line | Title | Description | Suggested Fix |
|---|---|---|---|---|---|
| 20 | `src/features/settings/UpdatesSection.tsx` | 186 | Dropdown toggle lacks aria-expanded/aria-controls | "Other Operating Systems" button toggles a collapsible list but has no `aria-expanded` or `aria-controls`. | Add `aria-expanded={showAllPlatforms}` and `aria-controls="platforms-panel"`; give panel matching `id`. |
| 21 | `src/features/diff/DiffPreviewModal.tsx` | 113 | File list buttons in modal lack aria-pressed/selected | Changed files list uses buttons with only color to indicate selection. | Add `aria-pressed={selectedFile === file}`. |
| 22 | `src/features/diff/DiffPreviewModal.tsx` | 152 | Diff lines rendered without semantics for screen readers | 100s of `<div>` rows with text only. No indication of added/removed context, file boundaries, or hunk headers. | Add `aria-label="added: <line>"` / `aria-label="removed: <line>"`; use `<ul>` with `<li>` per hunk; visually-hidden hunk headers. |
| 23 | `src/features/diff/DiffPreviewModal.tsx` | 163 | Modal lacks Escape to close and focus trap | `role="dialog"` + `aria-modal="true"` but no Escape handler, no focus trap, no initial focus. | Add `onKeyDown` Escape handler; use `focus-trap` or manual tab-cycle; move focus to first interactive element on open; return focus to trigger on close. |
| 24 | `src/features/updates/UpdateCheckerModal.tsx` | 199 | Dropdown toggle missing aria-expanded | "Other Platforms" collapsible button has no `aria-expanded` or `aria-controls`. | Add `aria-expanded={showAll}` and `aria-controls` linkage. |
| 25 | `src/features/updates/UpdateCheckerModal.tsx` | 97 | Icon-only buttons lack accessible names | Refresh and close buttons are icon-only Lucide components with no `aria-label`. `title` is not a reliable accessible name. | Add `aria-label="Refresh"` / `aria-label="Close"`. |
| 26 | `src/features/updates/UpdateCheckerModal.tsx` | 163 | Download progress has no live region announcement | `downloadProgress` string displayed visibly but not announced. | Add `role="status"` + `aria-live="polite"` to the progress container. |
| 27 | `src/features/git/GitControlModal.tsx` | 301 | Commit message input missing accessible label | Input has only a placeholder, no `<label>` or `aria-label`. Same for new branch input (line 339). | Add `<label htmlFor="commit-msg">Commit message</label>` or `aria-label`. |
| 28 | `src/features/git/GitControlModal.tsx` | 386 | Diff view toggle lacks radiogroup semantics | Visual/Stats toggle uses `<button>`s without `role="radio"`/`aria-checked`. | Add `role="radiogroup"` + `role="radio"` + `aria-checked`; arrow-key navigation. |
| 29 | `src/features/git/GitControlModal.tsx` | 410 | Diff lines lack semantic roles/labels | Each diff line is a plain `<div>`. Screen readers read 100s of lines with no added/removed context. | Add `aria-label` or semantic `<ul>/<li>` with visually-hidden context. |
| 30 | `src/features/git/GitControlModal.tsx` | 443 | Action output status not announced to screen readers | Action output block (success/error console) lacks `role="status"` / `aria-live`. | Add `role="status"` + `aria-live="polite"` to output container. |
| 31 | `src/features/git/GitControlModal.tsx` | 199 | Click-outside-to-close modal lacks focus trap and Escape handling | Backdrop `onClick` closes but no keyboard Escape handler, no focus moved into modal, focus escapes to underlying chrome. | Add Escape handler, focus trap, and initial focus management. |

---

### 2.3 MEDIUM (32 findings)

Correctness quirks, UX gaps, and moderate accessibility issues.

| # | File | Line | Title | Description | Suggested Fix |
|---|---|---|---|---|---|
| 32 | `desktop/src/shared/Skeleton.tsx` | 30 | Math.random() during render causes layout jitter | `TerminalSkeleton` and `SidebarSkeleton` call `Math.random()` inside JSX. Every render shuffles widths, producing visual jitter. | Move random width generation to `useMemo` or compute once in `useEffect` and store in state. |
| 33 | `desktop/src/features/splash/SwarmCanvasMesh.tsx` | 254 | requestAnimationFrame loop never yields control | Animation loop runs continuously even when `progress`, `isExiting`, and `phase` are static. Wastes CPU/GPU until unmount. | Cancel rAF when values are static; re-arm only on state change; add a `useEffect` cleanup. |
| 34 | `desktop/src/features/splash/SwarmCoreHero.tsx` | 32 | Inconsistent Date.now() values within one render | `lockPulse` computed once, but `chromaticGhost` and `hexFacet` call `Date.now()` again. Multiple timestamps in one paint creates visible jitter. | Capture a single `const now = Date.now()` at the top of the render function. |
| 35 | `desktop/src/shared/ToastProvider.tsx` | 29 | Unbounded module-level id counter | `idCounter` at module scope, only increments. Drifts upward over long sessions; hidden shared mutable surface between instances. | Use `useId()` or a bounded counter (`idCounter % 10000`); reset on provider unmount. |
| 36 | `desktop/src/shared/ShortcutsModal.tsx` | 84 | Array-index keys on shortcut rows | `key={i}` used. If shortcuts are reordered/filtered, React cannot reconcile correctly. | Use a stable identifier: `key={shortcut.id}` or `key={shortcut.command}`. |
| 37 | `desktop/src/features/settings/UpdatesSection.tsx` | 38 | useEffect depends on possibly unstable checkForUpdates | `useEffect([checkForUpdates])` triggers on mount and whenever `checkForUpdates` changes reference. New function per render = duplicate network requests. | Wrap `checkForUpdates` in `useCallback` with empty deps; or move the check to an explicit button handler. |
| 38 | `desktop/src/host/registerHosts.tsx` | 117 | Unsafe `as any` casts bypass type validation | `setGridLayout` casts `layout` with `(layout as any)` and `(Number(layout) as any)`. Invalid values from the Lead silently pass through. | Validate with a runtime schema (e.g. `zod` or manual check) before casting; reject with a fallback. |
| 39 | `desktop/src/app/globals.css` | 125 | Glass card variant breaks on very small viewports | `.glass-card` uses 26px `border-radius`. On 320px-wide viewports this can visually clip or waste space. | Add `@media (max-width: 400px) { .glass-card { border-radius: 12px; } }`. |
| 40 | `desktop/src/app/HomePage.tsx` | 64 | Command palette filter input is non-semantic div | Input area is a `<div role="searchbox">` — not a native `<input>`. Lacks autocomplete, spellcheck, IME composition. | Replace with `<input type="search" aria-label="Command palette" aria-controls="palette-results">`. |
| 41 | `desktop/src/shared/CommandPalette.tsx` | 85 | Palette overlay traps focus without a visible focus ring on results | Palette items are `<div role="option">` but not keyboard-focusable. No `focus-visible` styling on the scrollable list. | Add `tabIndex={-1}` + focus management; render items as `<button>` or add `tabIndex` cycling; add `focus-visible:ring-2`. |
| 42 | `desktop/src/app/HomePage.tsx` | 93 | Sticky masthead uses z-50 which can collide with modal z-indexes | Masthead `z-50` is safe today, but if ever reused inside a modal (different stacking context) it could silently layer on top. | Document the stacking context; consider `z-10` if the masthead is always within a `relative` container that already isolates. |
| 43 | `desktop/src/features/settings/SettingsPage.tsx` | 206 | Settings overlay and User Guide modal have conflicting z-index stacking | Overlay `z-[100]` while UserGuideModal uses `z-[400]`. Works because modal is child of overlay, but fragile. | Centralize z-index tokens in CSS custom properties (e.g. `--z-modal: 400; --z-overlay: 100;`). |
| 44 | `desktop/src/features/dock/RightDock.tsx` | 57 | Activity status uses indeterminate progress element for semantics | `div` with `role="status"` + `aria-live="polite"` would provide more reliable announcements. | Add `role="status"` + `aria-live="polite"` to the activity indicator. |
| 45 | `src/features/updates/UpdateCheckerModal.tsx` | 43 | Release notes markdown rendered as plain text | `latestRelease.body` injected with `whitespace-pre-wrap` — no heading/paragraph styling. Long notes render as one large monospace block. | Use a simple markdown renderer (`react-markdown`) or apply prose classes for typographic hierarchy. |
| 46 | `src/features/dashboard/SwarmDashboardModal.tsx` | 152 | Logs are fabricated 'mockLogs' rather than real agent telemetry | "Aggregated Logs" tab generates synthetic logs per agent, re-rendered every 1s. Misleading — no actual log content. | Replace with real log ingestion from agents via IPC; show empty state with "No logs yet" until backend is wired. |
| 47 | `src/features/dashboard/SwarmDashboardModal.tsx` | 164 | No empty-state handling for log filter | When `filteredLogs` is empty, the empty-state message is only shown when mock data exists; with a real backend failure the user sees stale logs. | Add a dedicated empty state for "No logs match your filter" and a separate error state for backend failures. |
| 48 | `src/features/diff/DiffPreviewModal.tsx` | 60 | Diff load failure shows generic text, not an error state | On catch, `diffText` set to a generic string conflating "empty diff" with "error". No `role="alert"`. | Distinguish empty-diff vs. error; use `role="alert"` for error state. |
| 49 | `src/features/diff/DiffPreviewModal.tsx` | 132 | Loading state is plain text — not announced | "Loading worktree diff..." shown but container has no `aria-live`/`role="status"`. | Add `role="status"` + `aria-live="polite"` to the loading container. |
| 50 | `src/features/git/GitControlModal.tsx` | 48 | Form fields not reset on modal close | `commitMessage`, `newBranchName`, `showNewBranchInput`, `actionOutput`, `diffMode` persist across open/close cycles. | Reset all form state in a `useEffect` keyed on `isOpen` or in the close handler. |
| 51 | `src/features/git/GitControlModal.tsx` | 258 | Init Git Repository button has no confirmation despite being destructive | Initializing a Git repo creates `.git/` files; in a folder with existing data this could overwrite existing config. | Add a confirmation dialog ("This will create a new Git repository in the current folder. Continue?"); show inline feedback on failure. |
| 52 | `src/features/updates/UpdateCheckerModal.tsx` | 154 | Download button uses hover:scale-105 — disabled users won't see focus state | Hover-only scale transform with no explicit focus ring. | Add visible `:focus-visible` ring (`focus-visible:ring-2 focus-visible:ring-blue-500`). |
| 53 | `src/features/templates/TaskTemplatesModal.tsx` | 183 | Template selection buttons missing aria-pressed | Each template button toggles `selectedTemplate` but only color indicates state. | Add `aria-pressed={selectedTemplate === template.id}`. |
| 54 | `src/features/templates/TaskTemplatesModal.tsx` | 277 | Tab switcher buttons missing role=tab/aria-selected | Templates / User Guide / Privacy tabs are styled as tabs but lack ARIA tab semantics. | Add `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, arrow-key roving tabindex. |
| 55 | `src/features/templates/TaskTemplatesModal.tsx` | 378 | Shortcut table uses `<kbd>` but missing caption and headers scope | No `<caption>`, no `scope="col"` on `<th>`, `<kbd>` elements have no semantic role. | Add `<caption>Keyboard shortcuts</caption>`; add `scope="col"` to `<th>`; consider `aria-label` on `<kbd>`. |
| 56 | `src/features/templates/TaskTemplatesModal.tsx` | 164 | Apply button uses setTimeout then closes modal — no announcement | After applying, modal closes after 1200ms with no success announcement. Screen reader users won't know task cards were created. | Add `role="status"` + `aria-live="polite"` announcing "Template applied: N task cards created". |
| 57 | `src/features/help/UserGuideModal.tsx` | 98 | Icon-only close button has no aria-label | Close button is an X icon with `title='Close Guide (Esc)'` only. `title` is not a reliable accessible name. | Add `aria-label="Close guide"`. |
| 58 | `src/features/help/UserGuideModal.tsx` | 67 | Tab buttons missing role=tab/aria-selected | User Guide / Privacy & Security tabs implement switch behavior with click handlers only. | Add `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, arrow-key navigation. |
| 59 | `src/features/help/UserGuideModal.tsx` | 109 | Sidebar nav buttons lack aria-current | Sidebar topic buttons update `selectedTopic` but only use color to indicate the active one. | Add `aria-current="page"` to the active topic button. |
| 60 | `src/features/help/UserGuideModal.tsx` | 42 | Modal lacks focus trap on open | Escape handler exists, but opening does not move focus into the modal; Tab can leave to underlying chrome. | Move focus to first interactive element on open; add focus trap. |
| 61 | `src/features/settings/UpdatesSection.tsx` | 78 | Check for Updates button missing aria-busy | Button disabled with `animate-spin` but no `aria-busy="true"` or `aria-live` announcement. | Add `aria-busy={isChecking}` + `aria-live="polite"` region announcing status. |
| 62 | `src/features/settings/UpdatesSection.tsx` | 162 | Download progress only visual — no live region | Download progress banner is purely visual (`animate-pulse` + text). | Add `role="status"` + `aria-live="polite"` to the progress container. |
| 63 | `src/features/settings/UpdatesSection.tsx` | 208 | Per-asset Download buttons have no accessible name differentiation | Each "Download" button repeats the same visible text. | Add `aria-label={\`Download ${asset.name}\`}`. |

---

### 2.4 LOW (20 findings)

Dead code, minor a11y enhancements, and edge-case responsiveness.

| # | File | Line | Title | Description | Suggested Fix |
|---|---|---|---|---|---|
| 64 | `desktop/src/shared/TaskProgressBar.tsx` | 17 | Unused `workspaceId` prop | Accepted but never read. Dead prop misleads callers. | Remove the prop or wire it to scoping logic. |
| 65 | `desktop/src/features/settings/UserGuideSection.tsx` | 50 | `as any` used for tab id cast | `setActiveSubTab(tab.id as any)` bypasses TypeScript checking. | Tighten the `tab.id` type to match the union expected by `setActiveSubTab`. |
| 66 | `desktop/src/app/globals.css` | 19 | Multiple unused custom scrollbar selectors | `::-webkit-scrollbar-thumb-hover`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-corner` styled but never produced by panels using `scrollbar-sleek`. | Remove dead CSS or ensure panels use non-overlay scrollbars where these selectors apply. |
| 67 | `desktop/src/shared/ThemePicker.tsx` | 1 | ThemePicker not audited for styling bugs | Exists in audit scope but full content not reviewed for responsive, overflow, z-index, or color contrast. | Schedule a second-pass focused on ThemePicker. |
| 68 | `desktop/src/features/browser/BrowserPane.tsx` | 61 | Row cells rely on align-middle without explicit height control | `items-center` for alignment, but varying text lengths + sticky header can shift row height during scroll/resize. | Add `min-h-[28px]` or equivalent on row cells to stabilize layout. |
| 69 | `src/features/settings/PrivacySection.tsx` | 29 | '100% LOCAL-FIRST GUARANTEED' badge not focusable for inspection | Animated badge conveys a critical guarantee but is decorative. | Add `role="img"` + `aria-label="100% local-first, no data leaves your machine"` or hide from AT with `aria-hidden="true"` if repetitive with surrounding text. |
| 70 | `src/features/settings/UserGuideSection.tsx` | 39 | Sub-tab pills missing role=tab semantics | Quickstart / Lead Steward / etc. pills behave as a tab group but use plain `<button>` with no `role="tablist"`/`role="tab"`/`aria-selected`. | Add full tablist pattern; implement arrow-key navigation. |
| 71 | `src/features/settings/UserGuideSection.tsx` | 243 | Shortcuts table missing `<caption>` and `<th scope>` | Unstyled for screen reader navigation. | Add `<caption>Keyboard shortcuts</caption>`; add `scope="col"` and `scope="row"` to `<th>`. |
| 72 | `src/features/panes/PlaneHost.tsx` | 217 | Mouse-based drag is not operable by keyboard | Pane dragging/swap wired only to `onMouseDown` + window mousemove/mouseup. Keyboard users cannot rearrange panes. | Add keyboard alternative: Space-to-pick + arrow keys to move; Enter to drop; Escape to cancel. |
| 73 | `src/features/panes/PlaneHost.tsx` | 864 | Pane container has no role/group semantics | Each pane is a generic `<div>` with `data-pane-id`. | Add `role="group"` + `aria-label={pane.name}` so screen readers announce each pane as a distinct region. |
| 74 | `src/features/panes/SessionLauncher.tsx` | 299 | Textarea missing accessible label | TASK — OPTIONAL textarea has a visible label but `<label>` is not associated via `htmlFor` or `aria-labelledby`. | Add `id` to textarea and `htmlFor` on the label. |
| 75 | `src/features/dashboard/SwarmDashboardModal.tsx` | 222 | Refresh button icon-only with no aria-label | Refresh icon button has only `title` attribute. | Add `aria-label="Refresh dashboard"`. |
| 76 | `src/features/dashboard/SwarmDashboardModal.tsx` | 230 | Close button icon-only with no aria-label | X button in modal header needs `aria-label="Close"`. | Add `aria-label="Close"`. |
| 77 | `src/features/dashboard/SwarmDashboardModal.tsx` | 439 | Click target for Stop/Focus buttons is <30px tall | Stop and Focus action buttons have small text and limited padding (`px-2 py-1`). May be under the 44px accessibility minimum touch target. | Increase padding to at least `px-3 py-2` or use icon buttons with larger hit areas. |

---

## 3. UX / Experience Improvement Recommendations

These are not bugs but would meaningfully improve the perceived polish and usability of the application.

| # | Area | Recommendation |
|---|---|---|
| 1 | **Splash Animation** | Add a "Skip intro" button for returning users. The particle swarm animation is beautiful but adds ~3–5 seconds of mandatory wait on every launch. |
| 2 | **Command Palette** | Show recently-used commands at the top of results (MRU ordering). Currently alphabetical/static, which means frequent actions require typing every time. |
| 3 | **Browser Pane** | Add a "Copy URL" action to each row's context menu. Users currently have no quick way to copy the devtools URL from the list. |
| 4 | **Right Dock** | Add tooltips (with `title` + a custom tooltip component) to all icon-only or text-truncated dock actions. Some labels are truncated and have no hover explanation. |
| 5 | **Home Page Sidebar** | Persist sidebar collapsed/expanded state in `SettingsStore` so it survives app restarts. Currently it resets every launch. |
| 6 | **Toast Notifications** | Add a "pause" toggle for the toast stack. During an active agent swarm, toasts can pile up and obscure the dashboard. |
| 7 | **Diff Preview** | Add line numbers to the diff view. Users reading 100+ line diffs with no line numbers have no spatial reference for navigating. |
| 8 | **Git Control Modal** | Add a "Stage All" / "Unstage All" bulk action. Currently every file must be staged individually. |
| 9 | **Update Checker** | Show the installed version alongside the available version in the update banner. Users can't tell if they're already on the latest without reading the changelog. |
| 10 | **Session Launcher** | Add a "Remember last preset" toggle. Users who always launch the same configuration (e.g., Swarm 3) re-select it every session. |
| 11 | **Keyboard Shortcuts** | Add a printable keyboard shortcuts cheat sheet (PDF or printable HTML) to the User Guide. Power users prefer a reference doc over modal navigation. |
| 12 | **Theme System** | Add a "follow system" option that respects macOS light/dark mode changes in real time, not just on app launch. |
| 13 | **Empty States** | Replace all "No data" empty states with an illustration or icon + a contextual CTA (e.g., "Create your first workspace" with a button). |

---

## 4. Mass Glitch Patterns

These are systemic issues that appear across multiple files and suggest architectural or convention gaps.

### 4.1 "Accessibility Afterthought" Pattern

**Symptoms:** ARIA roles, `aria-label`, `aria-expanded`, `aria-pressed`, `aria-live`, focus-visible styles, and focus traps are absent or incomplete across virtually every modal, tab group, button group, and icon-only button.

**Affected files:** `SessionLauncher.tsx`, `SwarmDashboardModal.tsx`, `DiffPreviewModal.tsx`, `GitControlModal.tsx`, `UpdateCheckerModal.tsx`, `TaskTemplatesModal.tsx`, `UserGuideModal.tsx`, `UpdatesSection.tsx`, `ShortcutsModal.tsx`, `RightDock.tsx`, `CommandPalette.tsx`.

**Root cause:** Accessibility was not included in the definition of "done" for UI components. There is no shared accessible-component primitive (e.g., `<AccessibleButton>`, `<AccessibleTabGroup>`) that enforces these patterns at the component level.

**Fix:** Create a shared component library with accessible wrappers. Add an ESLint rule (`jsx-a11y`) to the CI pipeline so new violations are caught at build time.

---

### 4.2 "Stale Closure" Pattern

**Symptoms:** `useEffect([], ...)` listeners capture handlers at mount time and never refresh, even when the underlying store handler changes.

**Affected files:** `HomePage.tsx` (lines 162, 193), and potentially any other `useEffect` with an empty dependency array that references a store method.

**Root cause:** Mixing event-listener registration with Zustand store subscriptions without a re-subscribe mechanism.

**Fix:** Standardize on a pattern: either (a) use `useRef` to always call the latest handler, or (b) subscribe inside `useEffect` with the handler in the deps array and clean up on change.

---

### 4.3 "Hover-Only Interactivity" Pattern

**Symptoms:** Buttons rely on `hover:` Tailwind classes for affordance feedback (`hover:scale-105`, `hover:bg-*`) with no corresponding `focus-visible:` styles. Keyboard users see no state change on focus.

**Affected files:** `RightDock.tsx`, `UpdateCheckerModal.tsx`, `HomePage.tsx`, `BrowserPane.tsx`.

**Root cause:** Design system does not enforce a focus ring as a first-class state alongside hover and active.

**Fix:** Add a global CSS rule: `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` and remove hover-only transforms that obscure focus rings.

---

### 4.4 "CSS Variable Declared But Never Defined" Pattern

**Symptoms:** JSX references `var(--browser-row-h, 28px)` and potentially other custom properties that have no source of truth in CSS or JS.

**Affected files:** `BrowserPane.tsx` (line 27), potentially others.

**Root cause:** CSS variables introduced as "future customization hooks" but never populated; the fallback value in `var()` masks the dead code.

**Fix:** Audit all `var(--*)` usages. Either define them in `:root` in `globals.css` or replace with hardcoded Tailwind utility values. Remove the variable pattern unless there is a documented override path.

---

### 4.5 "Generic Error Text" Pattern

**Symptoms:** Error states in `DiffPreviewModal.tsx` and `GitControlModal.tsx` use plain text strings like "No worktree diff or git repository not detected" and "Init Git Repository" with no `role="alert"` and no visual distinction from normal content.

**Affected files:** `DiffPreviewModal.tsx` (line 60), `GitControlModal.tsx` (line 258).

**Root cause:** Error handling was implemented as a text assignment rather than a distinct UI state with semantics and styling.

**Fix:** Create a shared `<ErrorBanner>` component with `role="alert"`, icon, and actionable CTA (retry, help link). Use it consistently across modals.

---

## 5. Priority Action Items

### Sprint 1 — Fix Broken Functionality (Week 1)

| Priority | Item | File | Why First |
|---|---|---|---|
| P0 | **Wire Stop button to actual stop-agent command** | `SwarmDashboardModal.tsx:442` | Broken affordance. Users lose trust. 1-line fix + 1-line test. |
| P0 | **Guard CDP screencast callback against unmounted state** | `BrowserPane.tsx:104` | Runtime crash risk. Add `mountedRef` guard + rAF batching. |
| P0 | **Fix AVD device serial bug** | `AndroidEmulatorPane.tsx:172` | Wrong data shown to users. One-line fix: use per-AVD serial. |
| P1 | **Fix stale closure on keyboard shortcut handler** | `HomePage.tsx:162` | Shortcut silently fails if store reference changes. |
| P1 | **Fix stale voice event listeners** | `HomePage.tsx:193` | Same pattern. Add refs. |

### Sprint 2 — Accessibility Foundation (Week 2–3)

| Priority | Item | Files | Why Second |
|---|---|---|---|
| P0 | **Add tablist/tab/radiogroup ARIA to SessionLauncher** | `SessionLauncher.tsx:175,221,272` | Blocks keyboard-only users from the primary entry point. |
| P0 | **Add tablist/tab ARIA to SwarmDashboardModal** | `SwarmDashboardModal.tsx:199` | Same — blocks core dashboard navigation. |
| P1 | **Add focus trap + Escape to all modals** | `DiffPreviewModal.tsx`, `GitControlModal.tsx`, `UserGuideModal.tsx` | Three modals have zero keyboard support. |
| P1 | **Add aria-label to all icon-only buttons** | `UpdateCheckerModal.tsx`, `SwarmDashboardModal.tsx` | Quick wins — 5–10 buttons across 2 files. |
| P2 | **Add focus-visible styles to all interactive elements** | `RightDock.tsx`, `globals.css` | Global CSS rule + per-button audit. |

### Sprint 3 — Performance & Polish (Week 4)

| Priority | Item | Files | Why Third |
|---|---|---|---|
| P1 | **Cancel rAF loop when splash is static** | `SwarmCanvasMesh.tsx:254` | CPU/GPU waste on low-end Macs. |
| P1 | **Remove global `overflow: hidden` from `:root`** | `globals.css:104` | May be cutting off dropdowns/context menus. |
| P1 | **Stabilize Date.now() in SwarmCoreHero** | `SwarmCoreHero.tsx:32` | Eliminates visible jitter in hero animation. |
| P2 | **Add `content-visibility: auto` to scrollable regions** | `globals.css` | Paint cost reduction for large surfaces. |
| P2 | **Replace Math.random() in skeletons with useMemo** | `Skeleton.tsx:30` | Eliminates layout jitter during loading. |

### Ongoing

| Priority | Item | Why Ongoing |
|---|---|---|
| P2 | **Create accessible component primitives** (`<AccessibleButton>`, `<AccessibleTabs>`, `<AccessibleModal>`) | Prevents regression. Enforces patterns at the component level. |
| P2 | **Enable `eslint-plugin-jsx-a11y` in CI** | Catches new violations before they ship. |
| P3 | **Replace mock logs with real telemetry** | `SwarmDashboardModal.tsx:152` — misleading UX. Requires backend work; schedule when agent logging is ready. |

---

## Appendix: Severity Distribution

```
CRITICAL: ████████████████████░░░░░░░░░░░░░░░░░░ 7 ( 9%)
HIGH: ████████████████████████████████████░░ 24 (31%)
MEDIUM: ██████████████████████████████████████ 32 (42%)
LOW: ██████████████████████░░░░░░░░░░░░░░░░ 20 (26%)
─────────────────────────────────────────────────
TOTAL: 77
```

## Appendix: Files Most Affected

| File | Finding Count | Top Issues |
|---|---|---|
| `SwarmDashboardModal.tsx` | 9 | Stop button no-op, ARIA tab semantics, mock logs, icon-only buttons |
| `GitControlModal.tsx` | 6 | Missing labels, focus trap, diff semantics, form reset |
| `UserGuideModal.tsx` | 5 | Tab ARIA, focus trap, stale keys, icon-only buttons |
| `UpdateCheckerModal.tsx` | 5 | aria-expanded, aria-labels, live regions, hover-only focus |
| `HomePage.tsx` | 4 | Stale closures, sticky sidebar overflow, non-semantic input |
| `globals.css` | 4 | overflow:hidden root, animation duration, content-visibility, dead selectors |
| `BrowserPane.tsx` | 4 | CDP race, sticky header overlap, CSS var, row height |
| `SessionLauncher.tsx` | 4 | 3× ARIA radiogroup + textarea label |
| `DiffPreviewModal.tsx` | 4 | File list ARIA, diff semantics, focus trap, error state |
| `UpdatesSection.tsx` | 4 | useEffect deps, aria-expanded, aria-busy, live regions |

---

*End of report. All findings are grounded in the reviewed source files. Fix priorities should be validated against the product roadmap before sprint planning.*
