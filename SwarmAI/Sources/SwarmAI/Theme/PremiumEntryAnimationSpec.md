# SwarmAI Premium Entry Animation System — Design Specification

## Document Purpose

This is the master design document for the SwarmAI macOS app's entry animation system.
It addresses every gap identified in the audit, builds on existing infrastructure, and
targets Linear / Arc Browser / Raycast-level polish.

The specification is grounded in the actual codebase files reviewed:
`Animations.swift`, `GlassElevation.swift`, `MainWindow.swift`, `TitleBar.swift`,
`StatusBar.swift`, `BoardStrip.swift`, `AgentPaneView.swift`, `SidebarDock.swift`,
`SplashScreenView.swift`, `LeadPanel.swift`, `DockEntryModifiers.swift`, `AppState.swift`,
`ThemeColors.swift`, `AgentStatus.swift`, `Color+Hex.swift`.

---

## Table of Contents

1. Design Philosophy
2. Master Timeline (Phase-by-Phase)
3. Easing Curves Library
4. Stagger System
5. Motion Quality Standards
6. Theme & Color Integration
7. Accessibility (reduceMotion)
8. Animation Helper API Surface
9. Per-File Refactor Plan
10. Implementation Checklist

---

## 1. Design Philosophy

The animation system communicates three things simultaneously:

**Hierarchy**: The app reveals in a precise sequence — background → frame → navigation →
content → status. Each phase has a clear "owner" element that leads, and supporting
elements that follow with stagger.

**Intentionality**: Every spring parameter, every stagger interval, every glow color
is chosen. There are no default SwiftUI animations hiding in the codebase. Every curve
has a name and a purpose.

**Responsiveness**: Animations should feel fast enough to never slow the user down,
yet smooth enough to feel premium. The sweet spot is 300-500ms for transitions,
200-400ms for spring reveals, with visible but contained overshoot.

Key principle: **No two elements should animate at the exact same time unless intentional**.
This means even elements in the same phase get staggered by at least 12ms.

---

## 2. Master Timeline

The master timeline is a single orchestrating clock. Every element's entrance time
is derived from this clock. In production this will be driven by a `MasterEntryController`
observable object (see Section 8).

```
t=0.0s ──────────────────────────────────────────────────────── t=2.0s

Phase 0 │████████████████████| 0.0 – 0.8s Splash
Phase 1 │ ████████████| 0.3 – 1.2s Window frame
Phase 2 │ ██████████████| 0.5 – 1.0s Left sidebar
Phase 3 │ ██████████████| 0.6 – 1.1s Right dock
Phase 4 │ ██████████████████████| 0.4 – 0.9s Title bar
Phase 5 │ ███████████████| 0.7 – 1.3s Board strip
Phase 6 │ █████████████████| 0.8 – 1.5s Content
Phase 7 │ █████████████████████| 0.9 – 1.6s Status bar
```

### Phase 0 — Splash Screen (0.0s – 0.8s)

The splash is the first thing the user sees. It must be impressive but not overstay.

| Element | Start | Duration | Animation | Stagger | Notes |
|---------|-------|----------|-----------|---------|-------|
| Radial glow pulse | 0.00s | 2.0s (infinite) | `.swarmGlowPulse` | — | Continuous ambient pulse |
| Particle burst (16 particles) | 0.00s | 0.80s per particle | `.swarmParticleBurst` | 0.08s between each | Theme-aware gold color |
| Logo text "SwarmAI" clip-reveal | 0.05s | 0.55s | `.swarmReveal` spring | — | Clip mask slides up |
| Logo text shadow/glow fade-in | 0.05s | 0.55s | `.swarmReveal` | synced | Gold glow 0.2 → 0.35 opacity |
| Tagline "Intelligent Agent Swarms" | 0.65s | 0.50s | `.swarmFadeInUp` | — | easeIn |
| Loading dots (3×) | 0.80s | 0.60s each | `.swarmPulse` repeatForever | 0.15s stagger | Gold, pulsing |

**Exit**: At t=1.6s (after all Phase 0 elements complete), the splash begins its exit
transition over 0.5s using `.swarmSplashExit`. This is NOT a hardcoded 2.3s delay —
it is derived from the master timeline and is interruptible.

### Phase 1 — Window Frame (0.3s – 1.2s)

The main window materializes. This phase overlaps with Phase 0 (splash) by 0.5s.

| Element | Start | Duration | Animation | From | To | Notes |
|---------|-------|----------|-----------|------|----|-------|
| Window container | 0.30s | 0.60s | `.swarmEntrySpring` | scale 0.97, opacity 0 | scale 1.0, opacity 1.0 | Spring overshoot visible |
| Background canvas | 0.30s | 0.50s | `.swarmFadeIn` | opacity 0 | opacity 1.0 | Smooth fade |

### Phase 2 — Left Sidebar (0.5s – 1.0s)

Slides in from the left with staggered icon reveals.

| Element | Start | Duration | Animation | From | To | Stagger |
|---------|-------|----------|-----------|------|----|---------|
| Sidebar rail (width expand) | 0.50s | 0.40s | `.swarmSidebarSpring` | width 0 | width 300 | — |
| Tab icons (7 icons) | 0.55s | 0.35s each | `.swarmSidebarSpring` | opacity 0, scale 0.8 | opacity 1, scale 1.0 | 20ms per index |
| Active tab indicator | 0.55s | 0.30s | `.swarmSpring` | scaleX 0 | scaleX 1.0 | Synced with icon[0] |
| Tab content area | 0.75s | 0.35s | `.swarmFadeIn` | opacity 0 | opacity 1.0 | After all icons |

### Phase 3 — Right Dock (0.6s – 1.1s)

