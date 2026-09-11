# SwarmAI Animation & Motion Design Report

## Executive Summary

SwarmAI has a **strong foundation** — a well-structured motion scale (`--swarm-t-fast: 90ms`, `--swarm-t-base: 150ms`, `cubic-bezier(0.2, 0, 0, 1)`), a cinematic splash screen, and thoughtful glassmorphism transitions. However, the system is **CSS-transition-only** with **no spring physics**, **no exit animations**, **no orchestrated choreography**, and **no layout animations**. This report identifies every gap and provides specific, actionable upgrades.

---

## 1. Current Animation Audit

### 1.1 What Exists

| Layer | Implementation | Quality |
|-------|---------------|---------|
| Motion tokens | 2 CSS vars (`--swarm-t-fast`, `--swarm-t-base`) + 1 easing | Solid foundation, but sparse |
| Keyframe animations | voice waves, pulse glow/emerald, slide up/out, shimmer, dash | Well-crafted, but limited scope |
| Tailwind animations | `fade-in`, `scale-in` (both 0.14s ease-out) | Too fast, too subtle for modals |
| Splash screen | 4-phase cinematic (2800ms) with canvas mesh, hex hero, HUD | **Excellent** — best-in-class |
| Toast entrance | `animate-slide-up` with stagger | Good, but no exit animation |
| Modals | `animate-in fade-in` + `animate-in zoom-in-95` (150ms) | Too fast, no exit |
| Glass elevation | `.glass-lift:hover` transitions (150ms) | Polished, consistent |
| Agent status | `animate-pulse` (Tailwind default) on connecting dot | Functional but basic |
| Theme switching | Instant CSS custom property swap | Abrupt, no transition |

### 1.2 What's Missing

1. **Spring physics** — no `cubic-bezier` overshoot, no spring simulation anywhere
2. **Exit animations** — modals unmount instantly, toasts disappear, panes snap away
3. **Layout animations (FLIP)** — pane grid reordering, sidebar collapse, agent spawning has no positional animation
4. **Orchestrated choreography** — splash is the only sequenced animation; modals, toasts, and panes are independent
5. **Gesture-driven motion** — no drag feedback, no scroll-linked, no velocity-aware animations
6. **Staggered list animations** — command palette items appear all at once
7. **Progress & streaming indicators** — no typing cursor, no streaming text reveal, no progress rings
8. **Micro-interactions** — button press states, card hover lift, checkbox animations
9. **Theme transition** — colors swap instantly with no crossfade
10. **Shared element transitions** — no element morphs between views
11. **Loading skeleton** — only shimmer, no pulse, no wave, no staggered fade-in

---

## 2. Premium Animation Patterns to Adopt

### 2.1 Linear — Precision Spring Physics

Linear uses **custom spring curves** for every interaction. Key patterns:

- **Spring for scroll-linked reveals**: Elements ease-out with a slight overshoot as they enter the viewport
- **Page transitions**: Crossfade with a subtle scale (0.98 → 1.0) and translateY (4px → 0)
- **Hover micro-interactions**: Buttons lift with `translateY(-1px)` and shadow expansion over 200ms with `cubic-bezier(0.16, 1, 0.3, 1)`

### 2.2 Raycast — Bouncy Playfulness

Raycast's signature is **delightful overshoot** without feeling unprofessional:

- **Icon bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoots to ~110% then settles
- **Window resize**: Panes ease-out with a subtle elastic settle
- **List selection**: Rows slide into highlight position with spring physics
- **Command palette**: Items stagger in from top with 40ms delay between each

### 2.3 Arc Browser — Spatial Continuity

Arc's defining feature is **tab morphing** — tabs animate between states as if they're physical objects:

- **Tab transitions**: Width/height animate smoothly with spring, content crossfades
- **Sidebar morphing**: Items rearrange with FLIP animations
- **Space switching**: Entire UI sections slide/scale with orchestrated timing

### 2.4 Cursor — Streaming Response Animation

Cursor's AI streaming feels **alive**:

- **Text streaming**: Characters appear with a typing cursor that blinks
- **Cursor blink**: `opacity` toggle at 530ms intervals during streaming
- **Diff highlighting**: New lines slide in with green highlight fade
- **Stop generation**: Smooth deceleration, not instant cut

### 2.5 Apple iOS/macOS — Spring Constants

