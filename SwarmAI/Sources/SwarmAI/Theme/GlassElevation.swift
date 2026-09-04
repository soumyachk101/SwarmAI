import SwiftUI

// MARK: - Glass Elevation View Modifiers

public enum GlassElevation: String, CaseIterable, Sendable {
	case appCanvas = "appCanvas"
	case glass = "glass"
	case glassToolbar = "glassToolbar"
	case glassRail = "glassRail"
	case glassInset = "glassInset"
	case glassHi = "glassHi"

	// MARK: - Content Elevations

	/// Card content elevation for content cards and tiles
	case glassCard = "glassCard"

	/// Modal overlay elevation for sheets and popovers
	case glassModal = "glassModal"

	/// Input field elevation for text inputs and form controls
	case glassInput = "glassInput"

	public var appearDuration: Double {
		switch self {
		case .appCanvas: return 0
		case .glass: return 0.7
		case .glassToolbar: return 0.5
		case .glassRail: return 0.5
		case .glassInset: return 0.4
		case .glassHi: return 0.8
		case .glassCard: return 0.55
		case .glassModal: return 0.35
		case .glassInput: return 0.3
		}
	}

	public var material: Material {
		switch self {
		case .appCanvas: return .ultraThinMaterial
		case .glass: return .ultraThinMaterial
		case .glassToolbar: return .thinMaterial
		case .glassRail: return .thinMaterial
		case .glassInset: return .ultraThinMaterial
		case .glassHi: return .regularMaterial
		case .glassCard: return .ultraThinMaterial
		case .glassModal: return .regularMaterial
		case .glassInput: return .ultraThinMaterial
		}
	}

	public var cornerRadius: CGFloat {
		switch self {
		case .appCanvas: return 0
		case .glass: return 12
		case .glassToolbar: return 8
		case .glassRail: return 0
		case .glassInset: return 8
		case .glassHi: return 16
		case .glassCard: return 10
		case .glassModal: return 16
		case .glassInput: return 8
		}
	}

	public var borderWidth: CGFloat {
		switch self {
		case .appCanvas: return 0
		case .glass: return 1
		case .glassToolbar: return 0.5
		case .glassRail: return 0
		case .glassInset: return 1
		case .glassHi: return 0.5
		case .glassCard: return 1
		case .glassModal: return 0.5
		case .glassInput: return 1
		}
	}

	// Appearance animation configuration per elevation
	public var appearConfig: (startScale: CGFloat, startOpacity: CGFloat, targetScale: CGFloat) {
		switch self {
		case .appCanvas: return (1.0, 1.0, 1.0)
		case .glass: return (0.96, 0.0, 1.0)
		case .glassToolbar: return (0.97, 0.0, 1.0)
		case .glassRail: return (1.0, 0.0, 1.0)
		case .glassInset: return (0.95, 0.0, 1.0)
		case .glassHi: return (0.92, 0.0, 1.0)
		case .glassCard: return (0.95, 0.0, 1.0)
		case .glassModal: return (0.94, 0.0, 1.0)
		case .glassInput: return (0.97, 0.0, 1.0)
		}
	}

	public var shadowConfig: (radius: CGFloat, y: CGFloat, opacity: Double) {
		switch self {
		case .appCanvas: return (0, 0, 0)
		case .glass: return (8, 4, 0.2)
		case .glassToolbar: return (6, 2, 0.15)
		case .glassRail: return (0, 0, 0)
		case .glassInset: return (4, 2, 0.1)
		case .glassHi: return (20, 10, 0.25)
		case .glassCard: return (10, 5, 0.18)
		case .glassModal: return (24, 12, 0.3)
		case .glassInput: return (6, 3, 0.15)
		}
	}
}

// MARK: - Glass Effect View Modifier

public struct GlassEffect: ViewModifier {
	public let elevation: GlassElevation
	public let theme: Theme
	public let showBorder: Bool

	public init(elevation: GlassElevation, theme: Theme = ThemeStore.shared.currentTheme, showBorder: Bool = true) {
		self.elevation = elevation
		self.theme = theme
		self.showBorder = showBorder
	}

	public func body(content: Content) -> some View {
		content
			.background(elevation.material)
			.clipShape(RoundedRectangle(cornerRadius: elevation.cornerRadius))
			.overlay {
				if showBorder && elevation.borderWidth > 0 {
					RoundedRectangle(cornerRadius: elevation.cornerRadius)
						.stroke(Color.from(theme: theme, token: .borderSubtle), lineWidth: elevation.borderWidth)
				}
			}
			.shadow(
				color: Color.from(theme: theme, token: .shadowColor).opacity(elevation.shadowConfig.opacity),
				radius: elevation.shadowConfig.radius,
				x: 0,
				y: elevation.shadowConfig.y
			)
	}
}

public extension View {
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

	func glassTransition(from: GlassElevation, to: GlassElevation, progress: CGFloat, theme: Theme? = nil) -> some View {
		self.modifier(GlassTransitionModifier(from: from, to: to, progress: progress, theme: theme ?? ThemeStore.shared.currentTheme))
	}

	// MARK: - Glass Appearance Animation

	func glassAppear(_ elevation: GlassElevation = .glass, theme: Theme? = nil) -> some View {
		self.modifier(GlassAppearModifier(elevation: elevation, theme: theme ?? ThemeStore.shared.currentTheme))
	}