Mirrors the left sidebar with a 0.1s offset.

| Element | Start | Duration | Animation | From | To | Stagger |
|---------|-------|----------|-----------|------|----|---------|
| Dock rail (width expand) | 0.60s | 0.40s | `.swarmDockSpring` | width 0 | width 380 | — |
| Tab icons (5 icons) | 0.65s | 0.35s each | `.swarmSidebarSpring` | opacity 0, scale 0.8 | opacity 1, scale 1.0 | 20ms per index |
| Active tab indicator | 0.65s | 0.30s | `.swarmSpring` | scaleX 0 | scaleX 1.0 | Synced with icon[0] |
| Tab content area | 0.85s | 0.35s | `.swarmFadeIn` | opacity 0 | opacity 1.0 | After all icons |

### Phase 4 — Title Bar (0.4s – 0.9s)

Cascades in with precise timing.

| Element | Start | Duration | Animation | Notes |
|---------|-------|----------|-----------|-------|
| Ant icon + workspace name | 0.40s | 0.40s | `.swarmTitleSpring` | Slide up from -30, scale 0.95→1.0 |
| Gold shimmer sweep on name | 0.55s | 0.40s | `.swarmShimmer` | Linear sweep, theme-aware gold |
| Voice toggle button | 0.43s | 0.30s | `.swarmTitleSpring` | Scale in from 0.8 |
| Plane picker (segmented) | 0.46s | 0.35s | `.swarmTitleSpring` | Slide up |
| Board view picker | 0.49s | 0.35s | `.swarmTitleSpring` | Slide up, conditional |
| Separator line (Capsule draw) | 0.55s | 0.35s | `.swarmDrawLine` | scaleX 0→1 from leading |

### Phase 5 — Board Strip (0.7s – 1.3s)

**This is the biggest gap in the current codebase — zero animations.**
The redesign gives it a polished slide-up entrance with staggered pills.

| Element | Start | Duration | Animation | Notes |
|---------|-------|----------|-----------|-------|
| Strip background slide up | 0.70s | 0.40s | `.swarmSlideUp` | From y:20, opacity 0 |
| Tab pills (staggered by index) | 0.78s | 0.35s each | `.swarmBoardTabSpring` | Scale 0.9→1.0, opacity 0→1 |
| Active pill gold highlight | 0.78s | 0.25s | `.swarmSpring` | Background + border transition |
| Close button on each tab | 0.82s | 0.25s | `.swarmQuick` | Scale pop-in |
| Add Pane button | 0.95s | 0.30s | `.swarmSpring` | Scale 0.9→1.0, border draw |

### Phase 6 — Content Area (0.8s – 1.5s)

The board/browser/emulator content fades and scales in with a slight blur-to-clear.

| Element | Start | Duration | Animation | Notes |
|---------|-------|----------|-----------|-------|
| Content container | 0.80s | 0.55s | `.swarmContentSpring` | scale 0.98→1.0, y:20→0, blur 8→0 |
| Grid/flow cells (first visible batch) | 0.90s | 0.40s | `.swarmCellReveal` | Staggered by grid position |
| Browser pane web content | 0.85s | 0.50s | `.swarmFadeInScale` | Blur 6→0, opacity |

### Phase 7 — Status Bar (0.9s – 1.6s)

Slides up with animated count-up numbers.

| Element | Start | Duration | Animation | Notes |
|---------|-------|----------|-----------|-------|
| Status bar container | 0.90s | 0.45s | `.swarmSlideUp` | From y:20, opacity 0 |
| Top separator line | 0.90s | 0.35s | `.swarmDrawLine` | scaleX 0→1 from leading |
| Git branch chip | 0.95s | 0.30s | `.swarmSlideUp` | Slide + fade |
| Agent count badge | 1.00s | 0.30s | `.swarmSlideUp` | Slide + fade |
| Agent count-up number | 1.05s | 0.30s | `.swarmCountUp` | Animated Int, not DispatchQueue ticks |
| Engine status chip | 1.05s | 0.30s | `.swarmSlideUp` | Slide + fade |
| Status pulse dot | 1.05s | 1.6s (infinite) | `.swarmStatusPulse` | easeInOut repeatForever autoreverses |
| Connected indicator | 1.15s | 0.30s | `.swarmSlideUp` | Slide + fade |

---

## 3. Easing Curves Library

All curves are defined in `Animations.swift` as named `static let` constants.
No inline `.easeIn(duration: 0.8)` anywhere in the codebase.

### Spring Curves

| Constant | Spring Parameters | Use Case | Overshoot |
|----------|-------------------|----------|-----------|
| `.swarmEntrySpring` | response: 0.5, damping: 0.85 | Window frame materialization | Visible, ~5% |
| `.swarmSidebarSpring` | response: 0.5, damping: 0.85 | Left sidebar rail + icons | Visible, ~5% |
| `.swarmDockSpring` | response: 0.5, damping: 0.85 | Right dock rail + icons | Visible, ~5% |
| `.swarmTitleSpring` | response: 0.4, damping: 0.90 | Title bar elements (tighter) | Subtle, ~3% |
| `.swarmContentSpring` | response: 0.6, damping: 0.82 | Content area (slightly bouncier) | Visible, ~6% |
| `.swarmBoardTabSpring` | response: 0.35, damping: 0.75 | Board strip tab pills | Snappy, ~4% |
| `.swarmModalSpring` | response: 0.35, damping: 0.75 | Modal popovers (scale 0.95→1.0) | Snappy pop |
| `.swarmAgentSpring` | response: 0.5, damping: 0.78 | Agent pane materialization | Visible, ~5% |
| `.swarmButtonSpring` | response: 0.3, damping: 0.70 | Button press feedback | Crisp, ~3% |
| `.swarmRevealSpring` | response: 0.45, damping: 0.78 | Logo/splash text reveals | Dramatic, ~8% |

