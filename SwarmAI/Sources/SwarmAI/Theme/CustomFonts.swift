import SwiftUI

// MARK: - Font Scale

enum SwarmFontSize: CGFloat, CaseIterable {
 case micro = 10
 case mini = 11
 case xs = 12
 case sm = 13
 case base = 14
 case lg = 16
 case xl = 19
 case xxl = 23
}

// MARK: - Font Extension

extension Font {
 static func swarm(_ size: SwarmFontSize = .base, weight: Font.Weight = .regular) -> Font {
 .system(size: size.rawValue, weight: weight)
 }

 static func swarmMono(_ size: SwarmFontSize = .base, weight: Font.Weight = .regular) -> Font {
 .system(size: size.rawValue, weight: weight, design: .monospaced)
 }
}

// MARK: - Line Height Helper

extension View {
 func swarmLineHeight(_ size: SwarmFontSize) -> some View {
 let lineHeight: CGFloat
 switch size {
 case .micro: lineHeight = 14
 case .mini: lineHeight = 15
 case .xs: lineHeight = 16
 case .sm: lineHeight = 17
 case .base: lineHeight = 19
 case .lg: lineHeight = 22
 case .xl: lineHeight = 26
 case .xxl: lineHeight = 32
 }
 return self.lineSpacing(lineHeight - size.rawValue)
 }
}
