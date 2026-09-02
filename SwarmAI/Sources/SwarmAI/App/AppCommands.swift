import SwiftUI

// MARK: - App Commands & Menu Bar Integration

struct AppCommands: Commands {
	@Environment(\.appState) private var appState
	@Environment(\.themeStore) private var themeStore
	@Environment(\.agentsStore) private var agentsStore

	var body: some Commands {
		CommandGroup(replacing: .appInfo) {
			Button("About SwarmAI") {
				appState.isUserGuidePresented = true
			}
			Button("Check for Updates...") {
				appState.isUpdateCheckerPresented = true
			}
		}

		CommandGroup(replacing: .newItem) {
			Button("New Agent Session") {
				_ = agentsStore.spawnAgent(.claudeCode)
			}
			.keyboardShortcut("n", modifiers: [.command, .shift])

			Button("Quick Goal Dispatch...") {
				appState.isCommandPalettePresented = true
			}
			.keyboardShortcut("d", modifiers: [.command, .shift])

			Divider()

			Button("Close Active Pane") {
				if let activeId = agentsStore.activePaneId, let uuid = UUID(uuidString: activeId) {
					agentsStore.closePane(uuid)
				}
			}
			.keyboardShortcut("w", modifiers: [.command])
		}

		CommandGroup(replacing: .sidebar) {
			Button("Toggle Left Sidebar") {
				withAnimation(.spring(duration: 0.3)) {
					appState.isLeftSidebarOpen.toggle()
				}
			}
			.keyboardShortcut("b", modifiers: [.command])

			Button("Toggle Right Dock") {
				withAnimation(.spring(duration: 0.3)) {
					appState.isRightDockOpen.toggle()
				}
			}
			.keyboardShortcut("\\", modifiers: [.command, .shift])
		}

		CommandGroup(replacing: .toolbar) {
			Button("Command Palette") {
				appState.isCommandPalettePresented.toggle()
			}
			.keyboardShortcut("k", modifiers: .command)

			Button("Fleet Dashboard") {
				appState.isDashboardPresented.toggle()
			}
			.keyboardShortcut("h", modifiers: [.command, .shift])

			Button("Task Templates") {
				appState.isTaskTemplatesPresented.toggle()
			}
			.keyboardShortcut("t", modifiers: [.command, .option])

			Button("Git Diff Inspector") {
				appState.isDiffPreviewPresented.toggle()
			}
			.keyboardShortcut("g", modifiers: [.command, .shift])

			Divider()

			Button("Settings...") {
				appState.isSettingsPresented.toggle()
			}
			.keyboardShortcut(",", modifiers: .command)
		}

		CommandMenu("Layout") {
			Button("Auto Grid") {
				agentsStore.setGridLayout(.auto)
			}
			.keyboardShortcut("1", modifiers: [.command, .option])

			Button("2×2 Grid") {
				agentsStore.setGridLayout(.twoByTwo)
			}
			.keyboardShortcut("2", modifiers: [.command, .option])

			Button("3×3 Grid") {
				agentsStore.setGridLayout(.threeByThree)
			}
			.keyboardShortcut("3", modifiers: [.command, .option])

			Button("4×4 Grid") {
				agentsStore.setGridLayout(.fourByFour)
			}
			.keyboardShortcut("4", modifiers: [.command, .option])

			Button("Master-Detail Layout") {
				agentsStore.setGridLayout(.master)
			}
			.keyboardShortcut("5", modifiers: [.command, .option])

			Button("Focus Mode") {
				agentsStore.setGridLayout(.focus)
			}
			.keyboardShortcut("6", modifiers: [.command, .option])

			Button("Horizontal Columns") {
				agentsStore.setGridLayout(.columns)
			}
			.keyboardShortcut("7", modifiers: [.command, .option])

			Button("Vertical Rows") {
				agentsStore.setGridLayout(.rows)
			}
			.keyboardShortcut("8", modifiers: [.command, .option])
		}

		CommandMenu("Swarm") {
			Button("Dispatch Goal to Lead...") {
				appState.isCommandPalettePresented = true
			}
			.keyboardShortcut("d", modifiers: [.command, .shift])

			Divider()

			Button("Cycle Theme") {
				themeStore.cycleTheme()
			}
			.keyboardShortcut("t", modifiers: [.command, .shift])

			Divider()

			ForEach(Theme.allThemes, id: \.id) { theme in
				Button(theme.displayName) {
					themeStore.transitionToTheme(theme.id)
				}
			}
		}

		CommandMenu("Help") {
			Button("SwarmAI User Guide") {
				appState.isUserGuidePresented = true
			}
			.keyboardShortcut("?", modifiers: [.command])

			Button("Check for Updates...") {
				appState.isUpdateCheckerPresented = true
			}
		}
	}
}