### Timing Curves

| Constant | Parameters | Use Case |
|----------|-----------|----------|
| `.swarmGlowPulse` | easeInOut, 2.0s | Splash radial glow ambient pulse |
| `.swarmFadeIn` | easeIn, 0.25s | Quick fade-in (was already correct) |
| `.swarmFadeInUp` | easeIn, 0.50s | Text fade + slide up (tagline) |
| `.swarmFadeInSlow` | easeIn, 0.80s | Slower fade for emphasis |
| `.swarmSlideUp` | spring, 0.4s, bounce: 0.15 | Status bar, sidebar content slide up |
| `.swarmSlideRight` | spring, 0.35s, bounce: 0.1 | Sidebar/dock rail slide (keep) |
| `.swarmParticleBurst` | easeOut, 0.80s | Particle travel distance |
| `.swarmShimmer` | linear, 0.40s | Gold shimmer sweep across text |
| `.swarmDrawLine` | linear, 0.35s | Separator/divider line draw (keep) |
| `.swarmCountUp` | easeOut, 0.30s per tick | Count-up number animation |
| `.swarmPulse` | easeInOut, 1.6s | Status dot pulse (keep) |
| `.swarmSplashExit` | easeInOut, 0.50s | Splash screen exit transition |
| `.swarmSlow` | easeInOut, 0.60s | Theme transitions (keep) |
| `.swarmBlurClear` | easeOut, 0.50s | Blur-to-clear for content reveal |

### Premium Reveal Curve (NEW)

The current system lacks a dramatic entrance curve. Raycast and Linear use a
custom cubic-bezier that starts fast and decelerates smoothly:

```swift
/// Premium reveal: fast start, smooth deceleration. 0.16, 1, 0.3, 1
static let swarmReveal = Animation.timingCurve(
 0.16, 1.0, 0.30, 1.0,
 duration: 0.45
)
```

This curve is used for logo reveals, modal popovers, and any element that needs
to feel like it "stamps in" with authority.

### Press Animation (NEW)

```swift
/// Crisp button press: very short spring with low damping for tactile feedback
static let swarmPress = Animation.spring(response: 0.2, dampingFraction: 0.65)
```

---

## 4. Stagger System

### Core Helper

```swift
extension Animation {
 /// Creates a staggered animation by appending a delay based on the element's index.
 ///
 /// - Parameters:
 /// - baseDelay: The delay before the FIRST element starts animating.
 /// - staggerInterval: The delay between consecutive elements.
 /// - index: The element's position in the sequence (0-based).
 /// - limit: Optional cap on total delay (e.g., max 0.5s stagger).
 /// - Returns: An animation with the appropriate delay for this element.
 static func swarmStagger(
 baseDelay: Double = 0,
 staggerInterval: Double = 0.02,
 index: Int = 0,
 limit: Double? = nil
 ) -> Animation {
 let totalDelay = baseDelay + Double(index) * staggerInterval
 let clampedDelay = limit.map { min(totalDelay, $0) } ?? totalDelay
 return self.delay(clampedDelay)
 }
}
```

### Usage Patterns

**Index-based stagger in ForEach:**
```swift
ForEach(Array(tabs.enumerated()), id: \.element.id) { index, tab in
 TabPill(tab: tab)
 .animation(.swarmBoardTabSpring.swarmStagger(
 baseDelay: 0.78,
 staggerInterval: 0.02,
 index: index
 ), value: hasAppeared)
}
```

**Fixed stagger presets:**
```swift
static let swarmStaggerFast = swarmStagger(staggerInterval: 0.012) // 12ms — micro-interactions
static let swarmStaggerDefault = swarmStagger(staggerInterval: 0.020) // 20ms — icons, tabs
static let swarmStaggerSlow = swarmStagger(staggerInterval: 0.030) // 30ms — large elements
```

### Stagger Configuration Reference

| Context | Base Delay | Interval | Max Total Stagger | Preset |
|---------|-----------|----------|-------------------|--------|
| Title bar elements | 0.40s | 0.03s | 0.12s | `swarmStaggerSlow` |
| Left sidebar tab icons | 0.55s | 0.02s | 0.14s | `swarmStaggerDefault` |
| Right dock tab icons | 0.65s | 0.02s | 0.10s | `swarmStaggerDefault` |
| Board strip tab pills | 0.78s | 0.02s | 0.40s | `swarmStaggerDefault` (limit: 0.50s) |
| Status bar items | 0.95s | 0.05s | 0.25s | custom |
| Splash particles | 0.00s | 0.08s | 0.68s | custom (0.08s fixed) |
| Splash loading dots | 0.80s | 0.15s | 0.30s | custom |
| Agent pane terminal lines | 0.40s | 0.04s | 0.60s | `swarmStaggerDefault` (limit: 0.60s) |

**Rule**: No two elements in the same phase share the exact same start time unless
they are a matched pair (e.g., icon + label in the same tab pill). Even then, the
label gets an additional 8ms delay after its icon.

---

## 5. Motion Quality Standards

### Spring Overshoot

All spring animations should have visible but contained overshoot. The damping
fraction values are chosen so that:

- `.dampingFraction >= 0.85` → subtle overshoot (2-4%), suitable for toolbar/nav
- `.dampingFraction 0.75–0.82` → moderate overshoot (5-8%), suitable for content reveals
- `.dampingFraction 0.65–0.70` → crisp overshoot (8-12%), suitable for buttons/presses