Apple's UISpringTimingParameters provide a motion language that feels physical:

| Apple Preset | Damping | Mass | Stiffness | Equivalent CSS |
|---|---|---|---|---|
| `UISpringTimingConfiguration.gentle` | 0.7 | 1.0 | 150 | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| `UISpringTimingConfiguration.snappy` | 0.6 | 1.0 | 200 | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `UISpringTimingConfiguration.bouncy` | 0.4 | 1.0 | 250 | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `UISpringTimingConfiguration.squishy` | 0.5 | 1.0 | 150 | `cubic-bezier(0.36, 0, 0.66, -0.56)` |

### 2.6 Vercel — Subtle Micro-Interactions

Vercel's dashboard is masterful at **quiet feedback**:

- **Button hover**: `translateY(-1px)` + shadow expansion, 150ms
- **Card hover**: Border color shift + subtle shadow, 200ms
- **Loading states**: Skeleton with shimmer, then staggered fade-in of content
- **Toast progress bar**: Slim bar at bottom that drains over the toast's lifetime

### 2.7 Figma — Canvas Fluidity

Figma's canvas interactions are **frame-rate smooth**:

- **Zoom**: Smooth exponential zoom with momentum
- **Pan**: 1:1 cursor tracking with no lag
- **Selection**: Elements highlight with outline animation
- **Drag**: Elements cast dynamic shadow that intensifies with altitude

---

## 3. Specific Animation Improvements

### 3.1 Enhanced Motion Scale

**Current**: 2 durations, 1 easing
**Target**: 4 durations, 3 easings, spring constants

```css
/* globals.css — expand the motion scale */
:root {
 /* Easings */
 --swarm-ease: cubic-bezier(0.2, 0, 0, 1); /* Default: snappy decel */
 --swarm-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot: bouncy */
 --swarm-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1); /* Dramatic decel */

 /* Durations */
 --swarm-t-fast: 90ms; /* hover, press, color feedback */
 --swarm-t-base: 150ms; /* elevation, state changes */
 --swarm-t-slow: 300ms; /* modal entrance, sidebar, pane transitions */
 --swarm-t-cinematic: 500ms; /* splash elements, orchestrated sequences */

 /* Spring presets (approximate with cubic-bezier) */
 --swarm-spring-subtle: cubic-bezier(0.22, 1, 0.36, 1); /* Gentle settle */
 --swarm-spring-bouncy: cubic-bezier(0.34, 1.3, 0.64, 1); /* Playful overshoot */
 --swarm-spring-squish: cubic-bezier(0.36, 0, 0.66, -0.4); /* Squish entrance */
}
```

```typescript
// tailwind.config.ts — extend
transitionDuration: {
 fast: 'var(--swarm-t-fast)',
 base: 'var(--swarm-t-base)',
 slow: 'var(--swarm-t-slow)',
 cinematic: 'var(--swarm-t-cinematic)',
},
transitionTimingFunction: {
 swarm: 'var(--swarm-ease)',
 spring: 'var(--swarm-ease-spring)',
 expo: 'var(--swarm-ease-out-expo)',
 settle: 'var(--swarm-spring-subtle)',
 bouncy: 'var(--swarm-spring-bouncy)',
 squish: 'var(--swarm-spring-squish)',
},
```

### 3.2 Modal Animations — Add Entrance + Exit

**Current**: Instant mount with 150ms `fade-in` + `zoom-in-95`, no exit animation (component unmounts).

**Problem**: Modals feel jarring because they disappear instantly on close. The 150ms entrance is also too fast for a premium feel.

**Fix** — orchestrated entrance + graceful exit:

```tsx
// shared/useModalAnimation.ts — reusable hook
import { useState, useCallback, useRef, useEffect } from 'react';

type ModalPhase = 'closed' | 'entering' | 'open' | 'exiting';

export function useModalAnimation(duration = 250) {
 const [phase, setPhase] = useState<ModalPhase>('closed');
 const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

 const open = useCallback(() => {
 setPhase('entering');
 // CSS animation plays, then mark as open
 timeoutRef.current = setTimeout(() => setPhase('open'), duration);
 }, [duration]);

 const close = useCallback(() => {
 clearTimeout(timeoutRef.current);
 setPhase('exiting');
 timeoutRef.current = setTimeout(() => setPhase('closed'), duration);
 }, [duration]);

 useEffect(() => () => clearTimeout(timeoutRef.current), []);

 return { phase, open, close };
}
```

