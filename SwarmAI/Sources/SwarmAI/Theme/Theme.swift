import SwiftUI
import AppKit

// MARK: - Theme Protocol

public struct Theme: Identifiable, Codable, Hashable, CaseIterable, Sendable {
	public static var allCases: [Theme] { allThemes }
	public let id: String
	public let displayName: String
	public let description: String
	public let colors: ThemeColors

	public struct ThemeColors: Codable, Hashable, Sendable {
		public let canvas: [Double] // RGB 0-255
		public let surface: [Double]
		public let surfaceHover: [Double]
		public let surfaceActive: [Double]
		public let surfaceRaised: [Double]
		public let surfaceOverlay: [Double]
		public let gold: [Double]
		public let goldHover: [Double]
		public let textPrimary: [Double]
		public let textSecondary: [Double]
		public let textTertiary: [Double]
		public let textInverse: [Double]
		public let border: [Double]
		public let borderSubtle: [Double]
		public let borderFocus: [Double]
		public let shadowColor: [Double]
		public let success: [Double]
		public let warning: [Double]
		public let error: [Double]
		public let info: [Double]

		public init(
			canvas: [Double],
			surface: [Double],
			surfaceHover: [Double],
			surfaceActive: [Double],
			surfaceRaised: [Double]? = nil,
			surfaceOverlay: [Double]? = nil,
			gold: [Double],
			goldHover: [Double],
			textPrimary: [Double],
			textSecondary: [Double],
			textTertiary: [Double],
			textInverse: [Double]? = nil,
			border: [Double],
			borderSubtle: [Double],
			borderFocus: [Double]? = nil,
			shadowColor: [Double]? = nil,
			success: [Double],
			warning: [Double],
			error: [Double],
			info: [Double]
		) {
			self.canvas = canvas
			self.surface = surface
			self.surfaceHover = surfaceHover
			self.surfaceActive = surfaceActive
			self.surfaceRaised = surfaceRaised ?? surfaceHover
			self.surfaceOverlay = surfaceOverlay ?? surface
			self.gold = gold
			self.goldHover = goldHover
			self.textPrimary = textPrimary
			self.textSecondary = textSecondary
			self.textTertiary = textTertiary
			self.textInverse = textInverse ?? canvas
			self.border = border
			self.borderSubtle = borderSubtle
			self.borderFocus = borderFocus ?? gold
			self.shadowColor = shadowColor ?? [0, 0, 0]
			self.success = success
			self.warning = warning
			self.error = error
			self.info = info
		}
	}

	public init(
		id: String,
		displayName: String,
		description: String,
		colors: ThemeColors
	) {
		self.id = id
		self.displayName = displayName
		self.description = description
		self.colors = colors
	}

	public func color(for token: ThemeToken) -> Color {
		let rgb = rgb(for: token)
		return Color(red: rgb[0] / 255.0, green: rgb[1] / 255.0, blue: rgb[2] / 255.0)
	}

	public func rgb(for token: ThemeToken) -> [Double] {
		switch token {
		case .canvas: return colors.canvas
		case .background: return colors.canvas
		case .surface: return colors.surface
		case .surfaceHover: return colors.surfaceHover
		case .surfaceActive: return colors.surfaceActive
		case .surfaceRaised: return colors.surfaceRaised
		case .surfaceOverlay: return colors.surfaceOverlay
		case .gold: return colors.gold
		case .goldHover: return colors.goldHover
		case .primary: return colors.gold
		case .textPrimary: return colors.textPrimary
		case .textSecondary: return colors.textSecondary
		case .textTertiary: return colors.textTertiary
		case .textInverse: return colors.textInverse
		case .border: return colors.border
		case .borderSubtle: return colors.borderSubtle
		case .borderFocus: return colors.borderFocus
		case .shadowColor: return colors.shadowColor
		case .success: return colors.success
		case .warning: return colors.warning
		case .error: return colors.error
		case .info: return colors.info
		}
	}

