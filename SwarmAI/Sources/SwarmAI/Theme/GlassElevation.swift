import SwiftUI

// MARK: - Glass Elevation View Modifiers

enum GlassElevation: String, CaseIterable {
 case appCanvas = "appCanvas" // Background floor
 case glass = "glass" // Pane/card frame (elevation 1)
 case glassToolbar = "glassToolbar" // Headers/title bars (elevation 2)
 case glassRail = "glassRail" // Sidebars/docks (elevation 2 variant)
 case glassInset = "glassInset" // Inputs/wells (elevation -1)
 case glassHi = "glassHi" // Modals/popovers (elevation 3)

 var appearDuration: Double {
 switch self {
 case .appCanvas: return 0
 case .glass: return 0.7
 case .glassToolbar: return 0.5
 case .glassRail: return 0.5
 case .glassInset: return 0.4
 case .glassHi: return 0.8
 }
 }

 var material: Material {
 switch self {
 case .appCanvas: return .clear
 case .glass: return .ultraThinMaterial
 case .glassToolbar: return .thinMaterial
 case .glassRail: return .thinMaterial
 case .glassInset: return .ultraThinMaterial
 case .glassHi: return .regularMaterial
 }
 }

 var cornerRadius: CGFloat {
 switch self {
 case .appCanvas: return 0
 case .glass: return 12
 case .glassToolbar: return 8
 case .glassRail: return 0
 case .glassInset: return 8
 case .glassHi: return 16
 }
 }

 var borderWidth: CGFloat {
 switch self {
 case .appCanvas: return 0
 case .glass: return 1
 case .glassToolbar: return 0.5
 case .glassRail: return 0
 case .glassInset: return 1
 case .glassHi: return 0.5
 }
 }
}

// MARK: - Glass Effect View Modifier

struct GlassEffect: ViewModifier {
 let elevation: GlassElevation
 let theme: Theme
 let showBorder: Bool

 func body(content: Content) -> some View {
 content
 .background(elevation.material)
 .clipShape(RoundedRectangle(cornerRadius: elevation.cornerRadius))
 .overlay {
 if showBorder && elevation.borderWidth > 0 {
 RoundedRectangle(cornerRadius: elevation.cornerRadius)
 .stroke(Color.from(theme: theme, token: .borderSubtle), lineWidth: elevation.borderWidth)
 }
 }
 .shadow(color: .black.opacity(0.2), radius: elevation == .glassHi ? 20 : 8, x: 0, y: elevation == .glassHi ? 10 : 4)
 }
}

extension View {
 func glassEffect(_ elevation: GlassElevation = .glass, showBorder: Bool = true) -> some View {
 self.modifier(GlassEffect(elevation: elevation, theme: ThemeStore.shared.currentTheme, showBorder: showBorder))
 }

 func glassToolbar(_ theme: Theme? = nil) -> some View {
 self.modifier(GlassEffect(elevation: .glassToolbar, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: true))
 }

 func glassRail(_ theme: Theme? = nil) -> some View {
 self.modifier(GlassEffect(elevation: .glassRail, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: false))
 }

 func glassInset(_ theme: Theme? = nil) -> some View {
 self.modifier(GlassEffect(elevation: .glassInset, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: true))
 }

 func glassHi(_ theme: Theme? = nil) -> some View {
 self.modifier(GlassEffect(elevation: .glassHi, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: true))
 }

 // MARK: - Animated Glass Transition

 func glassTransition(from: GlassElevation, to: GlassElevation, progress: CGFloat) -> some View {
 self.modifier(GlassTransitionModifier(from: from, to: to, progress: progress))
 }

 // MARK: - Glass Appearance Animation

 func glassAppear(_ elevation: GlassElevation = .glass) -> some View {
 self.modifier(GlassAppearModifier(elevation: elevation))
 }
}

// MARK: - Glass Transition Modifier

struct GlassTransitionModifier: ViewModifier {
 let from: GlassElevation
 let to: GlassElevation
 let progress: CGFloat

 func body(content: Content) -> some View {
 let clampedProgress = max(0, min(1, progress))
 let currentCornerRadius = from.cornerRadius + (to.cornerRadius - from.cornerRadius) * clampedProgress
 let currentBorderWidth = from.borderWidth + (to.borderWidth - from.borderWidth) * clampedProgress
 let fromMaterial = from.material
 let toMaterial = to.material

 return content
 .background(fromMaterial.opacity(1 - clampedProgress))
 .background(toMaterial.opacity(clampedProgress))
 .clipShape(RoundedRectangle(cornerRadius: currentCornerRadius))
 .overlay {
 if currentBorderWidth > 0 {
 RoundedRectangle(cornerRadius: currentCornerRadius)
 .stroke(Color.white.opacity(0.3), lineWidth: currentBorderWidth)
 }
 }
 }
}

// MARK: - Glass Appear Modifier

struct GlassAppearModifier: ViewModifier {
 let elevation: GlassElevation
 @State private var appearProgress: CGFloat = 0
 @State private var hasAppeared: Bool = false

 func body(content: Content) -> some View {
 let duration = elevation.appearDuration
 let targetCornerRadius = elevation.cornerRadius
 let targetBorderWidth = elevation.borderWidth
 let targetShadowRadius: CGFloat = elevation == .glassHi ? 20 : 8
 let targetShadowY: CGFloat = elevation == .glassHi ? 10 : 4

 return content
 .background(elevation.material.opacity(appearProgress))
 .clipShape(RoundedRectangle(cornerRadius: 16 + (targetCornerRadius - 16) * appearProgress))
 .overlay {
 if appearProgress > 0 && targetBorderWidth > 0 {
 RoundedRectangle(cornerRadius: 16 + (targetCornerRadius - 16) * appearProgress)
 .stroke(Color.white.opacity(0.3 * appearProgress), lineWidth: targetBorderWidth * appearProgress)
 }
 }
 .shadow(color: .black.opacity(0.2 * appearProgress), radius: targetShadowRadius * appearProgress, x: 0, y: targetShadowY * appearProgress)
 .onAppear {
 if !hasAppeared {
 hasAppeared = true
 withAnimation(.easeOut(duration: duration)) {
 appearProgress = 1
 }
 }
 }
 }
}

// MARK: - Theme Colors Environment

struct ThemeColorsKey: EnvironmentKey {
 static let defaultValue: Theme = Theme.allThemes[0]
}

extension EnvironmentValues {
 var theme: Theme {
 get { self[ThemeColorsKey.self] }
 set { self[ThemeColorsKey.self] = newValue }
 }
}

extension View {
 func themeColors(_ theme: Theme) -> some View {
 self.environment(\.theme, theme)
 }
}
