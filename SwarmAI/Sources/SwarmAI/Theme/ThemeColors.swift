import SwiftUI

// MARK: - Semantic Color Helpers

public extension Color {
	// MARK: - Animation Constants

	static let swarmSlow: Animation = Animation.easeInOut(duration: 0.6)

	// MARK: - Semantic Color Helpers

	public static var swarmCanvas: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .canvas)
	}

	public static var swarmSurface: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .surface)
	}

	public static var swarmSurfaceHover: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .surfaceHover)
	}

	public static var swarmSurfaceActive: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .surfaceActive)
	}

	public static var swarmGold: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .gold)
	}

	public static var swarmGoldHover: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .goldHover)
	}

	public static var swarmTextPrimary: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .textPrimary)
	}

	public static var swarmTextSecondary: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .textSecondary)
	}

	public static var swarmTextTertiary: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .textTertiary)
	}

	public static var swarmBorder: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .border)
	}

	public static var swarmBorderSubtle: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .borderSubtle)
	}

	public static var swarmSuccess: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .success)
	}

	public static var swarmWarning: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .warning)
	}

	public static var swarmError: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .error)
	}

	public static var swarmInfo: Color {
		Color.from(theme: ThemeStore.shared.currentTheme, token: .info)
	}
}

extension ShapeStyle where Self == Color {
  public static var swarmCanvas: Color { Color.swarmCanvas }
  public static var swarmSurface: Color { Color.swarmSurface }
  public static var swarmSurfaceHover: Color { Color.swarmSurfaceHover }
  public static var swarmSurfaceActive: Color { Color.swarmSurfaceActive }
  public static var swarmGold: Color { Color.swarmGold }
  public static var swarmGoldHover: Color { Color.swarmGoldHover }
  public static var swarmTextPrimary: Color { Color.swarmTextPrimary }
  public static var swarmTextSecondary: Color { Color.swarmTextSecondary }
  public static var swarmTextTertiary: Color { Color.swarmTextTertiary }
  public static var swarmBorder: Color { Color.swarmBorder }
  public static var swarmBorderSubtle: Color { Color.swarmBorderSubtle }
  public static var swarmSuccess: Color { Color.swarmSuccess }
  public static var swarmWarning: Color { Color.swarmWarning }
  public static var swarmError: Color { Color.swarmError }
  public static var swarmInfo: Color { Color.swarmInfo }
}