	public static let allThemes: [Theme] = [
		Theme(
			id: "obsidian-charcoal",
			displayName: "Charcoal Gold",
			description: "Default luxury dark charcoal theme with warm gold accents",
			colors: ThemeColors(
				canvas: [18, 18, 20],
 surface: [28, 28, 32],
 surfaceHover: [38, 38, 44],
 surfaceActive: [48, 48, 56],
 gold: [212, 175, 55],
 goldHover: [230, 195, 80],
 textPrimary: [232, 232, 238],
 textSecondary: [168, 168, 180],
 textTertiary: [120, 120, 136],
 border: [60, 60, 70],
 borderSubtle: [44, 44, 52],
 success: [80, 200, 120],
 warning: [230, 180, 50],
 error: [240, 80, 80],
 info: [100, 160, 240]
 )
 ),
 Theme(
 id: "midnight-cyberpunk",
 displayName: "Midnight Cyberpunk",
 description: "Dark purple/blue with neon pink and cyan",
 colors: ThemeColors(
 canvas: [12, 10, 24],
 surface: [22, 18, 40],
 surfaceHover: [32, 26, 56],
 surfaceActive: [42, 34, 68],
 gold: [255, 0, 128],
 goldHover: [255, 80, 160],
 textPrimary: [220, 220, 240],
 textSecondary: [160, 150, 200],
 textTertiary: [100, 90, 150],
 border: [60, 40, 100],
 borderSubtle: [44, 28, 78],
 success: [0, 255, 180],
 warning: [255, 200, 0],
 error: [255, 50, 80],
 info: [0, 200, 255]
 )
 ),
 Theme(
 id: "matrix-phosphor",
 displayName: "Matrix Phosphor",
 description: "Classic green phosphor terminal look",
 colors: ThemeColors(
 canvas: [0, 0, 0],
 surface: [8, 16, 8],
 surfaceHover: [12, 24, 12],
 surfaceActive: [16, 32, 16],
 gold: [0, 255, 65],
 goldHover: [0, 220, 55],
 textPrimary: [0, 255, 65],
 textSecondary: [0, 180, 45],
 textTertiary: [0, 120, 30],
 border: [0, 60, 15],
 borderSubtle: [0, 40, 10],
 success: [0, 255, 100],
 warning: [200, 255, 0],
 error: [255, 0, 50],
 info: [0, 200, 200]
 )
 ),
 Theme(
 id: "nordic-polar-frost",
 displayName: "Nordic Polar Frost",
 description: "Dark blue-gray with icy blue accents",
 colors: ThemeColors(
 canvas: [16, 20, 28],
 surface: [26, 32, 44],
 surfaceHover: [36, 44, 58],
 surfaceActive: [46, 56, 72],
 gold: [140, 200, 240],
 goldHover: [170, 220, 255],
 textPrimary: [220, 230, 240],
 textSecondary: [150, 170, 200],
 textTertiary: [100, 120, 150],
 border: [50, 60, 80],
 borderSubtle: [36, 44, 58],
 success: [120, 210, 160],
 warning: [240, 200, 100],
 error: [240, 100, 100],
 info: [140, 190, 255]
 )
 ),
 Theme(
 id: "crimson-eclipse",
 displayName: "Crimson Eclipse",
 description: "Very dark with crimson and red accents",
 colors: ThemeColors(
 canvas: [14, 8, 10],
 surface: [24, 14, 16],
 surfaceHover: [34, 20, 22],
 surfaceActive: [46, 26, 28],
 gold: [220, 40, 60],
 goldHover: [240, 70, 90],
 textPrimary: [235, 220, 225],
 textSecondary: [190, 160, 165],
 textTertiary: [130, 100, 105],
 border: [70, 30, 35],
 borderSubtle: [50, 20, 24],
 success: [80, 200, 120],
 warning: [230, 180, 50],
 error: [240, 60, 60],
 info: [160, 140, 220]
 )
 ),
 Theme(
 id: "swarm-dark",
 displayName: "Swarm Dark",
 description: "Deep dark with amber and gold accents",
 colors: ThemeColors(
 canvas: [14, 12, 8],
 surface: [24, 20, 14],
 surfaceHover: [34, 28, 20],
 surfaceActive: [46, 38, 26],
 gold: [220, 160, 40],
 goldHover: [240, 185, 70],
 textPrimary: [230, 225, 210],
 textSecondary: [185, 175, 150],
 textTertiary: [130, 120, 95],
 border: [65, 55, 35],
 borderSubtle: [46, 38, 26],
 success: [120, 190, 100],
 warning: [230, 180, 50],
 error: [220, 80, 80],
 info: [140, 170, 220]
 )
 ),
 Theme(
 id: "obsidian-oled",
 displayName: "Obsidian OLED",
 description: "Pure black with purple accents",
 colors: ThemeColors(
 canvas: [0, 0, 0],
 surface: [10, 8, 16],
 surfaceHover: [18, 14, 28],
 surfaceActive: [28, 22, 40],
 gold: [160, 100, 255],
 goldHover: [190, 140, 255],
 textPrimary: [220, 215, 235],
 textSecondary: [160, 150, 190],
 textTertiary: [100, 90, 140],
 border: [50, 35, 80],
 borderSubtle: [32, 22, 55],
 success: [100, 220, 140],
 warning: [220, 190, 50],
 error: [240, 80, 100],
 info: [140, 130, 255]
 )
 ),
 Theme(
 id: "graphite",
 displayName: "Graphite",
 description: "Medium-dark gray with teal accents",
 colors: ThemeColors(
 canvas: [22, 24, 26],
 surface: [34, 36, 40],
 surfaceHover: [46, 48, 54],
 surfaceActive: [58, 60, 68],
 gold: [80, 200, 180],
 goldHover: [110, 225, 205],
 textPrimary: [225, 228, 230],
 textSecondary: [165, 172, 178],
 textTertiary: [110, 118, 126],
 border: [58, 62, 68],
 borderSubtle: [42, 46, 52],
 success: [100, 200, 140],
 warning: [220, 190, 80],
 error: [230, 90, 90],
 info: [100, 180, 220]
 )
 ),
 Theme(
 id: "honey-amber",
 displayName: "Honey Amber",
 description: "Warm dark with honey and amber",
 colors: ThemeColors(
 canvas: [18, 14, 10],
 surface: [30, 24, 16],
 surfaceHover: [42, 34, 22],
 surfaceActive: [54, 44, 28],
 gold: [230, 160, 60],
 goldHover: [245, 185, 90],
 textPrimary: [232, 225, 210],
 textSecondary: [190, 178, 148],
 textTertiary: [140, 128, 96],
 border: [68, 52, 30],
 borderSubtle: [48, 36, 20],
 success: [130, 195, 100],
 warning: [230, 185, 50],
 error: [230, 85, 85],
 info: [150, 175, 220]
 )
 )
 ]