Never exceed 12% overshoot on any element. If a spring feels "too bouncy," reduce
the overshoot by increasing dampingFraction, NOT by switching to a timing curve.

### Motion Blur Simulation

During fast movement (sidebar/dock slides, window scale), simulate motion blur
by animating shadow opacity in sync with the movement:

```swift
.shadow(
 color: .swarmGold.opacity(reduceMotion ? 0 : movementIntensity * 0.3),
 radius: reduceMotion ? 0 : 4 + movementIntensity * 8,
 x: 0, y: 0
)
```

`movementIntensity` is derived from the velocity of the animated property.
In practice this is approximated by linking the shadow to the same animation
with a slightly delayed start (0.05s lag creates a "trailing" effect).

### Blur-to-Clear

For content area reveals, use `.blur(radius:)` animated alongside opacity:

```swift
.blur(radius: reduceMotion ? 0 : (1 - materializationProgress) * 8)
```

This creates a subtle depth-of-field effect that makes the UI feel like it's
coming into focus — a signature of premium macOS apps.

### Exit Animations

Every entrance animation must have a matching exit. Current gaps:

| Element | Current Exit | Spec Exit |
|---------|-------------|-----------|
| Agent pane | `easeIn(0.3)` — abrupt | `.swarmAgentSpring.speed(1.5)` reverse |
| Splash screen | No cancellation (hardcoded 2.3s) | Interruptible with `.swarmSplashExit` |
| Sidebar/dock | Reverse of entry spring | Explicit `.swarmPaneClose` easeIn(0.2) |
| Board strip tabs | None (snap out) | `.swarmQuick` fade out |
| Status bar | None | `.swarmFadeIn` reverse |

---

## 6. Theme & Color Integration

### Theme-Aware Animation Colors

All glow, shimmer, and particle colors must use the theme's semantic tokens,
not hardcoded values.

**Current correct pattern (keep):**
```swift
Color.from(theme: themeStore.currentTheme, token: .gold)
// or
.swarmGold
```

**Current incorrect pattern (fix):**
```swift
// SplashScreenView.swift line 46:
let c = goldComponents.cgColor?.components ?? [212/255, 175/255, 55/255, 1]
// This hardcodes gold as a fallback. Use theme token instead.
```

### Particle Color

Particle burst colors on the splash screen should match `theme.gold`:

```swift
let goldColor = themeStore.currentTheme.color(for: .gold)
// Use goldColor directly in Canvas drawing — already does this correctly
```

### Entrance Glow Effects

During entry animation, each phase gets a subtle gold accent glow:

| Phase | Glow Effect | Implementation |
|-------|-------------|----------------|
| Splash | Radial gold gradient pulse | Already implemented — keep, but make interruptible |
| Window frame | Subtle gold border shimmer on window edge | `.overlay` with animated `.swarmGold.opacity(0.1→0)` |
| Sidebar/Dock | Gold accent on active tab indicator | Already implemented — keep |
| Title bar | Gold shimmer sweep on workspace name | Already implemented — needs reduceMotion guard |
| Board strip | Gold accent on active pill | Already implemented — needs transition animation |
| Content | No glow (clean reveal) | — |
| Status bar | Gold pulse on active agents count | Already implemented — needs reduceMotion guard |

### Theme Transition

The existing `.swarmSlow` (easeInOut 0.6s) is correct for theme changes.
Enhance it to also animate interior view colors, not just the frame:

```swift
// In MainWindow.swift:
.animation(.swarmSlow, value: themeStore.currentThemeId)
// This already exists on line 132. It animates the frame.
// Ensure all interior views use @Environment(\.theme) so they pick up
// the animated color changes automatically.
```

---

## 7. Accessibility (reduceMotion)

### Policy

Every animation in the app must check `@Environment(\.accessibilityReduceMotion)`.
When `true`:
- Remove all movement animations (slides, scales, spring overshoot)
- Keep opacity transitions (they are not disorienting)
- Keep blur-to-clear transitions (they are not motion-inducing)
- Replace spring animations with `.easeInOut(duration: 0.3)` equivalents
- Remove repeatForever animations (particles, pulses)
- Count-up should jump directly to the final value

### Implementation Pattern

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

// In animation modifiers:
.animation(
 reduceMotion ? .easeInOut(duration: 0.3) : .swarmRevealSpring,
 value: appeared
)

// For repeatForever:
if !reduceMotion {
 withAnimation(.swarmGlowPulse) {
 glowPulse.toggle()
 }
}

// For stagger: reduce stagger to 0 and use easeInOut
.animation(
 reduceMotion ? .easeInOut(duration: 0.3) : .swarmSidebarSpring.swarmStagger(...),
 value: appeared
)
```

### Components Missing reduceMotion (from audit)

| Component | Missing Guard | Fix |
|-----------|--------------|-----|
| SplashScreenView | Particles, glow pulse, exit delay | Guard all with `reduceMotion` |
| StatusBar | Count-up DispatchQueue loop | Jump to final value when `reduceMotion` |
| TitleBar | Shimmer offset animation | Skip shimmer, fade text directly |
| GlassAppearModifier | Corner radius, shadow animation | Use `.easeOut(0.4)` instead |
| ShimmerModifier | Phase animation loop | Don't start shimmer when `reduceMotion` |

---

## 8. Animation Helper API Surface

### New/Updated Helpers in Animations.swift

```swift
// === NEW: Master Timeline Constants ===

/// The total duration of the master entry sequence.
static let masterEntryDuration: Double = 1.6

/// When the splash screen should begin its exit, relative to entry start.
static let splashExitStart: Double = 1.6

