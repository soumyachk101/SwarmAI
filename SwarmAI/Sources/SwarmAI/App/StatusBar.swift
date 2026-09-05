import SwiftUI
import AppKit

// MARK: - Status Bar

public struct StatusBar: View {
	@Environment(\.appState) private var appState
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	@State private var separatorScale: CGFloat = 0
	@State private var agentCountDisplay: Int = 0

	public init() {}

	public var body: some View {
		HStack(spacing: 10) {
			// LEFT: Project path + Git branch badges (luxury micro-pills)
			leftSection

			// CENTER: Engine status + Memory bridge
			centerSection

			Spacer(minLength: 8)

			// RIGHT: Error count + active agents badge
			rightSection
		}
		.frame(height: 28)
		.padding(.horizontal, 12)
		.background {
			Color.black.opacity(0.18)
				.ignoresSafeArea(edges: .horizontal)
		}
		.overlay(alignment: .top) {
			Capsule()
				.fill(.swarmBorderSubtle)
				.frame(height: 1)
				.scaleEffect(x: separatorScale, y: 1, anchor: .leading)
		}
		.onAppear {
			if reduceMotion {
				separatorScale = 1
			} else {
				withAnimation(.swarmDrawLine.delay(0.2)) {
					separatorScale = 1
				}
			}
			agentCountDisplay = appState.activeAgentsCount
			animateCountUp(from: 0, to: appState.activeAgentsCount)
		}
		.onChange(of: appState.activeAgentsCount) { _, newCount in
			animateCountUp(from: agentCountDisplay, to: newCount)
		}
	}

	// MARK: - Left Section (Project + Git badges)

	private var leftSection: some View {
		HStack(spacing: 8) {
			// Project path badge
			if !appState.workspaceName.isEmpty {
				HStack(spacing: 4) {
					Image(systemName: "folder.fill")
						.font(.swarm(.micro))
						.foregroundStyle(.swarmTextTertiary)

					Text(appState.workspaceName)
						.font(.swarmMono(.micro))
						.foregroundStyle(.swarmTextSecondary)
						.lineLimit(1)
				}
				.padding(.horizontal, 6)
				.padding(.vertical, 2)
				.background {
					RoundedRectangle(cornerRadius: 4)
						.fill(Color.swarmSurfaceHover.opacity(0.4))
						.overlay(
							RoundedRectangle(cornerRadius: 4)
								.stroke(.swarmBorderSubtle.opacity(0.3), lineWidth: 0.5)
						)
				}
				.shadow(color: .black.opacity(0.15), radius: 2, x: 0, y: 1)
				.help(appState.workspaceName)
			}

			// Git branch badge
			Button {
				appState.isGitModalPresented = true
			} label: {
				HStack(spacing: 4) {
					Image(systemName: "arrow.triangle.branch")
						.font(.swarm(.micro))
						.foregroundStyle(.swarmTextTertiary)

					Text(appState.gitBranch.isEmpty ? "no repo" : appState.gitBranch)
						.font(.swarmMono(.micro))
						.foregroundStyle(.swarmTextSecondary)
						.lineLimit(1)

					if appState.gitBranchCount > 0 {
						Text("+\(appState.gitBranchCount)")
							.font(.swarmMono(.micro))
							.fontWeight(.bold)
							.foregroundStyle(.swarmTextPrimary)
							.padding(.horizontal, 3)
							.padding(.vertical, 1)
							.background {
								RoundedRectangle(cornerRadius: 3)
									.fill(.swarmBorderSubtle.opacity(0.4))
							}
					}
				}
				.padding(.horizontal, 6)
				.padding(.vertical, 2)
				.background {
					RoundedRectangle(cornerRadius: 4)
						.fill(Color.swarmSurfaceHover.opacity(0.4))
						.overlay(
							RoundedRectangle(cornerRadius: 4)
								.stroke(.swarmBorderSubtle.opacity(0.3), lineWidth: 0.5)
						)
				}
				.shadow(color: .black.opacity(0.15), radius: 2, x: 0, y: 1)
			}
			.buttonStyle(.plain)
			.help("Git Control Hub")
		}
	}

	// MARK: - Center Section (Engine + Memory bridge)

