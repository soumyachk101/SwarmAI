import SwiftUI

// MARK: - Swarm Semantic Color Accessors

public extension Color {

 // MARK: - Background & Surface

 static var swarmBackground: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .canvas)
 }

 static var swarmSurface: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .surface)
 }

 static var swarmSurfaceHover: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .surfaceHover)
 }

 static var swarmSurfaceActive: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .surfaceActive)
 }

 static var swarmCanvas: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .canvas)
 }

 // MARK: - Borders

 static var swarmBorder: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .border)
 }

 static var swarmBorderSubtle: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .borderSubtle)
 }

 // MARK: - Text

 static var swarmTextPrimary: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .textPrimary)
 }

 static var swarmTextSecondary: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .textSecondary)
 }

 static var swarmTextTertiary: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .textTertiary)
 }

 // MARK: - Accents

 static var swarmGold: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .gold)
 }

 static var swarmAccent: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .accent)
 }

 static var swarmAccentSuccess: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .accentSuccess)
 }

 static var swarmAccentWarning: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .accentWarning)
 }

 static var swarmAccentError: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .accentError)
 }

 // MARK: - Semantic Status Colors

 static var swarmSuccess: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .success)
 }

 static var swarmWarning: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .warning)
 }

 static var swarmError: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .error)
 }

 static var swarmInfo: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .info)
 }

 // MARK: - Terminal

 static var swarmTerminalBackground: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .terminalBackground)
 }

 static var swarmTerminalText: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .terminalText)
 }

 static var swarmTerminalCursor: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .terminalCursor)
 }

 static var swarmTerminalSelection: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .terminalSelection)
 }

 static var swarmTerminalBorder: Color {
	 Color.from(theme: ThemeStore.shared.currentTheme, token: .terminalBorder)
 }

 // MARK: - Tauri Token & Palette Aliases

 static var zinc100: Color { Color(red: 244/255, green: 244/255, blue: 245/255) }
 static var zinc200: Color { Color(red: 228/255, green: 228/255, blue: 231/255) }
 static var zinc300: Color { Color(red: 212/255, green: 212/255, blue: 216/255) }
 static var zinc400: Color { Color(red: 161/255, green: 161/255, blue: 170/255) }
 static var zinc500: Color { Color(red: 113/255, green: 113/255, blue: 122/255) }
 static var swarmOk: Color { Color.swarmSuccess }
 static var swarmWarn: Color { Color.swarmWarning }
 static var swarmErr: Color { Color.swarmError }
 static var swarmGoldHi: Color { Color(red: 240/255, green: 195/255, blue: 110/255) }

 // MARK: - Animation Constants

 static let swarmSlow: Animation = Animation.easeInOut(duration: 0.6)
}
