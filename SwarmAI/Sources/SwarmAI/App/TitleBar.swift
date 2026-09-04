import SwiftUI
import AppKit

// MARK: - Title Bar

struct SwarmTitleBar: View {
	@Environment(\.appState) private var appState
	@Environment(\.uiStore) private var uiStore
	@Environment(\.accessibilityReduceMotion) private var reduceMotion
	@Binding var entryPhase: EntryPhase

	@State private var separatorScale: CGFloat = 0
	@State private var shimmerOffset: CGFloat = -0.5
	@State private var activeTabIndex: Int = 0

	private let titleBarHeight: CGFloat = 44
	private let trafficLightSpacing: CGFloat = 8
	private let buttonSpacing: CGFloat = 4

	var body: some View {
		ZStack(alignment: .center) {
			// ── Background & Glass Toolbar ──────────────────────────────
			glassToolbarBackground

			// ── Gold accent bottom border ───────────────────────────────
			goldAccentBorder

			// ── Content ─────────────────────────────────────────────────
			HStack(spacing: 0) {
				// Left: Window traffic lights + Ant icon
				leftSection

				Spacer()

				// Right: Board view tabs + Action buttons
				rightSection
			}
			.padding(.horizontal, 16)
			.frame(height: titleBarHeight)

			// ── Centered workspace name (true center, floating above HStack) ──
			centeredWorkspaceName
		}
		.frame(height: titleBarHeight)
		.onAppear {
			if reduceMotion {
				separatorScale = 1
			} else {
				withAnimation(.swarmDrawLine.delay(0.2)) {
					separatorScale = 1
				}
			}
			activeTabIndex = appState.boardView == .flow ? 1 : 0
		}
		.onChange(of: appState.boardView) { _, newView in
			activeTabIndex = newView == .flow ? 1 : 0
		}
	}

	// MARK: - Glass Toolbar Background

	private var glassToolbarBackground: some View {
		Rectangle()
			.fill(.ultraThinMaterial)
			.glassToolbar()
			.allowsHitTesting(false)
	}

	// MARK: - Gold Accent Border

	private var goldAccentBorder: some View {
		VStack {
			Spacer()
			Rectangle()
				.fill(
					LinearGradient(
						colors: [
							Color.clear,
							Color.swarmGold.opacity(0.35),
							Color.swarmGold.opacity(0.6),
							Color.swarmGold.opacity(0.35),
							Color.clear
						],
						startPoint: .leading,
						endPoint: .trailing
					)
				)
				.frame(height: 1.5)
		}
		.allowsHitTesting(false)
	}

	// MARK: - Left Section

	private var leftSection: some View {
		HStack(spacing: trafficLightSpacing) {
			// Window traffic lights
			trafficLights

			// Ant icon with shimmer
			HStack(spacing: 8) {
				AntIcon()
					.opacity(entryPhase >= .titlebarIn ? 1 : 0)
					.offset(y: entryPhase >= .titlebarIn ? 0 : -20)
					.animation(.swarmTitleEntry, value: entryPhase)
			}
		}
	}

	// MARK: - Traffic Lights

	private var trafficLights: some View {
		HStack(spacing: 8) {
			ForEach(TrafficLight.allCases, id: \.self) { light in
				Button {
					handleTrafficLightAction(light)
				} label: {
					ZStack {
						Circle()
							.fill(light.backgroundColor)
							.frame(width: 12, height: 12)
							.overlay(
								Circle()
									.stroke(light.borderColor.opacity(0.4), lineWidth: 0.5)
							)

						Image(systemName: light.symbolName)
							.font(.system(size: 6.5, weight: .bold))
							.foregroundStyle(light.symbolColor)
							.opacity(isHoveringTrafficLight ? 1 : 0)
							.scaleEffect(isHoveringTrafficLight ? 1 : 0.8)
					}
				}
				.buttonStyle(.plain)
				.onHover { hovering in
					withAnimation(.swarmQuick) {
						isHoveringTrafficLight = hovering
					}
				}
			}
		}
		.padding(.leading, 4)
	}

