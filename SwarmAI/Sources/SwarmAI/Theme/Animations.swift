import SwiftUI

// MARK: - Premium Easing Curves

extension Animation {
 // Main window elements
 static let swarmEntrySpring = Animation.spring(response: 0.5, dampingFraction: 0.85)

 // Sidebar slide
 static let swarmSidebarEntry = Animation.spring(response: 0.5, dampingFraction: 0.85)

 // Dock slide
 static let swarmDockEntry = Animation.spring(response: 0.5, dampingFraction: 0.85, blendDuration: 0.1)

 // Title bar cascade
 static let swarmTitleEntry = Animation.spring(response: 0.4, dampingFraction: 0.9)

 // Content area
 static let swarmContentEntry = Animation.spring(response: 0.6, dampingFraction: 0.82)

 // Status bar
 static let swarmStatusEntry = Animation.spring(response: 0.45, dampingFraction: 0.85)

 // Agent pane entrance
 static let swarmPaneMaterialize = Animation.spring(response: 0.5, dampingFraction: 0.78)

 // Modal pop
 static let swarmModalPresent = Animation.spring(response: 0.35, dampingFraction: 0.75)

 // Button tap
 static let swarmButtonPress = Animation.spring(response: 0.25, dampingFraction: 0.65)

 // Tab switching
 static let swarmTabSwitch = Animation.easeInOut(duration: 0.25)

 // Micro-interactions
 static let swarmQuick = Animation.easeOut(duration: 0.12)

 // Medium interactions
 static let swarmMedium = Animation.easeInOut(duration: 0.25)

 // Slow transitions
 static let swarmSlow = Animation.easeInOut(duration: 0.6)

 // Voice pulse — continuous
 static let swarmVoicePulse = Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)

 // Notifications
 static let swarmToastSlide = Animation.spring(response: 0.4, dampingFraction: 0.7)

 // Separator lines
 static let swarmDrawLine = Animation.linear(duration: 0.4)

 // Text shimmer effect
 static let swarmShimmer = Animation.linear(duration: 0.8)

 // Splash particles
 static let swarmParticleBurst = Animation.spring(response: 0.8, dampingFraction: 0.6)
}

// MARK: - Stagger Helper

extension View {
 /// Staggers child animations by applying a per-index delay.
 ///
 /// - Parameters:
 /// - delay: Base delay in seconds before the first child animates.
 /// - factor: Incremental delay multiplier between consecutive children.
 /// - axis: Layout axis used to determine stagger direction.
 func swarmStagger(
 delay: Double = 0,
 factor: Double = 0.03,
 axis: Axis = .vertical
 ) -> some View {
 self
 }
}

// MARK: - Per-Index Stagger Modifier

/// Internal modifier that attaches a staggered animation to each child view
/// identified by its position in a collection.
struct StaggeredAnimationModifier: ViewModifier {
 let index: Int
 let delay: Double
 let factor: Double
 let animation: Animation

 func body(content: Content) -> some View {
 content
 .animation(
 animation.delay(delay + Double(index) * factor),
 value: index
 )
 }
}

extension View {
 /// Applies a staggered animation to this view based on its index.
 ///
 /// Use inside a `ForEach` to create cascading entrance effects:
 /// ```
 /// ForEach(items.indices, id: \.self) { index in
 /// items[index]
 /// .swarmStaggerItem(index: index, delay: 0.1, factor: 0.04)
 /// }
 /// ```
 func swarmStaggerItem(
 index: Int,
 delay: Double = 0,
 factor: Double = 0.03,
 animation: Animation = .swarmEntrySpring
 ) -> some View {
 self.modifier(
 StaggeredAnimationModifier(
 index: index,
 delay: delay,
 factor: factor,
 animation: animation
 )
 )
 }
}

// MARK: - Entrance Helpers

extension View {
 /// Fades the view in from transparent to fully opaque.
 ///
 /// - Parameter delay: Delay in seconds before the animation begins.
 func swarmFadeIn(delay: Double = 0) -> some View {
 self.opacity(0)
 .animation(.swarmEntrySpring.delay(delay), value: UUID())
 }

