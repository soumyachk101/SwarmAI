import AppKit
import SwiftUI

@main
struct SwarmAIApp: App {
	@NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

	private let appState = AppState.shared
	private let themeStore = ThemeStore.shared
	private let agentsStore = AgentsStore.shared
	private let workspaceStore = WorkspaceStore.shared
	private let taskStore = TaskStore.shared
	private let settingsStore = SettingsStore.shared
	private let uiStore = UiStore.shared
	private let planeStore = PlaneStore.shared
	private let canvasStore = CanvasStore.shared
	private let browserStore = BrowserStore.shared
	private let extensionStore = ExtensionStore.shared
	private let dispatchStore = DispatchStore.shared
	private let projectStore = ProjectStore.shared

	var body: some Scene {
		WindowGroup {
			MainWindow()
				.environment(\.appState, appState)
				.environment(\.themeStore, themeStore)
				.environment(\.agentsStore, agentsStore)
				.environment(\.workspaceStore, workspaceStore)
				.environment(\.taskStore, taskStore)
				.environment(\.settingsStore, settingsStore)
				.environment(\.uiStore, uiStore)
				.environment(\.planeStore, planeStore)
				.environment(\.canvasStore, canvasStore)
				.environment(\.browserStore, browserStore)
				.environment(\.extensionStore, extensionStore)
				.environment(\.dispatchStore, dispatchStore)
				.environment(\.projectStore, projectStore)
				.frame(minWidth: 1100, minHeight: 700)
		}
		.windowStyle(.hiddenTitleBar)
		.defaultSize(width: 1440, height: 900)
		.commands {
			AppCommands()
		}
	}
}

final class AppDelegate: NSObject, NSApplicationDelegate {
	func applicationDidFinishLaunching(_ notification: Notification) {
		NSApp.setActivationPolicy(.regular)
		NSApp.activate(ignoringOtherApps: true)

		DispatchQueue.main.async {
			if let window = NSApp.windows.first(where: { $0.canBecomeKey }) ?? NSApp.windows.first {
				window.minSize = NSSize(width: 1100, height: 700)
				window.title = "SwarmAI"
				window.titleVisibility = .hidden
				window.titlebarAppearsTransparent = true
				window.isMovableByWindowBackground = true
				window.makeKeyAndOrderFront(nil)
			}
		}
	}

	func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
		return true
	}

	func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
		return true
	}
}
