import Foundation
import SwiftUI

/// The central model representing an AI coding agent in the swarm.
///
/// Agents are reference types (classes) so that multiple views observe
/// the same mutable state such as terminal output and status changes.
@Observable
public final class Agent: Codable, Identifiable, Hashable, @unchecked Sendable {
 /// Unique identifier for the agent.
 public let id: UUID

 /// Human-readable name assigned to this agent instance.
 public var name: String

 /// The type of AI agent or terminal.
 public var agentType: AgentType

 /// Current lifecycle status of the agent.
 public var status: AgentStatus

 /// The AI model identifier the agent is using (e.g., "claude-sonnet-4-20250514").
 public var model: String

 /// The effort/reasoning level for the agent (e.g., "high", "medium", "low").
 public var effortLevel: String

 /// The initial prompt or task description provided to the agent.
 public var prompt: String?

 /// Path to the git worktree this agent is operating in.
 public var worktree: String?

 /// The tmux pane ID where this agent's terminal is running.
 public var paneId: String?

 /// The role this agent plays in the swarm hierarchy.
 public var role: AgentRole

 /// If the agent is a lead, the operating mode it is using.
 public var leadMode: LeadMode?

 /// The display color associated with this agent instance.
 public var color: Color

 /// When this agent was spawned/created.
 public var spawnTime: Date

 /// When this agent last showed any activity.
 public var lastActivity: Date

 /// Token usage tracking for this agent session.
 public var tokenUsage: TokenUsage

 /// Ring buffer of terminal output lines, capped at `maxOutputLines`.
 public var terminalOutput: [String]

 /// Maximum number of lines to retain in the terminal output buffer.
 public static let maxOutputLines: Int = 10_000

 /// The exit code from the agent process, if it has terminated.
 public var exitCode: Int?

 // MARK: - Codable

 private enum CodingKeys: String, CodingKey {
 case id
 case name
 case agentType
 case status
 case model
 case effortLevel
 case prompt
 case worktree
 case paneId
 case role
 case leadMode
 case colorHex = "color"
 case spawnTime
 case lastActivity
 case tokenUsage
 case terminalOutput
 case exitCode
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 name = try container.decode(String.self, forKey: .name)
 agentType = try container.decode(AgentType.self, forKey: .agentType)
 status = try container.decode(AgentStatus.self, forKey: .status)
 model = try container.decode(String.self, forKey: .model)
 effortLevel = try container.decode(String.self, forKey: .effortLevel)
 prompt = try container.decodeIfPresent(String.self, forKey: .prompt)
 worktree = try container.decodeIfPresent(String.self, forKey: .worktree)
 paneId = try container.decodeIfPresent(String.self, forKey: .paneId)
 role = try container.decode(AgentRole.self, forKey: .role)
 leadMode = try container.decodeIfPresent(LeadMode.self, forKey: .leadMode)

 let colorHex = try container.decode(String.self, forKey: .colorHex)
 color = Color(hex: colorHex) ?? .gray

 spawnTime = try container.decode(Date.self, forKey: .spawnTime)
 lastActivity = try container.decode(Date.self, forKey: .lastActivity)
 tokenUsage = try container.decode(TokenUsage.self, forKey: .tokenUsage)
 terminalOutput = try container.decode([String].self, forKey: .terminalOutput)
 exitCode = try container.decodeIfPresent(Int.self, forKey: .exitCode)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(name, forKey: .name)
 try container.encode(agentType, forKey: .agentType)
 try container.encode(status, forKey: .status)
 try container.encode(model, forKey: .model)
 try container.encode(effortLevel, forKey: .effortLevel)
 try container.encodeIfPresent(prompt, forKey: .prompt)
 try container.encodeIfPresent(worktree, forKey: .worktree)
 try container.encodeIfPresent(paneId, forKey: .paneId)
 try container.encode(role, forKey: .role)
 try container.encodeIfPresent(leadMode, forKey: .leadMode)
 try container.encode(color.toHex(), forKey: .colorHex)
 try container.encode(spawnTime, forKey: .spawnTime)
 try container.encode(lastActivity, forKey: .lastActivity)
 try container.encode(tokenUsage, forKey: .tokenUsage)

 // Enforce ring buffer limit before encoding.
 let trimmed = Array(terminalOutput.suffix(Self.maxOutputLines))
 try container.encode(trimmed, forKey: .terminalOutput)

 try container.encodeIfPresent(exitCode, forKey: .exitCode)
 }

 // MARK: - Init

 /// Create a new agent instance.
 public init(
 id: UUID = UUID(),
 name: String,
 agentType: AgentType,
 status: AgentStatus = .idle,
 model: String = "",
 effortLevel: String = "medium",
 prompt: String? = nil,
 worktree: String? = nil,
 paneId: String? = nil,
 role: AgentRole = .follower,
 leadMode: LeadMode? = nil,
 color: Color? = nil,
 spawnTime: Date = Date(),
 lastActivity: Date = Date(),
 tokenUsage: TokenUsage = TokenUsage(),
 terminalOutput: [String] = [],
 exitCode: Int? = nil
 ) {
 self.id = id
 self.name = name
 self.agentType = agentType
 self.status = status
 self.model = model
 self.effortLevel = effortLevel
 self.prompt = prompt
 self.worktree = worktree
 self.paneId = paneId
 self.role = role
 self.leadMode = leadMode
 self.color = color ?? agentType.brandColor
 self.spawnTime = spawnTime
 self.lastActivity = lastActivity
 self.tokenUsage = tokenUsage
 self.terminalOutput = terminalOutput
 self.exitCode = exitCode
 }

 // MARK: - Hashable

 public static func == (lhs: Agent, rhs: Agent) -> Bool {
 lhs.id == rhs.id
 }

 public func hash(into hasher: inout Hasher) {
 hasher.combine(id)
 }

 // MARK: - Terminal Output

 /// Append a new line to the terminal output ring buffer.
 public func appendOutput(_ line: String) {
 terminalOutput.append(line)
 if terminalOutput.count > Self.maxOutputLines {
 terminalOutput.removeFirst(terminalOutput.count - Self.maxOutputLines)
 }
 lastActivity = Date()
 }

 /// Clear the terminal output buffer.
 public func clearOutput() {
 terminalOutput.removeAll(keepingCapacity: true)
 }

 /// Update token usage incrementally.
 public func updateTokenUsage(input: Int, output: Int) {
 tokenUsage.input += input
 tokenUsage.output += output
 lastActivity = Date()
 }
}
