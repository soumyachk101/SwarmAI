import SwiftUI
import AppKit

// MARK: - Right Dock (Rail)

public struct RightDock: View {
	@Environment(\.appState) private var appState
	@Environment(\.agentsStore) private var agentsStore

	@State private var contentAppeared: Bool = false
	@State private var isResizing: Bool = false
	@State private var dockWidth: CGFloat = 340
	@State private var collapsed: Bool = false

	private let minWidth: CGFloat = 260
	private let maxWidth: CGFloat = 520
	private let railWidth: CGFloat = 44

	private var clampedWidth: CGFloat {
		min(maxWidth, max(minWidth, dockWidth))
	}

	private var activeTab: DockTab {
		appState.activeRightTab
	}

	public init() {}

	public var body: some View {
		Group {
			if collapsed {
				railView
			} else {
				expandedView
			}
		}
		.animation(.swarmTabSwitch, value: collapsed)
		.onAppear {
			withAnimation(.easeOut(duration: 0.35).delay(0.25)) {
				contentAppeared = true
			}
		}
	}

	// MARK: - Rail View (Collapsed)

	private var railView: some View {
		VStack(spacing: 0) {
			Spacer(minLength: 0)

			ForEach(DockTab.allCases) { tab in
				railTabButton(for: tab)
					.padding(.vertical, 3)

				if tab != .reports {
					Divider()
						.background(.swarmBorder.opacity(0.3))
						.padding(.horizontal, 10)
				}
			}

			Spacer(minLength: 0)
		}
		.frame(width: railWidth)
		.background(.swarmSurface.opacity(0.95))
		.overlay(
			Rectangle()
				.fill(.swarmBorder.opacity(0.4))
				.frame(width: 1),
			alignment: .leading
		)
	}

	private func railTabButton(for tab: DockTab) -> some View {
		let isActive = activeTab == tab

		return Button {
			withAnimation(.swarmTabSwitch) {
				appState.activeRightTab = tab
				collapsed = false
			}
		} label: {
			ZStack {
				if isActive {
					RoundedRectangle(cornerRadius: 8)
						.fill(.swarmGold.opacity(0.18))
						.frame(width: 28, height: 36)
						.overlay(
							RoundedRectangle(cornerRadius: 8)
								.stroke(.swarmGold.opacity(0.5), lineWidth: 1.5)
						)
				}

				Image(systemName: tab.icon)
					.font(.system(size: 16))
					.foregroundStyle(isActive ? .swarmGold : .swarmTextSecondary)
					.frame(width: 28, height: 28)
			}
		}
		.buttonStyle(.plain)
		.help(tab.title)
		.scaleEffect(isActive ? 1.08 : 1.0)
	}

	// MARK: - Expanded View

	private var expandedView: some View {
		HStack(spacing: 0) {
			// Resize handle
			resizeHandle

			// Content
			dockContent
				.frame(width: clampedWidth)
				.background(.swarmSurface.opacity(0.95))
				.overlay(
					Rectangle()
						.fill(.swarmBorder.opacity(0.3))
						.frame(width: 1),
					alignment: .leading
				)
		}
	}

	private var resizeHandle: some View {
		Rectangle()
			.fill(Color.clear)
			.frame(width: 6)
			.contentShape(Rectangle())
			.gesture(
				DragGesture(minimumDistance: 1)
					.onChanged { value in
						isResizing = true
						dockWidth = clampedWidth - value.translation.width
						NSCursor.resizeLeftRight.push()
					}
					.onEnded { _ in
						isResizing = false
						NSCursor.pop()
					}
			)
			.onHover { hovering in
				if hovering {
					NSCursor.resizeLeftRight.push()
				} else if !isResizing {
					NSCursor.pop()
				}
			}
	}

	private var dockContent: some View {
		VStack(spacing: 0) {
			// Header
			dockHeader

			// Tab bar
			tabBar

			// Content
			tabContent
				.frame(maxWidth: .infinity, maxHeight: .infinity)
		}
		.cornerRadius(10, corners: [.topLeft, .bottomLeft])
		.shadow(color: .black.opacity(0.25), radius: 8, x: -3, y: 0)
	}

