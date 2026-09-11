# SwarmAI Desktop — Premium UI/UX Improvement Report

> Generated from deep codebase audit of `desktop/` (Tauri + React + TypeScript + Tailwind CSS)

---

## 1. CURRENT STATE AUDIT

### What's Already Excellent

The app has a **serious design foundation** — this is not a beginner project:

- **Token-driven theming**: RGB channel triplets as CSS custom properties (`--swarm-gold: 218 165 72`) so Tailwind opacity modifiers work. This is a professional-grade approach.
- **Elevation ladder**: Four-tier system (canvas → canvas-hi → surface → surface-hi) with opaque fills and a single `.glass-hi` that keeps backdrop-blur. The comment in `globals.css` shows deep thinking about why most glassmorphism apps look flat (translucency compositing everything toward the same value).
- **Motion tokens**: Unified `--swarm-t-fast: 90ms` and `--swarm-t-base: 150ms` with a single easing curve. Most apps have random durations per rule.
- **Cinematic splash**: 4-phase opening animation with sound effects, canvas mesh, core hero, and HUD. This is rare for desktop tools.
- **Self-hosted fonts**: Geist + Geist Mono bundled as WOFF2 — no runtime fetch, instant render. Professional detail.
- **Terminal typography fix**: Resetting `font-feature-settings`, `letter-spacing`, and `text-rendering` for xterm so columns don't drift. Shows deep care for the terminal experience.
- **9 themes** with distinctive personalities (Charcoal, Midnight, Matrix, Nordic, Crimson, Swarm, Obsidian, Graphite, Amber).
- **Accessibility**: `prefers-reduced-motion`, `prefers-reduced-transparency`, skip-nav, focus rings, keyboard shortcuts.
- **Status bar**: Rich, informative — git branch, change count, engine status, agent activity, update notifications.
- **Sidebar as session manager**: Dynamic chat titling, workspace switching, git status polling.

### What's Holding It Back From "Premium"

| Area | Issue | Impact |
|------|-------|--------|
| **Logo** | Generic geometric bee — looks like a placeholder, not a brand mark | First impression is amateur |
| **Theme picker** | Basic dropdown or grid — no preview, no categorization, no personality | Theme discovery is weak |
| **Empty states** | No illustrated/guided empty states for no-workspace, no-agents, no-history | Feels broken when empty |
| **Loading states** | Only basic shimmer skeleton — no brand-aligned loaders | Feels generic |
| **Window chrome** | Standard floating pill controls — not integrated into the chrome | Feels like a web app wrapper |
| **Status bar** | Informative but static — no hover details, no sparklines, no interactivity | Wasted premium real estate |
| **Modals** | Basic fade/scale — no spring physics, no shared transition system | Feels like a web app |
| **Command palette** | Functional but plain — no preview, no recent items, no categories | Feels utilitarian |
| **Settings page** | Grid of cards — good but no search, no grouping intelligence | Feels like a settings dump |
| **Hover states** | Mostly color-only transitions — no lift, no scale, no depth change | Feels flat |
| **Scrollbar** | Thin and themed, but no overlay scrollbar mode option | Minor |
| **Icon system** | Pure Lucide — no brand-specific icons, no icon scale system | Generic feel |
| **Onboarding** | Modal-based — not an interactive tour of the actual UI | Users miss features |

---

## 2. THEME IMPROVEMENTS

### Current Theme Analysis

