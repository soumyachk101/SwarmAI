import SwiftUI

// MARK: - Status Bar

struct StatusBar: View {
	@Environment(\.appState) private var appState
	@State private var isAppearing: Bool = true

	@State private var agentCountDisplay: Int = 0
	@State private var targetCount: Int = 0

	private var displayStatus: String {
		if appState.engineStatus == "Running" { return "Running" }
		if appState.engineStatus == "Idle" { return "Idle" }
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
		.padding(.horizontal, 16)
		.padding(.vertical, 6)
		.background {
			Color.black.opacity(0.1)
		}
		.overlay(alignment: .top) {
			Capsule()
				.fill(.swarmBorderSubtle)
				.frame(height: 1)
				.scaleEffect(x: isAppearing ? 1 : 0, y: 1, anchor: .leading)
				.animation(.swarmDrawLine, value: isAppearing)
		}
		.onAppear {
			guard isAppearing else { return }
			targetCount = appState.activeAgentsCount
			animateCountUp(from: 0, to: targetCount)
		}
	}

	// MARK: - Count-Up Animation

	private func animateCountUp(from start: Int, to end: Int) {
		guard end > start else {
			agentCountDisplay = end
			return
		}
		_Concurrency.Task { @MainActor in
			for current in start...end {
				try? await _Concurrency.Task.sleep(nanoseconds: 50_000_000)
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

			Text(appState.gitBranch)
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextSecondary)
		}
		.padding(.horizontal, 8)
		.padding(.vertical, 4)
		.background {
			RoundedRectangle(cornerRadius: 4)
				.fill(.swarmSurfaceHover.opacity(isHovered ? 0.7 : 0.5))
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
				.fill(count > 0 ? .swarmSuccess : .swarmTextTertiary)
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

	var isRunning: Bool { status == "Running" }

	var body: some View {
		HStack(spacing: 6) {
			Circle()
				.fill(isRunning ? .swarmSuccess : .swarmTextTertiary)
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
			guard isRunning && !reduceMotion else { return }
			withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
				pulsePhase = 1.0
			}
		}
	}
}

// MARK: - Connection Indicator

struct ConnectionIndicator: View {
	@State private var isHovered: Bool = false

	var body: some View {
		HStack(spacing: 4) {
			Circle()
				.fill(.swarmSuccess)
				.frame(width: 6, height: 6)

			Text("Connected")
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextTertiary)
		}
	}
}