	private var dockHeader: some View {
		HStack {
			Text("Swarm Dock")
				.font(.swarm(.sm, weight: .semibold))
				.foregroundStyle(.swarmTextPrimary)

			Spacer()

			// Collapse button
			Button {
				withAnimation(.swarmTabSwitch) {
					collapsed = true
				}
			} label: {
				Image(systemName: "chevron.right")
					.font(.system(size: 11, weight: .medium))
					.foregroundStyle(.swarmTextSecondary)
					.frame(width: 22, height: 22)
			}
			.buttonStyle(.plain)
			.help("Collapse dock")
		}
		.padding(.horizontal, 12)
		.padding(.vertical, 10)
		.background(.swarmSurface.opacity(0.8))
	}

	private var tabBar: some View {
		ScrollView(.horizontal, showsIndicators: false) {
			HStack(spacing: 4) {
				ForEach(DockTab.allCases) { tab in
					let isActive = activeTab == tab

					Button {
						withAnimation(.swarmTabSwitch) {
							appState.activeRightTab = tab
						}
					} label: {
						HStack(spacing: 5) {
							Image(systemName: tab.icon)
								.font(.system(size: 13))

							if !collapsed {
								Text(tab.title)
									.font(.swarm(.xs, weight: isActive ? .medium : .regular))
							}
						}
						.foregroundStyle(isActive ? .swarmGold : .swarmTextSecondary)
						.padding(.horizontal, isActive ? 10 : 8)
						.padding(.vertical, 5)
						.background(
							RoundedRectangle(cornerRadius: 6)
								.fill(isActive ? .swarmGold.opacity(0.15) : .clear)
						)
						.overlay(
							RoundedRectangle(cornerRadius: 6)
								.stroke(isActive ? .swarmGold.opacity(0.4) : .clear, lineWidth: 1)
						)
					}
					.buttonStyle(.plain)
				}
			}
			.padding(.horizontal, 8)
		}
		.frame(height: 34)
		.background(.swarmSurface.opacity(0.6))
		.overlay(
			Rectangle()
				.fill(.swarmBorder.opacity(0.4))
				.frame(height: 1),
			alignment: .bottom
		)
	}

	@ViewBuilder
	private var tabContent: some View {
		switch activeTab {
		case .chat:
			ChatPanel()
		case .glassChat:
			GlassChatPanel()
		case .gitPanel:
			GitPanelView()
		case .snippets:
			SnippetsPanel()
		case .reports:
			ReportsPanel()
		}
	}
}

// MARK: - Corner Radius Extension

struct RectCorner: OptionSet, Sendable {
	let rawValue: UInt
	static let topLeft = RectCorner(rawValue: 1)
	static let topRight = RectCorner(rawValue: 2)
	static let bottomRight = RectCorner(rawValue: 4)
	static let bottomLeft = RectCorner(rawValue: 8)
	static let allCorners: RectCorner = [.topLeft, .topRight, .bottomRight, .bottomLeft]
}

extension View {
	func cornerRadius(_ radius: CGFloat, corners: RectCorner) -> some View {
		clipShape(RoundedCorner(radius: radius, corners: corners))
	}
}

struct RoundedCorner: Shape {
	let radius: CGFloat
	let corners: RectCorner

	func path(in rect: CGRect) -> Path {
		var path = Path()
		let topLeft = corners.contains(.topLeft)
		let topRight = corners.contains(.topRight)
		let bottomRight = corners.contains(.bottomRight)
		let bottomLeft = corners.contains(.bottomLeft)
		let minX = rect.minX
		let maxX = rect.maxX
		let minY = rect.minY
		let maxY = rect.maxY

		if topLeft {
			path.move(to: CGPoint(x: minX + radius, y: minY))
			path.addArc(
				center: CGPoint(x: minX + radius, y: minY + radius),
				radius: radius,
				startAngle: .degrees(180),
				endAngle: .degrees(270),
				clockwise: false
			)
		} else {
			path.move(to: CGPoint(x: minX, y: minY))
		}

		if topRight {
			path.addLine(to: CGPoint(x: maxX - radius, y: minY))
			path.addArc(
				center: CGPoint(x: maxX - radius, y: minY + radius),
				radius: radius,
				startAngle: .degrees(270),
				endAngle: .degrees(0),
				clockwise: false
			)
		} else {
			path.addLine(to: CGPoint(x: maxX, y: minY))
		}

		if bottomRight {
			path.addLine(to: CGPoint(x: maxX, y: maxY - radius))
			path.addArc(
				center: CGPoint(x: maxX - radius, y: maxY - radius),
				radius: radius,
				startAngle: .degrees(0),
				endAngle: .degrees(90),
				clockwise: false
			)
		} else {
			path.addLine(to: CGPoint(x: maxX, y: maxY))
		}

		if bottomLeft {
			path.addLine(to: CGPoint(x: minX + radius, y: maxY))
			path.addArc(
				center: CGPoint(x: minX + radius, y: maxY - radius),
				radius: radius,
				startAngle: .degrees(90),
				endAngle: .degrees(180),
				clockwise: false
			)
		} else {
			path.addLine(to: CGPoint(x: minX, y: maxY))
		}

		path.closeSubpath()
		return path
	}
}