| Theme | Premium Rating | Notes |
|-------|---------------|-------|
| **Charcoal** (default) | ★★★★☆ | Excellent — deep, sophisticated, OLED-friendly. The "diamond smokie white" accent is distinctive. Best default. |
| **Midnight Cyberpunk** | ★★★☆☆ | Fun but niche. Violet/cyan clash feels more "hacker" than "luxury." |
| **Matrix Phosphor** | ★★★☆☆ | Cool factor but low versatility. Green-on-black is expected, not premium. |
| **Nordic Frost** | ★★★★☆ | Elegant ice-blue palette. Good for a "clean" premium feel. |
| **Crimson Eclipse** | ★★★★☆ | Bold and distinctive. Ruby/sakura is unusual and premium-feeling. |
| **Swarm Dark** | ★★★☆☆ | The "official" theme but gold-on-dark-blue is common. Needs more distinction. |
| **Obsidian** | ★★★☆☆ | Near-duplicate of Swarm Dark with slightly different values. Redundant. |
| **Graphite** | ★★★☆☆ | Safe and professional but uninspired. |
| **Honey Amber** | ★★★☆☆ | Warm and cozy but not "wow." |

### 5 New Premium Themes to Add

#### 1. **Celadon Jade** — Luxury Asian Aesthetic
```
canvas: "5 8 7" // #050807 — Near-black jade
canvasHi: "11 18 16" // #0b1210 — Deep jade glass
surface: "16 26 23" // #101a17 — Frosted jade surface
surfaceHi:"22 36 31" // #16241f — Luminous jade glass
border: "34 56 48" // #223830 — Jade hairline
borderHi: "52 211 153" // #34d399 — Phosphor mint glow
gold: "52 211 153" // #34d399 — Jade primary accent
goldHi: "134 239 172" // #86efac — Mint supernova
goldDim: "16 185 129" // #10b981 — Deep jade
honey: "110 231 183" // #6ee7b7 — Light phosphor
amber: "167 243 208" // #a7f3d0 — Celadon mist
text: "236 253 245" // #ecfdf5 — Phosphor white-green
textDim: "134 239 172" // #86efac — Phosphor mint dim
textMuted:"52 105 84" // #346954 — Stealth matrix muted
ok: "52 211 153" // #34d399 — Terminal green
warn: "250 204 21" // #facc15 — Warning gold
err: "244 63 94" // #f43f5e — Red terminal alarm
```
**Rationale**: Inspired by imperial jade carvings and celadon ceramics. The jade green accent feels ancient luxury meets digital precision. OLED-friendly near-black base. Distinct from Matrix (which is "hacker terminal") — this is "luxury artifact."

#### 2. **Rose Quartz** — Hermès Luxury Fashion
```
canvas: "12 8 9" // #0c0809 — Dark rose void
canvasHi: "20 14 16" // #140e10 — Deep obsidian ember
surface: "30 20 24" // #1e1418 — Frosted rose glass
surfaceHi:"44 28 34" // #2c1c22 — Solar flare glass
border: "70 40 50" // #462832 — Rose hairline
borderHi: "251 113 133" // #fb7185 — Rose supernova
gold: "251 113 133" // #fb7185 — Rose primary
goldHi: "253 164 175" // #fda4af — Light sakura
goldDim: 225 29 72" // #e11d48 — Deep rose
honey: "253 164 175" // #fda4af — Soft rose
amber: "251 146 60" // #fb923c — Solar orange
text: "255 241 242" // #fff1f2 — Crisp rose white
textDim: "253 164 175" // #fda4af — Soft rose subtext
textMuted:"140 90 105" // #8c5a69 — Muted ash
ok: "52 211 153" // #34d399 — Emerald spark
warn: "251 146 60" // #fb923c — Solar orange
err: "244 63 94" // #f43f5e — Crimson laser
```
**Rationale**: Hermès rose gold meets dark mode. Sophisticated, fashion-forward, instantly recognizable. The rose accent on near-black creates a "fine jewelry" premium feel.

