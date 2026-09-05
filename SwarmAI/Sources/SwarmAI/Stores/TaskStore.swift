import SwiftUI

@Observable
public final class TaskStore: @unchecked Sendable {
 public static let shared = TaskStore()
 public var tasks: [Task] = []
 public var selectedTaskId: UUID?
 public var isTaskPanelOpen: Bool = false
 public var isTaskLauncherOpen: Bool = false
 public var activeFilter: TaskFilter = .all
 public var searchQuery: String = ""

 public init() {
 loadSampleTasks()
 }

 func createTask(name: String, agent: AgentType, priority: TaskPriority, template: TaskTemplate? = nil) -> Task {
 let task = Task(title: name, priority: priority, agent: agent, template: template)
 tasks.append(task)
 return task
 }

 func createTask(title: String, description: String = "", agent: AgentType = .claudeCode, priority: TaskPriority = .medium, template: TaskTemplate? = nil) -> Task {
 let task = Task(title: title, description: description, priority: priority, agent: agent, template: template)
 tasks.append(task)
 return task
 }

 func updateTask(_ task: Task) {
 guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
 tasks[index] = task
 }

 func deleteTask(_ task: Task) {
 tasks.removeAll { $0.id == task.id }
 if selectedTaskId == task.id {
 selectedTaskId = nil
 }
 }

 func duplicateTask(_ task: Task) -> Task {
 		let newTask = Task(
			title: "\(task.title) (copy)",
			description: task.description,
			status: task.status,
			priority: task.priority,
			tags: task.tags,
			agent: task.agent,
 assigneeId: task.assigneeId,
 dueDate: task.dueDate,
 parentId: task.parentId,
 prompt: task.prompt,
 files: task.files,
 estimatedDuration: task.estimatedDuration,
 autoApprove: task.autoApprove,
 allowedTools: task.allowedTools,
 isFavorite: task.isFavorite,
 startedAt: task.startedAt,
 completedAt: task.completedAt,
 errorMessage: task.errorMessage,
 template: task.template
 )
 newTask.isFavorite = task.isFavorite
 tasks.append(newTask)
 return newTask
 }

 func startTask(_ task: Task) {
 guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
 tasks[index].status = .inProgress
 tasks[index].startedAt = Date()
 }

 func completeTask(_ task: Task) {
 guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
 tasks[index].status = .done
 tasks[index].completedAt = Date()
 }

 func failTask(_ task: Task, error: String? = nil) {
 guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
 tasks[index].status = .done
 tasks[index].errorMessage = error
 }

 	func cancelTask(_ task: Task) {
		guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
		tasks[index].status = .done
	}

	func moveTask(_ id: UUID, to status: TaskStatus) {
		guard let index = tasks.firstIndex(where: { $0.id == id }) else { return }
		tasks[index].status = status
		tasks[index].updatedAt = Date()
		if status == .inProgress && tasks[index].startedAt == nil {
			tasks[index].startedAt = Date()
		} else if status == .done {
			tasks[index].completedAt = Date()
		}
	}

 func selectTask(_ task: Task?) {
 selectedTaskId = task?.id
 }

 func toggleTaskPanel() {
 isTaskPanelOpen.toggle()
 }

 func openTaskLauncher() {
 isTaskLauncherOpen = true
 }

 func closeTaskLauncher() {
 isTaskLauncherOpen = false
 }

 func setFilter(_ filter: TaskFilter) {
 activeFilter = filter
 }

 func updateSearchQuery(_ query: String) {
 searchQuery = query
 }

 var filteredTasks: [Task] {
 var result = tasks

 switch activeFilter {
 case .all:
 break
 case .active:
 result = result.filter { $0.status == .inProgress || $0.status == .todo }
 case .completed:
 result = result.filter { $0.status == .done }
 case .failed:
 result = result.filter { $0.status == .done }
 case .favorites:
 result = result.filter { $0.isFavorite }
 }

 if !searchQuery.isEmpty {
 result = result.filter { task in
 task.title.localizedCaseInsensitiveContains(searchQuery) ||
 task.agent.displayName.localizedCaseInsensitiveContains(searchQuery)
 }
 }

 return result.sorted { $0.createdAt > $1.createdAt }
 }

 var selectedTask: Task? {
 guard let id = selectedTaskId else { return nil }
 return tasks.first(where: { $0.id == id })
 }

 var activeTasks: [Task] {
 tasks.filter { $0.status == .inProgress || $0.status == .todo }
 }

 var completedTasks: [Task] {
 tasks.filter { $0.status == .done }
 }

 var failedTasks: [Task] {
 tasks.filter { $0.status == .done }
 }

 var favoriteTasks: [Task] {
 tasks.filter { $0.isFavorite }
 }

 private func loadSampleTasks() {
 		tasks = [
			Task(title: "Implement user authentication", priority: .high, agent: .claudeCode),
			Task(title: "Refactor API endpoints", priority: .medium, agent: .codex),
			Task(title: "Fix login flow bugs", priority: .high, agent: .claudeCode),
			Task(title: "Write unit tests", priority: .medium, agent: .custom),
			Task(title: "Update dependencies", priority: .low, agent: .codex)
		]
 }
}
