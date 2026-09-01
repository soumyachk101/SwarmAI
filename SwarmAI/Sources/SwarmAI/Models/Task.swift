import Foundation
import SwiftUI

/// Status of a task in the kanban workflow.
@frozen
public enum TaskStatus: String, Codable, Sendable, CaseIterable {
 case backlog
 case todo
 case inProgress = "in_progress"
 case review
 case done

 /// Human-readable display name.
 public var displayName: String {
 switch self {
 case .backlog: "Backlog"
 case .todo: "To Do"
 case .inProgress: "In Progress"
 case .review: "Review"
 case .done: "Done"
 }
 }

 /// Column index for sorting/ordering in the kanban board.
 public var columnIndex: Int {
 switch self {
 case .backlog: 0
 case .todo: 1
 case .inProgress: 2
 case .review: 3
 case .done: 4
 }
 }
}

/// Priority level for a task.
@frozen
public enum TaskPriority: String, Codable, Sendable, CaseIterable {
 case low
 case medium
 case high
 case critical

 /// Human-readable display name.
 public var displayName: String {
 rawValue.capitalized
 }

 /// Display color for the priority level.
 public var color: Color {
 switch self {
 case .low: .green
 case .medium: .yellow
 case .high: .orange
 case .critical: .red
 }
 }

 /// Sort weight (higher = more important).
 public var weight: Int {
 switch self {
 case .low: 1
 case .medium: 2
 case .high: 3
 case .critical: 4
 }
 }
}

/// A task in the kanban board, representing work to be done.
@Observable
public class Task: Codable, Identifiable, Hashable {
 /// Unique identifier for the task.
 public let id: UUID

 /// Short title summarizing the task.
 public var title: String

 /// Detailed description of the task.
 public var description: String

 /// Current workflow status.
 public var status: TaskStatus

 /// Priority level.
 public var priority: TaskPriority

 /// Tags for categorization and filtering.
 public var tags: [String]

 /// The agent assigned to this task, if any.
 public var assigneeId: UUID?

 /// When the task was created.
 public var createdAt: Date

 /// When the task was last updated.
 public var updatedAt: Date

 /// Optional due date for the task.
 public var dueDate: Date?

 /// Parent task ID, if this is a subtask. Nil for top-level tasks.
 public var parentId: UUID?

 // MARK: - Codable

 private enum CodingKeys: String, CodingKey {
 case id
 case title
 case description
 case status
 case priority
 case tags
 case assigneeId
 case createdAt
 case updatedAt
 case dueDate
 case parentId
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 title = try container.decode(String.self, forKey: .title)
 description = try container.decode(String.self, forKey: .description)
 status = try container.decode(TaskStatus.self, forKey: .status)
 priority = try container.decode(TaskPriority.self, forKey: .priority)
 tags = try container.decode([String].self, forKey: .tags)
 assigneeId = try container.decodeIfPresent(UUID.self, forKey: .assigneeId)
 createdAt = try container.decode(Date.self, forKey: .createdAt)
 updatedAt = try container.decode(Date.self, forKey: .updatedAt)
 dueDate = try container.decodeIfPresent(Date.self, forKey: .dueDate)
 parentId = try container.decodeIfPresent(UUID.self, forKey: .parentId)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(title, forKey: .title)
 try container.encode(description, forKey: .description)
 try container.encode(status, forKey: .status)
 try container.encode(priority, forKey: .priority)
 try container.encode(tags, forKey: .tags)
 try container.encodeIfPresent(assigneeId, forKey: .assigneeId)
 try container.encode(createdAt, forKey: .createdAt)
 try container.encode(updatedAt, forKey: .updatedAt)
 try container.encodeIfPresent(dueDate, forKey: .dueDate)
 try container.encodeIfPresent(parentId, forKey: .parentId)
 }

 // MARK: - Init

 /// Create a new task.
 public init(
 id: UUID = UUID(),
 title: String,
 description: String = "",
 status: TaskStatus = .todo,
 priority: TaskPriority = .medium,
 tags: [String] = [],
 assigneeId: UUID? = nil,
 createdAt: Date = Date(),
 updatedAt: Date = Date(),
 dueDate: Date? = nil,
 parentId: UUID? = nil
 ) {
 self.id = id
 self.title = title
 self.description = description
 self.status = status
 self.priority = priority
 self.tags = tags
 self.assigneeId = assigneeId
 self.createdAt = createdAt
 self.updatedAt = updatedAt
 self.dueDate = dueDate
 self.parentId = parentId
 }

 // MARK: - Helpers

 /// Whether this task is a subtask (has a parent).
 public var isSubtask: Bool {
 parentId != nil
 }

 /// Whether this task is overdue.
 public var isOverdue: Bool {
 guard let dueDate = dueDate else { return false }
 return dueDate < Date() && status != .done
 }

 /// Touch the updatedAt timestamp to mark the task as recently modified.
 public func touch() {
 updatedAt = Date()
 }
}