#### 3. **Violet Royale** — Amethyst Luxury
```
canvas: "8 6 14" // #08060e — Royal purple void
canvasHi: "14 10 24" // #0e0a18 — Deep amethyst glass
surface: "22 16 36" // #161024 — Frosted violet surface
surfaceHi:"32 22 52" // #201634 — Luminous violet glass
border: "50 36 80" // #322450 — Violet hairline
borderHi: "168 85 247" // #a855f7 — Electric violet neon
gold: "168 85 247" // #a855f7 — Violet primary
goldHi: "192 132 252" // #c084fc — Lilac bright
goldDim: "126 34 206" // #7e22ce — Deep royal violet
honey: "216 180 254" // #d8b4fe — Soft lavender
amber: "139 92 246" // #8b5cf6 — Bright violet
text: "248 245 255" // #f8f5ff — Violet white
textDim: "192 132 252" // #c084fc — Lilac dim
textMuted:"107 70 160" // #6b46a0 — Muted violet
ok: "52 211 153" // #34d399 — Emerald
warn: "250 204 21" // #facc15 — Cyber yellow
err: "244 63 94" // #f43f5e — Neon pink
```
**Rationale**: Amethyst and tanzanite inspired. Purple is underused in premium dev tools — this fills that gap. Royal, creative, and distinctive.

#### 4. **Steel Diver** — Dive Watch Precision
```
canvas: "6 8 10" // #06080a — Abyss black
canvasHi: "12 16 22" // #0c1016 — Deep ocean glass
surface: "18 26 34" // #121a22 — Frosted steel
surfaceHi:"26 38 50" // #1a2632 — Luminous steel glass
border: "40 58 76" // #283a4c — Steel hairline
borderHi: "56 189 248" // #38bdf8 — Glacial ice blue
gold: "56 189 248" // #38bdf8 — Polar ice blue
goldHi: "125 211 252" // #7dd3fc — Crystalline blue
goldDim: "14 165 233" // #0ea5e9 — Deep azure
honey: "186 230 253" // #bae6fd — Polar frost
amber: "56 189 248" // #38bdf8 — Ice blue
text: "248 250 252" // #f8fafc — Diamond ice white
textDim: "186 230 253" // #bae6fd — Frost subtext
textMuted:"100 125 155" // #647d9b — Arctic fog
ok: "52 211 153" // #34d399 — Emerald aurora
warn: "250 204 21" // #facc15 — Amber sun
err: "244 63 94" // #f43f5e — Arctic rose
```
**Rationale**: Inspired by dive watch bezels and deep ocean. The ice-blue accent on near-black feels precise, technical, and luxurious — like a Rolex or Omega digital interface.

#### 5. **Champagne Noir** — Classic Luxury
```
canvas: "10 9 8" // #0a0908 — Warm black
canvasHi: "18 16 14" // // #12100e — Cognac glass
surface: "28 25 22" // // #1c1916 — Frosted cognac
surfaceHi:"40 35 30" // // #28231e — Luminous cognac glass
border: "58 50 42" // // #3a322a — Cognac hairline
borderHi: "232 176 74" // #e8b04a — Champagne gold
gold: "232 176 74" // #e8b04a — Champagne primary
goldHi: "246 205 124" // #f6cd7c — Bright champagne
goldDim: "172 127 44" // // #ac7f2c — Deep cognac
honey: "242 192 99" // #f2c063 — Warm honey
amber: "213 154 53" // // #d59a35 — Cognac amber
text: "244 239 228" // #f4efe4 — Warm ivory
textDim: "200 189 168" // #c8bda8 — Parchment dim
textMuted:"142 132 113" // #8e8471 — Muted sand
ok: "99 171 116" // // #63ab74 — Emerald moss
warn: "223 174 76" // // #dfae4c — Cognac warn
err: "221 106 92" // // #dd6a5c — Terra cotta
```
**Rationale**: Hermès-inspired warm palette. Cognac, champagne gold, warm ivory — feels like a luxury leather goods brand. Stands out from all other dark themes by being warm instead of cool.

### Theme System Improvements

