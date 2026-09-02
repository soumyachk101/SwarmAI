import Foundation
import SwiftUI

/// A terminal session associated with an agent.
///
/// Terminal sessions track the shell state, command history, and
/// output for an agent's terminal pane. Output is stored as a ring
/// buffer to prevent unbounded memory growth.
@Observable
public final class TerminalSession: Codable, Identifiable {
 /// Unique identifier for the terminal session.
 public let id: UUID

 /// The agent this terminal session belongs to.
 public var agentId: UUID

 /// Current working directory of the terminal.
 public var cwd: String

 /// History of executed commands.
 public var commandHistory: [String]

 /// Ring buffer of terminal output lines.
 public var outputBuffer: [String]

 /// Maximum number of lines retained in the output buffer.
 public var scrollbackLimit: Int

 /// Current scroll position in the output buffer (0 = bottom/latest).
 public var currentScrollPosition: Int

 /// Environment variables for the terminal session.
 public var environment: [String: String]

 // MARK: - Codable

 private enum CodingKeys: String, CodingKey {
 case id
 case agentId
 case cwd
 case commandHistory
 case outputBuffer
 case scrollbackLimit
 case currentScrollPosition
 case environment
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 agentId = try container.decode(UUID.self, forKey: .agentId)
 cwd = try container.decode(String.self, forKey: .cwd)
 commandHistory = try container.decode([String].self, forKey: .commandHistory)
 outputBuffer = try container.decode([String].self, forKey: .outputBuffer)
 scrollbackLimit = try container.decode(Int.self, forKey: .scrollbackLimit)
 currentScrollPosition = try container.decode(Int.self, forKey: .currentScrollPosition)
 environment = try container.decode([String: String].self, forKey: .environment)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(agentId, forKey: .agentId)
 try container.encode(cwd, forKey: .cwd)
 try container.encode(commandHistory, forKey: .commandHistory)

 // Enforce ring buffer limit before encoding.
 let trimmed = Array(outputBuffer.suffix(scrollbackLimit))
 try container.encode(trimmed, forKey: .outputBuffer)

 try container.encode(scrollbackLimit, forKey: .scrollbackLimit)
 try container.encode(currentScrollPosition, forKey: .currentScrollPosition)
 try container.encode(environment, forKey: .environment)
 }

 // MARK: - Init

 /// Create a new terminal session.
 public init(
 id: UUID = UUID(),
 agentId: UUID,
 cwd: String = "~",
 commandHistory: [String] = [],
 outputBuffer: [String] = [],
 scrollbackLimit: Int = 10_000,
 currentScrollPosition: Int = 0,
 environment: [String: String] = [:]
 ) {
 self.id = id
 self.agentId = agentId
 self.cwd = cwd
 self.commandHistory = commandHistory
 self.outputBuffer = outputBuffer
 self.scrollbackLimit = scrollbackLimit
 self.currentScrollPosition = currentScrollPosition
 self.environment = environment
 }

 // MARK: - Output Management

 /// Append output to the terminal session, enforcing ring buffer limits.
 public func appendOutput(_ line: String) {
 outputBuffer.append(line)
 if outputBuffer.count > scrollbackLimit {
 outputBuffer.removeFirst(outputBuffer.count - scrollbackLimit)
 }
 }

 /// Append a command to history and clear the output buffer for fresh output.
 public func executeCommand(_ command: String) {
 commandHistory.append(command)
 outputBuffer.removeAll(keepingCapacity: true)
 currentScrollPosition = 0
 }

 /// Clear the terminal output buffer.
 public func clear() {
 outputBuffer.removeAll(keepingCapacity: true)
 currentScrollPosition = 0
 }
}
