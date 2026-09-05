import SwiftUI

// MARK: - Theme Color Tokens

public struct ThemeColorToken: Sendable {

 public let rawValue: String

 public init(_ rawValue: String) {
	 self.rawValue = rawValue
 }

 // MARK: - Standard Tokens

 public static let canvas = ThemeColorToken("canvas")
 public static let surface = ThemeColorToken("surface")
 public static let surfaceHover = ThemeColorToken("surfaceHover")
 public static let surfaceActive = ThemeColorToken("surfaceActive")
 public static let gold = ThemeColorToken("gold")
 public static let goldHover = ThemeColorToken("goldHover")
 public static let textPrimary = ThemeColorToken("textPrimary")
 public static let textSecondary = ThemeColorToken("textSecondary")
 public static let textTertiary = ThemeColorToken("textTertiary")
 public static let border = ThemeColorToken("border")
 public static let borderSubtle = ThemeColorToken("borderSubtle")
 public static let success = ThemeColorToken("success")
 public static let warning = ThemeColorToken("warning")
 public static let error = ThemeColorToken("error")
 public static let info = ThemeColorToken("info")
 public static let accent = ThemeColorToken("accent")
 public static let accentSuccess = ThemeColorToken("accentSuccess")
 public static let accentWarning = ThemeColorToken("accentWarning")
 public static let accentError = ThemeColorToken("accentError")
 public static let shadowColor = ThemeColorToken("shadowColor")

 // MARK: - Terminal Tokens

 public static let terminalBackground = ThemeColorToken("terminalBackground")
 public static let terminalText = ThemeColorToken("terminalText")
 public static let terminalCursor = ThemeColorToken("terminalCursor")
 public static let terminalSelection = ThemeColorToken("terminalSelection")
 public static let terminalBorder = ThemeColorToken("terminalBorder")

 // MARK: - Resolution

 public func resolve(in theme: Theme) -> Color {
	 switch rawValue {
	 case "canvas": return theme.color(for: .canvas)
	 case "surface": return theme.color(for: .surface)
	 case "surfaceHover": return theme.color(for: .surfaceHover)
	 case "surfaceActive": return theme.color(for: .surfaceActive)
	 case "gold": return theme.color(for: .gold)
	 case "goldHover": return theme.color(for: .goldHover)
	 case "textPrimary": return theme.color(for: .textPrimary)
	 case "textSecondary": return theme.color(for: .textSecondary)
	 case "textTertiary": return theme.color(for: .textTertiary)
	 case "border": return theme.color(for: .border)
	 case "borderSubtle": return theme.color(for: .borderSubtle)
	 case "success": return theme.color(for: .success)
	 case "warning": return theme.color(for: .warning)
	 case "error": return theme.color(for: .error)
	 case "info": return theme.color(for: .info)
	 case "accent": return theme.color(for: .primary)
	 case "accentSuccess": return theme.color(for: .success)
	 case "accentWarning": return theme.color(for: .warning)
	 case "accentError": return theme.color(for: .error)
	 case "terminalBackground": return theme.color(for: .canvas)
	 case "terminalText": return theme.color(for: .textPrimary)
	 case "terminalCursor": return theme.color(for: .gold)
	 case "terminalSelection": return theme.color(for: .gold).opacity(0.3)
	 case "terminalBorder": return theme.color(for: .border)
	 case "shadowColor": return theme.color(for: .shadowColor)
	 default: return theme.color(for: .surface)
	 }
 }
}

// MARK: - Color.from(theme:token:) helper

public extension Color {

 static func from(theme: Theme, token: ThemeColorToken) -> Color {
	 token.resolve(in: theme)
 }
}
