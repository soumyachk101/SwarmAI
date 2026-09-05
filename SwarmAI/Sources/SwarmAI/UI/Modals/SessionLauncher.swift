import SwiftUI

// MARK: - Session Launcher

public struct SessionLauncher: View {
	@Environment(\.dismiss) var dismiss
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.workspaceStore) private var workspaceStore

	@State private var selectedMode: LaunchMode = .agent
	@State private var agentCount: Int = 1
	@State private var taskPrompt: String = ""
	@State private var selectedAgentTypes: [AgentType] = [.claudeCode]
	@State private var selectedWorkspaceId: String = ""
	@State private var isPresented: Bool = false
	@State private var showingTemplateBrowser: Bool = false

	// 7 agent types (excludes plainTerminal for agent sessions)
	private var availableAgentTypes: [AgentType] {
		AgentType.allCases.filter { $0 != .plainTerminal }
	}

	private var presetCardOptions: [(name: String, count: Int, icon: String, color: Color)] {
		[
			("Solo", 1, "person.circle", .swarmInfo),
			("Pair", 2, "person.2.circle", .swarmSuccess),
			("Workbench", 2, "desktopcomputer", .swarmGold),
			("Swarm", 4, "ant.circle.fill", .swarmWarning),
		]
	}

	public init() {}

	public var body: some View {
		ZStack {
			// Backdrop
			Color.clear
				.ignoresSafeArea()
				.background(.black.opacity(isPresented ? 0.45 : 0))
				.allowsHitTesting(isPresented)
				.scaleEffect(isPresented ? 1.0 : 0.92)
				.onTapGesture { dismissLauncher() }
				.animation(.spring(response: 0.4, dampingFraction: 0.82), value: isPresented)

			// Hidden Escape Button for macOS keyboard shortcut routing
			Button("") {
				dismissLauncher()
			}
			.keyboardShortcut(.cancelAction)
			.keyboardShortcut(.escape, modifiers: [])
			.opacity(0)
			.frame(width: 0, height: 0)

			// Main panel
			mainPanel
				.padding(.horizontal, 36)
				.frame(maxWidth: 560)
				.background {
					RoundedRectangle(cornerRadius: 16)
						.fill(Color.swarmCanvas)
						.shadow(color: .black.opacity(0.4), radius: 40, x: 0, y: 12)
				}
				.padding(.horizontal, 40)
				.onKeyPress(.escape) {
					dismissLauncher()
					return .handled
				}
		}
		.onAppear {
			withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) {
				isPresented = true
			}
			// Default workspace to first workspace if empty
			if selectedWorkspaceId.isEmpty, let first = workspaceStore.workspaces.first {
				selectedWorkspaceId = first.id.uuidString
			}
		}
	}

	// MARK: - Main Panel

	@ViewBuilder
	private var mainPanel: some View {
		VStack(spacing: 20) {
			// Top bar with close button
			HStack {
				Spacer()
				Button {
					dismissLauncher()
				} label: {
					Image(systemName: "xmark.circle.fill")
						.font(.system(size: 20))
						.foregroundStyle(.swarmTextTertiary)
				}
				.buttonStyle(.plain)
			}
			.padding(.top, 8)

			// Title
			VStack(spacing: 6) {
				Image(systemName: "ant.fill")
					.font(.swarm(.xxl))
					.foregroundStyle(.swarmGold)
					.swarmEntrySpring(delay: 0.0)

				Text("Launch Swarm")
					.font(.swarm(.xxl, weight: .bold))
					.foregroundStyle(.swarmTextPrimary)
					.swarmEntrySpring(delay: 0.04)

				Text("Configure your AI agent swarm")
					.font(.swarm(.sm))
					.foregroundStyle(.swarmTextSecondary)
					.swarmEntrySpring(delay: 0.08)
			}

			// Mode selector (3 modes)
			modeSelector
				.swarmEntrySpring(delay: 0.12)

			// Workspace picker
			workspacePicker
				.swarmEntrySpring(delay: 0.15)

			// Preset cards
			presetCardsSection
				.swarmEntrySpring(delay: 0.18)

			// Agent count
			agentCountControl
				.swarmEntrySpring(delay: 0.22)

			// Agent type selection — 7 types
			agentTypeSelection
				.swarmEntrySpring(delay: 0.26)

			// Task prompt
			taskPromptSection
				.swarmEntrySpring(delay: 0.30)

			// Launch button
			launchButton
				.swarmEntrySpring(delay: 0.34)
		}
		.padding(.vertical, 20)
		.padding(.horizontal, 24)
	}

	// MARK: - Mode Selector

	@ViewBuilder
	private var modeSelector: some View {
		VStack(alignment: .leading, spacing: 6) {
			Text("Launch Mode")
				.font(.swarm(.xs, weight: .semibold))
				.foregroundStyle(.swarmTextSecondary)

			HStack(spacing: 8) {
				ForEach(LaunchMode.allCases) { mode in
					Button {
						selectedMode = mode
						SoundEffects.shared.play(.click)
					} label: {
						Text(mode.title)
							.font(.swarm(.sm, weight: .medium))
							.foregroundStyle(selectedMode == mode ? .swarmCanvas : .swarmTextSecondary)
							.frame(maxWidth: .infinity)
							.padding(.vertical, 9)
							.background {
								RoundedRectangle(cornerRadius: 8)
									.fill(selectedMode == mode ? Color.swarmGold : Color.swarmSurface)
							}
					}
					.buttonStyle(.plain)
				}
			}
		}
	}

	// MARK: - Workspace Picker

	@ViewBuilder
	private var workspacePicker: some View {
		VStack(alignment: .leading, spacing: 6) {
			Text("Workspace")
				.font(.swarm(.xs, weight: .semibold))
				.foregroundStyle(.swarmTextSecondary)

			Picker("Workspace", selection: $selectedWorkspaceId) {
				ForEach(workspaceStore.workspaces) { workspace in
					Text(workspace.name).tag(workspace.id.uuidString)
				}
			}
			.pickerStyle(.menu)
			.frame(maxWidth: .infinity, alignment: .leading)
			.font(.swarm(.sm))
		}
	}

	// MARK: - Preset Cards

	@ViewBuilder
	private var presetCardsSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			HStack {
				Text("Quick Presets")
					.font(.swarm(.xs, weight: .semibold))
					.foregroundStyle(.swarmTextSecondary)

				Spacer()

				// Browse Templates button
				Button {
					showingTemplateBrowser = true
				} label: {
					HStack(spacing: 4) {
						Image(systemName: "list.bullet.rectangle.portrait")
							.font(.swarm(.micro))
						Text("Browse Templates")
							.font(.swarm(.micro))
					}
					.foregroundStyle(.swarmGold)
					.padding(.horizontal, 10)
					.padding(.vertical, 4)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.fill(Color.swarmGold.opacity(0.1))
							.overlay(
								RoundedRectangle(cornerRadius: 6)
									.stroke(.swarmGold.opacity(0.35), lineWidth: 1)
							)
					}
				}
				.buttonStyle(.plain)
			}

			LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
				ForEach(Array(presetCardOptions.enumerated()), id: \.offset) { index, preset in
					Button {
						agentCount = preset.count
						SoundEffects.shared.play(.click)
					} label: {
						VStack(spacing: 4) {
							Image(systemName: preset.icon)
								.font(.swarm(.xs))
								.foregroundStyle(preset.color)

							Text(preset.name)
								.font(.swarm(.micro))
								.foregroundStyle(.swarmTextSecondary)
						}
						.frame(maxWidth: .infinity)
						.padding(.vertical, 10)
						.background {
							RoundedRectangle(cornerRadius: 8)
								.fill(agentCount == preset.count ? Color.swarmGold.opacity(0.15) : Color.swarmSurface)
								.overlay(
									RoundedRectangle(cornerRadius: 8)
										.stroke(agentCount == preset.count ? .swarmGold : .swarmBorderSubtle, lineWidth: 1)
								)
						}
					}
					.buttonStyle(.plain)
				}
			}
		}
	}

	// MARK: - Agent Count

	@ViewBuilder
	private var agentCountControl: some View {
		HStack(spacing: 16) {
			Text("Agents: \(agentCount)")
				.font(.swarm(.sm))
				.foregroundStyle(.swarmTextPrimary)

			Spacer()

			HStack(spacing: 6) {
				Button {
					agentCount = max(1, agentCount - 1)
				} label: {
					Image(systemName: "minus.circle.fill")
						.font(.swarm(.sm))
						.foregroundStyle(agentCount > 1 ? .swarmGold : .swarmTextTertiary)
				}
				.buttonStyle(.plain)
				.disabled(agentCount <= 1)

				Text("\(agentCount)")
					.font(.swarm(.base, weight: .semibold))
					.foregroundStyle(.swarmTextPrimary)
					.frame(minWidth: 30)

				Button {
					agentCount = min(16, agentCount + 1)
				} label: {
					Image(systemName: "plus.circle.fill")
						.font(.swarm(.sm))
						.foregroundStyle(agentCount < 16 ? .swarmGold : .swarmTextTertiary)
				}
				.buttonStyle(.plain)
				.disabled(agentCount >= 16)
			}
		}
	}

	// MARK: - Agent Type Selection

	@ViewBuilder
	private var agentTypeSelection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("Agent Types")
				.font(.swarm(.xs, weight: .semibold))
				.foregroundStyle(.swarmTextSecondary)

			FlowLayout(spacing: 8) {
				ForEach(availableAgentTypes, id: \.self) { type in
					Button {
						if selectedAgentTypes.contains(type) {
							if selectedAgentTypes.count > 1 {
								selectedAgentTypes.removeAll { $0 == type }
							}
						} else {
							selectedAgentTypes.append(type)
						}
						SoundEffects.shared.play(.click)
					} label: {
						HStack(spacing: 4) {
							Text(type.icon)
								.font(.swarm(.xs))

							Text(type.displayName)
								.font(.swarm(.micro))
						}
						.foregroundStyle(selectedAgentTypes.contains(type) ? .swarmCanvas : .swarmTextSecondary)
						.padding(.horizontal, 10)
						.padding(.vertical, 5)
						.background {
							RoundedRectangle(cornerRadius: 6)
								.fill(selectedAgentTypes.contains(type) ? type.brandColor : .swarmSurface)
						}
					}
					.buttonStyle(.plain)
				}
			}
		}
	}

	// MARK: - Task Prompt

	@ViewBuilder
	private var taskPromptSection: some View {
		VStack(alignment: .leading, spacing: 6) {
			Text("Task Prompt")
				.font(.swarm(.xs, weight: .semibold))
				.foregroundStyle(.swarmTextSecondary)

			TextEditor(text: $taskPrompt)
				.font(.swarm(.sm))
				.frame(height: 80)
				.scrollContentBackground(.hidden)
				.padding(8)
				.background(.swarmSurface)
				.cornerRadius(8)
				.overlay(
					RoundedRectangle(cornerRadius: 8)
						.stroke(.swarmBorderSubtle, lineWidth: 1)
				)
		}
	}

	// MARK: - Launch Button

	private var launchButton: some View {
		Button {
			launchSwarmAgents()
		} label: {
			HStack(spacing: 8) {
				Image(systemName: "play.fill")
					.font(.swarm(.sm))

				Text("Launch \(agentCount) Agent\(agentCount == 1 ? "" : "s")")
					.font(.swarm(.sm, weight: .semibold))
			}
			.foregroundStyle(.swarmCanvas)
			.frame(maxWidth: .infinity)
			.padding(.vertical, 12)
			.background(.swarmGold)
			.cornerRadius(10)
		}
		.buttonStyle(.plain)
		.disabled(taskPrompt.isEmpty || selectedAgentTypes.isEmpty)
		.opacity((taskPrompt.isEmpty || selectedAgentTypes.isEmpty) ? 0.5 : 1.0)
	}

	// MARK: - Launch Logic

	private func launchSwarmAgents() {
		let types = selectedAgentTypes.isEmpty ? [.claudeCode] : selectedAgentTypes
		for i in 0..<agentCount {
			let agentType = types[i % types.count]
			let agent = agentsStore.spawnAgent(agentType, name: "\(agentType.displayName) #\(i + 1)")
			if !taskPrompt.isEmpty {
				agent.role = .builder
			}
		}
		SoundEffects.shared.play(.launch)
		dismissLauncher()
	}

	private func dismissLauncher() {
		withAnimation(.spring(response: 0.25, dampingFraction: 0.82)) {
			isPresented = false
		}
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
			dismiss()
		}
	}
}

