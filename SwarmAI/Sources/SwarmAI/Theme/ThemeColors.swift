import SwiftUI

// MARK: - ShapeStyle Compatibility Layer

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
