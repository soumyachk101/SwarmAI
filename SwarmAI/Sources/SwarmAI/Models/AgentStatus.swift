import Foundation
import SwiftUI

/// The status of an agent during its lifecycle.
@frozen
public enum AgentStatus: String, Codable, Sendable {
 case idle
 case launching
 case running
 case error
 case done
 case terminating

 /// Human-readable display name for the status.
 public var displayName: String {
 rawValue.capitalized
 }

 /// Whether the agent is currently active and processing.
 public var isActive: Bool {
 self == .launching || self == .running
 }

 /// Whether the agent has finished its work.
 public var isFinished: Bool {
 self == .done || self == .error || self == .terminating
 }

 /// Status display color.
 public var color: Color {
   switch self {
   case .idle: .swarmTextTertiary
   case .launching, .running: .swarmSuccess
   case .error: .swarmError
   case .done: .swarmGold
   case .terminating: .swarmWarning
   }
 }
}

/// The role of an agent in the swarm hierarchy.
@frozen
public enum AgentRole: String, Codable, Sendable {
 case follower
 case lead

 /// Human-readable display name for the role.
 public var displayName: String {
 rawValue.capitalized
 }
}

/// The operating mode for lead agents.
@frozen
public enum LeadMode: String, Codable, Sendable, CaseIterable, Identifiable {
  public var id: String { rawValue }
  case steward
  case forager
  case stinger

 /// Human-readable display name for the lead mode.
 public var displayName: String {
 rawValue.capitalized
 }

 /// Brief description of what this mode does.
 public var description: String {
 switch self {
 case .steward:
 "Manages overall coordination and task distribution."
 case .forager:
 "Explores and gathers information independently."
 case .stinger:
 "Focused on completing a specific, critical task."
 }
 }
}

/// Supported AI coding agents and terminals.
@frozen
public enum AgentType: String, Codable, Sendable, CaseIterable, Identifiable {
 public var id: String { rawValue }
 case claudeCode = "claude_code"
 case codex
 case aider
 case cursor
 case openCode = "open_code"
 case cline
 case kilo
 case kimiCode = "kimi_code"
 case kiro
 case antigravity
 case plainTerminal = "plain_terminal"
 case geminiCli = "gemini_cli"
 case deepSeek = "deep_seek"
 case grok
 case droid

 /// Human-readable display name.
 public var displayName: String {
 switch self {
 case .claudeCode: "Claude Code"
 case .codex: "Codex"
 case .aider: "Aider"
 case .cursor: "Cursor"
 case .openCode: "OpenCode"
 case .cline: "Cline"
 case .kilo: "Kilo"
 case .kimiCode: " Code"
 case .kiro: "Kiro"
 case .antigravity: "Antigravity"
 case .plainTerminal: "Terminal"
 case .geminiCli: "Gemini CLI"
 case .deepSeek: "DeepSeek"
 case .grok: "Grok"
 case .droid: "Droid"
 }
 }

 /// SF Symbol icon name for this agent type.
 public var icon: String {
 switch self {
 case .claudeCode: "brain.head.profile"
 case .codex: "curlybraces"
 case .aider: "text.quote.bubble"
 case .cursor: "cursor.rays"
 case .openCode: "chevron.left.forwardslash.chevron.right"
 case .cline: "bubble.left.and.bubble.right"
 case .kilo: "bolt.fill"
 case .kimiCode: "star.fill"
 case .kiro: "pencil.tip"
 case .antigravity: "airplane"
 case .plainTerminal: "terminal.fill"
 case .geminiCli: "sparkles"
 case .deepSeek: "magnifyingglass"
 case .grok: "waveform.path"
 case .droid: "iphone"
 }
 }

 /// Brand color for this agent type (matching simple-icons palette).
 public var brandColor: Color {
   switch self {
   case .claudeCode: Color(hex: "#D97757") ?? .orange // Anthropic orange
   case .codex: Color(hex: "#1A1A2E") ?? .gray // OpenAI black
   case .aider: Color(hex: "#7654B4") ?? .purple // Aider purple
   case .cursor: Color(hex: "#1A1A2E") ?? .gray // Cursor dark
   case .openCode: Color(hex: "#4A90D9") ?? .blue // OpenCode blue
   case .cline: Color(hex: "#9B59B6") ?? .purple // Cline purple
   case .kilo: Color(hex: "#FFD700") ?? .yellow // Kilo gold
   case .kimiCode: Color(hex: "#1A1A2E") ?? .gray // dark
   case .kiro: Color(hex: "#6C5CE7") ?? .indigo // Kiro indigo
   case .antigravity: Color(hex: "#FF6B6B") ?? .red // Antigravity red
   case .plainTerminal: Color(hex: "#2D2D2D") ?? .gray // Terminal dark gray
   case .geminiCli: Color(hex: "#4285F4") ?? .blue // Google blue
   case .deepSeek: Color(hex: "#0066FF") ?? .blue // DeepSeek blue
   case .grok: Color(hex: "#1DA1F2") ?? .blue // Grok/X blue
   case .droid: Color(hex: "#00FF88") ?? .green // Droid green
   }
 }

 /// Brand colors dictionary for all agent types.
 public static let brandColors: [AgentType: Color] = {
 var dict: [AgentType: Color] = [:]
 for type in AgentType.allCases {
 dict[type] = type.brandColor
 }
 return dict
 }()
}

/// Token usage metrics for an agent.
public struct TokenUsage: Codable, Sendable {
 public var input: Int
 public var output: Int
 public var total: Int {
 input + output
 }

 public init(input: Int = 0, output: Int = 0) {
 self.input = input
 self.output = output
 }

 /// Reset all counters to zero.
 public mutating func reset() {
 input = 0
 output = 0
 }
}
