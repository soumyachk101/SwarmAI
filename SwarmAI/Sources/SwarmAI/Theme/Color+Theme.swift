import SwiftUI
import Foundation

// MARK: - Swarm Semantic Color Accessors

public extension Color {

 // MARK: - Background & Surface

 static func swarmBackground(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.background ?? Theme.dark.background
 }

 static func swarmSurface(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.surface ?? Theme.dark.surface
 }

 static func swarmSurfaceSecondary(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.surfaceSecondary ?? Theme.dark.surfaceSecondary
 }

 static func swarmSurfaceElevated(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.surfaceElevated ?? Theme.dark.surfaceElevated
 }

 // MARK: - Borders

 static func swarmBorder(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.border ?? Theme.dark.border
 }

 static func swarmBorderSubtle(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.borderSubtle ?? Theme.dark.borderSubtle
 }

 // MARK: - Text

 static func swarmTextPrimary(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.primaryText ?? Theme.dark.primaryText
 }

 static func swarmTextSecondary(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.textSecondary ?? Theme.dark.textSecondary
 }

 static func swarmTextTertiary(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.textTertiary ?? Theme.dark.textTertiary
 }

 // MARK: - Accents

 static func swarmAccent(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.accent ?? Theme.dark.accent
 }

 static func swarmAccentSuccess(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.accentSuccess ?? Theme.dark.accentSuccess
 }

 static func swarmAccentWarning(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.accentWarning ?? Theme.dark.accentWarning
 }

 static func swarmAccentError(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.accentError ?? Theme.dark.accentError
 }

 // MARK: - Terminal

 static func swarmTerminalBackground(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.terminalBackground ?? Theme.dark.terminalBackground
 }

 static func swarmTerminalText(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.terminalText ?? Theme.dark.terminalText
 }

 static func swarmTerminalCursor(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.terminalCursor ?? Theme.dark.terminalCursor
 }

 static func swarmTerminalSelection(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.terminalSelection ?? Theme.dark.terminalSelection
 }

 static func swarmTerminalBorder(for theme: ThemeKind = .dark) -> Color {
 Theme.preset(for: theme)?.terminalBorder ?? Theme.dark.terminalBorder
 }
}

// MARK: - Convenience Static Computed Properties (default .dark)

public extension Color {

 static var swarmBackground: Color { swarmBackground() }
 static var swarmSurface: Color { swarmSurface() }
 static var swarmSurfaceSecondary: Color { swarmSurfaceSecondary() }
 static var swarmSurfaceElevated: Color { swarmSurfaceElevated() }
 static var swarmBorder: Color { swarmBorder() }
 static var swarmBorderSubtle: Color { swarmBorderSubtle() }
 static var swarmTextPrimary: Color { swarmTextPrimary() }
 static var swarmTextSecondary: Color { swarmTextSecondary() }
 static var swarmTextTertiary: Color { swarmTextTertiary() }
 static var swarmAccent: Color { swarmAccent() }
 static var swarmAccentSuccess: Color { swarmAccentSuccess() }
 static var swarmAccentWarning: Color { swarmAccentWarning() }
 static var swarmAccentError: Color { swarmAccentError() }
 static var swarmTerminalBackground: Color { swarmTerminalBackground() }
 static var swarmTerminalText: Color { swarmTerminalText() }
 static var swarmTerminalCursor: Color { swarmTerminalCursor() }
 static var swarmTerminalSelection: Color { swarmTerminalSelection() }
 static var swarmTerminalBorder: Color { swarmTerminalBorder() }
}
