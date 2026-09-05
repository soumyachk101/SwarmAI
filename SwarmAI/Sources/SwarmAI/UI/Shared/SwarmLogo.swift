import SwiftUI
import AppKit

// MARK: - Swarm Logo

public enum SwarmLogoVariant {
 case iconOnly
 case iconWithText
 case full
}

public struct SwarmLogo: View {
 public var variant: SwarmLogoVariant = .iconWithText
 public var iconSize: CGFloat = 28
 public var textSize: CGFloat = 16
 public var showGlow: Bool = true

 public init(
 variant: SwarmLogoVariant = .iconWithText,
 iconSize: CGFloat = 28,
 textSize: CGFloat = 16,
 showGlow: Bool = true
 ) {
 self.variant = variant
 self.iconSize = iconSize
 self.textSize = textSize
 self.showGlow = showGlow
 }

 public var body: some View {
 HStack(spacing: 8) {
 iconView
 if variant != .iconOnly {
 textView
 }
 }
 }

 private var iconView: some View {
 Image(systemName: "ant.fill")
 .font(.system(size: iconSize))
 .foregroundStyle(Color.swarmGold)
 .shadow(
 color: showGlow ? Color.swarmGold.opacity(0.3) : .clear,
 radius: showGlow ? 6 : 0,
 x: 0,
 y: 2
 )
 }

 private var textView: some View {
 VStack(alignment: .leading, spacing: 0) {
 Text("SwarmAI")
 .font(.swarm(.base, weight: .semibold))
 .foregroundStyle(Color.swarmTextPrimary)

 if variant == .full {
 Text("Agent Swarm Platform")
 .font(.swarm(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 }
 }
 }
}