/// When the splash screen exit completes.
static let splashExitEnd: Double = 2.1

// === NEW: Spring Curves ===

static let swarmEntrySpring = Animation.spring(response: 0.5, dampingFraction: 0.85, blendDuration: 0)
static let swarmRevealSpring = Animation.spring(response: 0.45, dampingFraction: 0.78, blendDuration: 0)
static let swarmSidebarSpring = Animation.spring(response: 0.5, dampingFraction: 0.85, blendDuration: 0)
static let swarmDockSpring = Animation.spring(response: 0.5, dampingFraction: 0.85, blendDuration: 0.1)
static let swarmTitleSpring = Animation.spring(response: 0.4, dampingFraction: 0.90, blendDuration: 0)
static let swarmContentSpring = Animation.spring(response: 0.6, dampingFraction: 0.82, blendDuration: 0)
static let swarmBoardTabSpring = Animation.spring(response: 0.35, dampingFraction: 0.75, blendDuration: 0)
static let swarmModalSpring = Animation.spring(response: 0.35, dampingFraction: 0.75, blendDuration: 0)
static let swarmAgentSpring = Animation.spring(response: 0.5, dampingFraction: 0.78, blendDuration: 0)
static let swarmButtonSpring = Animation.spring(response: 0.3, dampingFraction: 0.70, blendDuration: 0)

// === NEW: Timing Curves ===

static let swarmReveal = Animation.timingCurve(0.16, 1.0, 0.30, 1.0, duration: 0.45)
static let swarmFadeInUp = Animation.easeIn(duration: 0.50)
static let swarmFadeInSlow = Animation.easeIn(duration: 0.80)
static let swarmGlowPulse = Animation.easeInOut(duration: 2.0)
static let swarmParticleBurst = Animation.easeOut(duration: 0.80)
static let swarmShimmer = Animation.linear(duration: 0.40)
static let swarmCountUp = Animation.easeOut(duration: 0.30)
static let swarmSplashExit = Animation.easeInOut(duration: 0.50)
static let swarmBlurClear = Animation.easeOut(duration: 0.50)

// === KEEP: Existing Curves (verified correct) ===

static let swarmFadeIn = Animation.easeIn(duration: 0.25)
static let swarmScaleIn = Animation.spring(duration: 0.35, bounce: 0.2)
static let swarmSlideUp = Animation.spring(duration: 0.4, bounce: 0.15)
static let swarmSlideRight = Animation.spring(duration: 0.35, bounce: 0.1)
static let swarmQuick = Animation.easeOut(duration: 0.15)
static let swarmMedium = Animation.easeInOut(duration: 0.3)
static let swarmPaneOpen = Animation.spring(duration: 0.4, bounce: 0.1)
static let swarmPaneClose = Animation.easeIn(duration: 0.2)
static let swarmVoicePulse = Animation.easeInOut(duration: 1.2).repeatForever(autoreverses: true)
static let swarmToastSlide = Animation.spring(duration: 0.5, bounce: 0.2)
static let swarmTabSwitch = Animation.easeInOut(duration: 0.2)
static let swarmDrawLine = Animation.linear(duration: 0.35)
```

### New View Modifier Helpers

```swift
extension View {

 // ─── Stagger ───────────────────────────────────────────────

 /// Apply a staggered entrance animation.
 ///
 /// - Parameters:
 /// - baseDelay: Delay before first element starts.
 /// - staggerInterval: Delay between consecutive elements.
 /// - index: This element's position in the sequence.
 /// - limit: Optional cap on total stagger delay.
 /// - reduceMotion: If true, collapses stagger and uses easeInOut.
 func swarmAnimate(
 _ animation: Animation,
 baseDelay: Double = 0,
 staggerInterval: Double = 0.02,
 index: Int = 0,
 limit: Double? = nil,
 reduceMotion: Bool = false,
 value: AnyHashable
 ) -> some View {
 let effective = reduceMotion
 ? Animation.easeInOut(duration: 0.3)
 : animation.swarmStagger(
 baseDelay: baseDelay,
 staggerInterval: staggerInterval,
 index: index,
 limit: limit
 )
 return self.animation(effective, value: value)
 }

 // ─── Entrance Wrappers ─────────────────────────────────────

 /// Fade in with optional stagger delay.
 func swarmFadeIn(
 delay: Double = 0,
 reduceMotion: Bool = false
 ) -> some View {
 let anim = reduceMotion
 ? Animation.easeInOut(duration: 0.3).delay(delay)
 : Animation.swarmFadeIn.delay(delay)
 return self.opacity(1).animation(anim, value: UUID())
 }

 /// Scale in from 0.9 → 1.0 with spring, optional stagger.
 func swarmScaleIn(
 from: CGFloat = 0.9,
 delay: Double = 0,
 reduceMotion: Bool = false
 ) -> some View {
 let base = reduceMotion
 ? Animation.easeInOut(duration: 0.3)
 : Animation.swarmRevealSpring
 return self.scaleEffect(1)
 .animation(base.delay(delay), value: UUID())
 }

 /// Slide up from offset, optional stagger.
 func swarmSlideUp(
 from: CGFloat = 20,
 delay: Double = 0,
 reduceMotion: Bool = false
 ) -> some View {
 let base = reduceMotion
 ? Animation.easeInOut(duration: 0.3)
 : Animation.swarmSlideUp
 return self.offset(y: 0)
 .animation(base.delay(delay), value: UUID())
 }

 /// Slide in from left/right, optional stagger.
 func swarmSlideIn(
 from x: CGFloat,
 delay: Double = 0,
 reduceMotion: Bool = false
 ) -> some View {
 let base = reduceMotion
 ? Animation.easeInOut(duration: 0.3)
 : Animation.swarmSlideRight
 return self.offset(x: 0)
 .animation(base.delay(delay), value: UUID())
 }