// MARK: - Chat Panel (Lightweight)

public struct ChatPanel: View {
	@Environment(\.agentsStore) private var agentsStore
	@State private var messages: [DockChatMessage] = []
	@State private var inputText: String = ""
	@State private var contentAppeared: Bool = false

	public var body: some View {
		VStack(alignment: .leading, spacing: 0) {
			// Header
			HStack {
				Text("Chat")
					.font(.swarm(.sm, weight: .semibold))
					.foregroundStyle(.swarmTextPrimary)

				Spacer()

				Button {
					messages.removeAll()
				} label: {
					Image(systemName: "trash")
						.font(.swarm(.micro))
						.foregroundStyle(.swarmTextTertiary)
				}
				.buttonStyle(.plain)
			}
			.padding(.horizontal, 12)
			.padding(.vertical, 10)

			Divider()
				.background(.swarmBorderSubtle)

			// Messages
			ScrollView {
				VStack(alignment: .leading, spacing: 8) {
					if messages.isEmpty {
						emptyStateView
					} else {
						ForEach(Array(messages.enumerated()), id: \.element.id) { index, msg in
							chatBubble(msg, index: index)
						}
					}
				}
				.padding(.horizontal, 12)
				.padding(.vertical, 10)
			}
			.background(.swarmCanvas)

			// Input
			HStack(spacing: 8) {
				TextField("Type a message...", text: $inputText, axis: .vertical)
					.font(.swarm(.sm))
					.foregroundStyle(.swarmTextPrimary)
					.textFieldStyle(.plain)
					.onSubmit {
						sendMessage()
					}

				Button {
					sendMessage()
				} label: {
					Image(systemName: "arrow.up.circle.fill")
						.font(.system(size: 20))
						.foregroundStyle(inputText.isEmpty ? .swarmTextTertiary : .swarmGold)
				}
				.buttonStyle(.plain)
				.disabled(inputText.isEmpty)
			}
			.padding(.horizontal, 12)
			.padding(.vertical, 8)
			.background(.swarmSurface)
			.overlay(
				Rectangle()
					.fill(.swarmBorderSubtle)
					.frame(height: 1),
				alignment: .top
			)
		}
		.modifier(PanelEntryModifier(appeared: $contentAppeared))
		.onAppear {
			contentAppeared = false
			DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
				contentAppeared = true
				if messages.isEmpty {
					messages = [
						DockChatMessage(role: .assistant, content: "Hello! I'm SwarmAI Chat. How can I help you today?")
					]
				}
			}
		}
	}

	private var emptyStateView: some View {
		VStack(spacing: 12) {
			Image(systemName: "message.fill")
				.font(.system(size: 36))
				.foregroundStyle(.swarmGold.opacity(0.5))

			Text("Start a conversation")
				.font(.swarm(.sm))
				.foregroundStyle(.swarmTextTertiary)

			Text("Messages here are lightweight and fast -- use GlassChat for richer agent conversations")
				.font(.swarm(.xs))
				.foregroundStyle(.swarmTextTertiary.opacity(0.7))
				.multilineTextAlignment(.center)
				.padding(.horizontal, 20)
		}
		.frame(maxWidth: .infinity)
		.padding(.vertical, 40)
	}

	private func chatBubble(_ msg: DockChatMessage, index: Int) -> some View {
		let isUser = msg.role == .user
		return HStack(alignment: .top, spacing: 8) {
			if isUser { Spacer() }

			VStack(alignment: isUser ? .trailing : .leading, spacing: 2) {
				Text(msg.content)
					.font(.swarm(.xs))
					.foregroundStyle(isUser ? .swarmCanvas : .swarmTextPrimary)
					.padding(.horizontal, 10)
					.padding(.vertical, 6)
					.background {
						RoundedRectangle(cornerRadius: 10)
							.fill(isUser ? .swarmGold : .swarmSurfaceHover)
					}
					.overlay(
						RoundedRectangle(cornerRadius: 10)
							.stroke(isUser ? .swarmGold.opacity(0.3) : .swarmBorderSubtle, lineWidth: 0.5)
					)
					.frame(maxWidth: 240, alignment: isUser ? .trailing : .leading)
			}

			if !isUser { Spacer() }
		}
		.padding(.vertical, 2)
	}

	private func sendMessage() {
		let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
		guard !text.isEmpty else { return }
		messages.append(DockChatMessage(role: .user, content: text))
		inputText = ""

		// Simulated response
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
			let responses = [
				"I understand. Let me look into that for you.",
				"Great question! Here's what I think...",
				"I'll help you with that. Here are my findings.",
				"Let me analyze this and get back to you shortly."
			]
			let response = responses.randomElement() ?? responses[0]
			messages.append(DockChatMessage(role: .assistant, content: response))
		}
	}
}