	private var centerSection: some View {
		HStack(spacing: 8) {
			// Engine status
			HStack(spacing: 5) {
				Circle()
					.fill(appState.engineStatus.lowercased() == "running" ? Color.swarmSuccess : Color.swarmTextTertiary)
					.frame(width: 6, height: 6)
					.shadow(color: (appState.engineStatus.lowercased() == "running" && !reduceMotion) ? Color.swarmSuccess.opacity(0.6) : .clear, radius: 3)
					.overlay {
						if appState.engineStatus.lowercased() == "running" && !reduceMotion {
							Circle()
								.stroke(Color.swarmSuccess.opacity(0.3), lineWidth: 2)
								.scaleEffect(1.8)
						}
					}

				Text("Swarm Engine")
					.font(.swarm(.micro, weight: .medium))
					.foregroundStyle(.swarmTextSecondary)
			}
			.padding(.horizontal, 6)
			.padding(.vertical, 2)
			.background {
				RoundedRectangle(cornerRadius: 4)
					.fill(Color.swarmSurfaceHover.opacity(0.4))
					.overlay(
						RoundedRectangle(cornerRadius: 4)
							.stroke(.swarmBorderSubtle.opacity(0.3), lineWidth: 0.5)
					)
			}

			// Separator dot
			Text("·")
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextTertiary.opacity(0.6))

			// Memory bridge
			Text("Local Memory Bridge")
				.font(.swarm(.micro, weight: .medium))
				.foregroundStyle(.swarmTextTertiary)
		}
	}

	// MARK: - Right Section (Errors + Active Agents)

	private var rightSection: some View {
		HStack(spacing: 8) {
			// Error count badge
			if appState.erroredAgentsCount > 0 {
				Button {
					appState.isDashboardPresented = true
				} label: {
					HStack(spacing: 4) {
						Image(systemName: "exclamationmark.triangle.fill")
							.font(.swarm(.micro))
						Text("\(appState.erroredAgentsCount) failed")
							.font(.swarm(.micro, weight: .semibold))
					}
					.foregroundStyle(Color.swarmAccentError)
					.padding(.horizontal, 6)
					.padding(.vertical, 2)
					.background {
						RoundedRectangle(cornerRadius: 4)
							.fill(Color.swarmAccentError.opacity(0.12))
							.overlay(
								RoundedRectangle(cornerRadius: 4)
									.stroke(Color.swarmAccentError.opacity(0.3), lineWidth: 0.5)
							)
					}
				}
				.buttonStyle(.plain)
				.help("Open Swarm Dashboard")
			}

			// Active agents badge
			Button {
				appState.isDashboardPresented = true
			} label: {
				HStack(spacing: 5) {
					Circle()
						.fill(appState.activeAgentsCount > 0 ? Color.swarmSuccess : Color.swarmTextTertiary)
						.frame(width: 6, height: 6)
						.shadow(color: (appState.activeAgentsCount > 0 && !reduceMotion) ? Color.swarmSuccess.opacity(0.7) : .clear, radius: 3)

					Text("\(appState.activeAgentsCount)/\(appState.totalAgentsCount) active")
						.font(.swarmMono(.micro))
						.fontWeight(.semibold)
						.foregroundStyle(.swarmTextSecondary)
				}
				.padding(.horizontal, 6)
				.padding(.vertical, 2)
				.background {
					RoundedRectangle(cornerRadius: 4)
						.fill(Color.swarmSurfaceHover.opacity(0.4))
						.overlay(
							RoundedRectangle(cornerRadius: 4)
								.stroke(.swarmBorderSubtle.opacity(0.3), lineWidth: 0.5)
						)
				}
				.shadow(color: .black.opacity(0.15), radius: 2, x: 0, y: 1)
			}
			.buttonStyle(.plain)
			.help("Open Swarm Dashboard")
		}
	}

	// MARK: - Count-Up Animation

	private func animateCountUp(from start: Int, to end: Int) {
		guard end != start else { return }
		if reduceMotion || abs(end - start) > 20 {
			agentCountDisplay = end
			return
		}

		_Concurrency.Task { @MainActor in
			let step = end > start ? 1 : -1
			var current = start
			while current != end {
				try? await _Concurrency.Task.sleep(nanoseconds: 40_000_000)
				current += step
				withAnimation(.swarmQuick) {
					agentCountDisplay = current
				}
			}
		}
	}
}

// MARK: - Git Branch Badge

public struct GitBranchBadge: View {
	@Environment(\.appState) private var appState
	@State private var isHovered: Bool = false

	public var body: some View {
		HStack(spacing: 6) {
			Image(systemName: "arrow.triangle.branch")
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextTertiary)

			Text(appState.gitBranch.isEmpty ? "main" : appState.gitBranch)
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextSecondary)
		}
		.padding(.horizontal, 8)
		.padding(.vertical, 3)
		.background {
			RoundedRectangle(cornerRadius: 4)
				.fill(Color.swarmSurfaceHover.opacity(isHovered ? 0.8 : 0.4))
		}
		.scaleEffect(isHovered ? 1.02 : 1.0)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}

// MARK: - Agent Count Badge

public struct AgentCountBadge: View {
	let count: Int

	public var body: some View {
		HStack(spacing: 6) {
			Circle()
				.fill(count > 0 ? Color.swarmSuccess : Color.swarmTextTertiary)
				.frame(width: 6, height: 6)

			Text("\(count) agent\(count == 1 ? "" : "s")")
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextSecondary)
		}
	}
}

// MARK: - Engine Status Badge

public struct EngineStatusBadge: View {
	let status: String
	@State private var pulsePhase: CGFloat = 0
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	public var isRunning: Bool { status.caseInsensitiveCompare("running") == .orderedSame }

	public var body: some View {
		HStack(spacing: 6) {
			Circle()
				.fill(isRunning ? Color.swarmSuccess : Color.swarmTextTertiary)
				.frame(width: 6, height: 6)
				.scaleEffect(reduceMotion ? 1 : (isRunning ? 1 + 0.3 * pulsePhase : 1))
				.shadow(
					color: (isRunning ? Color.swarmSuccess : Color.swarmTextTertiary).opacity(reduceMotion ? 0 : 0.5 + 0.3 * pulsePhase),
					radius: reduceMotion ? 0 : 2 + 4 * pulsePhase,
					x: 0,
					y: 0
				)

			Text(status)
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextSecondary)
		}
		.onAppear {
			startPulsingIfNeeded()
		}
		.onChange(of: isRunning) { _, running in
			if running {
				startPulsingIfNeeded()
			} else {
				pulsePhase = 0
			}
		}
	}

	private func startPulsingIfNeeded() {
		guard isRunning && !reduceMotion else {
			pulsePhase = 0
			return
		}
		withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
			pulsePhase = 1.0
		}
	}
}

// MARK: - Connection Indicator

public struct ConnectionIndicator: View {
	public var body: some View {
		HStack(spacing: 4) {
			Circle()
				.fill(Color.swarmSuccess)
				.frame(width: 6, height: 6)

			Text("Connected")
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextTertiary)
		}
	}
}
