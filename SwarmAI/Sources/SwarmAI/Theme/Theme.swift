import SwiftUI

// MARK: - Theme Protocol

struct Theme: Identifiable, Codable, Hashable, CaseIterable {
 let id: String
 let displayName: String
 let description: String
 let colors: ThemeColors

 struct ThemeColors: Codable, Hashable {
 let canvas: [Double] // RGB 0-255
 let surface: [Double]
 let surfaceHover: [Double]
 let surfaceActive: [Double]
 let gold: [Double]
 let goldHover: [Double]
 let textPrimary: [Double]
 let textSecondary: [Double]
 let textTertiary: [Double]
 let border: [Double]
 let borderSubtle: [Double]
 let success: [Double]
 let warning: [Double]
 let error: [Double]
 let info: [Double]
 }

 func color(for token: ThemeToken) -> Color {
 let rgb = rgb(for: token)
 return Color(red: rgb[0], green: rgb[1], blue: rgb[2])
 }

 func rgb(for token: ThemeToken) -> [Double] {
 switch token {
 case .canvas: return colors.canvas
 case .surface: return colors.surface
 case .surfaceHover: return colors.surfaceHover
 case .surfaceActive: return colors.surfaceActive
 case .gold: return colors.gold
 case .goldHover: return colors.goldHover
 case .textPrimary: return colors.textPrimary
 case .textSecondary: return colors.textSecondary
 case .textTertiary: return colors.textTertiary
 case .border: return colors.border
 case .borderSubtle: return colors.borderSubtle
 case .success: return colors.success
 case .warning: return colors.warning
 case .error: return colors.error
 case .info: return colors.info
 }
 }

 static let allThemes: [Theme] = [
 Theme(
 id: "obsidian-charcoal",
 displayName: "Obsidian Charcoal",
 description: "Default dark theme with gold accents",
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

 static func theme(for id: String) -> Theme? {
 allThemes.first { $0.id == id }
 }
}

// MARK: - Theme Token

enum ThemeToken: String, CaseIterable {
 case canvas
 case surface
 case surfaceHover
 case surfaceActive
 case gold
 case goldHover
 case textPrimary
 case textSecondary
 case textTertiary
 case border
 case borderSubtle
 case success
 case warning
 case error
 case info
}

// MARK: - ThemeManager

@Observable
final class ThemeStore {
 var currentThemeId: String = "obsidian-charcoal"
 var themeMode: ThemeMode = .dark

 var currentTheme: Theme {
 Theme.theme(for: currentThemeId) ?? Theme.allThemes[0]
 }

 init() {
 if let saved = UserDefaults.standard.string(forKey: "selectedTheme"),
 let theme = Theme.theme(for: saved) {
 currentThemeId = saved
 }
 }

 func setTheme(_ id: String) {
 currentThemeId = id
 UserDefaults.standard.set(id, forKey: "selectedTheme")
 }

 func cycleTheme() {
 let currentIndex = Theme.allThemes.firstIndex { $0.id == currentThemeId } ?? 0
 let nextIndex = (currentIndex + 1) % Theme.allThemes.count
 setTheme(Theme.allThemes[nextIndex].id)
 }

 var colorScheme: ColorScheme? {
 switch themeMode {
 case .light: return .light
 case .dark: return .dark
 case .system: return nil
 }
 }
}

// MARK: - Theme Mode

enum ThemeMode: String, CaseIterable {
 case system = "System"
 case light = "Light"
 case dark = "Dark"
}

// MARK: - Color Helpers

extension Color {
 init(theme: Theme, token: ThemeToken) {
 let rgb = theme.rgb(for: token)
 self.init(red: rgb[0] / 255.0, green: rgb[1] / 255.0, blue: rgb[2] / 255.0)
 }

 static func from(theme: Theme, token: ThemeToken) -> Color {
 Color(theme: theme, token: token)
 }

 init(hex: String) {
 let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
 var int: UInt64 = 0
 Scanner(string: hex).scanHexInt64(&int)
 let r = Double((int >> 16) & 0xFF) / 255.0
 let g = Double((int >> 8) & 0xFF) / 255.0
 let b = Double(int & 0xFF) / 255.0
 self.init(red: r, green: g, blue: b)
 }

 func toHex() -> String {
 let components = UIColor(self).cgColor.components!
 let r = Int(components[0] * 255)
 let g = Int(components[1] * 255)
 let b = Int(components[2] * 255)
 return String(format: "#%02X%02X%02X", r, g, b)
 }
}