 // ─── Blur-to-Clear ─────────────────────────────────────────

 /// Animate blur from `from` to 0 alongside opacity.
 func swarmBlurReveal(
 blurAmount: CGFloat = 8,
 delay: Double = 0,
 reduceMotion: Bool = false
 ) -> some View {
 let base = reduceMotion
 ? Animation.easeOut(duration: 0.3)
 : Animation.swarmBlurClear
 return self
 .animation(base.delay(delay), value: UUID())
 }

 // ─── Conditional ────────────────────────────────────────────

 /// Conditionally apply an animation modifier based on a Bool.
 @ViewBuilder
 func swarmAnimateIf(
 _ condition: Bool,
 animation: Animation,
 value: AnyHashable
 ) -> some View {
 if condition {
 self.animation(animation, value: value)
 } else {
 self
 }
 }
}
```

### Master Entry Controller (NEW)

```swift
/// Observable controller that drives the entire app entry sequence.
/// All views read from this single source of truth for their entrance timing.
@Observable
final class MasterEntryController {

 /// Whether the full entry sequence has completed.
 private(set) var hasCompleted: Bool = false

 /// Whether the splash screen is currently visible.
 private(set) var splashVisible: Bool = true

 /// Timestamp when the entry sequence started.
 private let startTime: CFAbsoluteTime

 /// Accessibility guard — reads from environment at init.
 let reduceMotion: Bool

 /// Whether the splash should start exiting.
 var splashShouldExit: Bool {
 elapsed > Animations.swarmSplashExitStart
 }

 /// Elapsed time since entry started.
 var elapsed: Double {
 CFAbsoluteTimeGetCurrent() - startTime
 }

 init(reduceMotion: Bool = false) {
 self.reduceMotion = reduceMotion
 self.startTime = CFAbsoluteTimeGetCurrent()
 }

 /// Call when splash screen exit animation completes.
 func completeSplashExit() {
 splashVisible = false
 }

 /// Call when all entry animations are done.
 func completeEntry() {
 hasCompleted = true
 }
}
```

Usage pattern in `MainWindow`:
```swift
@State private var entryController = MasterEntryController()

// Read phase completion from entryController:
.opacity(entryController.elapsed > 0.3 ? 1 : 0)

// Splash screen watches:
.onChange(of: entryController.splashShouldExit) { _, shouldExit in
 if shouldExit {
 withAnimation(.swarmSplashExit) {
 isLaunching = false
 }
 }
}
```

This eliminates the hardcoded `DispatchQueue.main.asyncAfter(deadline: .now() + 2.3)`
and makes the splash exit interruptible (e.g., if the user dismisses early).

---

## 9. Per-File Refactor Plan

### SplashScreenView.swift

**Problems:**
- Inline easing curves (`.easeInOut(duration: 2.0)`, `.spring(response: 0.6, dampingFraction: 0.8)`)
- No `reduceMotion` guard
- Hardcoded 2.3s exit delay — not interruptible
- No theme transition animation

**Changes:**

1. Replace all inline animations with named constants from `Animations.swift`
2. Add `@Environment(\.accessibilityReduceMotion)` guard
3. Replace `DispatchQueue.main.asyncAfter(deadline: .now() + 2.3)` with
 `MasterEntryController.splashShouldExit` observation
4. Add `.animation(.swarmSlow, value: themeStore.currentThemeId)` for smooth
 theme color transitions during splash
5. Use theme's gold token for all particle and glow colors (already done correctly,
 but remove the hardcoded `[212/255, 175/255, 55/255, 1]` fallback)

```swift
// Before (line 37):
withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
 glowPulse.toggle()
}

// After:
if !reduceMotion {
 withAnimation(.swarmGlowPulse.repeatForever(autoreverses: true)) {
 glowPulse.toggle()
 }
}

// Before (line 147):
withAnimation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0)) {
 textRevealOffset = -100
}

// After:
withAnimation(reduceMotion ? .easeInOut(duration: 0.3) : .swarmRevealSpring) {
 textRevealOffset = -100
}
```

### MainWindow.swift

**Problems:**
- All sidebars/center animate from single `windowHasAppeared` Bool — no cascade
- Multiple `.animation()` modifiers on same value can conflict
- Modals use uniform `.opacity.combined(with: .scale(0.95))` — no spring
- Theme change only animates frame, not interior views

**Changes:**

1. Replace single Bool with `MasterEntryController` for phase-based timing
2. Add per-phase delays so sidebar, center, title bar, status bar cascade properly
3. Replace modal transitions with `.swarmModalSpring` + scale:
 ```swift
 .transition(.opacity.combined(with: .scale(scale: 0.95)))
 .animation(.swarmModalSpring, value: appState.isCommandPaletteOpen)
 ```
4. Ensure all interior views use `@Environment(\.theme)` so `.swarmSlow` theme
 animation propagates to colors automatically

```swift
// Before (modal):
.transition(.opacity.combined(with: .scale(scale: 0.95)))

// After:
.transition(.opacity.combined(with: .scale(scale: 0.95)))
.animation(.swarmModalSpring, value: appState.isCommandPaletteOpen)
```

### TitleBar.swift

**Problems:**
- Shimmer uses inline `.linear(duration: 0.7)` — not named constant
- No `reduceMotion` guard for shimmer
- Outer HStack and inner workspace HStack have overlapping animations
- Picker controls lack spring scale-in

**Changes:**

1. Replace shimmer animation with `.swarmShimmer` constant
2. Add `reduceMotion` guard — skip shimmer, just fade text
3. Fix overlapping animations: only the outer HStack should have the `.animation()`
 modifier; inner elements should use `.animation(nil)` to inherit
4. Add scale-in to picker controls:
 ```swift
 .scaleEffect(hasAppeared ? 1 : 0.9)
 ```

```swift
// Before (line 48):
withAnimation(.linear(duration: 0.7).delay(0.15)) {
 shimmerOffset = 1.1
}

