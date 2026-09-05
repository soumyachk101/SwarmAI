import SwiftUI

// MARK: - Environment Keys

public struct AgentsStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: AgentsStore = AgentsStore.shared
}

public struct WorkspaceStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: WorkspaceStore = WorkspaceStore.shared
}

public struct TaskStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: TaskStore = TaskStore.shared
}

public struct SettingsStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: SettingsStore = SettingsStore.shared
}

public struct UiStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: UiStore = UiStore.shared
}

public struct PlaneStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: PlaneStore = PlaneStore.shared
}

public struct CanvasStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: CanvasStore = CanvasStore.shared
}

public struct BrowserStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: BrowserStore = BrowserStore.shared
}

public struct ExtensionStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: ExtensionStore = ExtensionStore.shared
}

public struct DispatchStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: DispatchStore = DispatchStore.shared
}

public struct ProjectStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: ProjectStore = ProjectStore.shared
}

public struct AppStateKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: AppState = AppState.shared
}

public struct ThemeStoreKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: ThemeStore = ThemeStore.shared
}

public struct EmulatorServiceKey: @preconcurrency EnvironmentKey {
  @MainActor public static let defaultValue: EmulatorService = EmulatorService.shared
}

// MARK: - EnvironmentValues Extension

public extension EnvironmentValues {
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

  var projectsStore: ProjectStore {
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