```tsx
// Usage in CommandPalette.tsx
const { phase, open, close } = useModalAnimation(250);

const backdropClass =
 phase === 'entering' ? 'animate-in fade-in duration-250' :
 phase === 'exiting' ? 'animate-out fade-out duration-200' :
 phase === 'open' ? 'animate-in fade-in' :
 '';

const dialogClass =
 phase === 'entering' ? 'animate-in zoom-in-95 duration-250 ease-out-expo' :
 phase === 'exiting' ? 'animate-out zoom-out-95 duration-200 ease-in' :
 phase === 'open' ? 'animate-in zoom-in-95' :
 '';
```

```css
/* globals.css — add exit animations */
@keyframes fade-out {
 from { opacity: 1; }
 to { opacity: 0; }
}

@keyframes zoom-out-95 {
 from { opacity: 1; transform: scale(0.95); }
 to { opacity: 0; transform: scale(0.97); }
}

.animate-out {
 animation-fill-mode: forwards;
}
```

### 3.3 Toast Exit Animation + Progress Bar

**Current**: Toasts slide up on enter but are simply removed from the DOM after their timeout. No exit animation, no visual countdown.

**Fix** — exit slide-out + slim progress bar:

```tsx
// Toast item with exit animation
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
 const [isExiting, setIsExiting] = useState(false);

 const handleDismiss = useCallback(() => {
 setIsExiting(true);
 setTimeout(onDismiss, 200); // match slide-out duration
 }, [onDismiss]);

 return (
 <div
 className={`
 pointer-events-auto glass-hi rounded-xl border p-3 shadow-lg
 ${isExiting ? 'animate-slide-out' : 'animate-slide-up'}
 `}
 >
 {/* Progress bar */}
 <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
 <div
 className="h-full bg-amber-400/60 origin-left"
 style={{
 animation: `toast-drain ${toast.duration}ms linear forwards`,
 }}
 />
 </div>
 {/* ... rest of toast content ... */}
 </div>
 );
}
```

```css
@keyframes toast-drain {
 from { transform: scaleX(1); }
 to { transform: scaleX(0); }
}
```

### 3.4 Pane/Grid Transitions

**Current**: Panes appear and disappear instantly. Grid reordering has no animation.

**Fix** — animate in/out + layout transitions:

```tsx
// shared/AnimatedPane.tsx
function AnimatedPane({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
 return (
 <div
 className={`
 flex flex-col h-full overflow-hidden
 transition-all duration-300 ease-out-expo
 ${isActive
 ? 'opacity-100 scale-[1.002]'
 : 'opacity-0 scale-[0.98]'
 }
 `}
 style={{
 // GPU acceleration for transform animations
 willChange: 'transform, opacity',
 transform: 'translateZ(0)',
 }}
 >
 {children}
 </div>
 );
}
```

For **grid layout changes** (e.g., switching from 2x2 to master layout), use CSS transitions on grid properties:

```css
.pane-grid {
 display: grid;
 gap: 4px;
 transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.pane-grid[data-layout="grid2x2"] {
 grid-template-columns: 1fr 1fr;
 grid-template-rows: 1fr 1fr;
}

.pane-grid[data-layout="master"] {
 grid-template-columns: 2fr 1fr;
 grid-template-rows: 1fr;
}
```

### 3.5 Sidebar Animations

**Current**: Sidebar appears/disappears instantly or with basic CSS transition.

**Fix** — smooth slide with content stagger:

```tsx
function Sidebar({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
 return (
 <>
 {/* Backdrop */}
 <div
 className={`
 fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm
 transition-opacity duration-300 lg:hidden
 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
 `}
 />

 {/* Sidebar panel */}
 <aside
 className={`
 fixed left-0 top-0 bottom-0 z-[410] w-64 glass-rail
 transition-transform duration-300 ease-out-expo
 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
 `}
 style={{ willChange: 'transform' }}
 >
 {/* Stagger children */}
 <nav className="p-2 space-y-0.5">
 {items.map((item, i) => (
 <div
 key={item.id}
 className="transition-all duration-200"
 style={{
 transitionDelay: isOpen ? `${i * 30}ms` : '0ms',
 opacity: isOpen ? 1 : 0,
 transform: isOpen ? 'translateX(0)' : 'translateX(-8px)',
 }}
 >
 {item.content}
 </div>
 ))}
 </nav>
 </aside>
 </>
 );
}
```

