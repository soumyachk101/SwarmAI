import AppKit
import SwiftUI

@main
struct SwarmAIApp: App {
	@NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

	@Environment(\.appState) private var appState
	@Environment(\.themeStore) private var themeStore
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.workspaceStore) private var workspaceStore
	@Environment(\.taskStore) private var taskStore
	@Environment(\.settingsStore) private var settingsStore
	@Environment(\.uiStore) private var uiStore
	@Environment(\.planeStore) private var planeStore
	@Environment(\.canvasStore) private var canvasStore
	@Environment(\.browserStore) private var browserStore
	@Environment(\.extensionStore) private var extensionStore
	@Environment(\.dispatchStore) private var dispatchStore
	@Environment(\.projectStore) private var projectStore

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