 	public static func theme(for id: String) -> Theme? {
		if let match = allThemes.first(where: { $0.id == id }) {
			return match
		}
		// Match common aliases gracefully
		switch id.lowercased() {
		case "charcoal", "charcoal-gold", "charcoal gold", "obsidian-charcoal", "default":
			return allThemes.first { $0.id == "obsidian-charcoal" }
		case "midnight", "midnight-cyberpunk":
			return allThemes.first { $0.id == "midnight-cyberpunk" }
		case "matrix", "matrix-phosphor":
			return allThemes.first { $0.id == "matrix-phosphor" }
		case "nordic", "nordic-polar-frost":
			return allThemes.first { $0.id == "nordic-polar-frost" }
		case "crimson", "crimson-eclipse":
			return allThemes.first { $0.id == "crimson-eclipse" }
		case "swarm", "swarm-dark":
			return allThemes.first { $0.id == "swarm-dark" }
		case "obsidian", "obsidian-oled":
			return allThemes.first { $0.id == "obsidian-oled" }
		case "graphite":
			return allThemes.first { $0.id == "graphite" }
		case "amber", "honey-amber":
			return allThemes.first { $0.id == "honey-amber" }
		default:
			return nil
		}
	}
}

// MARK: - Theme Kind

public enum ThemeKind: String, Codable, Hashable, Sendable, CaseIterable {
	case dark = "dark"
	case light = "light"
	case midnight = "midnight"

