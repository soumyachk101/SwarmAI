import SwiftUI

// MARK: - Grid Layout View

public struct GridBoardView: View {
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.appState) private var appState

	@State private var bgOpacity: Double = 0
	@State private var gridOpacity: Double = 0
	@State private var presetBarOffset: CGFloat = -10
	@State private var gridCornerRadius: CGFloat = 16
	@State private var breathingPhase: CGFloat = 0
	@State private var hasAppeared = false
	@State private var pulsePhase: CGFloat = 0

	public init() {}

	private var currentPreset: GridPreset {
		agentsStore.gridLayout.preset ?? .auto
	}

	public var body: some View {
		VStack(spacing: 0) {
			// Grid preset picker bar
			GridPresetBar()
				.offset(y: hasAppeared ? 0 : presetBarOffset)
				.opacity(hasAppeared ? 1 : 0)
				.animation(
					hasAppeared
						? .easeOut(duration: 0.4).delay(0.25)
						: .none,
					value: hasAppeared
				)

			// Agent Layout Panes Container
			Group {
				if agentsStore.agents.isEmpty {
					emptyStateView
				} else {
					layoutContentView
				}
			}
			.frame(maxWidth: .infinity, maxHeight: .infinity)
			.padding(4)
			.background {
				ZStack {
					Color.swarmCanvas.opacity(bgOpacity)

					// Subtle grid pattern overlay
					if bgOpacity > 0.1 {
						gridPatternOverlay
							.opacity(0.12 * bgOpacity)
					}
				}
			}
			.clipShape(RoundedRectangle(cornerRadius: gridCornerRadius))
			.overlay(
				breathingBorderOverlay
					.clipShape(RoundedRectangle(cornerRadius: gridCornerRadius))
			)
			.animation(.easeInOut(duration: 0.5), value: bgOpacity)
			.animation(.spring(response: 0.6, dampingFraction: 0.85), value: gridCornerRadius)
		}
		.ignoresSafeArea(.container, edges: .bottom)
		.onAppear {
			guard !hasAppeared else { return }
			hasAppeared = true

			withAnimation(.easeIn(duration: 0.3)) {
				bgOpacity = 1
			}

			withAnimation(.spring(response: 0.5, dampingFraction: 0.85).delay(0.15)) {
				gridCornerRadius = 4
			}

			withAnimation(.linear(duration: 3.0).repeatCount(1, autoreverses: true)) {
				breathingPhase = 1
			}

			DispatchQueue.main.asyncAfter(deadline: .now() + 3.3) {
				withAnimation(.linear(duration: 6.0).repeatForever(autoreverses: true)) {
					breathingPhase = 1
				}
			}
		}
	}

	// MARK: - Breathing Border Overlay

	private var breathingBorderOverlay: some View {
		let opacity = 0.06 + 0.04 * sin(breathingPhase * .pi * 2)
		return RoundedRectangle(cornerRadius: gridCornerRadius)
			.stroke(
				LinearGradient(
					gradient: Gradient(colors: [
						Color.swarmGold.opacity(opacity),
						Color.swarmBorderSubtle.opacity(0.3 + 0.1 * sin(breathingPhase * .pi * 2)),
						Color.swarmGold.opacity(opacity),
					]),
					startPoint: .topLeading,
					endPoint: .bottomTrailing
				),
				lineWidth: 1
			)
	}

	// MARK: - Subtle Grid Pattern Overlay

	private var gridPatternOverlay: some View {
		Canvas { context, size in
			let spacing: CGFloat = 40
			var path = Path()
			for x in stride(from: spacing, to: size.width, by: spacing) {
				path.move(to: CGPoint(x: x, y: 0))
				path.addLine(to: CGPoint(x: x, y: size.height))
			}
			for y in stride(from: spacing, to: size.height, by: spacing) {
				path.move(to: CGPoint(x: 0, y: y))
				path.addLine(to: CGPoint(x: size.width, y: y))
			}
			context.stroke(path, with: .color(Color.swarmTextTertiary))
		}
	}

	// MARK: - Layout Switcher

	@ViewBuilder
	private var layoutContentView: some View {
		if let maxId = agentsStore.maximizedPaneId,
		 let maxAgent = agentsStore.agents.first(where: { $0.id.uuidString == maxId }) {
			AgentPaneView(agent: maxAgent)
				.frame(maxWidth: .infinity, maxHeight: .infinity)
				.transition(.opacity.combined(with: .scale(scale: 0.98)))
		} else {
			switch currentPreset {
			case .auto:
				autoGridLayout
			case .twoByTwo:
				fixedGridLayout(columns: 2)
			case .threeByThree:
				fixedGridLayout(columns: 3)
			case .fourByFour:
				fixedGridLayout(columns: 4)
			case .master:
				masterDetailLayout
			case .focus:
				focusLayout
			case .columns:
				columnsLayout
			case .rows:
				rowsLayout
			}
		}
	}

	// MARK: - Preset 1: Auto Grid Layout

	private var autoGridLayout: some View {
		let count = agentsStore.agents.count
		if count <= 1 {
			return AnyView(
				Group {
					if let singleAgent = agentsStore.agents.first {
						AgentPaneView(agent: singleAgent)
							.frame(maxWidth: .infinity, maxHeight: .infinity)
					}
				}
			)
		} else if count == 2 {
			return AnyView(
				HStack(spacing: 4) {
					ForEach(agentsStore.agents) { agent in
						AgentPaneView(agent: agent)
							.frame(maxWidth: .infinity, maxHeight: .infinity)
					}
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			)
		} else {
			let colCount: Int = {
				switch count {
				case 3...4: return 2
				case 5...9: return 3
				case 10...16: return 4
				default: return max(1, Int(ceil(sqrt(Double(count)))))
				}
			}()
			return AnyView(fixedGridLayout(columns: colCount))
		}
	}

	// MARK: - Presets 2-4: Fixed N-Column Grid Layout

	private func fixedGridLayout(columns: Int) -> some View {
		let count = agentsStore.agents.count
		let effectiveCols = max(columns, 1)

		return ScrollView {
			LazyVGrid(
				columns: Array(repeating: GridItem(.flexible(minimum: 280), spacing: 4), count: effectiveCols),
				spacing: 4
			) {
				ForEach(Array(agentsStore.agents.enumerated()), id: \.element.id) { index, agent in
					AgentPaneView(agent: agent)
						.frame(minHeight: count <= effectiveCols ? 400 : 300)
						.opacity(hasAppeared ? 1 : 0)
						.scaleEffect(hasAppeared ? 1.0 : 0.9)
						.offset(y: hasAppeared ? 0 : 15)
						.animation(
							hasAppeared
								? .spring(response: 0.5, dampingFraction: 0.8)
									.delay(Double(index) * 0.04)
								: .none,
							value: hasAppeared
						)
				}
			}
			.padding(2)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
	}

	// MARK: - Preset 5: Master-Detail Layout

	private var masterDetailLayout: some View {
		let agents = agentsStore.agents
		let primaryAgent = agents.first(where: { $0.id.uuidString == agentsStore.activePaneId }) ?? agents.first
		let detailAgents = agents.filter { $0.id != primaryAgent?.id }

		return Group {
			if let primary = primaryAgent {
				HStack(spacing: 4) {
					// Master (Primary) Pane
					AgentPaneView(agent: primary)
						.frame(maxWidth: .infinity, maxHeight: .infinity)

					// Detail Side Strip (Scrollable if multiple agents)
					if !detailAgents.isEmpty {
						VStack(spacing: 0) {
							HStack {
								Text("SUPPORTING AGENTS (\(detailAgents.count))")
									.font(.swarmMono(.micro))
									.foregroundStyle(Color.swarmTextTertiary)
								Spacer()
							}
							.padding(.horizontal, 8)
							.padding(.vertical, 4)
							.background(Color.swarmSurface)

							ScrollView {
								LazyVStack(spacing: 4) {
									ForEach(detailAgents) { detail in
										VStack(spacing: 0) {
											AgentPaneView(agent: detail)
												.frame(height: 240)
												.overlay(alignment: .topTrailing) {
													Button {
														agentsStore.activePaneId = detail.id.uuidString
													} label: {
														HStack(spacing: 2) {
															Image(systemName: "arrow.left.arrow.right")
															Text("Promote")
														}
														.font(.swarmMono(.micro))
														.foregroundStyle(Color.swarmGold)
														.padding(.horizontal, 6)
														.padding(.vertical, 3)
														.background(Color.swarmSurface.opacity(0.9))
														.cornerRadius(4)
													}
													.buttonStyle(.plain)
													.padding(6)
												}
										}
									}
								}
								.padding(2)
							}
						}
						.frame(width: 360)
						.background(Color.swarmSurface.opacity(0.4))
						.cornerRadius(6)
					}
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			} else {
				emptyStateView
			}
		}
	}

	// MARK: - Preset 6: Focus Layout

	private var focusLayout: some View {
		let agents = agentsStore.agents
		let activeAgent = agents.first(where: { $0.id.uuidString == agentsStore.activePaneId }) ?? agents.first

		return Group {
			if let active = activeAgent {
				VStack(spacing: 4) {
					// Focus switcher bar if multiple agents
					if agents.count > 1 {
						ScrollView(.horizontal, showsIndicators: false) {
							HStack(spacing: 4) {
								ForEach(agents) { agent in
									Button {
										withAnimation(.swarmQuick) {
											agentsStore.activePaneId = agent.id.uuidString
										}
									} label: {
										HStack(spacing: 5) {
											Text(agent.agentType.icon)
											Text(agent.name)
												.font(.swarm(.xs, weight: agent.id == active.id ? .semibold : .regular))
												.foregroundStyle(agent.id == active.id ? Color.swarmGold : Color.swarmTextSecondary)

											Circle()
												.fill(agent.status == .running ? Color.swarmSuccess : Color.swarmTextTertiary)
												.frame(width: 5, height: 5)
										}
										.padding(.horizontal, 10)
										.padding(.vertical, 5)
										.background {
											RoundedRectangle(cornerRadius: 6)
												.fill(agent.id == active.id ? Color.swarmGold.opacity(0.18) : Color.swarmSurface)
												.overlay {
													RoundedRectangle(cornerRadius: 6)
														.stroke(agent.id == active.id ? Color.swarmGold : Color.swarmBorderSubtle, lineWidth: 1)
												}
										}
									}
									.buttonStyle(.plain)
								}
								Spacer()
							}
							.padding(.horizontal, 4)
							.padding(.vertical, 2)
						}
					}

					AgentPaneView(agent: active)
						.frame(maxWidth: .infinity, maxHeight: .infinity)
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			} else {
				emptyStateView
			}
		}
	}

	// MARK: - Preset 7: Horizontal Columns Layout

	private var columnsLayout: some View {
		let count = agentsStore.agents.count
		return Group {
			if count <= 3 {
				HStack(spacing: 4) {
					ForEach(agentsStore.agents) { agent in
						AgentPaneView(agent: agent)
							.frame(maxWidth: .infinity, maxHeight: .infinity)
					}
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			} else {
				ScrollView(.horizontal) {
					LazyHStack(spacing: 4) {
						ForEach(agentsStore.agents) { agent in
							AgentPaneView(agent: agent)
								.frame(width: 380)
								.frame(maxHeight: .infinity)
						}
					}
					.padding(2)
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			}
		}
	}

	// MARK: - Preset 8: Vertical Rows Layout

	private var rowsLayout: some View {
		let count = agentsStore.agents.count
		return Group {
			if count <= 2 {
				VStack(spacing: 4) {
					ForEach(agentsStore.agents) { agent in
						AgentPaneView(agent: agent)
							.frame(maxWidth: .infinity, maxHeight: .infinity)
					}
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			} else {
				ScrollView(.vertical) {
					LazyVStack(spacing: 4) {
						ForEach(agentsStore.agents) { agent in
							AgentPaneView(agent: agent)
								.frame(minHeight: 280)
								.frame(maxWidth: .infinity)
						}
					}
					.padding(2)
				}
				.frame(maxWidth: .infinity, maxHeight: .infinity)
			}
		}
	}

	// MARK: - Empty State (0 Agents)

	private var emptyStateView: some View {
		VStack(spacing: 24) {
			ZStack {
				Circle()
					.fill(Color.swarmGold.opacity(0.08))
					.frame(width: 80, height: 80)

				Circle()
					.fill(Color.swarmGold.opacity(0.12))
					.frame(width: 56, height: 56)

				Image(systemName: "square.grid.2x2.fill")
					.font(.system(size: 28))
					.foregroundStyle(Color.swarmGold)
			}
			.shimmer()

			VStack(spacing: 8) {
				Text("No Active Agent Panes")
					.font(.swarm(.lg, weight: .semibold))
					.foregroundStyle(Color.swarmTextPrimary)

				Text("Deploy concurrent AI agents to distribute terminal execution, code generation, and worktree isolation.")
					.font(.swarm(.sm))
					.foregroundStyle(Color.swarmTextSecondary)
					.multilineTextAlignment(.center)
					.frame(maxWidth: 460)
			}

			// Quick Spawn Agent Cards
			HStack(spacing: 12) {
				agentSpawnCard(
					title: "Claude Code",
					role: "Lead / Orchestrator",
					icon: "🤖",
					type: .claudeCode
				)

				agentSpawnCard(
					title: "Codex Agent",
					role: "Full-Stack Dev",
					icon: "💻",
					type: .codex
				)

				agentSpawnCard(
					title: "Plain Terminal",
					role: "Generic Shell",
					icon: "🖥",
					type: .plainTerminal
				)
			}
			.padding(.top, 4)

			// Action: Open Task Templates
			Button {
				appState.isTaskTemplatesOpen = true
			} label: {
				HStack(spacing: 6) {
					Image(systemName: "list.bullet.rectangle.portrait")
						.font(.swarm(.xs))
					Text("Browse Swarm Task Templates")
						.font(.swarm(.xs, weight: .medium))
				}
				.foregroundStyle(Color.swarmTextSecondary)
				.padding(.horizontal, 14)
				.padding(.vertical, 7)
				.background(
					RoundedRectangle(cornerRadius: 6)
						.fill(Color.swarmSurface)
						.overlay(
							RoundedRectangle(cornerRadius: 6)
								.stroke(Color.swarmBorderSubtle, lineWidth: 1)
						)
				)
			}
			.buttonStyle(.plain)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.padding(40)
	}

	private func agentSpawnCard(title: String, role: String, icon: String, type: AgentType) -> some View {
		Button {
			withAnimation(.spring(duration: 0.35)) {
				_ = agentsStore.spawnAgent(type)
			}
		} label: {
			VStack(alignment: .leading, spacing: 8) {
				HStack {
					Text(icon)
						.font(.system(size: 20))
					Spacer()
					Image(systemName: "plus.circle.fill")
						.font(.system(size: 14))
						.foregroundStyle(Color.swarmGold)
				}

				Text(title)
					.font(.swarm(.sm, weight: .semibold))
					.foregroundStyle(Color.swarmTextPrimary)

				Text(role)
					.font(.swarmMono(.micro))
					.foregroundStyle(Color.swarmTextTertiary)
			}
			.frame(width: 150, alignment: .leading)
			.padding(14)
			.background(
				RoundedRectangle(cornerRadius: 10)
					.fill(Color.swarmSurface)
					.overlay(
						RoundedRectangle(cornerRadius: 10)
							.stroke(Color.swarmBorderSubtle, lineWidth: 1)
					)
			)
		}
		.buttonStyle(.plain)
		.glassInteractive(.glassInset)
	}
}

// MARK: - Grid Preset Bar

public struct GridPresetBar: View {
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.appState) private var appState
	@State private var pulsePhase: CGFloat = 0

	public init() {}

	public var body: some View {
		HStack(spacing: 4) {
			// Preset Buttons - segmented control style
			ForEach(GridPreset.allCases, id: \.self) { preset in
				let isSelected = (agentsStore.gridLayout.preset == preset)
				Button {
					withAnimation(.spring(duration: 0.3)) {
						agentsStore.setGridLayout(preset)
					}
				} label: {
					HStack(spacing: 4) {
						Text(presetIcon(for: preset))
							.font(.system(size: 10))

						Text(preset.displayName)
							.font(.swarmMono(.micro))
					}
					.foregroundStyle(isSelected ? Color.swarmGold : Color.swarmTextSecondary)
					.padding(.horizontal, 10)
					.padding(.vertical, 5)
					.background {
						RoundedRectangle(cornerRadius: 5)
							.fill(isSelected ? Color.swarmGold.opacity(0.15) : Color.clear)
							.overlay {
								if isSelected {
									RoundedRectangle(cornerRadius: 5)
										.stroke(Color.swarmGold.opacity(0.45), lineWidth: 1)
								}
							}
					}
				}
				.buttonStyle(.plain)
				.scaleEffect(isSelected ? 1.0 : 0.97)
				.animation(.swarmQuick, value: isSelected)
			}

			Spacer()

			// Active Agent Count Badge with live pulse dot
			HStack(spacing: 6) {
				// Pulse dot - animated when agents are active
				Circle()
					.fill(agentsStore.agents.isEmpty ? Color.swarmTextTertiary : Color.swarmSuccess)
					.frame(width: 7, height: 7)
					.overlay {
						if !agentsStore.agents.isEmpty {
							Circle()
								.stroke(Color.swarmSuccess.opacity(0.5 - 0.3 * pulsePhase), lineWidth: 1.5)
								.frame(width: 14, height: 14)
								.scaleEffect(1 + 0.5 * pulsePhase)
								.animation(.linear(duration: 2.0).repeatForever(autoreverses: true), value: pulsePhase)
						}
					}

				Text("\(agentsStore.agents.count) AGENT\(agentsStore.agents.count == 1 ? "" : "S")")
					.font(.swarmMono(.micro))
					.foregroundStyle(Color.swarmTextTertiary)
			}
			.padding(.horizontal, 10)
			.padding(.vertical, 5)
			.background(Color.swarmSurface)
			.cornerRadius(5)

			// Add Pane Quick Button with gold accent
			Button {
				withAnimation(.spring(duration: 0.3)) {
					_ = agentsStore.spawnAgent(.claudeCode)
				}
			} label: {
				HStack(spacing: 4) {
					Image(systemName: "plus")
						.font(.swarmMono(.micro))
					Text("Add Agent")
						.font(.swarmMono(.micro))
				}
				.foregroundStyle(Color.swarmGold)
				.padding(.horizontal, 10)
				.padding(.vertical, 5)
				.background {
					RoundedRectangle(cornerRadius: 5)
						.fill(Color.swarmGold.opacity(0.1))
						.overlay(
							RoundedRectangle(cornerRadius: 5)
								.stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
						)
				}
			}
			.buttonStyle(.plain)
		}
		.padding(.horizontal, 12)
		.padding(.vertical, 6)
		.glassRail()
		.onAppear {
			withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: true)) {
				pulsePhase = 1
			}
		}
	}

	private func presetIcon(for preset: GridPreset) -> String {
		switch preset {
		case .auto: return "✦"
		case .twoByTwo: return "⊞"
		case .threeByThree: return "▦"
		case .fourByFour: return "▩"
		case .master: return "◫"
		case .focus: return "⊡"
		case .columns: return "▥"
		case .rows: return "▤"
		}
	}
}
