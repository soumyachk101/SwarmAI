import SwiftUI

// MARK: - Environment Values

struct AgentsStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: AgentsStore = AgentsStore()
}

struct WorkspaceStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: WorkspaceStore = WorkspaceStore()
}

struct TaskStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: TaskStore = TaskStore()
}

struct SettingsStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: SettingsStore = SettingsStore()
}

struct UiStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: UiStore = UiStore()
}

struct PlaneStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: PlaneStore = PlaneStore()
}

struct CanvasStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: CanvasStore = CanvasStore()
}

struct BrowserStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: BrowserStore = BrowserStore()
}

struct ExtensionStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: ExtensionStore = ExtensionStore()
}

struct DispatchStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: DispatchStore = DispatchStore()
}

struct ProjectStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: ProjectStore = ProjectStore()
}

struct AppStateKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: AppState = AppState()
}

struct ThemeStoreKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: ThemeStore = ThemeStore()
}

struct EmulatorServiceKey: @preconcurrency EnvironmentKey {
  @MainActor static let defaultValue: EmulatorService = EmulatorService.shared
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

  var appState: AppState {
    get { self[AppStateKey.self] }
    set { self[AppStateKey.self] = newValue }
  }

  var themeStore: ThemeStore {
    get { self[ThemeStoreKey.self] }
    set { self[ThemeStoreKey.self] = newValue }
  }

  var emulatorService: EmulatorService {
    get { self[EmulatorServiceKey.self] }
    set { self[EmulatorServiceKey.self] = newValue }
  }
}