### 3.6 Agent Status Transitions

**Current**: Status dot uses Tailwind's default `animate-pulse` (which is a 2s ease-in-out infinite pulse). No visual distinction between states beyond color and a red ring on error.

**Fix** — state-specific animations with smooth transitions:

```css
/* globals.css — agent status animations */
@keyframes status-connecting {
 0%, 100% {
 opacity: 1;
 transform: scale(1);
 }
 50% {
 opacity: 0.5;
 transform: scale(0.8);
 }
}

@keyframes status-error {
 0% { transform: scale(1); }
 25% { transform: scale(1.4); }
 50% { transform: scale(1); }
 75% { transform: scale(1.2); }
 100% { transform: scale(1); }
}

@keyframes status-ready {
 0% {
 box-shadow: 0 0 0 0 rgba(var(--swarm-gold), 0.4);
 }
 70% {
 box-shadow: 0 0 0 6px rgba(var(--swarm-gold), 0);
 }
 100% {
 box-shadow: 0 0 0 0 rgba(var(--swarm-gold), 0);
 }
}

.agent-status-connecting {
 animation: status-connecting 1.2s ease-in-out infinite;
}

.agent-status-error {
 animation: status-error 0.5s ease-out;
 /* Then fall back to static error state */
}

.agent-status-ready {
 animation: status-ready 0.6s ease-out;
}
```

```tsx
// AgentStatusIndicator.tsx — enhanced
function AgentStatusIndicator({ spawnState, cli, accentColor }) {
 const [animClass, setAnimClass] = useState('');

 useEffect(() => {
 if (spawnState === 'connecting') {
 setAnimClass('agent-status-connecting');
 } else if (spawnState === 'error') {
 setAnimClass('agent-status-error');
 // After error animation completes, keep static error state
 const t = setTimeout(() => setAnimClass(''), 500);
 return () => clearTimeout(t);
 } else if (spawnState === 'running') {
 // One-shot ripple on becoming ready
 setAnimClass('agent-status-ready');
 const t = setTimeout(() => setAnimClass(''), 600);
 return () => clearTimeout(t);
 }
 }, [spawnState]);

 return (
 <span
 className={`
 w-1.5 h-1.5 rounded-full flex-shrink-0
 transition-all duration-300 ease-out-expo
 ${animClass}
 `}
 style={{
 background: accentColor,
 boxShadow: spawnState === 'error'
 ? '0 0 0 2px rgba(var(--swarm-err) / 0.85)'
 : spawnState === 'running'
 ? `0 0 4px ${accentColor}`
 : undefined,
 transition: 'box-shadow 300ms ease-out',
 }}
 />
 );
}
```

### 3.7 Data Loading Animations

**Streaming Text Effect** (for AI response streaming):

```css
@keyframes blink-cursor {
 0%, 100% { opacity: 1; }
 50% { opacity: 0; }
}

.streaming-cursor::after {
 content: '▊';
 animation: blink-cursor 530ms steps(1) infinite;
 color: rgb(var(--swarm-gold));
 margin-left: 1px;
}
```

**Progress Ring** (for task progress):

```tsx
function ProgressRing({ progress, size = 32, strokeWidth = 2.5 }: {
 progress: number; size?: number; strokeWidth?: number;
}) {
 const radius = (size - strokeWidth) / 2;
 const circumference = radius * 2 * Math.PI;
 const offset = circumference - (progress / 100) * circumference;

 return (
 <svg width={size} height={size} className="transform -rotate-90">
 {/* Track */}
 <circle
 cx={size / 2} cy={size / 2} r={radius}
 fill="none"
 stroke="rgb(var(--swarm-border))"
 strokeWidth={strokeWidth}
 />
 {/* Progress */}
 <circle
 cx={size / 2} cy={size / 2} r={radius}
 fill="none"
 stroke="rgb(var(--swarm-gold))"
 strokeWidth={strokeWidth}
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 strokeLinecap="round"
 style={{
 transition: 'stroke-dashoffset 500ms cubic-bezier(0.16, 1, 0.3, 1)',
 }}
 />
 </svg>
 );
}
```

**Staggered Skeleton Loader**:

