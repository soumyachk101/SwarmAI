import SwiftUI

// MARK: - Environment Values

struct AgentsStoreKey: EnvironmentKey {
 static let defaultValue: AgentsStore = AgentsStore()
}

struct WorkspaceStoreKey: EnvironmentKey {
 static let defaultValue: WorkspaceStore = WorkspaceStore()
}

struct TaskStoreKey: EnvironmentKey {
 static let defaultValue: TaskStore = TaskStore()
}

struct SettingsStoreKey: EnvironmentKey {
 static let defaultValue: SettingsStore = SettingsStore()
}

struct UiStoreKey: EnvironmentKey {
 static let defaultValue: UiStore = UiStore()
}

struct PlaneStoreKey: EnvironmentKey {
 static let defaultValue: PlaneStore = PlaneStore()
}

struct CanvasStoreKey: EnvironmentKey {
 static let defaultValue: CanvasStore = CanvasStore()
}

struct BrowserStoreKey: EnvironmentKey {
 static let defaultValue: BrowserStore = BrowserStore()
}

struct ExtensionStoreKey: EnvironmentKey {
 static let defaultValue: ExtensionStore = ExtensionStore()
}

struct DispatchStoreKey: EnvironmentKey {
 static let defaultValue: DispatchStore = DispatchStore()
}

struct ProjectStoreKey: EnvironmentKey {
 static let defaultValue: ProjectStore = ProjectStore()
}

extension EnvironmentValues {
 var agentsStore: AgentsStore {
 get { self[AgentsStoreKey.self] }
 set { self[AgentsStoreKey.self] = newValue }
 }

 var workspaceStore: WorkspaceStore {
 get { self[WorkspaceStoreKey.self] }
 set { self[WorkspaceStoreKey.self] = newValue }
 }

 var taskStore: TaskStore {
 get { self[TaskStoreKey.self] }
 set { self[TaskStoreKey.self] = newValue }
 }

 var settingsStore: SettingsStore {
 get { self[SettingsStoreKey.self] }
 set { self[SettingsStoreKey.self] = newValue }
 }

 var uiStore: UiStore {
 get { self[UiStoreKey.self] }
 set { self[UiStoreKey.self] = newValue }
 }

 var planeStore: PlaneStore {
 get { self[PlaneStoreKey.self] }
 set { self[PlaneStoreKey.self] = newValue }
 }

 var canvasStore: CanvasStore {
 get { self[CanvasStoreKey.self] }
 set { self[CanvasStoreKey.self] = newValue }
 }

 var browserStore: BrowserStore {
 get { self[BrowserStoreKey.self] }
 set { self[BrowserStoreKey.self] = newValue }
 }

 var extensionStore: ExtensionStore {
 get { self[ExtensionStoreKey.self] }
 set { self[ExtensionStoreKey.self] = newValue }
 }

 var dispatchStore: DispatchStore {
 get { self[DispatchStoreKey.self] }
 set { self[DispatchStoreKey.self] = newValue }
 }

 var projectStore: ProjectStore {
 get { self[ProjectStoreKey.self] }
 set { self[ProjectStoreKey.self] = newValue }
 }
}
