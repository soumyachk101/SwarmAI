import SwiftUI

// MARK: - Agent Pane View

struct AgentPaneView: View {
 let agent: Agent
 @Bindable var agentsStore: AgentsStore
 @State private var inputText: String = ""

 var body: some View {
 VStack(spacing: 0) {
 // Pane header
 HStack(spacing: 8) {
 // Agent icon + name
 Text(agent.agentType.icon)
 .font(.system(size: 12))

 Text(agent.name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 // Status indicator
 HStack(spacing: 4) {
 Circle()
 .fill(agent.status.color)
 .frame(width: 6, height: 6)

 Text(agent.status.rawValue)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 // Worktree badge
 if let worktree = agent.worktree {
 Text(worktree)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 // Controls
 Button {
 agentsStore.maximizePane(UUID(uuidString: agent.id.uuidString))
 } label: {
 Image(systemName: "arrow.up.left.and.arrow.down.right")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)

 Button {
 agentsStore.removeAgent(agent.id)
 } label: {
 Image(systemName: "xmark")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmSurface)

 // Terminal output
 ScrollViewReader { proxy in
 ScrollView {
 VStack(alignment: .leading, spacing: 0) {
 ForEach(Array(agent.terminalOutput.enumerated()), id: \.offset) { index, line in
 Text(line)
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 1)
 .textSelection(.enabled)
 .frame(maxWidth: .infinity, alignment: .leading)
 }
 Color.clear
 .frame(height: 1)
 .id("bottom")
 }
 }
 .onChange(of: agent.terminalOutput.count) { _, _ in
 withAnimation {
 proxy.scrollTo("bottom", anchor: .bottom)
 }
 }
 .background(.swarmCanvas)

 // Input prompt bar
 HStack(spacing: 8) {
 Text("$")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmGold)

 TextField("Enter command...", text: $inputText, axis: .vertical)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .onSubmit {
 sendCommand()
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 8)
 .background(.swarmSurface)
 .overlay(alignment: .top) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
 }
}

private extension AgentPaneView {
 func sendCommand() {
 guard !inputText.isEmpty else { return }
 // Add to terminal output
 var mutableAgent = agent
 mutableAgent.terminalOutput.append("$ \(inputText)")
 mutableAgent.terminalOutput.append("[Simulated output for: \(inputText)]")
 mutableAgent.lastActivity = Date()

 // Update in store
 if let index = agentsStore.agents.firstIndex(where: { $0.id == agent.id }) {
 agentsStore.agents[index] = mutableAgent
 }

 inputText = ""
 }
}

// MARK: - Terminal Pane View

struct TerminalPaneView: View {
 @State private var inputText: String = ""

 var body: some View {
 VStack(spacing: 0) {
 // Header
 HStack(spacing: 8) {
 Text("Terminal")
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Text("zsh")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmSurface)

 // Terminal output
 ScrollViewReader { proxy in
 ScrollView {
 VStack(alignment: .leading, spacing: 0) {
 Text("Welcome to SwarmAI Terminal\n")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 10)

 Color.clear
 .frame(height: 1)
 .id("bottom")
 }
 }
 .background(.swarmCanvas)

 // Input
 HStack(spacing: 8) {
 Text("$")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmGold)

 TextField("Enter command...", text: $inputText, axis: .vertical)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .onSubmit {
 inputText = ""
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical: 8)
 .background(.swarmSurface)
 }
 }
}