	public var title: String {
		rawValue.capitalized
	}
}

// MARK: - Theme Data Model

public struct ThemeScheme: Identifiable, Hashable, Sendable {
	public let id: String
	public let name: String
	public let kind: ThemeKind

	public var isDark: Bool {
		kind != .light
	}

	// MARK: - Semantic Surface & Background

	public let background: Color
	public let surface: Color
	public let surfaceSecondary: Color
	public let surfaceElevated: Color
	public let border: Color
	public let borderSubtle: Color

	// MARK: - Text Colors

	public let textPrimary: [Double]
	public let textSecondary: Color
	public let textTertiary: Color
	public let textDisabled: Color
	public let textInverse: Color

	// MARK: - Accent Colors

	public let accentPrimary: Color
	public let accentSecondary: Color
	public let accentSuccess: Color
	public let accentWarning: Color
	public let accentError: Color

	// MARK: - Terminal Colors

	public let terminalBackground: Color
	public let terminalText: Color
	public let terminalCursor: Color
	public let terminalSelection: Color
	public let terminalBorder: Color

	// MARK: - ANSI Palette

	public let ansiStandard: [Color]
	public let ansiBright: [Color]

	// MARK: - Computed Conveniences

	public var accent: Color {
		accentPrimary
	}

	public var primaryText: Color {
		Color(red: textPrimary[0] / 255.0, green: textPrimary[1] / 255.0, blue: textPrimary[2] / 255.0)
	}

	// MARK: - Init

	public init(
		id: String,
		name: String,
		kind: ThemeKind,
		background: Color,
		surface: Color,
		surfaceSecondary: Color,
		surfaceElevated: Color,
		border: Color,
		borderSubtle: Color,
		textPrimary: [Double],
		textSecondary: Color,
		textTertiary: Color,
		textDisabled: Color,
		textInverse: Color,
		accentPrimary: Color,
		accentSecondary: Color,
		accentSuccess: Color,
		accentWarning: Color,
		accentError: Color,
		terminalBackground: Color,
		terminalText: Color,
		terminalCursor: Color,
		terminalSelection: Color,
		terminalBorder: Color,
		ansiStandard: [Color],
		ansiBright: [Color]
	) {
		self.id = id
		self.name = name
		self.kind = kind
		self.background = background
		self.surface = surface
		self.surfaceSecondary = surfaceSecondary
		self.surfaceElevated = surfaceElevated
		self.border = border
		self.borderSubtle = borderSubtle
		self.textPrimary = textPrimary
		self.textSecondary = textSecondary
		self.textTertiary = textTertiary
		self.textDisabled = textDisabled
		self.textInverse = textInverse
		self.accentPrimary = accentPrimary
		self.accentSecondary = accentSecondary
		self.accentSuccess = accentSuccess
		self.accentWarning = accentWarning
		self.accentError = accentError
		self.terminalBackground = terminalBackground
		self.terminalText = terminalText
		self.terminalCursor = terminalCursor
		self.terminalSelection = terminalSelection
		self.terminalBorder = terminalBorder
		self.ansiStandard = ansiStandard
		self.ansiBright = ansiBright
	}
}

// MARK: - ThemeScheme Presets