// MARK: - GlassChat Panel (Rich)

public struct GlassChatPanel: View {
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.settingsStore) private var settingsStore
	@State private var messages: [LLMChatMessage] = [
		LLMChatMessage(
			role: .assistant,
			content: "Welcome to GlassChat. This panel supports full LLM-backed conversations with any connected provider. Configure your API keys in Settings to get started."
		)
	]
	@State private var inputText: String = ""
	@State private var contentAppeared: Bool = false
	@State private var isStreaming: Bool = false
	@State private var selectedProvider: Provider = Provider.anthropicPreset
	@State private var selectedModel: String = "claude-sonnet-4-20250514"
	@State private var showConfigWarning: Bool = false

	public init() {}

	public var body: some View {
		VStack(alignment: .leading, spacing: 0) {
			// Header with provider/model selection
			glassChatHeader
				.opacity(contentAppeared ? 1 : 0)
				.animation(.easeOut(duration: 0.4).delay(0.05), value: contentAppeared)

			Divider()
				.background(.swarmBorderSubtle)

			// Config warning
			if showConfigWarning {
				HStack(spacing: 8) {
					Image(systemName: "exclamationmark.triangle.fill")
						.foregroundStyle(.swarmWarning)
						.font(.swarm(.xs))
					Text("No API key configured. Add one in Settings > Providers.")
						.font(.swarm(.xs))
						.foregroundStyle(.swarmTextSecondary)
					Spacer()
					Button("Settings") {
						// Navigate to settings
					}
					.buttonStyle(.plain)
				}
				.padding(.horizontal, 12)
				.padding(.vertical, 6)
				.background(.swarmWarning.opacity(0.08))
				.overlay(
					Rectangle()
						.fill(.swarmWarning.opacity(0.2))
						.frame(height: 1),
					alignment: .top
				)
			}

			// Messages
			ScrollView {
				VStack(alignment: .leading, spacing: 8) {
					ForEach(Array(messages.enumerated()), id: \.element.id) { index, msg in
						glassChatBubble(msg, index: index)
					}

					if isStreaming {
						HStack(spacing: 6) {
							ProgressView()
								.controlSize(.small)
								.scaleEffect(0.7)
							Text("Thinking...")
								.font(.swarm(.micro))
								.foregroundStyle(.swarmTextTertiary)
						}
						.padding(.horizontal, 12)
						.padding(.vertical, 4)
					}
				}
				.padding(.horizontal, 12)
				.padding(.vertical, 10)
			}
			.background(.swarmCanvas)

			// Input bar
			HStack(spacing: 8) {
				TextField("Message GlassChat...", text: $inputText, axis: .vertical)
					.font(.swarm(.sm))
					.foregroundStyle(.swarmTextPrimary)
					.textFieldStyle(.plain)
					.disabled(isStreaming)

				Button {
					sendGlassChatMessage()
				} label: {
					Image(systemName: "arrow.up.circle.fill")
						.font(.system(size: 20))
						.foregroundStyle(inputText.isEmpty || isStreaming ? .swarmTextTertiary : .swarmGold)
				}
				.buttonStyle(.plain)
				.disabled(inputText.isEmpty || isStreaming)
			}
			.padding(.horizontal, 12)
			.padding(.vertical, 8)
			.background(.swarmSurface)
			.overlay(
				Rectangle()
					.fill(.swarmBorderSubtle)
					.frame(height: 1),
				alignment: .top
			)
		}
		.modifier(PanelEntryModifier(appeared: $contentAppeared))
		.onAppear {
			contentAppeared = false
			DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
				contentAppeared = true
				checkConfig()
			}
		}
	}

	// MARK: - Header

	private var glassChatHeader: some View {
		HStack(spacing: 8) {
			VStack(alignment: .leading, spacing: 2) {
				Text("GlassChat")
					.font(.swarm(.sm, weight: .semibold))
					.foregroundStyle(.swarmTextPrimary)

				Text("\(selectedProvider.name) / \(selectedModel)")
					.font(.swarmMono(.micro))
					.foregroundStyle(.swarmTextTertiary)
					.lineLimit(1)
			}

			Spacer()

			Menu {
				ForEach(settingsStore.apiKeys) { provider in
					Button {
						selectedProvider = provider
						selectedModel = "claude-sonnet-4-20250514"
					} label: {
						HStack {
							Text(provider.name)
							if provider.name == selectedProvider.name {
								Image(systemName: "checkmark")
							}
						}
					}
				}
			} label: {
				HStack(spacing: 4) {
					Image(systemName: "cpu.fill")
						.font(.swarm(.micro))
					Text("Provider")
						.font(.swarmMono(.micro))
				}
				.foregroundStyle(.swarmGold)
				.padding(.horizontal, 8)
				.padding(.vertical, 4)
				.background {
					RoundedRectangle(cornerRadius: 5)
						.fill(.swarmGold.opacity(0.12))
				}
			}
			.buttonStyle(.plain)

			Button {
				messages.removeAll()
				messages = [
					LLMChatMessage(role: .assistant, content: "Conversation cleared. How can I help?")
				]
			} label: {
				Image(systemName: "trash")
					.font(.swarm(.micro))
					.foregroundStyle(.swarmTextTertiary)
			}
			.buttonStyle(.plain)
		}
		.padding(.horizontal, 12)
		.padding(.vertical, 10)
	}

	// MARK: - Bubbles

	private func glassChatBubble(_ msg: LLMChatMessage, index: Int) -> some View {
		let isUser = msg.role == .user
		return HStack(alignment: .top, spacing: 8) {
			if isUser { Spacer() }

			VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
				// Role label
				Text(isUser ? "You" : selectedProvider.name)
					.font(.swarmMono(.micro))
					.foregroundStyle(isUser ? .swarmGold : .swarmTextTertiary)

				Text(msg.content)
					.font(.swarm(.xs))
					.foregroundStyle(isUser ? .swarmCanvas : .swarmTextPrimary)
					.padding(.horizontal, 10)
					.padding(.vertical, 6)
					.background {
						RoundedRectangle(cornerRadius: 10)
							.fill(isUser ? .swarmGold : .swarmSurfaceHover)
					}
					.overlay(
						RoundedRectangle(cornerRadius: 10)
							.stroke(isUser ? .swarmGold.opacity(0.3) : .swarmBorderSubtle, lineWidth: 0.5)
					)
					.frame(maxWidth: 240, alignment: isUser ? .trailing : .leading)
			}

			if !isUser { Spacer() }
		}
		.padding(.vertical, 2)
	}

	// MARK: - Actions

	private func checkConfig() {
		let hasKey = settingsStore.apiKeys.contains { !$0.apiKey.isEmpty }
		showConfigWarning = !hasKey
	}

	private func sendGlassChatMessage() {
		let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
		guard !text.isEmpty else { return }
		messages.append(LLMChatMessage(role: .user, content: text))
		inputText = ""

		guard !isStreaming else { return }
		isStreaming = true

		// Simulated streaming response
		let responseText = "This is a simulated GlassChat response. In production, this would call the LLM provider \(selectedProvider.name) with model \(selectedModel)."
		var accumulated = ""
		let chars = Array(responseText)

		DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
			_Concurrency.Task { @MainActor in
				for char in chars {
					accumulated += String(char)
					messages[messages.count - 1] = LLMChatMessage(role: .assistant, content: accumulated)
					try? await _Concurrency.Task.sleep(nanoseconds: 15_000_000)
				}
				isStreaming = false
			}
		}
	}
}

// MARK: - Chat Message Model

public struct DockChatMessage: Identifiable, Codable, Sendable, Hashable {
	public var id: UUID
	public var role: Role
	public var content: String
	public var timestamp: Date

	public init(id: UUID = UUID(), role: Role, content: String, timestamp: Date = Date()) {
		self.id = id
		self.role = role
		self.content = content
		self.timestamp = timestamp
	}

	public enum Role: String, Codable, Sendable {
		case user
		case assistant
	}
}
