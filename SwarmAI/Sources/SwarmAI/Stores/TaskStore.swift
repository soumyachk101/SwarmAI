import SwiftUI

@Observable
public final class TaskStore: @unchecked Sendable {
  public var tasks: [Task] = []
  public var activeTaskId: UUID?
  public var viewMode: TaskView = .pipeline

  public init() {
    loadFromStorage()
    if tasks.isEmpty {
      seedDemoTasks()
    }
  }

  public func createTask(title: String, description: String = "") -> Task {
    let task = Task(title: title, description: description)
    tasks.append(task)
    saveToStorage()
    return task
  }

  public func updateTaskStatus(_ id: UUID, status: TaskStatus) {
    if let index = tasks.firstIndex(where: { $0.id == id }) {
      tasks[index].status = status
      tasks[index].updatedAt = Date()
      saveToStorage()
    }
  }

  public func deleteTask(_ id: UUID) {
    tasks.removeAll { $0.id == id }
    if activeTaskId == id { activeTaskId = nil }
    saveToStorage()
  }

  public func moveTask(_ id: UUID, to status: TaskStatus) {
    updateTaskStatus(id, status: status)
  }

 func tasks(for status: TaskStatus) -> [Task] {
 tasks.filter { $0.status == status }
 }

 private func seedDemoTasks() {
 let demoData: [(String, TaskStatus, TaskPriority)] = [
 ("Implement SwarmMind orchestrator", .inProgress, .high),
 ("Add terminal PTY support", .todo, .medium),
 ("Design Flow canvas edges", .backlog, .low),
 ("Write Pheromone MCP server", .review, .high),
 ("Create Lead breakdown logic", .done, .medium),
 ("Set up git worktree management", .inProgress, .high),
 ]
 for (title, status, priority) in demoData {
 let task = Task(title: title, status: status, priority: priority)
 tasks.append(task)
 }
 saveToStorage()
 }

 private func saveToStorage() {
 if let data = try? JSONEncoder().encode(tasks) {
 UserDefaults.standard.set(data, forKey: "savedTasks")
 }
 }

 private func loadFromStorage() {
 guard let data = UserDefaults.standard.data(forKey: "savedTasks"),
 let decoded = try? JSONDecoder().decode([Task].self, from: data) else { return }
 tasks = decoded
 }
}

// MARK: - Task Supporting Types

public enum TaskView: String, CaseIterable {
  case pipeline = "Pipeline"
  case progress = "Progress"
  case list = "List"
  case history = "History"
}