1. **Theme preview cards** in the picker — show actual UI components (button, input, card) rendered in the theme, not just color swatches
2. **Theme categories**: "Classic," "Bold," "Nature," "Luxury" — help users navigate 14 themes
3. **Accent-only mode**: Let users keep a theme's surface/canvas but swap just the accent color
4. **System sync**: Option to match OS dark/light mode automatically
5. **Per-pane theming**: Allow different panes to use different themes (e.g., terminal in Matrix, dashboard in Charcoal)
6. **Theme transition animation**: Smooth 300ms color morph when switching themes (currently instant)

---

## 3. WINDOW CHROME & TITLE BAR

### Current State
- Floating pill-shaped window controls in the top-right corner (`fixed right-2 top-1 z-[60]`)
- Background blur + border on the controls container
- macOS traffic lights vs Windows min/max/close buttons

### Premium Improvements

1. **Unified title bar strip**: A thin (32px) full-width bar that spans the entire window top, matching the app's surface color. Window controls sit inside it, aligned to the right. This feels native, not floating.

2. **Traffic light styling**: On macOS, style the traffic lights to match the theme's accent (not just standard macOS colors). The active state could have a subtle glow.

3. **Drag region refinement**: The `data-tauri-drag-region="deep"` is good — expand it to cover the full title bar strip, not just the corner.

4. **Title bar tabs** (advanced): When multiple panes are open, show subtle tab-like indicators in the title bar showing which pane is active — similar to VS Code's title bar tabs but more minimal.

5. **Window controls animation**: Subtle scale/color transition on hover for min/max/close buttons. Currently they're instant.

---

## 4. SIDEBAR ENHANCEMENTS

### Current State
- Workspace sidebar with project tree, git status, agent list
- Collapsible (pin/unpin)
- Theme picker slot
- Top bar with "Workspaces" label and toggle buttons

### Premium Improvements

1. **Bento grid layout** for the workspace overview: Instead of a flat list, show workspace cards in a 2-column bento grid with:
 - Project name + path
 - Agent count + status dots
 - Git branch badge
 - Last activity timestamp
 - Subtle hover lift effect

2. **Animated section headers**: Collapsible sections (Workspaces, Agents, Git) with smooth height transitions and rotating chevrons.

3. **Agent status indicators**: Replace text status with animated dots/bars — running = pulsing emerald, launching = amber wave, error = red flash.

4. **Context-aware quick actions**: Right-click (or long-press) on a workspace shows: Open, Rename, Delete, Open in Terminal, Open in GitHub.

5. **Search/filter bar**: A compact search input at the top of the sidebar to filter workspaces and agents.

6. **Sticky bottom section**: Theme picker and settings gear in a fixed bottom section that doesn't scroll with the content.

---

## 5. STATUS BAR UPGRADES

### Current State
- 7px height, border-top, backdrop-blur
- Project path pill, git branch + change count, engine status, agent activity, update notifications

### Premium Improvements

1. **Hover tooltips**: Each element reveals a rich tooltip on hover:
 - Git branch → "Branch: main · Last commit: 2h ago · 3 ahead, 1 behind"
 - Agent count → "2 of 4 agents running · Claude Code + Codex"
 - Engine status → "Swarm Engine v0.4.1 · Local Memory Bridge connected"

2. **Mini sparkline charts**: Show CPU/memory usage as a tiny inline sparkline in the status bar.

3. **Interactive git pill**: Click opens a mini dropdown showing recent commits (last 5) with author avatar dots.

4. **Theme indicator**: Small dot showing current theme color — click to open theme picker.

5. **Clock/uptime**: Show session uptime or current time on the far right.

6. **Expandable detail panel**: Double-click the status bar to expand a detail panel showing full telemetry.

---

## 6. MODAL & DIALOG IMPROVEMENTS

### Current State
- Various modals: Settings, Dashboard, Git, Diff, Templates, Extensions, Updates, Guide
- All use similar glass-hi treatment with backdrop blur

### Premium Improvements

1. **Spring animations**: Replace all modal open/close with spring physics:
 ```css
 /* Instead of: opacity + scale */
 /* Use: spring-curve translateY + scale + opacity */
 transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
 ```
 This gives modals a slight "overshoot" that feels physical and premium.

