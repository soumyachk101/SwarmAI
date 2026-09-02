import SwiftUI
import AppKit

@main
struct SwarmAIApp: App {
	@NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
	@State private var themeStore = ThemeStore.shared

	var body: some Scene {
		WindowGroup {
			MainWindow()
				.environment(themeStore)
				.environment(\.themeStore, themeStore)
				.frame(minWidth: 1200, minHeight: 800)
		}
		.windowStyle(.hiddenTitleBar)
		.windowToolbarStyle(.unifiedCompact)
		.defaultSize(width: 1440, height: 900)
		.commands {
			AppCommands()
		}
	}
}

final class AppDelegate: NSObject, NSApplicationDelegate {
	func applicationDidFinishLaunching(_ notification: Notification) {
		NSApp.setActivationPolicy(.regular)
		DispatchQueue.main.async {
			NSApp.activate(ignoringOtherApps: true)
			for window in NSApp.windows {
				window.title = "SwarmAI"
				window.makeKeyAndOrderFront(nil)
				window.center()
			}
		}
	}

	func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
		true
	}
}
