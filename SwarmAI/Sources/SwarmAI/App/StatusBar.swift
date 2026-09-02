import SwiftUI

// MARK: - Status Bar

struct StatusBar: View {
	@Environment(\.appState) private var appState

	// Entrance animation state
	@State private var hasAppeared = false
	@State private var agentCountDisplay: Int = 0
	@State private var statusTextIndex: Int = 0

	private var displayStatus: String {
		if appState.engineStatus == "Running" { return "Running" }
		if appState.engineStatus == "Idle" { return "Idle" }
		return appState.engineStatus
	}

	var body: some View {
		HStack(spacing: 16) {
			// Git branch
			HStack(spacing: 6) {
				Image(systemName: "arrow.triangle.branch")
					.font(.swarm(.xs))
					.foregroundStyle(.swarmTextTertiary)
					.opacity(hasAppeared ? 1 : 0)
					.offset(y: hasAppeared ? 0 : 20)
					.animation(.swarmSlideUp.delay(0.3), value: hasAppeared)

				Text(appState.gitBranch)
					.font(.swarm(.xs))
					.foregroundStyle(.swarmTextSecondary)
					.opacity(hasAppeared ? 1 : 0)
					.offset(y: hasAppeared ? 0 : 20)
					.animation(.swarmSlideUp.delay(0.35), value: hasAppeared)
			}
			.padding(.horizontal, 8)
			.padding(.vertical, 4)
			.background {
				RoundedRectangle(cornerRadius: 4)
					.fill(.swarmSurfaceHover.opacity(0.5))
			}
			.onTapGesture {
				// Show Git Control Modal
			}

			Spacer()

			// Active agents count
			HStack(spacing: 6) {
				Circle()
					.fill(appState.activeAgentsCount > 0 ? .swarmSuccess : .swarmTextTertiary)
					.frame(width: 6, height: 6)

				Text("\(agentCountDisplay) agent\(agentCountDisplay == 1 ? "" : "s")")
					.font(.swarm(.xs))
					.foregroundStyle(.swarmTextSecondary)
					.opacity(hasAppeared ? 1 : 0)
					.offset(y: hasAppeared ? 0 : 20)
					.animation(.swarmSlideUp.delay(0.4), value: hasAppeared)
			}

			// Engine status
			HStack(spacing: 6) {
				Circle()
					.fill(appState.engineStatus == "Running" ? .swarmSuccess : .swarmTextTertiary)
					.frame(width: 6, height: 6)
					.opacity(hasAppeared ? 1 : 0)
					.offset(y: hasAppeared ? 0 : 20)
					.animation(.swarmSlideUp.delay(0.45), value: hasAppeared)

				Text(displayStatus)
					.font(.swarm(.xs))
					.foregroundStyle(.swarmTextSecondary)
					.opacity(hasAppeared ? 1 : 0)
					.offset(y: hasAppeared ? 0 : 20)
					.animation(.swarmSlideUp.delay(0.5), value: hasAppeared)
			}

			// Spacer
			Spacer()

			// Connection indicator
			HStack(spacing: 4) {
				Circle()
					.fill(.swarmSuccess)
					.frame(width: 6, height: 6)

				Text("Connected")
					.font(.swarm(.xs))
					.foregroundStyle(.swarmTextTertiary)
					.opacity(hasAppeared ? 1 : 0)
					.offset(y: hasAppeared ? 0 : 20)
					.animation(.swarmSlideUp.delay(0.55), value: hasAppeared)
			}
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
				.scaleEffect(x: hasAppeared ? 1 : 0, y: 1, anchor: .leading)
				.animation(.swarmDrawLine.delay(0.35), value: hasAppeared)
		}
		.onAppear {
			guard !hasAppeared else { return }

			// Count-up animation for agent count
			let targetCount = appState.activeAgentsCount
			if targetCount > 0 {
				for i in 1...targetCount {
					DispatchQueue.main.asyncAfter(deadline: .now() + 0.3 + Double(i) * 0.05) {
						withAnimation(.easeOut(duration: 0.15)) {
							agentCountDisplay = i
						}
					}
				}
			}

			withAnimation(.swarmSlideUp.delay(0.3)) {
				hasAppeared = true
			}
		}
	}
}