2. **Backdrop blur intensity**: The current `.glass-hi` uses `blur(20px) saturate(1.6)`. Increase to `blur(24px) saturate(1.8)` for modals and add a subtle darkening overlay (`bg-black/40`) behind them.

3. **Shared modal component**: Create a `Modal` base component that all modals use, ensuring consistent:
 - Entrance/exit animation
 - Backdrop click to close
 - Escape key handling
 - Focus trap
 - Body scroll lock
 - Z-index management

4. **Staggered children**: Modals with lists (templates, extensions, settings nav) should stagger-animate children on open:
 ```
 Item 1: delay 0ms
 Item 2: delay 30ms
 Item 3: delay 60ms
 ...
 ```

5. **Modal size variants**: Define standard sizes — `sm` (420px), `md` (560px), `lg` (720px), `xl` (900px), `full` — instead of each modal deciding independently.

---

## 7. COMMAND PALETTE REDESIGN

### Current State
- `CommandPalette.tsx` — functional overlay with search
- `CommandHistoryPopup.tsx` — recent commands

### Premium Improvements

1. **Preview pane**: When a command is selected, show a preview panel on the right:
 - "Open Folder" → shows recent folders with icons
 - "Git Commit" → shows staged changes preview
 - "Switch Theme" → shows theme preview

2. **Category tabs**: Top of the palette shows category tabs: "All", "Navigation", "Agents", "Git", "Settings", "Recent"

3. **Recent commands**: Show last 10 commands with fuzzy match highlighting

4. **Keyboard shortcut display**: Every command shows its keyboard shortcut on the right, with the correct modifier symbols (⌘, ⌃, ⌥)

5. **Rich icons**: Each command has a distinctive icon with the app's accent color, not just gray

6. **Animation**: Smooth open/close with scale + fade + slight upward translation. The search field should auto-focus with a cursor blink.

7. **Result grouping**: Group results by category with subtle section headers

---

## 8. SETTINGS PAGE REDESIGN

### Current State
- Two-column layout: left nav + right content
- 6 sections: Tools, Models, Providers, Guide, Privacy, Updates
- Card-based tool grid in Tools section

### Premium Improvements

1. **Search bar**: Add a search input at the top that filters settings across all sections

2. **Visual toggles**: Replace checkboxes with iOS-style toggle switches with smooth animations

3. **Section icons with accent colors**: Each nav item gets its own accent color:
 - Tools → gold
 - Models → blue
 - Providers → purple
 - Guide → green
 - Privacy → red/crimson
 - Updates → amber

4. **Grouped settings**: Within each section, group related settings with subtle card containers

5. **Badge indicators**: Show notification badges on nav items (e.g., "2" on Updates if available, "!" on Providers if a key is missing)

6. **Hero section**: At the top of Settings, show a mini "about" card with:
 - App version
 - Current theme (with preview)
 - Quick actions (Check for Updates, Open Logs)

---

## 9. ANIMATION & MOTION SYSTEM

### Current State
- CSS-only animations (no Framer Motion)
- Keyframes for: voice waves, pulse glows, slide up/down, shimmer, dash
- Motion tokens: 90ms fast, 150ms base, cubic-bezier(0.2, 0, 0, 1)
- 4-phase splash animation (2800ms)

### Recommended Improvements

1. **Add Framer Motion** for complex orchestrated animations:
 - Modal stagger children
 - Pane focus transitions
 - Sidebar collapse/expand
 - List reorder animations

2. **Spring physics for interactive elements**:
 - Buttons: slight scale on press (0.97), spring back
 - Cards: lift + shadow expansion on hover with spring easing
 - Toggles: spring-based thumb movement

3. **Theme transition animation**:
 ```css
 :root {
 transition: --swarm-canvas 300ms ease, --swarm-surface 300ms ease, 
 --swarm-gold 300ms ease, --swarm-text 300ms ease;
 }
 ```
 This makes theme switching feel smooth rather than jarring.

