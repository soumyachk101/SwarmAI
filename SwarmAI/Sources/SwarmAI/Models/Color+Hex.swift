import Foundation
import SwiftUI

/// Extensions on `Color` for hex-based initialization and serialization.
public extension Color {
 /// Initialize a Color from a hex string (e.g., "#FF6B6B" or "FF6B6B").
 init?(hex: String) {
 var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
 hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

 guard hexSanitized.count == 6,
 let hexValue = UInt64(hexSanitized, radix: 16) else {
 return nil
 }

 let red = Double((hexValue & 0xFF0000) >> 16) / 255.0
 let green = Double((hexValue & 0x00FF00) >> 8) / 255.0
 let blue = Double(hexValue & 0x0000FF) / 255.0

 self.init(.sRGB, red: red, green: green, blue: blue, opacity: 1.0)
 }

 /// Convert the color to a hex string in the format "RRGGBB".
 func toHex() -> String {
 #if os(iOS) || os(tvOS) || os(watchOS)
 let uiColor = UIColor(self)
 var red: CGFloat = 0
 var green: CGFloat = 0
 var blue: CGFloat = 0
 var alpha: CGFloat = 0
 uiColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
 let r = Int(red * 255.0)
 let g = Int(green * 255.0)
 let b = Int(blue * 255.0)
 return String(format: "%02X%02X%02X", r, g, b)
 #elseif os(macOS)
 let nsColor = NSColor(self)
 var red: CGFloat = 0
 var green: CGFloat = 0
 var blue: CGFloat = 0
 var alpha: CGFloat = 0
 nsColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
 let r = Int(red * 255.0)
 let g = Int(green * 255.0)
 let b = Int(blue * 255.0)
 return String(format: "%02X%02X%02X", r, g, b)
 #else
 // Fallback: attempt cgColor components
 if let components = self.cgColor?.components, components.count >= 3 {
 let r = Int((components[0] * 255.0).rounded())
 let g = Int((components[1] * 255.0).rounded())
 let b = Int((components[2] * 255.0).rounded())
 return String(format: "%02X%02X%02X", r, g, b)
 }
 return "000000"
 #endif
 }
}
