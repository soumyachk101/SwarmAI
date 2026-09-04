import SwiftUI

// MARK: - Status Bar

struct StatusBar: View {
	@Environment(\.appState) private var appState
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	@State private var separatorScale: CGFloat = 0
	@State private var agentCountDisplay: Int = 0

	private var displayStatus: String {
		if appState.engineStatus.isEmpty { return "Idle" }
		return appState.engineStatus
	}

	var body: some View {
		HStack(spacing: 16) {
			// Git branch
			GitBranchBadge()
				.swarmStaggerItem(index: 0, delay: 0.0, factor: 0.04, animation: .swarmSlideUp)

			Spacer()

			// Active agents count
			AgentCountBadge(count: agentCountDisplay)
				.swarmStaggerItem(index: 1, delay: 0.08, factor: 0.04, animation: .swarmSlideUp)

			// Engine status
			EngineStatusBadge(status: displayStatus)
				.swarmStaggerItem(index: 2, delay: 0.16, factor: 0.04, animation: .swarmSlideUp)

			Spacer()

			// Connection indicator
			ConnectionIndicator()
				.swarmStaggerItem(index: 3, delay: 0.24, factor: 0.04, animation: .swarmSlideUp)
		}
		.frame(height: 28)
		.padding(.horizontal, 16)
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

	// MARK: - Count-Up Animation

	private func animateCountUp(from start: Int, to end: Int) {
		guard end != start else { return }
		if reduceMotion || abs(end - start) > 20 {
			agentCountDisplay = end
			return
		}

		Task { @MainActor in
			let step = end > start ? 1 : -1
			var current = start
			while current != end {
				try? await Task.sleep(nanoseconds: 40_000_000)
				current += step
				withAnimation(.swarmQuick) {
					agentCountDisplay = current
				}
			}
		}
	}
}

// MARK: - Git Branch Badge

struct GitBranchBadge: View {
	@Environment(\.appState) private var appState
	@State private var isHovered: Bool = false

	var body: some View {
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

struct AgentCountBadge: View {
	let count: Int

	var body: some View {
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

struct EngineStatusBadge: View {
	let status: String
	@State private var pulsePhase: CGFloat = 0
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	var isRunning: Bool { status.caseInsensitiveCompare("running") == .orderedSame }

	var body: some View {
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

struct ConnectionIndicator: View {
	var body: some View {
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