4. **Pane entrance animation**: When a new terminal/agent pane is created:
 - Fade in + slight scale (0.95 → 1)
 - Slide from spawn point (e.g., center or where the "+" button was)
 - Stagger: if multiple panes open at once, cascade the animation

5. **Agent status transitions**: Smooth morphing between states:
 - idle → launching: amber wave sweeps across the agent chip
 - launching → running: emerald pulse expands outward
 - running → error: red flash + shake

6. **Skeleton → content transition**: When content loads, the skeleton shimmer fades out while content fades in (cross-fade, not instant swap).

7. **Scroll-triggered reveals**: Settings sections, dashboard cards, and sidebar items animate in as they scroll into view (use Intersection Observer).

---

## 10. ICONOGRAPHY & BRANDING

### Current State
- Logo: Geometric honeybee SVG with striped body, wings, antennae
- Icons: Pure Lucide React (30+ files import from it)
- No custom icon set

### Logo Improvements

**Current issues**: The bee is recognizable but generic. The proportions feel slightly off (body too tall relative to wings). The color is hardcoded white/gray instead of using theme tokens.

**Recommended logo evolution**:

1. **Geometric refinement**: Redesign the bee with tighter geometry:
 - Use a 24×24 grid (standard icon grid)
 - Reduce body height by 10%
 - Widen wings slightly for better visual balance
 - Round antennae tips for a friendlier feel

2. **Logo mark + wordmark combo**: The current logo is a mark only. Add a wordmark "SwarmAI" in Geist font next to it for the splash screen and settings.

3. **Animated logo variant**: For the splash screen, add a subtle animation:
 - Bee "lands" on screen with a slight bounce
 - Wings flap once on arrival
 - Antennae twitch
 - Then the hexagonal honeycomb pattern radiates outward

4. **Monochrome variant**: A single-color version for places where the gold accent doesn't work (dark overlays, etc.)

### Icon System Improvements

1. **Create a `SwarmIcon` component** that wraps Lucide icons with:
 - Consistent sizing (16px default, 14px compact, 20px prominent)
 - Theme-aware stroke color
 - Hover state (subtle scale + color shift)
 - Active state (filled version where Lucide provides it)
 - Loading state (spinning variant)

2. **Custom icons for key features**:
 - **Swarm mark** (bee) — for the app icon, splash, and "home" actions
 - **Agent types** — custom icons for each agent role (Builder, Reviewer, Scout, Coordinator, etc.) instead of generic Lucide icons
 - **Workflow icons** — custom icons for the task pipeline stages
 - **Terminal prompt** — a custom terminal icon that matches the app's aesthetic

3. **Icon color system**:
 - Default: `text-swarm-textMuted`
 - Accent: `text-swarm-gold`
 - Success: `text-swarm-ok`
 - Error: `text-swarm-err`
 - Interactive hover: `text-swarm-text` with `hover:text-swarm-gold`

---

## 11. ONBOARDING FLOW

### Current State
- `OnboardingModal.tsx` — a single modal
- `AppOpeningAnimation.tsx` — splash screen (replayable)

### Premium Improvements

1. **Interactive first-run tour**: Instead of a static modal, guide users through the actual UI:
 - Step 1: "Let's open your first project" → highlight the folder button, auto-trigger folder picker
 - Step 2: "Meet your AI agents" → highlight the session launcher
 - Step 3: "Try the command palette" → trigger Ctrl+K programmatically
 - Step 4: "Customize your theme" → open theme picker

2. **Progressive disclosure**: Don't show all features at once. Show "Need help?" only after the user has been using the app for 5+ minutes.

3. **Feature discovery tooltips**: Subtle "Did you know?" tooltips that appear near features the user hasn't discovered yet, with a dismiss button.