// After:
guard !reduceMotion else {
 shimmerOffset = 1.1
 return
}
withAnimation(.swarmShimmer.delay(0.15)) {
 shimmerOffset = 1.1
}
```

### StatusBar.swift

**Problems:**
- Count-up uses raw `DispatchQueue` + `.easeOut(duration: 0.15)` ticks
- No `reduceMotion` guard for count-up
- All items use identical delay pattern — mechanical

**Changes:**

1. Replace `DispatchQueue` count-up with animated `@State` Int using `.swarmCountUp`
2. Add `reduceMotion` guard — jump to final value
3. Vary the stagger slightly (organic variation of ±10ms):
 - Git: 0.95s
 - Agent count: 1.00s
 - Engine: 1.05s
 - Connected: 1.15s

```swift
// Before (lines 114-122):
for i in 1...targetCount {
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.3 + Double(i) * 0.05) {
 withAnimation(.easeOut(duration: 0.15)) {
 agentCountDisplay = i
 }
 }
}

// After:
if reduceMotion {
 agentCountDisplay = targetCount
} else {
 withAnimation(.swarmCountUp) {
 agentCountDisplay = targetCount
 }
}
```

### BoardStrip.swift

**Problems:**
- ZERO animations — tabs appear instantly, active state snaps, no hover feedback
- This is the biggest visual gap in the app

**Changes:**

1. Add `@State private var hasAppeared = false` with `.onAppear` trigger
2. Animate strip background slide-up on entry
3. Animate each tab pill with staggered scale-in + opacity
4. Animate active state transition (gold highlight) with `.swarmBoardTabSpring`
5. Add hover scale feedback to tabs:
 ```swift
 .scaleEffect(isHovered ? 1.05 : 1.0)
 .animation(.swarmButtonSpring, value: isHovered)
 ```
6. Add press feedback to close button:
 ```swift
 .scaleEffect(isPressed ? 0.8 : 1.0)
 ```
7. Animate Add Pane button entrance

```swift
struct BoardStrip: View {
 @State private var hasAppeared = false
 // ...

 var body: some View {
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 4) {
 ForEach(Array(agentsStore.agents.enumerated()), id: \.element.id) { index, agent in
 BoardStripTab(agent: agent, isActive: ...)
 .opacity(hasAppeared ? 1 : 0)
 .scaleEffect(hasAppeared ? 1 : 0.9)
 .animation(
 .swarmBoardTabSpring.swarmStagger(
 baseDelay: 0.78,
 staggerInterval: 0.02,
 index: index
 ),
 value: hasAppeared
 )
 }

 AddPaneButton()
 .opacity(hasAppeared ? 1 : 0)
 .scaleEffect(hasAppeared ? 1 : 0.9)
 .animation(.swarmBoardTabSpring.delay(0.95), value: hasAppeared)
 }
 }
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : 20)
 .animation(.swarmSlideUp.delay(0.70), value: hasAppeared)
 .onAppear {
 hasAppeared = true
 }
 }
}
```

### AgentPaneView.swift

**Problems:**
- Exit uses `easeIn(0.3)` — abrupt vs spring entry
- ScanLineModifier ForEach creates N views in body every render
- No stagger for terminal output lines
- Hover glow uses different curve than entry — feels disconnected

**Changes:**

1. Replace exit animation:
 ```swift
 // Before:
 withAnimation(.easeIn(duration: 0.3)) { exitProgress = 1 }
 // After:
 withAnimation(.swarmAgentSpring.speed(1.5)) { exitProgress = 1 }
 ```

2. Fix ScanLineModifier performance: move `ForEach` out of body or use
 `@State` to cache the raster lines

3. Add stagger for terminal output lines (stagger based on line index)

4. Align hover glow curve with entry:
 ```swift
 .animation(.swarmAgentSpring, value: isHovered)
 ```

### SidebarDock.swift

**Problems:**
- Multiple `.animation()` modifiers on same view chain — can conflict
- Active tab indicator snaps with no animation
- No explicit exit animation

**Changes:**

1. Collapse multiple `.animation()` modifiers to a single `.animation()` per
 animated property. Use `.animation(nil)` on subviews that should not animate
 independently:
 ```swift
 // Before (4 animation modifiers on same view):
 .animation(.swarmPaneOpen, value: ...)
 .animation(.swarmSidebarEntry, value: ...)
 .animation(.swarmTabContentEntry, value: ...)
 .animation(.swarmTabSwitch, value: ...)

 // After (1 modifier per distinct animated property):
 .animation(.swarmSidebarEntry, value: appState.isLeftSidebarOpen) // outer slide
 // Inner content inherits or uses explicit nil
 ```

2. Animate active tab indicator:
 ```swift
 .scaleEffect(isSelected ? 1 : 0)
 .animation(.swarmSidebarSpring, value: isSelected)
 ```

### GlassElevation.swift

**Problems:**
- `GlassAppearModifier` and `GlassTransitionModifier` defined but never applied
- Corner radius animation hardcodes start at 16 instead of `from.cornerRadius`
- Shadow opacity starts at `0.2 * progress` instead of 0 — always has shadow hint
- No `reduceMotion` guard

**Changes:**

1. Apply `GlassAppearModifier` to pane views in `AgentPaneView`:
 ```swift
 .modifier(GlassAppearModifier(elevation: .glass))
 ```

2. Fix corner radius interpolation:
 ```swift
 // Before:
 .clipShape(RoundedRectangle(cornerRadius: 16 + (targetCornerRadius - 16) * appearProgress))
 // After:
 .clipShape(RoundedRectangle(cornerRadius: 0 + (targetCornerRadius - 0) * appearProgress))
 ```

3. Fix shadow opacity:
 ```swift
 // Before:
 .shadow(color: .black.opacity(0.2 * appearProgress), ...)
 // After:
 .shadow(color: .black.opacity(appearProgress > 0.01 ? 0.2 * appearProgress : 0), ...)
 ```

4. Add `reduceMotion` guard — skip animation, set progress to 1 immediately

5. Use theme-aware shadow color:
 ```swift
 .shadow(color: Color.swarmTextPrimary.opacity(0.15 * appearProgress), ...)
 ```

6. Apply `GlassTransitionModifier` for theme-aware material transitions

### Animations.swift

**Changes:**

1. Add all NEW curves listed in Section 3
2. Add `swarmStagger()` method on `Animation`
3. Add `swarmAnimate()` and related helpers on `View`
4. Remove `UUID()` as trigger value in helpers — use explicit `Bool` state
 passed by caller (see `swarmAnimateIf` pattern)

```swift
// Before (fragile UUID trigger):
func swarmFadeIn(delay: Double = 0) -> some View {
 self.opacity(1)
 .animation(.swarmFadeIn.delay(delay), value: UUID()) // ← UUID changes every render
}

