import SwiftUI

// MARK: - Custom Animations

extension Animation {
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
}

// MARK: - Animation View Helpers

extension View {
 func swarmFadeIn(delay: Double = 0) -> some View {
 self.opacity(1)
 .animation(.swarmFadeIn.delay(delay), value: UUID())
 }

 func swarmScaleIn(delay: Double = 0) -> some View {
 self.scaleEffect(1)
 .animation(.swarmScaleIn.delay(delay), value: UUID())
 }

 func swarmSlideInFromRight(delay: Double = 0) -> some View {
 self.offset(x: 0)
 .animation(.swarmSlideRight.delay(delay), value: UUID())
 }

 @ViewBuilder
 func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
 if condition {
 transform(self)
 } else {
 self
 }
 }

 @ViewBuilder
 func conditionalOpacity(_ condition: Bool) -> some View {
 self.opacity(condition ? 1 : 0)
 }
}

// MARK: - Shimmer Loading Effect

struct ShimmerModifier: ViewModifier {
 @State private var phase: CGFloat = 0

 func body(content: Content) -> some View {
 content
 .overlay {
 LinearGradient(
 gradient: Gradient(colors: [
 .clear,
 .swarmSurfaceHover.opacity(0.3),
 .clear
 ]),
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 .rotationEffect(.degrees(30))
 .offset(x: phase * 300 - 150)
 .blendMode(.overlay)
 }
 .onAppear {
 withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
 phase = 1
 }
 }
 }
}

extension View {
 func shimmer() -> some View {
 self.modifier(ShimmerModifier())
 }
}