```tsx
function StaggeredSkeleton({ lines = 5 }: { lines?: number }) {
 return (
 <div className="space-y-2">
 {Array.from({ length: lines }).map((_, i) => (
 <div
 key={i}
 className="skeleton rounded"
 style={{
 width: `${60 + Math.random() * 35}%`,
 height: 12,
 animationDelay: `${i * 80}ms`,
 animationDuration: '1.5s',
 }}
 />
 ))}
 </div>
 );
}
```

### 3.8 Hover/Focus Micro-Interactions

**Button press feedback**:

```css
.btn-press {
 transition: transform 90ms var(--swarm-ease),
 box-shadow 150ms var(--swarm-ease);
}
.btn-press:hover {
 transform: translateY(-1px);
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.btn-press:active {
 transform: translateY(0) scale(0.98);
 box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
 transition-duration: 60ms; /* faster on press */
}
```

**Card hover lift with sheen**:

```css
.card-lift {
 transition: transform 200ms var(--swarm-spring-subtle),
 box-shadow 200ms var(--swarm-ease),
 border-color 200ms var(--swarm-ease);
}
.card-lift:hover {
 transform: translateY(-2px);
 box-shadow:
 0 20px 40px -16px rgba(0, 0, 0, 0.6),
 0 0 0 1px rgba(var(--swarm-gold) / 0.1);
 border-color: rgb(var(--swarm-border-hi));
}
```

**List item selection animation**:

```tsx
function AnimatedListItem({ isSelected, children }: {
 isSelected: boolean; children: React.ReactNode;
}) {
 return (
 <div
 className="relative rounded-lg transition-all duration-200 ease-out-expo"
 style={{
 backgroundColor: isSelected
 ? 'rgb(var(--swarm-gold) / 0.1)'
 : 'transparent',
 transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
 }}
 >
 {isSelected && (
 <div
 className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-swarm-gold rounded-r"
 style={{
 animation: 'slide-in 200ms ease-out-expo',
 }}
 />
 )}
 {children}
 </div>
 );
}
```

### 3.9 Theme Switching Animation

**Current**: Instant CSS custom property swap.

**Fix** — smooth crossfade using a transition layer:

```tsx
// shared/ThemeTransition.tsx
function ThemeTransition({ children }: { children: React.ReactNode }) {
 const [isTransitioning, setIsTransitioning] = useState(false);
 const [displayTheme, setDisplayTheme] = useState(useThemeStore.getState().themeId);
 const [, setTick] = useState(0);

 useEffect(() => {
 return useThemeStore.subscribe(
 (state) => state.themeId,
 (newId) => {
 if (newId === displayTheme) return;
 setIsTransitioning(true);
 // Brief pause for crossfade effect
 setTimeout(() => {
 setDisplayTheme(newId);
 setTick(t => t + 1); // force re-render
 requestAnimationFrame(() => {
 requestAnimationFrame(() => {
 setIsTransitioning(false);
 });
 });
 }, 150);
 }
 );
 }, [displayTheme]);

 return (
 <div
 className="transition-opacity duration-150"
 style={{ opacity: isTransitioning ? 0.5 : 1 }}
 >
 {children}
 </div>
 );
}
```

Alternative simpler approach — add CSS transitions on color properties:

```css
/* globals.css — enable theme transitions */
*,
*::before,
*::after {
 transition: background-color 400ms ease,
 border-color 400ms ease,
 color 400ms ease,
 box-shadow 400ms ease,
 fill 400ms ease,
 stroke 400ms ease;
}
```

**Caution**: The universal selector approach can cause performance issues and unexpected transitions on dynamic content. Prefer the `ThemeTransition` wrapper approach, or selectively add transitions to key UI elements.

### 3.10 Splash Screen Enhancements

The splash screen is already excellent. Suggested refinements:

1. **Staggered HUD text reveal**: The "SWARM" wordmark and subtitle should fade in with staggered delay rather than appearing together.

2. **Exit choreography**: The current exit is `scale(1.1) + opacity 0` over 700ms. Enhance with:
 - Phase 1 (0-200ms): Hero scales up slightly, HUD slides down
 - Phase 2 (200-500ms): Canvas mesh fades, particles accelerate outward
 - Phase 3 (500-700ms): Full fade to app reveal