// After (explicit trigger):
func swarmFadeIn(delay: Double = 0, trigger: AnyHashable) -> some View {
 self.opacity(1)
 .animation(.swarmFadeIn.delay(delay), value: trigger)
}
```

---

## 10. Implementation Checklist

### Phase 0: Foundation (Animations.swift)

- [ ] Add all new spring curves (`.swarmEntrySpring`, `.swarmRevealSpring`, etc.)
- [ ] Add all new timing curves (`.swarmReveal`, `.swarmFadeInUp`, `.swarmGlowPulse`, etc.)
- [ ] Add `swarmStagger()` extension on `Animation`
- [ ] Add `swarmAnimate()` and related `View` helpers
- [ ] Replace `UUID()` triggers with explicit `AnyHashable` parameters

### Phase 1: Master Entry Controller

- [ ] Create `MasterEntryController` observable class
- [ ] Wire it into `MainWindow` with `@State`
- [ ] Verify all phase start times derive from `entryController.elapsed`

### Phase 2: Splash Screen

- [ ] Replace inline animations with named constants
- [ ] Add `reduceMotion` guard
- [ ] Replace hardcoded 2.3s delay with `MasterEntryController` observation
- [ ] Remove hardcoded gold fallback color
- [ ] Add smooth theme color transition during splash

### Phase 3: Window & Navigation

- [ ] Refactor `MainWindow` to use `MasterEntryController` for cascade timing
- [ ] Add stagger between sidebar → center → title bar → status bar
- [ ] Update modal transitions to use `.swarmModalSpring`
- [ ] Fix conflicting `.animation()` modifiers

### Phase 4: Static Elements (BoardStrip)

- [ ] Add entrance animation to `BoardStrip`
- [ ] Add staggered tab pill animations
- [ ] Add active state transition animation
- [ ] Add hover/press feedback to tabs and close buttons
- [ ] Animate Add Pane button

### Phase 5: Polish Passes

- [ ] Fix `AgentPaneView` exit animation
- [ ] Fix `ScanLineModifier` performance
- [ ] Add stagger for terminal output lines
- [ ] Fix `TitleBar` overlapping animations + shimmer constant
- [ ] Replace `DispatchQueue` count-up with animated Int
- [ ] Fix `SidebarDock` conflicting `.animation()` modifiers
- [ ] Animate active tab indicator in SidebarDock
- [ ] Fix `GlassAppearModifier` corner radius, shadow, reduceMotion
- [ ] Apply `GlassAppearModifier` to agent panes
- [ ] Add `reduceMotion` guards to all components

### Phase 6: Verification

- [ ] Run with `reduceMotion = true` in Accessibility settings — verify all animations degrade gracefully
- [ ] Switch themes mid-animation — verify smooth color transitions
- [ ] Test splash exit interruption (dismiss early, verify no orphaned animations)
- [ ] Profile with Instruments — verify no animation-driven layout thrashing
- [ ] Verify no two elements share exact start time within same phase (unless intentional pair)

---

## Appendix: Current vs. Spec Comparison

| File | Current Rating | Target Rating | Key Changes |
|------|---------------|---------------|-------------|
| SplashScreenView | B+ | A+ | Named curves, reduceMotion, interruptible exit |
| MainWindow | B | A | Master timeline, cascade timing, modal springs |
| TitleBar | B+ | A | Named shimmer, reduceMotion, fixed overlaps |
| StatusBar | B | A+ | Animated Int count-up, reduceMotion, varied stagger |
| BoardStrip | D | A+ | Complete animation overhaul |
| AgentPaneView | B+ | A | Spring exit, blur-to-clear, stagger lines |
| SidebarDock | B | A | Resolved .animation() conflicts, indicator animation |
| GlassElevation | C | B+ | Dead code removed, reduceMotion, applied modifiers |
| Animations.swift | B+ | A+ | Premium curves, stagger system, new helpers |

**Overall Target: A (was B+)**

The gap from B+ to A is primarily BoardStrip (D → A+) and the master timeline
orchestration. Everything else is polish on already-solid foundations.
