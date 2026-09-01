import SwiftUI

// MARK: - Semantic Color Helpers

extension Color {
 static var swarmCanvas: Color {
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

 static var swarmGold: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .gold)
 }

 static var swarmGoldHover: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .goldHover)
 }

 static var swarmTextPrimary: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .textPrimary)
 }

 static var swarmTextSecondary: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .textSecondary)
 }

 static var swarmTextTertiary: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .textTertiary)
 }

 static var swarmBorder: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .border)
 }

 static var swarmBorderSubtle: Color {
 Color.from(theme: ThemeStore.shared.currentTheme, token: .borderSubtle)
 }

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
}
