import Foundation
import SwiftUI

/// The type/category of a memory entry in the pheromone store.
@frozen
public enum MemoryType: String, Codable, Sendable, CaseIterable {
 case context = "context"
 case plan = "plan"
 case handoff = "handoff"
 case session = "session"
 case note = "note"

 /// Human-readable display name.
 public var displayName: String {
 rawValue.capitalized
 }

 /// SF Symbol icon for this memory type.
 public var icon: String {
 switch self {
 case .context: "book.fill"
 case .plan: "map.fill"
 case .handoff: "arrowshape.turn.up.right.fill"
 case .session: "bubble.left.and.bubble.right.fill"
 case .note: "pencil"
 }
 }

 /// Default importance level for this type.
 public var defaultImportance: Int {
 switch self {
 case .context: 3
 case .plan: 4
 case .handoff: 5
 case .session: 2
 case .note: 1
 }
 }
}

/// Pheromone shared memory entry for inter-agent knowledge sharing.
///
/// The memory system acts as a distributed shared context store where agents
/// can deposit and retrieve information about the workspace state, plans,
/// handoffs, and session notes.
@Observable
public class Memory: Codable, Identifiable {
 /// Unique identifier for this memory entry.
 public let id: UUID

 /// The workspace this memory belongs to.
 public var workspaceId: UUID

 /// The actual content/text of the memory entry.
 public var content: String

 /// The category/type of this memory entry.
 public var type: MemoryType

 /// The ID of the agent that created this memory entry.
 public var agentId: UUID

 /// Display name of the agent that created this entry.
 public var agentName: String

 /// Importance level (1-5), higher = more significant.
 public var importance: Int {
 didSet {
 importance = min(max(importance, 1), 5)
 }
 }

 /// Tags for categorization and search.
 public var tags: [String]

 /// When this memory entry was created.
 public var createdAt: Date

 /// When this memory entry was last accessed/read.
 public var accessedAt: Date

 // MARK: - Codable

 private enum CodingKeys: String, CodingKey {
 case id
 case workspaceId
 case content
 case type
 case agentId
 case agentName
 case importance
 case tags
 case createdAt
 case accessedAt
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 workspaceId = try container.decode(UUID.self, forKey: .workspaceId)
 content = try container.decode(String.self, forKey: .content)
 type = try container.decode(MemoryType.self, forKey: .type)
 agentId = try container.decode(UUID.self, forKey: .agentId)
 agentName = try container.decode(String.self, forKey: .agentName)
 importance = try container.decode(Int.self, forKey: .importance)
 tags = try container.decode([String].self, forKey: .tags)
 createdAt = try container.decode(Date.self, forKey: .createdAt)
 accessedAt = try container.decode(Date.self, forKey: .accessedAt)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(workspaceId, forKey: .workspaceId)
 try container.encode(content, forKey: .content)
 try container.encode(type, forKey: .type)
 try container.encode(agentId, forKey: .agentId)
 try container.encode(agentName, forKey: .agentName)
 try container.encode(importance, forKey: .importance)
 try container.encode(tags, forKey: .tags)
 try container.encode(createdAt, forKey: .createdAt)
 try container.encode(accessedAt, forKey: .accessedAt)
 }

 // MARK: - Init

 /// Create a new memory entry.
 public init(
 id: UUID = UUID(),
 workspaceId: UUID,
 content: String,
 type: MemoryType = .note,
 agentId: UUID,
 agentName: String,
 importance: Int = 3,
 tags: [String] = [],
 createdAt: Date = Date(),
 accessedAt: Date = Date()
 ) {
 self.id = id
 self.workspaceId = workspaceId
 self.content = content
 self.type = type
 self.agentId = agentId
 self.agentName = agentName
 self.importance = min(max(importance, 1), 5)
 self.tags = tags
 self.createdAt = createdAt
 self.accessedAt = accessedAt
 }

 // MARK: - Access

 /// Mark this memory entry as recently accessed.
 public func touchAccess() {
 accessedAt = Date()
 }
}