public extension ThemeScheme {
	static let dark: ThemeScheme = ThemeScheme(
		id: "swarm-dark",
		name: "Swarm Dark",
		kind: .dark,
		background: Color(red: 0.059, green: 0.059, blue: 0.078),
		surface: Color(red: 0.098, green: 0.098, blue: 0.125),
		surfaceSecondary: Color(red: 0.122, green: 0.122, blue: 0.157),
		surfaceElevated: Color(red: 0.149, green: 0.149, blue: 0.188),
		border: Color(red: 0.200, green: 0.200, blue: 0.235),
		borderSubtle: Color(red: 0.157, green: 0.157, blue: 0.192),
		textPrimary: [228, 225, 238],
		textSecondary: Color(red: 0.663, green: 0.647, blue: 0.718),
		textTertiary: Color(red: 0.510, green: 0.498, blue: 0.561),
		textDisabled: Color(red: 0.380, green: 0.368, blue: 0.420),
		textInverse: Color(red: 0.078, green: 0.078, blue: 0.110),
		accentPrimary: Color(red: 0.455, green: 0.373, blue: 1.000),
		accentSecondary: Color(red: 0.600, green: 0.467, blue: 1.000),
		accentSuccess: Color(red: 0.396, green: 0.800, blue: 0.580),
		accentWarning: Color(red: 1.000, green: 0.780, blue: 0.278),
		accentError: Color(red: 1.000, green: 0.388, blue: 0.388),
		terminalBackground: Color(red: 0.047, green: 0.047, blue: 0.063),
		terminalText: Color(red: 0.816, green: 0.800, blue: 0.906),
		terminalCursor: Color(red: 0.455, green: 0.373, blue: 1.000),
		terminalSelection: Color(red: 0.455, green: 0.373, blue: 1.000).opacity(0.3),
		terminalBorder: Color(red: 0.180, green: 0.180, blue: 0.220),
		ansiStandard: [
			Color(red: 0.000, green: 0.000, blue: 0.000),
			Color(red: 0.675, green: 0.263, blue: 0.263),
			Color(red: 0.267, green: 0.549, blue: 0.267),
			Color(red: 0.529, green: 0.549, blue: 0.267),
			Color(red: 0.278, green: 0.333, blue: 0.678),
			Color(red: 0.557, green: 0.278, blue: 0.678),
			Color(red: 0.278, green: 0.518, blue: 0.518),
			Color(red: 0.663, green: 0.647, blue: 0.718),
			Color(red: 0.388, green: 0.388, blue: 0.447),
			Color(red: 1.000, green: 0.396, blue: 0.396),
			Color(red: 0.396, green: 1.000, blue: 0.396),
			Color(red: 1.000, green: 1.000, blue: 0.396),
			Color(red: 0.396, green: 0.498, blue: 1.000),
			Color(red: 1.000, green: 0.396, blue: 1.000),
			Color(red: 0.396, green: 1.000, blue: 1.000),
			Color(red: 0.910, green: 0.898, blue: 0.933),
		],
		ansiBright: [
			Color(red: 0.663, green: 0.663, blue: 0.663),
			Color(red: 1.000, green: 0.459, blue: 0.459),
			Color(red: 0.459, green: 1.000, blue: 0.459),
			Color(red: 1.000, green: 1.000, blue: 0.459),
			Color(red: 0.459, green: 0.624, blue: 1.000),
			Color(red: 1.000, green: 0.459, blue: 1.000),
			Color(red: 0.459, green: 1.000, blue: 1.000),
			Color(red: 1.000, green: 1.000, blue: 1.000),
			Color(red: 0.510, green: 0.510, blue: 0.561),
			Color(red: 1.000, green: 0.616, blue: 0.616),
			Color(red: 0.616, green: 1.000, blue: 0.616),
			Color(red: 1.000, green: 1.000, blue: 0.616),
			Color(red: 0.616, green: 0.733, blue: 1.000),
			Color(red: 1.000, green: 0.616, blue: 1.000),
			Color(red: 0.616, green: 1.000, blue: 1.000),
			Color(red: 1.000, green: 1.000, blue: 1.000),
		]
	)

