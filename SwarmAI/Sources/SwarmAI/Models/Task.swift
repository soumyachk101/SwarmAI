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

// MARK: - Task Filter

public enum TaskFilter: String, Codable, Sendable, CaseIterable {
	case all
	case active
	case completed
	case failed
	case favorites
}

// MARK: - Task Template

public struct TaskTemplate: Identifiable, Codable, Sendable, Hashable {
	public let id: UUID
	public let name: String
	public let agent: AgentType
	public let priority: TaskPriority
	public let prompt: String = ""
	public let files: [String] = []
	public let estimatedDuration: TimeInterval?
	public let autoApprove: Bool = false
	public let allowedTools: [String] = []

	public init(
		id: UUID = UUID(),
		name: String,
		agent: AgentType,
		priority: TaskPriority,
		estimatedDuration: TimeInterval? = nil
	) {
		self.id = id
		self.name = name
		self.agent = agent
		self.priority = priority
		self.estimatedDuration = estimatedDuration
	}
}

/// A task in the kanban board, representing work to be done.
@Observable
public final class Task: Codable, Identifiable, Hashable, @unchecked Sendable {
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

 public var agent: AgentType = .claudeCode

 public var name: String {
	get { title }
	set { title = newValue }
 }

 public var prompt: String = ""
 public var files: [String] = []
 public var estimatedDuration: TimeInterval?
 public var autoApprove: Bool = false
 public var allowedTools: [String] = []
 public var isFavorite: Bool = false
 public var startedAt: Date?
 public var completedAt: Date?
 public var errorMessage: String?
 public var template: TaskTemplate?

 // MARK: - Codable

 private enum CodingKeys: String, CodingKey {
 case id
 case title
 case description
 case status
 case priority
 case tags
 case agent
 case assigneeId
 case createdAt
 case updatedAt
 case dueDate
 case parentId
 case prompt
 case files
 case estimatedDuration
 case autoApprove
 case allowedTools
 case isFavorite
 case startedAt
 case completedAt
 case errorMessage
 case template
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 title = try container.decode(String.self, forKey: .title)
 description = try container.decode(String.self, forKey: .description)
 status = try container.decode(TaskStatus.self, forKey: .status)
 priority = try container.decode(TaskPriority.self, forKey: .priority)
 tags = try container.decode([String].self, forKey: .tags)
 agent = try container.decodeIfPresent(AgentType.self, forKey: .agent) ?? .claudeCode
 assigneeId = try container.decodeIfPresent(UUID.self, forKey: .assigneeId)
 createdAt = try container.decode(Date.self, forKey: .createdAt)
 updatedAt = try container.decode(Date.self, forKey: .updatedAt)
 dueDate = try container.decodeIfPresent(Date.self, forKey: .dueDate)
 parentId = try container.decodeIfPresent(UUID.self, forKey: .parentId)
 prompt = try container.decodeIfPresent(String.self, forKey: .prompt) ?? ""
 files = try container.decodeIfPresent([String].self, forKey: .files) ?? []
 estimatedDuration = try container.decodeIfPresent(TimeInterval.self, forKey: .estimatedDuration)
 autoApprove = try container.decodeIfPresent(Bool.self, forKey: .autoApprove) ?? false
 allowedTools = try container.decodeIfPresent([String].self, forKey: .allowedTools) ?? []
 isFavorite = try container.decodeIfPresent(Bool.self, forKey: .isFavorite) ?? false
 startedAt = try container.decodeIfPresent(Date.self, forKey: .startedAt)
 completedAt = try container.decodeIfPresent(Date.self, forKey: .completedAt)
 errorMessage = try container.decodeIfPresent(String.self, forKey: .errorMessage)
 template = try container.decodeIfPresent(TaskTemplate.self, forKey: .template)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(title, forKey: .title)
 try container.encode(description, forKey: .description)
 try container.encode(status, forKey: .status)
 try container.encode(priority, forKey: .priority)
 try container.encode(tags, forKey: .tags)
 try container.encodeIfPresent(agent, forKey: .agent)
 try container.encodeIfPresent(assigneeId, forKey: .assigneeId)
 try container.encode(createdAt, forKey: .createdAt)
 try container.encode(updatedAt, forKey: .updatedAt)
 try container.encodeIfPresent(dueDate, forKey: .dueDate)
 try container.encodeIfPresent(parentId, forKey: .parentId)
 try container.encode(prompt, forKey: .prompt)
 try container.encode(files, forKey: .files)
 try container.encodeIfPresent(estimatedDuration, forKey: .estimatedDuration)
 try container.encode(autoApprove, forKey: .autoApprove)
 try container.encode(allowedTools, forKey: .allowedTools)
 try container.encode(isFavorite, forKey: .isFavorite)
 try container.encodeIfPresent(startedAt, forKey: .startedAt)
 try container.encodeIfPresent(completedAt, forKey: .completedAt)
 try container.encodeIfPresent(errorMessage, forKey: .errorMessage)
 try container.encodeIfPresent(template, forKey: .template)
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
 agent: AgentType = .claudeCode,
 assigneeId: UUID? = nil,
 createdAt: Date = Date(),
 updatedAt: Date = Date(),
 dueDate: Date? = nil,
 parentId: UUID? = nil,
 prompt: String = "",
 files: [String] = [],
 estimatedDuration: TimeInterval? = nil,
 autoApprove: Bool = false,
 allowedTools: [String] = [],
 isFavorite: Bool = false,
 startedAt: Date? = nil,
 completedAt: Date? = nil,
 errorMessage: String? = nil,
 template: TaskTemplate? = nil
 ) {
 self.id = id
 self.title = title
 self.description = description
 self.status = status
 self.priority = priority
 self.tags = tags
 self.agent = agent
 self.assigneeId = assigneeId
 self.createdAt = createdAt
 self.updatedAt = updatedAt
 self.dueDate = dueDate
 self.parentId = parentId
 self.prompt = prompt
 self.files = files
 self.estimatedDuration = estimatedDuration
 self.autoApprove = autoApprove
 self.allowedTools = allowedTools
 self.isFavorite = isFavorite
 self.startedAt = startedAt
 self.completedAt = completedAt
 self.errorMessage = errorMessage
 self.template = template
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

 // MARK: - Hashable & Equatable

 public static func == (lhs: Task, rhs: Task) -> Bool {
   lhs.id == rhs.id
 }

 public func hash(into hasher: inout Hasher) {
   hasher.combine(id)
 }
}