```tsx
// In AppOpeningAnimation.tsx — enhanced exit
const exitPhase = isExiting ? 'dissolve' : 'none';

// Pass exitPhase to children:
<SwarmCoreHero progress={progress} isExiting={isExiting} phase={phase} exitPhase={exitPhase} />
```

3. **Skip feedback**: When the user presses ESC/space, play a more satisfying "resolution" sound and briefly flash the hero before dissolving.

### 3.11 Command Palette Stagger

**Current**: All items appear simultaneously.

**Fix** — staggered reveal:

```tsx
{filteredCommands.map((cmd, idx) => (
 <PaletteCommandRow
 key={cmd.id}
 cmd={cmd}
 isSelected={idx === selectedIndex}
 onSelect={() => setSelectedIndex(idx)}
 style={{
 animationDelay: `${idx * 25}ms`,
 animation: 'fade-in 200ms ease-out both',
 }}
 />
))}
```

### 3.12 Pane State Overlay Transitions

**Current**: Loading/error overlays appear instantly with no transition.

**Fix** — smooth crossfade between states:

```tsx
{spawnState !== 'running' && spawnState !== 'notFound' && (
 <div
 className="absolute inset-0 flex flex-col items-center justify-center gap-2
 glass-inset px-4 text-center z-10"
 style={{
 animation: 'fade-in 250ms ease-out',
 }}
 >
 {/* ... */}
 </div>
)}
```

For transitions between loading → running → error, use a **crossfade** pattern:

```tsx
function CrossfadeOverlay({ show, children }: { show: boolean; children: React.ReactNode }) {
 const [visible, setVisible] = useState(false);
 const [rendered, setRendered] = useState(false);

 useEffect(() => {
 if (show) {
 setRendered(true);
 // Double rAF ensures the initial state is painted before transitioning
 requestAnimationFrame(() => {
 requestAnimationFrame(() => setVisible(true));
 });
 } else {
 setVisible(false);
 setTimeout(() => setRendered(false), 250); // match CSS duration
 }
 }, [show]);

 if (!rendered) return null;

 return (
 <div
 className="absolute inset-0 ..."
 style={{
 opacity: visible ? 1 : 0,
 transition: 'opacity 250ms ease-out',
 }}
 >
 {children}
 </div>
 );
}
```

---

## 4. Tooling Recommendation

### 4.1 Should They Add Framer Motion?

**Recommendation: Yes, but selectively.**

Framer Motion (now called **Motion**) is the right tool for:
- **Layout animations** (FLIP) — pane grid reordering, sidebar collapse, list reordering
- **Spring physics** — `transition={{ type: "spring", stiffness: 300, damping: 30 }}`
- **Gesture-driven animations** — drag, pan, swipe with velocity
- **Shared element transitions** — `layoutId` for morphing between views
- **Complex orchestration** — `AnimatePresence` for exit animations on modals/panes

**Do NOT use it for**:
- Simple hover transitions (CSS `transition:` is sufficient)
- The splash screen (canvas + RAF is the right approach)
- Voice waves, pulse glows (CSS keyframes are lighter)
- Global theme transitions (CSS custom properties are correct)

**Hybrid approach**: Keep CSS for the 80% of simple transitions. Use Motion for the 20% of complex interactions.

### 4.2 What to Build First

Priority order:

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P0 | Modal exit animations | High — eliminates the biggest jarring moment | Low |
| P0 | Toast exit animation + progress bar | High — polishes a frequently-seen element | Low |
| P1 | Agent status state machine animation | High — communicates state clearly | Low |
| P1 | Expand motion scale (add slow/cinematic) | High — enables all other improvements | Low |
| P1 | Pane open/close transitions | High — core navigation feedback | Medium |
| P2 | Sidebar slide + stagger | Medium — polish on open/close | Low |
| P2 | Command palette stagger | Medium — subtle but premium | Low |
| P2 | Theme transition crossfade | Medium — elevates a global action | Low |
| P3 | Spring easing variants | Medium — adds character | Low |
| P3 | Micro-interactions (buttons, cards) | Medium — polish | Medium |
| P4 | Layout animations (FLIP) | High — but requires Motion | High |

### 4.3 Recommended Utilities to Build