	static let light: ThemeScheme = ThemeScheme(
		id: "swarm-light",
		name: "Swarm Light",
		kind: .light,
		background: Color(red: 0.980, green: 0.980, blue: 0.984),
		surface: Color(red: 1.000, green: 1.000, blue: 1.000),
		surfaceSecondary: Color(red: 0.941, green: 0.941, blue: 0.945),
		surfaceElevated: Color(red: 1.000, green: 1.000, blue: 1.000),
		border: Color(red: 0.820, green: 0.820, blue: 0.843),
		borderSubtle: Color(red: 0.886, green: 0.886, blue: 0.898),
		textPrimary: [26, 26, 46],
		textSecondary: Color(red: 0.290, green: 0.290, blue: 0.416),
		textTertiary: Color(red: 0.510, green: 0.498, blue: 0.561),
		textDisabled: Color(red: 0.690, green: 0.690, blue: 0.718),
		textInverse: Color(red: 1.000, green: 1.000, blue: 1.000),
		accentPrimary: Color(red: 0.000, green: 0.400, blue: 1.000),
		accentSecondary: Color(red: 0.200, green: 0.522, blue: 1.000),
		accentSuccess: Color(red: 0.063, green: 0.725, blue: 0.506),
		accentWarning: Color(red: 0.961, green: 0.620, blue: 0.043),
		accentError: Color(red: 0.937, green: 0.267, blue: 0.267),
		terminalBackground: Color(red: 0.106, green: 0.106, blue: 0.122),
		terminalText: Color(red: 0.808, green: 0.796, blue: 0.886),
		terminalCursor: Color(red: 0.000, green: 0.400, blue: 1.000),
		terminalSelection: Color(red: 0.000, green: 0.400, blue: 1.000).opacity(0.25),
		terminalBorder: Color(red: 0.769, green: 0.769, blue: 0.788),
		ansiStandard: [
			Color(red: 0.000, green: 0.000, blue: 0.000),
			Color(red: 0.675, green: 0.263, blue: 0.263),
			Color(red: 0.267, green: 0.549, blue: 0.267),
			Color(red: 0.529, green: 0.549, blue: 0.267),
			Color(red: 0.278, green: 0.333, blue: 0.678),
			Color(red: 0.557, green: 0.278, blue: 0.678),
			Color(red: 0.278, green: 0.518, blue: 0.518),
			Color(red: 0.663, green: 0.647, blue: 0.718),
			Color(red: 0.388, green: 0.388, blue: 0.447),
			Color(red: 1.000, green: 0.396, blue: 0.396),
			Color(red: 0.396, green: 1.000, blue: 0.396),
			Color(red: 1.000, green: 1.000, blue: 0.396),
			Color(red: 0.396, green: 0.498, blue: 1.000),
			Color(red: 1.000, green: 0.396, blue: 1.000),
			Color(red: 0.396, green: 1.000, blue: 1.000),
			Color(red: 0.910, green: 0.898, blue: 0.933),
		],
		ansiBright: [
			Color(red: 0.663, green: 0.663, blue: 0.663),
			Color(red: 1.000, green: 0.459, blue: 0.459),
			Color(red: 0.459, green: 1.000, blue: 0.459),
			Color(red: 1.000, green: 1.000, blue: 0.459),
			Color(red: 0.459, green: 0.624, blue: 1.000),
			Color(red: 1.000, green: 0.459, blue: 1.000),
			Color(red: 0.459, green: 1.000, blue: 1.000),
			Color(red: 1.000, green: 1.000, blue: 1.000),
			Color(red: 0.510, green: 0.510, blue: 0.561),
			Color(red: 1.000, green: 0.616, blue: 0.616),
			Color(red: 0.616, green: 1.000, blue: 0.616),
			Color(red: 1.000, green: 1.000, blue: 0.616),
			Color(red: 0.616, green: 0.733, blue: 1.000),
			Color(red: 1.000, green: 0.616, blue: 1.000),
			Color(red: 0.616, green: 1.000, blue: 1.000),
			Color(red: 1.000, green: 1.000, blue: 1.000),
		]
	)