	@State private var isHoveringTrafficLight: Bool = false

	// MARK: - Centered Workspace Name

	private var centeredWorkspaceName: some View {
		Text(appState.workspaceName.isEmpty ? "SwarmAI" : appState.workspaceName)
			.font(.swarm(.sm, weight: .semibold))
			.foregroundStyle(.swarmTextPrimary)
			.opacity(entryPhase >= .titlebarIn ? 1 : 0)
			.offset(y: entryPhase >= .titlebarIn ? 0 : -20)
			.animation(.swarmTitleEntry.delay(0.05), value: entryPhase)
			.overlay {
				if !reduceMotion && shimmerOffset >= -0.2 && shimmerOffset <= 1.2 {
					LinearGradient(
						stops: [
							.init(color: .clear, location: max(0, shimmerOffset - 0.2)),
							.init(color: Color.swarmGold.opacity(0.8), location: max(0, min(1, shimmerOffset))),
							.init(color: .clear, location: min(1, shimmerOffset + 0.2))
						],
						startPoint: .leading,
						endPoint: .trailing
					)
					.mask(
						Text(appState.workspaceName.isEmpty ? "SwarmAI" : appState.workspaceName)
							.font(.swarm(.sm, weight: .semibold))
					)
				}
			}
			.onChange(of: entryPhase) { _, phase in
				guard !reduceMotion else { return }
				if phase >= .titlebarIn {
					withAnimation(.swarmShimmer.delay(0.2)) {
						shimmerOffset = 1.2
					}
				}
			}
	}

	// MARK: - Right Section

	private var rightSection: some View {
		HStack(spacing: buttonSpacing) {
			// Board view tabs (only on board plane)
			if appState.activePlane == .board {
				boardViewTabs
			}

			Divider()
				.frame(height: 16)
				.overlay(Color.swarmBorderSubtle)
				.opacity(0.5)
				.padding(.horizontal, 4)

			// Action buttons
			actionButtons
		}
		.opacity(entryPhase >= .titlebarIn ? 1 : 0)
		.offset(y: entryPhase >= .titlebarIn ? 0 : -20)
		.animation(.swarmTitleEntry.delay(0.05), value: entryPhase)
	}

	// MARK: - Board View Tabs

