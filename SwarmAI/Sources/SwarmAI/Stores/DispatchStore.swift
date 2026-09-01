import SwiftUI

@Observable
final class DispatchStore {
 var dispatchedTasks: [DispatchedTask] = []
 var pendingApprovals: [ApprovalRequest] = []

 struct DispatchedTask: Identifiable, Codable {
 let id: UUID
 let goal: String
 let status: TaskDispatchStatus
 let createdAt: Date
 let completedAt: Date?
 let subtasks: [SubTask]
 }

 struct SubTask: Identifiable, Codable {
 let id: UUID
 let title: String
 let assigneeId: UUID?
 let status: SubTaskStatus
 }

 struct ApprovalRequest: Identifiable, Codable {
 let id: UUID
 let taskId: UUID
 let description: String
 let status: ApprovalStatus
 let createdAt: Date
 }

 enum TaskDispatchStatus: String, Codable { case pending, running, completed, failed, cancelled }
 enum SubTaskStatus: String, Codable { case pending, assigned, running, completed, failed }
 enum ApprovalStatus: String, Codable { case pending, approved, rejected }

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
