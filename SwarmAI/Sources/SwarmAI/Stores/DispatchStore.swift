import SwiftUI

 @MainActor
@Observable
public final class DispatchStore: @unchecked Sendable {
  public static let shared = DispatchStore()
  public var dispatchedTasks: [DispatchedTask] = []
  public var pendingApprovals: [ApprovalRequest] = []

  public init() {}

 public struct DispatchedTask: Identifiable, Codable {
 public let id: UUID
 public let goal: String
 public var status: TaskDispatchStatus
 public let createdAt: Date
 public var completedAt: Date?
 public var subtasks: [SubTask]

 public init(id: UUID, goal: String, status: TaskDispatchStatus, createdAt: Date, completedAt: Date?, subtasks: [SubTask]) {
 self.id = id
 self.goal = goal
 self.status = status
 self.createdAt = createdAt
 self.completedAt = completedAt
 self.subtasks = subtasks
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 goal = try container.decode(String.self, forKey: .goal)
 status = try container.decode(TaskDispatchStatus.self, forKey: .status)
 createdAt = try container.decode(Date.self, forKey: .createdAt)
 completedAt = try container.decodeIfPresent(Date.self, forKey: .completedAt)
 subtasks = try container.decode([SubTask].self, forKey: .subtasks)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(goal, forKey: .goal)
 try container.encode(status, forKey: .status)
 try container.encode(createdAt, forKey: .createdAt)
 try container.encodeIfPresent(completedAt, forKey: .completedAt)
 try container.encode(subtasks, forKey: .subtasks)
 }

 private enum CodingKeys: String, CodingKey {
 case id, goal, status, createdAt, completedAt, subtasks
 }
 }

 public struct SubTask: Identifiable, Codable {
 public let id: UUID
 public let title: String
 public var assigneeId: UUID?
 public var status: SubTaskStatus

 public init(id: UUID, title: String, assigneeId: UUID?, status: SubTaskStatus) {
 self.id = id
 self.title = title
 self.assigneeId = assigneeId
 self.status = status
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 title = try container.decode(String.self, forKey: .title)
 assigneeId = try container.decodeIfPresent(UUID.self, forKey: .assigneeId)
 status = try container.decode(SubTaskStatus.self, forKey: .status)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(title, forKey: .title)
 try container.encodeIfPresent(assigneeId, forKey: .assigneeId)
 try container.encode(status, forKey: .status)
 }

 private enum CodingKeys: String, CodingKey {
 case id, title, assigneeId, status
 }
 }

 public struct ApprovalRequest: Identifiable, Codable {
 public let id: UUID
 public let taskId: UUID
 public let description: String
 public var status: ApprovalStatus
 public let createdAt: Date

 public init(id: UUID, taskId: UUID, description: String, status: ApprovalStatus, createdAt: Date) {
 self.id = id
 self.taskId = taskId
 self.description = description
 self.status = status
 self.createdAt = createdAt
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 taskId = try container.decode(UUID.self, forKey: .taskId)
 description = try container.decode(String.self, forKey: .description)
 status = try container.decode(ApprovalStatus.self, forKey: .status)
 createdAt = try container.decode(Date.self, forKey: .createdAt)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(taskId, forKey: .taskId)
 try container.encode(description, forKey: .description)
 try container.encode(status, forKey: .status)
 try container.encode(createdAt, forKey: .createdAt)
 }

 private enum CodingKeys: String, CodingKey {
 case id, taskId, description, status, createdAt
 }
 }

 public enum TaskDispatchStatus: String, Codable { case pending, running, completed, failed, cancelled }
 public enum SubTaskStatus: String, Codable { case pending, assigned, running, completed, failed }
 public enum ApprovalStatus: String, Codable { case pending, approved, rejected }

 func dispatchGoal(_ description: String) -> DispatchedTask {
 let task = DispatchedTask(
 id: UUID(),
 goal: description,
 status: .pending,
 createdAt: Date(),
 completedAt: nil,
 subtasks: []
 )
 dispatchedTasks.append(task)
 return task
 }

 func approveTask(_ id: UUID) {
 if let index = pendingApprovals.firstIndex(where: { $0.id == id }) {
 pendingApprovals[index].status = .approved
 }
 }

 func rejectTask(_ id: UUID) {
 if let index = pendingApprovals.firstIndex(where: { $0.id == id }) {
 pendingApprovals[index].status = .rejected
 }
 }

 func getPendingApprovals() -> [ApprovalRequest] {
 pendingApprovals.filter { $0.status == .pending }
 }
}
