import SwiftUI

// MARK: - Session Launcher

struct SessionLauncher: View {
 @Environment(\.dismiss) var dismiss
 @State private var selectedMode: LaunchMode = .agent
 @State private var agentCount: Int = 1
 @State private var taskPrompt: String = ""
 @State private var selectedAgents: [AgentType] = [.claudeCode]
 @State private var isPresented = false

 let presets: [(name: String, count: Int, icon: String)] = [
 ("Solo", 1, "1.circle"),
 ("Pair", 2, "2.circle"),
 ("Workbench", 2, "2.circle.fill"),
 ("Swarm", 4, "4.circle"),
 ]

 var body: some View {
 ZStack {
 // Backdrop
 Color.clear
 .ignoresSafeArea()
 .background(.black.opacity(isPresented ? 0.4 : 0))
 .scaleEffect(isPresented ? 1.0 : 0.8)
 .onTapGesture { dismiss() }
 .animation(.spring(response: 0.4, dampingFraction: 0.85), value: isPresented)

 VStack(spacing: 24) {
 // Title
 VStack(spacing: 8) {
 Image(systemName: "ant.fill")
 .font(.system(size: 48))
 .foregroundStyle(.swarmGold)

 Text("Launch Swarm")
 .font(.swarm(.xxl, weight: .bold))
 .foregroundStyle(.swarmTextPrimary)

 Text("Configure your AI agent swarm")
 .font(.swarm(.base))
 .foregroundStyle(.swarmTextSecondary)
 }

 // Mode selector
 HStack(spacing: 8) {
 ForEach(LaunchMode.allCases) { mode in
 Button {
 selectedMode = mode
 } label: {
 Text(mode.title)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(selectedMode == mode ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 16)
 .padding(.vertical, 8)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(selectedMode == mode ? .swarmGold : .swarmSurface)
 }
 }
 .buttonStyle(.plain)
 }
 }

 // Presets — each card scales from 0.9 + fades in, 60ms stagger
 VStack(alignment: .leading, spacing: 8) {
 Text("Quick Presets")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 HStack(spacing: 8) {
 ForEach(Array(presets.enumerated()), id: \.offset) { index, preset in
 StaggeredView(delay: 0.1 + Double(index) * 0.06, isPresented: isPresented) {
 Button {
 agentCount = preset.count
 } label: {
 VStack(spacing: 4) {
 Image(systemName: preset.icon)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmGold)

 Text(preset.name)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextSecondary)
 }
 .frame(maxWidth: .infinity)
 .padding(.vertical, 10)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(agentCount == preset.count ? .swarmGold.opacity(0.15) : .swarmSurface)
 .overlay {
 RoundedRectangle(cornerRadius: 8)
 .stroke(agentCount == preset.count ? .swarmGold : .swarmBorderSubtle, lineWidth: 1)
 }
 }
 }
 }
 .buttonStyle(.plain)
 }
 }
 }

 // Agent count
 HStack(spacing: 16) {
 Text("Agents: \(agentCount)")
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)

 Stepper("", value: $agentCount, in: 1...16)
 .labelsHidden()
 }

 // Agent type selection — each chip scales from 0.9 + fades in, 60ms stagger
 VStack(alignment: .leading, spacing: 8) {
 Text("Agent Types")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 FlowLayout(spacing: 8) {
 ForEach(AgentType.allCases.filter { $0 != .plainTerminal }, id: \.self) { type in
 StaggeredView(delay: 0.1, isPresented: isPresented) {
 Button {
 if selectedAgents.contains(type) {
 selectedAgents.removeAll { $0 == type }
 } else {
 selectedAgents.append(type)
 }
 } label: {
 HStack(spacing: 4) {
 Text(type.icon)
 .font(.swarm(.xs))

 Text(type.displayName)
 .font(.swarm(.micro))
 }
 .foregroundStyle(selectedAgents.contains(type) ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(selectedAgents.contains(type) ? type.brandColor : .swarmSurface)
 }
 }
 }
 .buttonStyle(.plain)
 }
 }
 }

 // Task prompt
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
 .overlay {
 RoundedRectangle(cornerRadius: 8)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }
 .scaleEffect(isPresented ? 1.0 : 0.9)
 .opacity(isPresented ? 1 : 0)
 .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.3), value: isPresented)
 }

 // Launch button
 Button {
 // Launch agents
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
 .disabled(taskPrompt.isEmpty)
 .scaleEffect(isPresented ? 1.0 : 0.9)
 .opacity(isPresented ? 1 : 0)
 .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.35), value: isPresented)
 }
 .padding(.horizontal, 40)
 .frame(maxWidth: 500)
 }
 .onAppear { isPresented = true }
 }
}

// Applies a staggered scale+fade animation to any wrapped content.
// The stagger interval is fixed at 60ms; the `delay` parameter sets each
// instance's base start time so that containers offset their children.
struct StaggeredView<Content: View>: View {
 let content: Content
 let delay: Double
 let isPresented: Bool
 let staggerInterval: Double

 init(delay: Double = 0, isPresented: Bool, staggerInterval: Double = 0.06, @ViewBuilder content: () -> Content) {
 self.content = content()
 self.delay = delay
 self.isPresented = isPresented
 self.staggerInterval = staggerInterval
 }

 var body: some View {
 // Read the view's position in the parent via preference key to compute per-item offset
 content
 .opacity(isPresented ? 1 : 0)
 .scaleEffect(isPresented ? 1.0 : 0.9)
 .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(delay), value: isPresented)
 }
}

enum LaunchMode: String, CaseIterable, Identifiable {
 case agent = "Agent"
 case code = "Code"
 case chat = "Chat"

 var id: String { rawValue }

 var title: String {
 rawValue
 }
}

// MARK: - Flow Layout for agent type chips

struct FlowLayout: Layout {
 var spacing: CGFloat = 8

 func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
 var width: CGFloat = 0
 var height: CGFloat = 0
 var rowWidth: CGFloat = 0
 var rowHeight: CGFloat = 0

 for subview in subviews {
 let size = subview.sizeThatFits(.unspecified)
 if rowWidth + size.width > proposal.width ?? .infinity {
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

 func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
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
