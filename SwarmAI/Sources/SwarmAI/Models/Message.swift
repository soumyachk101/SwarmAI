import Foundation
import SwiftUI

/// Types of messages exchanged between agents in the swarm.
@frozen
public enum MessageType: String, Codable, Sendable, CaseIterable {
 case task
 case handoff
 case status
 case error
 case result

 /// Human-readable display name.
 public var displayName: String {
 rawValue.capitalized
 }

 /// SF Symbol icon for this message type.
 public var icon: String {
 switch self {
 case .task: "checklist"
 case .handoff: "arrowshape.turn.up.right.fill"
 case .status: "info.circle.fill"
 case .error: "xmark.octagon.fill"
 case .result: "checkmark.circle.fill"
 }
 }
}

/// A message exchanged between agents in the swarm.
///
/// Messages enable asynchronous communication and coordination
/// between agents. A `nil` `toAgentId` indicates a broadcast message.
public struct Message: Identifiable, Codable, Sendable, Hashable {
 /// Unique identifier for the message.
 public let id: UUID

 /// The agent that sent this message.
 public var fromAgentId: UUID

 /// The intended recipient agent ID. `nil` means broadcast to all agents.
 public var toAgentId: UUID?

 /// The type/category of this message.
 public var type: MessageType

 /// The textual content of the message.
 public var content: String

 /// Optional structured payload data (JSON-serialized).
 public var payload: Data?

 /// When the message was sent.
 public var timestamp: Date

 /// Whether the message has been read by the recipient.
 public var read: Bool

 public init(
 id: UUID = UUID(),
 fromAgentId: UUID,
 toAgentId: UUID? = nil,
 type: MessageType = .status,
 content: String = "",
 payload: Data? = nil,
 timestamp: Date = Date(),
 read: Bool = false
 ) {
 self.id = id
 self.fromAgentId = fromAgentId
 self.toAgentId = toAgentId
 self.type = type
 self.content = content
 self.payload = payload
 self.timestamp = timestamp
 self.read = read
 }

 // MARK: - Helpers

 /// Whether this message is a broadcast (sent to all agents).
 public var isBroadcast: Bool {
 toAgentId == nil
 }

 /// Decode the payload as JSON, if available.
 public func decodePayload<T: Decodable>(as type: T.Type = T.self) throws -> T? {
 guard let payload = payload else { return nil }
 return try JSONDecoder().decode(T.self, from: payload)
 }
}