4. **Welcome screen** (before the main UI): A full-screen welcome with:
 - Animated logo
 - "Open a project to get started" with a large, inviting button
 - Recent projects (if any)
 - Theme preview at the bottom

---

## 12. SPECIFIC UI POLISH ITEMS

### Immediate Wins (Low Effort, High Impact)

| Item | Effort | Impact | Description |
|------|--------|--------|-------------|
| **Logo update** | Medium | High | Refine the bee SVG geometry, add wordmark |
| **Theme transition animation** | Low | Medium | Add CSS transition on theme token changes |
| **Button hover lift** | Low | Medium | Add `.glass-lift` class to all interactive buttons |
| **Status bar hover tooltips** | Low | Medium | Add title attributes with richer info |
| **Skeleton → content cross-fade** | Low | Medium | Add fade transition in Skeleton.tsx |
| **Modal spring animation** | Low | High | Update modal enter/exit to use spring easing |
| **Icon scale system** | Low | Medium | Create SwarmIcon wrapper component |
| **Selection color** | Already done | — | ✅ Already themed with gold |
| **Focus ring consistency** | Already done | — | ✅ Already gold, consistent |
| **Scrollbar theming** | Already done | — | ✅ Already themed |

### Medium Effort, High Impact

| Item | Effort | Impact | Description |
|------|--------|--------|-------------|
| **Theme preview cards** | Medium | High | Render actual UI in each theme's colors |
| **5 new themes** | Medium | High | Jade, Rose Quartz, Violet, Steel Diver, Champagne Noir |
| **Shared Modal component** | Medium | High | Consistent animation, focus trap, scroll lock |
| **Command palette redesign** | Medium | High | Preview pane, categories, recent items |
| **Settings page search + badges** | Medium | Medium | Cross-section search, notification badges |
| **Sidebar bento grid** | Medium | Medium | Animated workspace cards |
| **Welcome screen** | Medium | Medium | Full-screen first-run experience |

### High Effort, Very High Impact

| Item | Effort | Impact | Description |
|------|--------|--------|-------------|
| **Framer Motion integration** | High | Very High | Spring physics, orchestrated animations, shared layouts |
| **Interactive onboarding tour** | High | High | Step-by-step UI walkthrough |
| **Per-pane theming** | High | Medium | Different themes per terminal pane |
| **Custom icon set** | High | Medium | Brand-specific icons for agents, workflows |
| **Dashboard charts** | Medium | High | Add sparkline charts to agent telemetry |

---

## 13. RECOMMENDED DESIGN SYSTEM ADDITIONS

### New CSS Classes to Add to `globals.css`

```css
/* Spring animation curve for interactive elements */
.spring-transition {
 transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Theme-aware transition for smooth theme switching */
.theme-transition {
 transition: background-color 300ms ease, border-color 300ms ease,
 color 300ms ease, box-shadow 300ms ease;
}

/* Premium shimmer for skeleton screens */
.shimmer-premium {
 background: linear-gradient(
 90deg,
 rgba(255,255,255,0.03) 0%,
 rgba(255,255,255,0.06) 50%,
 rgba(255,255,255,0.03) 100%
 );
 background-size: 200% 100%;
 animation: shimmer 1.5s ease-in-out infinite;
}

/* Subtle hover lift for cards */
.hover-lift {
 transition: transform 150ms var(--swarm-ease),
 box-shadow 150ms var(--swarm-ease);
}
.hover-lift:hover {
 transform: translateY(-2px);
 box-shadow: 0 8px 24px -8px rgba(0,0,0,0.5);
}

/* Animated underline for links */
.link-underline {
 position: relative;
}
.link-underline::after {
 content: '';
 position: absolute;
 bottom: -2px;
 left: 0;
 width: 0;
 height: 1px;
 background: rgb(var(--swarm-gold));
 transition: width 150ms var(--swarm-ease);
}
.link-underline:hover::after {
 width: 100%;
}

/* Mini sparkline container */
.sparkline {
 display: inline-flex;
 align-items: flex-end;
 gap: 1px;
 height: 16px;
}
.sparkline-bar {
 width: 2px;
 background: rgb(var(--swarm-gold));
 border-radius: 1px;
 transition: height 100ms ease;
}
```

