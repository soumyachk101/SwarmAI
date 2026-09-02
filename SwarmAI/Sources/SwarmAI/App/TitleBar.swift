import SwiftUI

// MARK: - Title Bar

struct SwarmTitleBar: View {
	@Environment(\.appState) private var appState
	@Environment(\.uiStore) private var uiStore
	@Binding var entryPhase: EntryPhase

	@State private var separatorScale: CGFloat = 0
	@State private var shimmerOffset: CGFloat = -1.0

	var body: some View {
		HStack(spacing: 0) {
			// Left: workspace name
			HStack(spacing: 8) {
				AntIcon()
					.opacity(entryPhase >= .titlebarIn ? 1 : 0)
					.offset(y: entryPhase >= .titlebarIn ? 0 : -20)
					.animation(.swarmTitleEntry, value: entryPhase)

				Text(appState.workspaceName)
					.font(.swarm(.sm, weight: .medium))
					.foregroundStyle(.swarmTextPrimary)
					.mask(
						LinearGradient(
							gradient: Gradient(stops: [
								.init(color: .clear, location: max(0, shimmerOffset - 0.15)),
								.init(color: .black, location: shimmerOffset),
								.init(color: .clear, location: min(1, shimmerOffset + 0.15))
							]),
							startPoint: .leading,
							endPoint: .trailing
						)
					)
					.opacity(entryPhase >= .titlebarIn ? 1 : 0)
					.offset(y: entryPhase >= .titlebarIn ? 0 : -20)
					.animation(.swarmTitleEntry.delay(0.05), value: entryPhase)
					.onChange(of: entryPhase) { _, phase in
						if phase == .titlebarIn {
							withAnimation(.swarmShimmer.delay(0.3)) {
								shimmerOffset = 1.1
							}
						}
					}
			}
			.padding(.leading, 16)

			Spacer()

			// Right: controls
			HStack(spacing: 16) {
				VoiceToggle()
					.swarmStaggerItem(index: 0, delay: 0.0, factor: 0.03, animation: .swarmTitleEntry)

				PlanePicker()
					.swarmStaggerItem(index: 1, delay: 0.03, factor: 0.03, animation: .swarmTitleEntry)

				if appState.activePlane == .board {
					BoardViewPicker()
						.swarmStaggerItem(index: 2, delay: 0.06, factor: 0.03, animation: .swarmTitleEntry)
				}
			}
			.padding(.trailing, 80)
			.opacity(entryPhase >= .titlebarIn ? 1 : 0)
			.offset(y: entryPhase >= .titlebarIn ? 0 : -20)
			.animation(.swarmTitleEntry.delay(0.05), value: entryPhase)
		}
		.padding(.horizontal, 12)
		.padding(.vertical, 8)
		.background {
			ZStack {
				Color.black.opacity(0.15)
			}
			.ignoresSafeArea(edges: .horizontal)
		}
		.overlay(alignment: .bottom) {
			Capsule()
				.fill(.swarmBorderSubtle)
				.frame(height: 1)
				.scaleEffect(x: separatorScale, y: 1, anchor: .leading)
		}
		.onAppear {
			withAnimation(.swarmDrawLine.delay(0.4)) {
				separatorScale = 1
			}
		}
	}
}

// MARK: - Ant Icon

struct AntIcon: View {
	@State private var breathPhase: CGFloat = 0

	var body: some View {
		Image(systemName: "ant.fill")
			.font(.system(size: 14))
			.foregroundStyle(.swarmGold)
			.scaleEffect(1 + 0.04 * sin(breathPhase))
			.shadow(color: .swarmGold.opacity(0.15 + 0.1 * sin(breathPhase)), radius: 6, x: 0, y: 2)
			.onAppear {
				withAnimation(.easeInOut(duration: 3.0).repeatForever(autoreverses: true)) {
					breathPhase = .pi
				}
			}
	}
}

// MARK: - Voice Toggle

struct VoiceToggle: View {
	@Environment(\.appState) private var appState
	@State private var isHovered: Bool = false

	var body: some View {
		Button {
			withAnimation(.swarmQuick) {
				appState.isVoiceActive.toggle()
			}
		} label: {
			Image(systemName: appState.isVoiceActive ? "mic.fill" : "mic.slash.fill")
				.font(.system(size: 13))
				.foregroundStyle(appState.isVoiceActive ? .swarmGold : .swarmTextTertiary)
				.frame(width: 28, height: 28)
				.scaleEffect(isHovered ? 1.1 : 1.0)
		}
		.buttonStyle(.plain)
		.help("Toggle Voice Input")
		.onHover { hovering in
			isHovered = hovering
		}
	}
}

// MARK: - Plane Picker

struct PlanePicker: View {
	@Environment(\.appState) private var appState
	@State private var isHovered: Bool = false

	var body: some View {
		@Bindable var appState = appState
		Picker("", selection: $appState.activePlane) {
			ForEach(Plane.allCases) { plane in
				Image(systemName: plane.icon)
					.tag(plane)
			}
		}
		.pickerStyle(.segmented)
		.frame(width: 160)
		.labelsHidden()
		.scaleEffect(isHovered ? 1.02 : 1.0)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}

// MARK: - Board View Picker

struct BoardViewPicker: View {
	@Environment(\.appState) private var appState
	@State private var isHovered: Bool = false

	var body: some View {
		@Bindable var appState = appState
		Picker("", selection: $appState.boardView) {
			ForEach(BoardView.allCases) { view in
				Text(view.title)
					.tag(view)
			}
		}
		.pickerStyle(.segmented)
		.frame(width: 120)
		.labelsHidden()
		.scaleEffect(isHovered ? 1.02 : 1.0)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}
