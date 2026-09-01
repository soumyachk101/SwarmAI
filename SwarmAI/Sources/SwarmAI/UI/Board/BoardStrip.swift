import SwiftUI

// MARK: - Board Strip (Tab Bar for open panes)

struct BoardStrip: View {
 @Bindable var agentsStore: AgentsStore

 var body: some View {
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 4) {
 // Active pane tabs
 ForEach(agentsStore.agents.prefix(8)) { agent in
 BoardStripTab(agent: agent, isActive: agentsStore.activePaneId == agent.id.uuidString)
 }

 // Add pane button
 Button {
 agentsStore.spawnAgent(.claudeCode)
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "plus")
 .font(.swarm(.micro))

 Text("Add Pane")
 .font(.swarm(.micro))
 }
 .foregroundStyle(.swarmTextTertiary)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 12)
 }
 .padding(.vertical, 4)
 .background(.swarmSurface)
 .overlay(alignment: .bottom) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}

struct BoardStripTab: View {
 let agent: Agent
 var isActive: Bool = false

 var body: some View {
 Button {
 // Activate this pane
 } label: {
 HStack(spacing: 6) {
 Text(agent.agentType.icon)
 .font(.swarm(.xs))

 Text(agent.name)
 .font(.swarm(.xs, weight: isActive ? .medium : .regular))
 .foregroundStyle(isActive ? .swarmGold : .swarmTextSecondary)
 .lineLimit(1)

 Button { } label: {
 Image(systemName: "xmark")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(isActive ? .swarmGold.opacity(0.15) : .swarmSurface)
 .overlay {
 RoundedRectangle(cornerRadius: 6)
 .stroke(isActive ? .swarmGold : .swarmBorderSubtle, lineWidth: 1)
 }
 }
 }
 .buttonStyle(.plain)
 }
}
