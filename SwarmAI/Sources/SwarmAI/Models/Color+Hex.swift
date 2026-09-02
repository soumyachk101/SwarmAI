import AppKit
import Foundation
import SwiftUI

public extension Color {
    /// Initialize a SwiftUI Color from a hexadecimal string.
    /// Supports formats: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA` (with or without `#`).
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexSanitized.hasPrefix("#") {
            hexSanitized.removeFirst()
        }

        var rgbValue: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgbValue) else {
            return nil
        }

        let length = hexSanitized.count
        let red: Double
        let green: Double
        let blue: Double
        let alpha: Double

        switch length {
        case 3: // RGB (12-bit)
            red = Double((rgbValue >> 8) & 0xF) / 15.0
            green = Double((rgbValue >> 4) & 0xF) / 15.0
            blue = Double(rgbValue & 0xF) / 15.0
            alpha = 1.0
        case 4: // RGBA (16-bit)
            red = Double((rgbValue >> 12) & 0xF) / 15.0
            green = Double((rgbValue >> 8) & 0xF) / 15.0
            blue = Double((rgbValue >> 4) & 0xF) / 15.0
            alpha = Double(rgbValue & 0xF) / 15.0
        case 6: // RRGGBB (24-bit)
            red = Double((rgbValue >> 16) & 0xFF) / 255.0
            green = Double((rgbValue >> 8) & 0xFF) / 255.0
            blue = Double(rgbValue & 0xFF) / 255.0
            alpha = 1.0
        case 8: // RRGGBBAA (32-bit)
            red = Double((rgbValue >> 24) & 0xFF) / 255.0
            green = Double((rgbValue >> 16) & 0xFF) / 255.0
            blue = Double((rgbValue >> 8) & 0xFF) / 255.0
            alpha = Double(rgbValue & 0xFF) / 255.0
        default:
            return nil
        }

        self.init(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
    }

    /// Initialize a SwiftUI Color from a 24-bit integer hex value (e.g. 0xFF7700).
    init(hex: UInt32, alpha: Double = 1.0) {
        let red = Double((hex >> 16) & 0xFF) / 255.0
        let green = Double((hex >> 8) & 0xFF) / 255.0
        let blue = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
    }

    /// Convert the Color to a 6-character or 8-character hex string.
    func toHex(includeAlpha: Bool = false) -> String {
        let nsColor = NSColor(self)
        guard let srgbColor = nsColor.usingColorSpace(.sRGB) else {
            return "000000"
        }

        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        srgbColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)

        let r = Int(round(red * 255.0))
        let g = Int(round(green * 255.0))
        let b = Int(round(blue * 255.0))
        let a = Int(round(alpha * 255.0))

        if includeAlpha {
            return String(format: "%02X%02X%02X%02X", r, g, b, a)
        } else {
            return String(format: "%02X%02X%02X", r, g, b)
        }
    }

    /// Linearly interpolate between this color and another color by a given fraction (0.0 to 1.0).
    func interpolate(to target: Color, fraction: Double) -> Color {
        let clamped = min(max(fraction, 0.0), 1.0)
        let c1 = NSColor(self).usingColorSpace(.sRGB) ?? NSColor(self)
        let c2 = NSColor(target).usingColorSpace(.sRGB) ?? NSColor(target)

        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0

        c1.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        c2.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)

        let r = r1 + (r2 - r1) * CGFloat(clamped)
        let g = g1 + (g2 - g1) * CGFloat(clamped)
        let b = b1 + (b2 - b1) * CGFloat(clamped)
        let a = a1 + (a2 - a1) * CGFloat(clamped)

        return Color(.sRGB, red: Double(r), green: Double(g), blue: Double(b), opacity: Double(a))
    }

    /// Alias for `interpolate(to:fraction:)` using parameter `by:`.
    func interpolate(to target: Color, by fraction: Double) -> Color {
        interpolate(to: target, fraction: fraction)
    }
}
