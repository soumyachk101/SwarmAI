import SwiftUI
import Combine

// MARK: - Task Store

final class TaskStore: ObservableObject {
	static let shared = TaskStore()

	@Published var tasks: [Task] = []
	@Published var selectedTaskId: String?
	@Published var isTaskPanelOpen: Bool = false
	@Published var isTaskLauncherOpen: Bool = false
	@Published var activeFilter: TaskFilter = .all
	@Published var searchQuery: String = ""

	private init() {
		loadSampleTasks()
	}

	// MARK: - CRUD

	func createTask(name: String, agent: AgentType, priority: TaskPriority, template: TaskTemplate? = nil) -> Task {
		let task = Task(name: name, agent: agent, priority: priority, template: template)
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
		let newTask = Task(name: "\(task.name) (copy)", agent: task.agent, priority: task.priority, template: task.template)
		newTask.prompt = task.prompt
		newTask.files = task.files
		newTask.estimatedDuration = task.estimatedDuration
		newTask.autoApprove = task.autoApprove
		newTask.allowedTools = task.allowedTools
		tasks.append(newTask)
		return newTask
	}

	// MARK: - Actions

	func startTask(_ task: Task) {
		guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
		tasks[index].status = .running
		tasks[index].startedAt = Date()
	}

	func completeTask(_ task: Task) {
		guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
		tasks[index].status = .completed
		tasks[index].completedAt = Date()
	}

	func failTask(_ task: Task, error: String? = nil) {
		guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
		tasks[index].status = .failed
		tasks[index].errorMessage = error
	}

	func cancelTask(_ task: Task) {
		guard let index = tasks.firstIndex(where: { $0.id == task.id }) else { return }
		tasks[index].status = .cancelled
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

	// MARK: - Computed

	var filteredTasks: [Task] {
		var result = tasks

		switch activeFilter {
		case .all:
			break
		case .active:
			result = result.filter { $0.status == .running || $0.status == .pending }
		case .completed:
			result = result.filter { $0.status == .completed }
		case .failed:
			result = result.filter { $0.status == .failed || $0.status == .cancelled }
		case .favorites:
			result = result.filter { $0.isFavorite }
		}

		if !searchQuery.isEmpty {
			result = result.filter { task in
				task.name.localizedCaseInsensitiveContains(searchQuery) ||
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
		tasks.filter { $0.status == .running || $0.status == .pending }
	}

	var completedTasks: [Task] {
		tasks.filter { $0.status == .completed }
	}

	var failedTasks: [Task] {
		tasks.filter { $0.status == .failed || $0.status == .cancelled }
	}

	var favoriteTasks: [Task] {
		tasks.filter { $0.isFavorite }
	}

	// MARK: - Persistence

	func save() {
		// TODO: Implement persistence
	}

	func load() {
		// TODO: Implement persistence
	}

	// MARK: - Private

	private func loadSampleTasks() {
		tasks = [
			Task(name: "Implement user authentication", agent: .claudeCode, priority: .high, template: nil),
			Task(name: "Refactor API endpoints", agent: .codex, priority: .medium, template: nil),
			Task(name: "Fix login flow bugs", agent: .claudeCode, priority: .high, template: nil),
			Task(name: "Write unit tests", agent: .custom, priority: .medium, template: nil),
			Task(name: "Update dependencies", agent: .codex, priority: .low, template: nil)
		]
	}
}
