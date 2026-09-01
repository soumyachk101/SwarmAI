import Foundation
import SwiftUI

/// The type of pane that can be placed in a grid cell.
@frozen
public enum PaneType: String, Codable, Sendable, CaseIterable {
 case agent
 case terminal
 case browser
 case emulator
 case toolbox
 case extension
 case chat

 /// Human-readable display name.
 public var displayName: String {
 rawValue.capitalized
 }

 /// SF Symbol icon for this pane type.
 public var icon: String {
 switch self {
 case .agent: "person.circle.fill"
 case .terminal: "terminal.fill"
 case .browser: "globe"
 case .emulator: "iphone"
 case .toolbox: "wrench.fill"
 case .extension: "puzzlepiece.extension.fill"
 case .chat: "bubble.left.and.bubble.right.fill"
 }
 }
}