```tsx
// shared/animations/
├── useModalAnimation.ts // enter/exit phase management
├── useStaggeredReveal.ts // list/children staggered entrance
├── useCrossfade.ts // crossfade between two states
├── useSpringPhysics.ts // custom spring simulation (if not using Motion)
├── AnimatedPane.tsx // pane mount/unmount with animation
├── AnimatedListItem.tsx // list item with selection slide
├── ProgressRing.tsx // SVG circular progress
├── StaggeredSkeleton.tsx // skeleton with staggered lines
└── springEasings.ts // exported cubic-bezier approximations
```

### 4.4 Performance Considerations

1. **GPU acceleration**: Use `transform` and `opacity` for all animations. Add `will-change: transform, opacity` on elements that will animate. Remove it after animation ends.

2. **Containment**: Use CSS `contain: layout style paint` on animated elements that don't affect siblings.

3. **Avoid animating**: `box-shadow`, `border-radius`, `background-color`, `width/height/margin/padding` — these trigger layout repaints. Prefer `transform: scale()` over width/height changes.

4. **Layer promotion**: `transform: translateZ(0)` forces GPU layer promotion for complex animations (splash hero, canvas overlays).

5. **RAF cleanup**: Always cancel animation frames and clear timeouts in splash and canvas components.

6. **Reduced motion**: The `prefers-reduced-motion: reduce` media query is already in place. Keep it.

7. **Motion library bundle size**: If adding Framer Motion, the gzipped bundle is ~28KB. Acceptable for a desktop Tauri app. For web builds, consider `motion` (the v11 rewrite) which is ~22KB gzipped.

---

## 5. Quick Wins (Implement This Week)

These changes have the highest impact-to-effort ratio:

### 5.1 Expand Motion Scale (5 minutes)

Add 2 new CSS variables and update Tailwind config:

```css
:root {
 --swarm-t-slow: 300ms;
 --swarm-t-cinematic: 500ms;
 --swarm-ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1);
 --swarm-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 5.2 Fix Modal Animations (15 minutes)

Replace `duration-150` with `duration-250` on modal backdrop/dialog. Add exit animation classes. This alone will make the app feel significantly more premium.

### 5.3 Toast Progress Bar (10 minutes)

Add a draining progress bar to each toast. CSS-only, uses `animation: toast-drain`.

### 5.4 Agent Status Ripple (10 minutes)

Add the `status-ready` ripple keyframe to `AgentStatusIndicator`. One CSS addition, one component tweak.

### 5.5 Stagger Command Palette (5 minutes)

Add `animationDelay` based on index to `PaletteCommandRow`. Pure JSX change.

---

## 6. Animation Vocabulary — Quick Reference

Create a shared constants file so the team speaks the same motion language:

```typescript
// shared/motion.ts

/** Spring-approximated cubic-bezier curves */
export const SPRINGS = {
 subtle: 'cubic-bezier(0.22, 1, 0.36, 1)', // Gentle settle
 bouncy: 'cubic-bezier(0.34, 1.3, 0.64, 1)', // Playful overshoot
 snappy: 'cubic-bezier(0.16, 1, 0.3, 1)', // Decisive decel (current default)
 squish: 'cubic-bezier(0.36, 0, 0.66, -0.4)', // Elastic entrance
} as const;

/** Standard duration scale */
export const DURATIONS = {
 fast: '90ms', // hover, press, color
 base: '150ms', // elevation, state
 slow: '300ms', // modals, sidebar, panes
 cinematic: '500ms', // splash, orchestrated
} as const;

/** Stagger delays for list items */
export const STAGGER = {
 tight: '20ms',
 normal: '30ms',
 loose: '50ms',
} as const;

/** Easing for specific animation types */
export const EASING = {
 entrance: SPRINGS.subtle,
 exit: 'ease-in',
 loop: 'ease-in-out',
 press: 'ease-out',
} as const;
```

---

## 7. Summary

The current animation system is **well-engineered but minimal**. The splash screen proves the team understands premium motion. The gap is bringing that same quality to the **app shell** — modals, panes, toasts, agent states, sidebar, and theme switching.

**The single highest-impact change** is adding exit animations to modals and toasts. The current "snap away" behavior is the most noticeable lack of polish. Followed closely by spring-tinged hover/elevation transitions and animated agent status indicators.

The architecture is ready for Motion (Framer Motion v11) to handle layout animations and spring physics, while CSS keyframes and transitions continue handling the simple cases. A hybrid approach keeps bundle size down while enabling the complex choreography the splash screen already demonstrates.