	// MARK: - Content Elevation Helpers

	func glassCard(_ theme: Theme? = nil) -> some View {
		self.modifier(GlassEffect(elevation: .glassCard, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: true))
	}

	func glassModal(_ theme: Theme? = nil) -> some View {
		self.modifier(GlassEffect(elevation: .glassModal, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: true))
	}

	func glassInput(_ theme: Theme? = nil) -> some View {
		self.modifier(GlassEffect(elevation: .glassInput, theme: theme ?? ThemeStore.shared.currentTheme, showBorder: true))
	}
}

// MARK: - Glass Transition Modifier

struct GlassTransitionModifier: ViewModifier {
	let from: GlassElevation
	let to: GlassElevation
	let progress: CGFloat
	let theme: Theme

	init(from: GlassElevation, to: GlassElevation, progress: CGFloat, theme: Theme = ThemeStore.shared.currentTheme) {
		self.from = from
		self.to = to
		self.progress = progress
		self.theme = theme
	}

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
						.stroke(Color.from(theme: theme, token: .borderSubtle).opacity(0.3), lineWidth: currentBorderWidth)
				}
			}
	}
}

// MARK: - Glass Appear Modifier

struct GlassAppearModifier: ViewModifier {
	let elevation: GlassElevation
	let theme: Theme
	@State private var appearProgress: CGFloat = 0
	@State private var hasAppeared: Bool = false

	init(elevation: GlassElevation, theme: Theme = ThemeStore.shared.currentTheme) {
		self.elevation = elevation
		self.theme = theme
	}

	func body(content: Content) -> some View {
		let duration = elevation.appearDuration
		let config = elevation.appearConfig
		let shadow = elevation.shadowConfig
		let targetCornerRadius = elevation.cornerRadius
		let startCornerRadius = targetCornerRadius + (elevation == .appCanvas ? 0 : 4)
		let targetBorderWidth = elevation.borderWidth

		return content
			.scaleEffect(config.startScale + (config.targetScale - config.startScale) * appearProgress)
			.opacity(config.startOpacity + (1.0 - config.startOpacity) * appearProgress)
			.background(elevation.material.opacity(appearProgress))
			.clipShape(RoundedRectangle(cornerRadius: startCornerRadius + (targetCornerRadius - startCornerRadius) * appearProgress))
			.overlay {
				if appearProgress > 0 && targetBorderWidth > 0 {
					RoundedRectangle(cornerRadius: startCornerRadius + (targetCornerRadius - startCornerRadius) * appearProgress)
						.stroke(Color.from(theme: theme, token: .borderSubtle).opacity(0.3 * appearProgress), lineWidth: targetBorderWidth * appearProgress)
				}
			}
			.shadow(
				color: Color.from(theme: theme, token: .shadowColor).opacity(shadow.opacity * appearProgress),
				radius: shadow.radius * appearProgress,
				x: 0,
				y: shadow.y * appearProgress
			)
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

// MARK: - Glass Hover/Press Modifier

struct GlassInteractiveModifier: ViewModifier {
	let elevation: GlassElevation
	let theme: Theme
	@State private var isHovered: Bool = false
	@State private var isPressed: Bool = false

	init(elevation: GlassElevation, theme: Theme = ThemeStore.shared.currentTheme) {
		self.elevation = elevation
		self.theme = theme
	}

	func body(content: Content) -> some View {
		content
			.scaleEffect(isPressed ? 0.98 : (isHovered ? 1.01 : 1.0))
			.overlay {
				if isHovered {
					RoundedRectangle(cornerRadius: elevation.cornerRadius)
						.stroke(Color.from(theme: theme, token: .borderSubtle).opacity(0.4), lineWidth: 1)
				}
			}
			.shadow(
				color: Color.from(theme: theme, token: .shadowColor).opacity(isHovered ? 0.25 : 0.2),
				radius: isHovered ? (elevation == .glassHi ? 24 : 10) : (elevation == .glassHi ? 20 : 8),
				x: 0,
				y: isHovered ? (elevation == .glassHi ? 12 : 5) : (elevation == .glassHi ? 10 : 4)
			)
			.onHover { hovering in
				withAnimation(.swarmQuick) {
					isHovered = hovering
				}
			}
			.simultaneousGesture(
				DragGesture(minimumDistance: 0)
					.onChanged { _ in
						if !isPressed {
							withAnimation(.swarmButtonPress) {
								isPressed = true
							}
						}
					}
					.onEnded { _ in
						withAnimation(.swarmEntrySpring) {
							isPressed = false
						}
					}
			)
	}
}

public extension View {
	func glassInteractive(_ elevation: GlassElevation = .glass, theme: Theme? = nil) -> some View {
		self.modifier(GlassInteractiveModifier(elevation: elevation, theme: theme ?? ThemeStore.shared.currentTheme))
	}
}

// MARK: - Theme Colors Environment

public struct ThemeColorsKey: EnvironmentKey {
	public static let defaultValue: Theme = Theme.allThemes[0]
}

public extension EnvironmentValues {
	var theme: Theme {
		get { self[ThemeColorsKey.self] }
		set { self[ThemeColorsKey.self] = newValue }
	}
}

public extension View {
	func themeColors(_ theme: Theme) -> some View {
		self.environment(\.theme, theme)
	}
}