	static let midnight: ThemeScheme = ThemeScheme(
		id: "midnight-ocean",
		name: "Midnight Ocean",
		kind: .midnight,
		background: Color(red: 0.012, green: 0.020, blue: 0.063),
		surface: Color(red: 0.031, green: 0.047, blue: 0.110),
		surfaceSecondary: Color(red: 0.039, green: 0.059, blue: 0.145),
		surfaceElevated: Color(red: 0.051, green: 0.071, blue: 0.169),
		border: Color(red: 0.145, green: 0.192, blue: 0.302),
		borderSubtle: Color(red: 0.090, green: 0.118, blue: 0.196),
		textPrimary: [200, 215, 235],
		textSecondary: Color(red: 0.580, green: 0.647, blue: 0.757),
		textTertiary: Color(red: 0.420, green: 0.498, blue: 0.624),
		textDisabled: Color(red: 0.310, green: 0.380, blue: 0.498),
		textInverse: Color(red: 0.012, green: 0.020, blue: 0.063),
		accentPrimary: Color(red: 0.000, green: 0.851, blue: 1.000),
		accentSecondary: Color(red: 0.278, green: 0.655, blue: 1.000),
		accentSuccess: Color(red: 0.278, green: 0.851, blue: 0.667),
		accentWarning: Color(red: 1.000, green: 0.851, blue: 0.278),
		accentError: Color(red: 1.000, green: 0.369, blue: 0.369),
		terminalBackground: Color(red: 0.004, green: 0.012, blue: 0.039),
		terminalText: Color(red: 0.741, green: 0.800, blue: 0.902),
		terminalCursor: Color(red: 0.000, green: 0.851, blue: 1.000),
		terminalSelection: Color(red: 0.000, green: 0.851, blue: 1.000).opacity(0.3),
		terminalBorder: Color(red: 0.106, green: 0.157, blue: 0.267),
		ansiStandard: [
			Color(red: 0.000, green: 0.000, blue: 0.000),
			Color(red: 0.675, green: 0.263, blue: 0.263),
			Color(red: 0.267, green: 0.549, blue: 0.267),
			Color(red: 0.529, green: 0.549, blue: 0.267),
			Color(red: 0.278, green: 0.333, blue: 0.678),
			Color(red: 0.557, green: 0.278, blue: 0.678),
			Color(red: 0.278, green: 0.518, blue: 0.518),
			Color(red: 0.663, green: 0.647, blue: 0.718),
			Color(red: 0.388, green: 0.388, blue: 0.447),
			Color(red: 1.000, green: 0.396, blue: 0.396),
			Color(red: 0.396, green: 1.000, blue: 0.396),
			Color(red: 1.000, green: 1.000, blue: 0.396),
			Color(red: 0.396, green: 0.498, blue: 1.000),
			Color(red: 1.000, green: 0.396, blue: 1.000),
			Color(red: 0.396, green: 1.000, blue: 1.000),
			Color(red: 0.910, green: 0.898, blue: 0.933),
		],
		ansiBright: [
			Color(red: 0.663, green: 0.663, blue: 0.663),
			Color(red: 1.000, green: 0.459, blue: 0.459),
			Color(red: 0.459, green: 1.000, blue: 0.459),
			Color(red: 1.000, green: 1.000, blue: 0.459),
			Color(red: 0.459, green: 0.624, blue: 1.000),
			Color(red: 1.000, green: 0.459, blue: 1.000),
			Color(red: 0.459, green: 1.000, blue: 1.000),
			Color(red: 1.000, green: 1.000, blue: 1.000),
			Color(red: 0.510, green: 0.510, blue: 0.561),
			Color(red: 1.000, green: 0.616, blue: 0.616),
			Color(red: 0.616, green: 1.000, blue: 0.616),
			Color(red: 1.000, green: 1.000, blue: 0.616),
			Color(red: 0.616, green: 0.733, blue: 1.000),
			Color(red: 1.000, green: 0.616, blue: 1.000),
			Color(red: 0.616, green: 1.000, blue: 1.000),
			Color(red: 1.000, green: 1.000, blue: 1.000),
		]
	)