	private var boardViewTabs: some View {
		HStack(spacing: 2) {
			ForEach(Array(BoardView.allCases.enumerated()), id: \.element.id) { index, view in
				boardViewTabButton(view: view, index: index)
			}
		}
		.glassInset()
		.clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 8, style: .continuous)
				.stroke(Color.swarmBorderSubtle, lineWidth: 0.5)
				.opacity(0.4)
		)
	}

	private func boardViewTabButton(view: BoardView, index: Int) -> some View {
		let isActive = (view == .grid && appState.boardView == .grid) ||
					 (view == .flow && appState.boardView == .flow)

		return Button {
			withAnimation(.swarmTabSwitch) {
				appState.boardView = view
				activeTabIndex = index
			}
		} label: {
			Text(view.title)
				.font(.swarm(.xs, weight: isActive ? .semibold : .regular))
				.foregroundStyle(
					isActive ? .swarmGold : .swarmTextTertiary
				)
				.padding(.horizontal, 10)
				.padding(.vertical, 4)
				.frame(height: 26)
				.background(
					ZStack {
						if isActive {
							RoundedRectangle(cornerRadius: 6, style: .continuous)
								.fill(Color.swarmGold.opacity(0.12))
						}
					}
				)
				.overlay(
					// Active tab gold underline indicator
					VStack {
						Spacer()
						RoundedRectangle(cornerRadius: 1.5, style: .continuous)
							.fill(Color.swarmGold.opacity(isActive ? 0.8 : 0))
							.frame(height: 2)
					}
					.padding(.horizontal, 4)
					.padding(.bottom, 1)
				)
		}
		.buttonStyle(.plain)
		.glassInteractive(.glass)
		.scaleEffect(isActive ? 1.0 : 0.96)
	}

	// MARK: - Action Buttons

	private var actionButtons: some View {
		HStack(spacing: buttonSpacing) {
			// Search button
			actionButton(
				icon: "magnifyingglass",
				tooltip: "Search",
				action: { /* TODO: open search */ }
			)

			// Command Palette button (⌘K)
			actionButton(
				icon: "command.square",
				tooltip: "Command Palette (⌘K)",
				action: { uiStore.toggleCommandPalette() }
			)

			// Settings button
			actionButton(
				icon: "gearshape",
				tooltip: "Settings",
				action: { uiStore.toggleSettings() }
			)
		}
		.swarmStaggerItem(index: 3, delay: 0.09, factor: 0.03, animation: .swarmTitleEntry)
	}

	private func actionButton(icon: String, tooltip: String, action: @escaping () -> Void) -> some View {
		Button(action: action) {
			Image(systemName: icon)
				.font(.system(size: 13, weight: .medium))
				.foregroundStyle(.swarmTextSecondary)
				.frame(width: 28, height: 28)
				.contentShape(Rectangle())
		}
		.buttonStyle(.plain)
		.glassInteractive(.glass)
		.help(tooltip)
	}

	// MARK: - Traffic Light Actions

	private func handleTrafficLightAction(_ light: TrafficLight) {
		guard let window = NSApplication.shared.keyWindow else { return }

		switch light {
		case .close:
			window.close()
		case .minimize:
			window.minimize(nil)
		case .fullscreen:
			window.toggleFullScreen(nil)
		}
	}
}

// MARK: - Traffic Light

private enum TrafficLight: String, CaseIterable {
	case close
	case minimize
	case fullscreen

	var backgroundColor: Color {
		switch self {
		case .close: return Color(red: 1.0, green: 0.24, blue: 0.24)
		case .minimize: return Color(red: 1.0, green: 0.72, blue: 0.18)
		case .fullscreen: return Color(red: 0.22, green: 0.86, blue: 0.33)
		}
	}

	var borderColor: Color {
		Color.black.opacity(0.15)
	}

	var symbolName: String {
		switch self {
		case .close: return "xmark"
		case .minimize: return "minus"
		case .fullscreen: return "arrow.up.left.and.arrow.down.right"
		}
	}

	var symbolColor: Color {
		switch self {
		case .close: return Color.black.opacity(0.65)
		case .minimize: return Color.black.opacity(0.55)
		case .fullscreen: return Color.black.opacity(0.5)
		}
	}
}

// MARK: - Ant Icon

struct AntIcon: View {
	@Environment(\.accessibilityReduceMotion) private var reduceMotion
	@State private var breathPhase: CGFloat = 0

	var body: some View {
		Image(systemName: "ant.fill")
			.font(.system(size: 14))
			.foregroundStyle(.swarmGold)
			.scaleEffect(reduceMotion ? 1.0 : 1 + 0.04 * sin(breathPhase))
			.shadow(color: .swarmGold.opacity(reduceMotion ? 0.1 : 0.15 + 0.1 * sin(breathPhase)), radius: 6, x: 0, y: 2)
			.onAppear {
				guard !reduceMotion else { return }
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
				.background {
					if isHovered || appState.isVoiceActive {
						RoundedRectangle(cornerRadius: 6)
							.fill(appState.isVoiceActive ? Color.swarmGold.opacity(0.15) : Color.swarmSurfaceHover)
					}
				}
				.scaleEffect(isHovered ? 1.05 : 1.0)
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
		.controlSize(.small)
		.frame(width: 140)
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
		.controlSize(.small)
		.frame(width: 110)
		.labelsHidden()
		.scaleEffect(isHovered ? 1.02 : 1.0)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}
