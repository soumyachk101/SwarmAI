import Foundation
import SwiftUI

/// Status of a handoff between two agents.
@frozen
public enum HandoffStatus: String, Codable, Sendable, CaseIterable {
 case pending = "pending"
 case accepted = "accepted"
 case completed = "completed"
 case rejected = "rejected"

 /// Human-readable display name.
 public var displayName: String {
 rawValue.capitalized
 }

 /// SF Symbol icon for this handoff status.
 public var icon: String {
 switch self {
 case .pending: "clock.fill"
 case .accepted: "checkmark.circle.fill"
 case .completed: "checkmark.circle.fill"
 case .rejected: "xmark.circle.fill"
 }
 }

 /// Whether this handoff is still awaiting action.
 public var isPending: Bool {
 self == .pending
 }

 /// Whether this handoff has been finalized.
 public var isFinalized: Bool {
 self == .completed || self == .rejected
 }
}

/// A handoff message transferring context from one agent to another.
///
/// Handoffs are used when a lead agent delegates work to a follower,
/// or when an agent passes its work to another agent. The handoff
/// carries context, relevant files, and instructions.
public struct Handoff: Identifiable, Codable, Sendable, Hashable {
 /// Unique identifier for the handoff.
 public let id: UUID

 /// The agent initiating the handoff.
 public var fromAgentId: UUID

 /// The agent receiving the handoff.
 public var toAgentId: UUID

 /// Current status of the handoff.
 public var status: HandoffStatus

 /// Contextual information about the work being handed off.
 public var context: String

 /// File paths relevant to this handoff.
 public var files: [String]

 /// Instructions for the receiving agent.
 public var instructions: String

 /// When the handoff was created.
 public var createdAt: Date

 public init(
 id: UUID = UUID(),
 fromAgentId: UUID,
 toAgentId: UUID,
 status: HandoffStatus = .pending,
 context: String = "",
 files: [String] = [],
 instructions: String = "",
 createdAt: Date = Date()
 ) {
 self.id = id
 self.fromAgentId = fromAgentId
 self.toAgentId = toAgentId
 self.status = status
 self.context = context
 self.files = files
 self.instructions = instructions
 self.createdAt = createdAt
 }
}
