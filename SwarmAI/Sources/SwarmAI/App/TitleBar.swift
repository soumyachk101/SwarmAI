import SwiftUI
import AppKit

// MARK: - Floating Top-Right Island
/// Floating island at top-right of the window matching Tauri's windowControlsRef
public struct FloatingTopRightIsland: View {
	@Environment(\.appState) private var appState

	public init() {}

	public var body: some View {
		HStack(spacing: 4) {
			// Voice dictation button
			Button {
				appState.isVoiceActive.toggle()
			} label: {
				Image(systemName: appState.isVoiceActive ? "waveform" : "mic")
					.font(.system(size: 13, weight: .medium))
					.foregroundStyle(appState.isVoiceActive ? Color.swarmGold : Color.swarmTextSecondary)
					.frame(width: 28, height: 28)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.fill(appState.isVoiceActive ? Color.swarmGold.opacity(0.18) : Color.clear)
					}
			}
			.buttonStyle(.plain)
			.help("Voice Dictation")

			// Right dock toggle button
			Button {
				withAnimation(.swarmQuick) {
					appState.isRightDockOpen.toggle()
				}
			} label: {
				Image(systemName: "sidebar.trailing")
					.font(.system(size: 13, weight: .medium))
					.foregroundStyle(appState.isRightDockOpen ? Color.swarmGold : Color.swarmTextSecondary)
					.frame(width: 28, height: 28)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.fill(appState.isRightDockOpen ? Color.swarmGold.opacity(0.18) : Color.clear)
							.overlay {
								if appState.isRightDockOpen {
									RoundedRectangle(cornerRadius: 6)
										.stroke(Color.swarmGold.opacity(0.4), lineWidth: 1)
								}
							}
					}
			}
			.buttonStyle(.plain)
			.help("Toggle right panel")

			// Overflow Menu (...)
			Menu {
				Button {
					appState.resetEntryState()
					appState.startEntrySequence(reduceMotion: false)
				} label: {
					Label("Replay Opening Animation", systemImage: "sparkles")
				}

				Button {
					appState.isDashboardPresented = true
				} label: {
					Label("Swarm Dashboard", systemImage: "chart.xyaxis.line")
				}

				Button {
					appState.isTaskTemplatesPresented = true
				} label: {
					Label("Task Templates", systemImage: "square.stack.3d.up")
				}

				Button {
					appState.isCommandPaletteOpen = true
				} label: {
					Label("Extensions Marketplace", systemImage: "puzzlepiece.extension")
				}

				Button {
					appState.isSettingsOpen = true
				} label: {
					Label("Settings & Tools", systemImage: "gearshape")
				}

				Button {
					appState.isUserGuidePresented = true
				} label: {
					Label("User Guide & Docs", systemImage: "book")
				}
			} label: {
				Image(systemName: "ellipsis")
					.font(.system(size: 13, weight: .medium))
					.foregroundStyle(Color.swarmTextSecondary)
					.frame(width: 28, height: 28)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.fill(Color.clear)
					}
			}
			.menuStyle(.borderlessButton)
			.frame(width: 28, height: 28)
			.help("More Actions")
		}
		.padding(.horizontal, 6)
		.padding(.vertical, 3)
		.background {
			RoundedRectangle(cornerRadius: 10)
				.fill(Color(red: 18/255, green: 21/255, blue: 32/255).opacity(0.95))
				.overlay(
					RoundedRectangle(cornerRadius: 10)
						.stroke(Color.white.opacity(0.12), lineWidth: 1)
				)
				.shadow(color: Color.black.opacity(0.4), radius: 10, x: 0, y: 4)
		}
	}
}

// MARK: - Board View Toggle
/// Segmented Grid | Flow toggle matching Tauri ViewToggle
public struct BoardViewToggle: View {
	@Environment(\.appState) private var appState

	public init() {}

	public var body: some View {
		HStack(spacing: 2) {
			// Board Button
			Button {
				withAnimation(.swarmQuick) {
					appState.boardView = .grid
				}
			} label: {
				HStack(spacing: 5) {
					Image(systemName: "square.grid.2x2")
						.font(.system(size: 10))
						.foregroundStyle(appState.boardView == .grid ? Color.swarmGold : Color.zinc400)
					Text("Board")
						.font(.system(size: 11.5, weight: appState.boardView == .grid ? .semibold : .regular))
						.foregroundStyle(appState.boardView == .grid ? Color.swarmGoldHi : Color.zinc400)
				}
				.padding(.horizontal, 9)
				.padding(.vertical, 4)
				.background {
					if appState.boardView == .grid {
						RoundedRectangle(cornerRadius: 6)
							.fill(Color.swarmGold.opacity(0.18))
							.overlay(
								RoundedRectangle(cornerRadius: 6)
									.stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
							)
					}
				}
			}
			.buttonStyle(.plain)

			// Flow Button
			Button {
				withAnimation(.swarmQuick) {
					appState.boardView = .flow
				}
			} label: {
				HStack(spacing: 5) {
					Image(systemName: "point.topleft.down.to.point.bottomright.curvepath")
						.font(.system(size: 10))
						.foregroundStyle(appState.boardView == .flow ? Color.swarmGold : Color.zinc400)
					Text("Flow")
						.font(.system(size: 11.5, weight: appState.boardView == .flow ? .semibold : .regular))
						.foregroundStyle(appState.boardView == .flow ? Color.swarmGoldHi : Color.zinc400)
				}
				.padding(.horizontal, 9)
				.padding(.vertical, 4)
				.background {
					if appState.boardView == .flow {
						RoundedRectangle(cornerRadius: 6)
							.fill(Color.swarmGold.opacity(0.18))
							.overlay(
								RoundedRectangle(cornerRadius: 6)
									.stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
							)
					}
				}
			}
			.buttonStyle(.plain)
		}
		.padding(2)
		.background {
			RoundedRectangle(cornerRadius: 8)
				.fill(Color.black.opacity(0.4))
				.overlay(
					RoundedRectangle(cornerRadius: 8)
						.stroke(Color.white.opacity(0.08), lineWidth: 1)
				)
		}
	}
}

// MARK: - Backward Compatibility
public struct SwarmTitleBar: View {
	var entryPhase: EntryPhase = .complete
	public init(entryPhase: EntryPhase = .complete) {
		self.entryPhase = entryPhase
	}
	public var body: some View {
		EmptyView()
	}
}