	// MARK: - All Themes

	static let allThemes: [ThemeScheme] = [dark, light, midnight]

	// MARK: - Lookup

	static func preset(for kind: ThemeKind) -> ThemeScheme? {
		allThemes.first { $0.kind == kind }
	}
}

// MARK: - Theme Token

public enum ThemeToken: String, CaseIterable, Sendable {
	case canvas
	case background
	case surface
	case surfaceHover
	case surfaceActive
	case surfaceRaised
	case surfaceOverlay
	case gold
	case goldHover
	case primary
	case textPrimary
	case textSecondary
	case textTertiary
	case textInverse
	case border
	case borderSubtle
	case borderFocus
	case shadowColor
	case success
	case warning
	case error
	case info
}

// MARK: - ThemeManager

@Observable
public final class ThemeStore: @unchecked Sendable {
	public static let shared = ThemeStore()
	public var currentThemeId: String = "obsidian-charcoal"
	public var themeMode: ThemeMode = .dark

	public var currentTheme: Theme {
		get {
			Theme.theme(for: currentThemeId) ?? Theme.allThemes[0]
		}
		set {
			setTheme(newValue.id)
		}
	}

	public init() {
		if let saved = UserDefaults.standard.string(forKey: "selectedTheme"),
		   let theme = Theme.theme(for: saved) {
			currentThemeId = theme.id
		}
	}

	public func setTheme(_ id: String) {
		if let theme = Theme.theme(for: id) {
			currentThemeId = theme.id
			UserDefaults.standard.set(theme.id, forKey: "selectedTheme")
		} else {
			currentThemeId = id
			UserDefaults.standard.set(id, forKey: "selectedTheme")
		}
	}

	public func cycleTheme() {
		let currentIndex = Theme.allThemes.firstIndex { $0.id == currentThemeId } ?? 0
		let nextIndex = (currentIndex + 1) % Theme.allThemes.count
		setTheme(Theme.allThemes[nextIndex].id)
	}

	public func transitionToTheme(_ id: String, animated: Bool = true) {
		guard animated else {
			setTheme(id)
			return
		}
		withAnimation(.swarmSlow) {
			setTheme(id)
		}
	}

	public var colorScheme: ColorScheme? {
		switch themeMode {
		case .light: return .light
		case .dark: return .dark
		case .system: return nil
		}
	}
}

// MARK: - Theme Mode

public enum ThemeMode: String, CaseIterable, Sendable {
	case system = "System"
	case light = "Light"
	case dark = "Dark"

	public var title: String {
		rawValue
	}
}

// MARK: - Color Helpers

public extension Color {
	init(theme: Theme, token: ThemeToken) {
		let rgb = theme.rgb(for: token)
		self.init(red: rgb[0] / 255.0, green: rgb[1] / 255.0, blue: rgb[2] / 255.0)
	}

	static func from(theme: Theme, themeToken: ThemeToken) -> Color {
		Color(theme: theme, token: themeToken)
	}

	func toHex() -> String {
		guard let nsColor = NSColor(self).usingColorSpace(.sRGB) else { return "#000000" }
		let r = Int(nsColor.redComponent * 255)
		let g = Int(nsColor.greenComponent * 255)
		let b = Int(nsColor.blueComponent * 255)
		return String(format: "#%02X%02X%02X", r, g, b)
	}
}