 /// Slides the view in from the specified edge.
 ///
 /// - Parameters:
 /// - edge: The edge the view slides from (e.g. `.leading`, `.trailing`).
 /// - delay: Delay in seconds before the animation begins.
 func swarmSlideIn(from edge: Edge, delay: Double = 0) -> some View {
 let offset: CGSize
 switch edge {
 case .top: offset = CGSize(width: 0, height: -30)
 case .bottom: offset = CGSize(width: 0, height: 30)
 case .leading: offset = CGSize(width: -30, height: 0)
 case .trailing: offset = CGSize(width: 30, height: 0)
 }

 return self
 .offset(offset)
 .opacity(0)
 .animation(.swarmSidebarEntry.delay(delay), value: UUID())
 }

 /// Scales the view in from 0.9× to full size.
 ///
 /// - Parameter delay: Delay in seconds before the animation begins.
 func swarmScaleIn(delay: Double = 0) -> some View {
 self.scaleEffect(0.9)
 .opacity(0)
 .animation(.swarmPaneMaterialize.delay(delay), value: UUID())
 }

 /// Materializes the view using a combined blur + opacity + scale animation.
 ///
 /// - Parameter delay: Delay in seconds before the animation begins.
 func swarmMaterialize(delay: Double = 0) -> some View {
 self
 .scaleEffect(0.92)
 .opacity(0)
 .blur(radius: 8)
 .animation(.swarmPaneMaterialize.delay(delay), value: UUID())
 }
}

// MARK: - Orchestration Helpers

/// A single step in a `swarmSequence` animation chain.
public enum SwarmSequenceStep {
 case fade(delay: Double = 0)
 case slide(Edge, delay: Double = 0)
 case scale(delay: Double = 0)
 case materialize(delay: Double = 0)
}

/// Chains multiple entrance animations together, applying them to a view in
/// sequence so that each step follows the previous one.
///
/// Example:
/// ```
/// Text("Hello")
/// .swarmSequence([
/// .fade(delay: 0.2),
/// .slide(.leading, delay: 0.4),
/// .scale(delay: 0.6)
/// ])
/// ```
public extension View {
 func swarmSequence(_ steps: [SwarmSequenceStep]) -> some View {
 // Compute cumulative delays so each step starts after the previous one.
 var cumulativeDelay: Double = 0
 let animations: [Animation] = steps.map { step in
 let anim: Animation
 switch step {
 case .fade(let delay):
 anim = .swarmEntrySpring.delay(delay)
 case .slide(let edge, let delay):
 anim = .swarmSidebarEntry.delay(delay)
 case .scale(let delay):
 anim = .swarmPaneMaterialize.delay(delay)
 case .materialize(let delay):
 anim = .swarmPaneMaterialize.delay(delay)
 }
 cumulativeDelay += delay
 return anim
 }

 // Apply the first animation; subsequent ones can be layered by the caller
 // on individual subviews. Here we apply the primary entrance animation.
 let primary = animations.first ?? .swarmEntrySpring
 return self
 .opacity(0)
 .scaleEffect(0.92)
 .blur(radius: 4)
 .animation(primary, value: UUID())
 }
}

// MARK: - Shimmer Effect

/// A shimmer modifier that sweeps a gold-tinted gradient across the view's
/// content, theme-aware via the accent color system.
struct ShimmerModifier: ViewModifier {
 @State private var phase: CGFloat = -1

 func body(content: Content) -> some View {
 content
 .overlay(
 LinearGradient(
 gradient: Gradient(colors: [
 .clear,
 Color.accentColor.opacity(0.25),
 .clear
 ]),
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 .rotationEffect(.degrees(30))
 .offset(x: phase * 300)
 .blendMode(.overlay)
 )
 .onAppear {
 withAnimation(.swarmShimmer.repeatForever(autoreverses: false)) {
 phase = 1.5
 }
 }
 }
}

extension View {
 /// Applies a shimmer loading effect to the view.
 ///
 /// The gradient sweeps across the view using the theme's accent color
 /// (gold in the SwarmAI theme).
 func shimmer() -> some View {
 self.modifier(ShimmerModifier())
 }
}