// MARK: - Launch Modes

public enum LaunchMode: String, CaseIterable, Identifiable {
	case agent = "Agent"
	case code = "Code"
	case chat = "Chat"

	public var id: String { rawValue }
	public var title: String { rawValue }
}

// MARK: - Flow Layout for agent type chips

public struct FlowLayout: Layout {
	public var spacing: CGFloat = 8

	public init(spacing: CGFloat = 8) {
		self.spacing = spacing
	}

	public func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
		var width: CGFloat = 0
		var height: CGFloat = 0
		var rowWidth: CGFloat = 0
		var rowHeight: CGFloat = 0

		for subview in subviews {
			let size = subview.sizeThatFits(.unspecified)
			if rowWidth + size.width > (proposal.width ?? .infinity) {
				width = max(width, rowWidth)
				height += rowHeight + spacing
				rowWidth = size.width
				rowHeight = size.height
			} else {
				rowWidth += size.width + spacing
				rowHeight = max(rowHeight, size.height)
			}
		}
		width = max(width, rowWidth)
		height += rowHeight
		return CGSize(width: width, height: height)
	}

	public func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
		var x: CGFloat = bounds.minX
		var y: CGFloat = bounds.minY
		var rowHeight: CGFloat = 0

		for subview in subviews {
			let size = subview.sizeThatFits(.unspecified)
			if x + size.width > bounds.maxX {
				x = bounds.minX
				y += rowHeight + spacing
				rowHeight = 0
			}
			subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
			x += size.width + spacing
			rowHeight = max(rowHeight, size.height)
		}
	}
}

// MARK: - Template Browser (placeholder sheet)

struct TemplateBrowser: View {
	@Environment(\.dismiss) var dismiss

	var body: some View {
		VStack(spacing: 20) {
			Text("Template Browser")
				.font(.swarm(.xl, weight: .bold))
				.foregroundStyle(.swarmTextPrimary)

			Text("Pre-built swarm configurations coming soon.")
				.font(.swarm(.sm))
				.foregroundStyle(.swarmTextSecondary)

			Button("Close") {
				dismiss()
			}
			.font(.swarm(.sm))
			.padding(.horizontal, 20)
			.padding(.vertical, 8)
			.background(.swarmSurface)
			.cornerRadius(8)
			.overlay(
				RoundedRectangle(cornerRadius: 8)
					.stroke(.swarmBorderSubtle, lineWidth: 1)
			)
			.buttonStyle(.plain)
		}
		.padding(24)
		.frame(width: 400, height: 280)
		.background(Color.swarmCanvas)
		.cornerRadius(14)
		.shadow(color: .black.opacity(0.3), radius: 24, x: 0, y: 8)
	}
}