### New React Components to Build

```
src/shared/
 SwarmIcon.tsx — Lucide wrapper with theme-aware styling
 Modal.tsx — Shared modal with spring animation
 Tooltip.tsx — Rich tooltip component
 Sparkline.tsx — Mini chart component
 Skeleton.tsx — Already exists, add more variants
 EmptyState.tsx — Illustrated empty states
 Badge.tsx — Notification/info badges

src/features/
 onboarding/
 WelcomeScreen.tsx — Full-screen welcome
 OnboardingTour.tsx — Interactive tour overlay
 settings/
 SettingsSearch.tsx — Cross-section search
 palette/
 CategoryTabs.tsx — Command palette categories
 PreviewPane.tsx — Command result preview
```

---

## 14. PRIORITY IMPLEMENTATION ORDER

### Phase 1: Foundation (Week 1-2)
1. Logo refinement (SVG geometry + wordmark)
2. Theme transition animation (CSS only, low effort)
3. Button hover lift (CSS class propagation)
4. Modal spring animation (update existing modals)
5. Shared Modal component (refactor existing modals)

### Phase 2: Polish (Week 3-4)
6. 5 new premium themes (Jade, Rose Quartz, Violet, Steel Diver, Champagne Noir)
7. Theme preview cards in picker
8. Status bar hover tooltips
9. Icon scale system (SwarmIcon wrapper)
10. Settings page search + badges

### Phase 3: Experience (Week 5-6)
11. Command palette redesign (preview pane, categories)
12. Welcome screen + interactive onboarding tour
13. Sidebar bento grid workspace cards
14. Skeleton → content cross-fade

### Phase 4: Delight (Week 7-8)
15. Framer Motion integration for complex animations
16. Custom icon set for agents/workflows
17. Dashboard sparkline charts
18. Per-pane theming

---

## 15. INSPIRATION REFERENCE

| App | What to Steal | How It Translates |
|-----|---------------|-------------------|
| **Raycast** | Command palette design, icon precision, spring animations | Redesign command palette, add SwarmIcon |
| **Linear** | Subtle motion, status indicators, empty states | Agent status transitions, empty state illustrations |
| **Warp** | Terminal polish, onboarding flow | Terminal pane improvements, welcome screen |
| **Arc Browser** | Tab design, sidebar morphing | Pane tabs in title bar, sidebar animations |
| **Zed** | Editor chrome, status bar detail | Status bar sparklines, hover tooltips |
| **Cursor** | AI response streaming animations | Agent output streaming visual feedback |
| **Vercel Dashboard** | Card hover effects, subtle shadows | Hover-lift class, card elevation |
| **Apple SF Symbols** | Icon grid system, optical sizing | SwarmIcon scale system, Lucide wrappers |
| **Figma** | Canvas interactions, color precision | Theme preview cards, color token system |
| **Things 3** | Empty state illustrations, onboarding tour | Welcome screen, progressive disclosure |

---

## Summary

Your SwarmAI desktop app already has a **strong foundation** — the token-driven theming system, elevation ladder, motion tokens, and cinematic splash show serious design thinking. The biggest leap to "premium" comes from:

1. **Logo/branding polish** (biggest first impression impact)
2. **Theme expansion** (5 new luxury-inspired themes with preview cards)
3. **Animation refinement** (spring physics, smooth transitions, orchestrated reveals)
4. **Interactive details** (tooltips, sparklines, hover lifts, command palette preview)
5. **Onboarding experience** (guided tour instead of static modal)

The app is at roughly **75% of the way** to feeling like a $100+ premium product. The remaining 25% is mostly polish, animation, and branding refinement — not structural rewrites.
