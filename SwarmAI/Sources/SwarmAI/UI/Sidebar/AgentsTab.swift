import SwiftUI

// MARK: - Agents Tab

struct AgentsTab: View {
 @Bindable var agentsStore: AgentsStore
 @State private var selectedAgentType: AgentType = .claudeCode

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Header
 HStack {
 Text("Agents")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Button {
 agentsStore.spawnAgent(selectedAgentType)
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "plus")
 .font(.swarm(.xs))
 Text("New")
 .font(.swarm(.xs))
 }
 .foregroundStyle(.swarmGold)
 }
 .buttonStyle(.plain)
 .help("Spawn new agent")
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)

 Divider()
 .background(.swarmBorderSubtle)

 // Agent type selector
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 4) {
 ForEach(AgentType.allCases) { type in
 Button {
 selectedAgentType = type
 } label: {
 Text(type.displayName)
 .font(.swarm(.micro, weight: .medium))
 .foregroundStyle(selectedAgentType == type ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 4)
 .fill(selectedAgentType == type ? type.brandColor : .swarmSurface)
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 12)
 }
 }
 .padding(.vertical, 8)

 Divider()
 .background(.swarmBorderSubtle)

 // Agent list
 if agentsStore.agents.isEmpty {
 ContentUnavailableView(
 "No Agents",
 systemImage: "cpu",
 description: Text("Click New to spawn your first agent")
 )
 .padding(.top, 40)
 } else {
 ScrollView {
 VStack(spacing: 2) {
 ForEach(agentsStore.agents) { agent in
 AgentListRow(agent: agent)
 }
 }
 .padding(.horizontal, 8)
 .padding(.top, 4)
 }
 }
 }
 .background(.swarmCanvas)
 }
}

struct AgentListRow: View {
 let agent: Agent

 var body: some View {
 HStack(spacing: 8) {
 // Status indicator
 Circle()
 .fill(agent.status.color)
 .frame(width: 8, height: 8)

 // Agent type icon
 Text(agent.agentType.icon)
 .font(.swarm(.xs))

 // Name and info
 VStack(alignment: .leading, spacing: 1) {
 Text(agent.name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Text("\(agent.agentType.displayName) • \(agent.status.rawValue)")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 Spacer()

 // Role badge if Lead
 if agent.role == .lead {
 Text("LEAD")
 .font(.swarm(.micro, weight: .bold))
 .foregroundStyle(.swarmGold)
 .padding(.horizontal, 4)
 .padding(.vertical, 1)
 .background {
 RoundedRectangle(cornerRadius: 3)
 .stroke(.swarmGold, lineWidth: 0.5)
 }
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 }

private extension AgentStatus {
 var color: Color {
 switch self {
 case .idle: return .swarmTextTertiary
 case .launching: return .swarmWarning
 case .running: return .swarmSuccess
 case .error: return .swarmError
 case .done: return .swarmInfo
 case .terminating: return .swarmWarning
 }
}

struct AgentListRow: View {

struct FleetTab: View {
 @Bindable var agentsStore: AgentsStore

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 HStack {
 Text("Swarm Fleet")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)

 Divider()
 .background(.swarmBorderSubtle)

 // Fleet overview
 ScrollView {
 VStack(spacing: 12) {
 // Fleet stats
 HStack(spacing: 12) {
 FleetStatCard(title: "Total", count: agentsStore.agents.count, color: .swarmInfo)
 FleetStatCard(title: "Running", count: agentsStore.agentCount(for: .running), color: .swarmSuccess)
 FleetStatCard(title: "Idle", count: agentsStore.agentCount(for: .idle), color: .swarmTextTertiary)
 FleetStatCard(title: "Errors", count: agentsStore.agentCount(for: .error), color: .swarmError)
 }
 .padding(.horizontal, 12)

 // Agent grid
 if agentsStore.agents.isEmpty {
 ContentUnavailableView(
 "No Agents in Fleet",
 systemImage: "antenna.radiowaves.left.and.right",
 description: Text("Spawn agents to see them here")
 )
 .padding(.top, 20)
 } else {
 LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 8)], spacing: 8) {
 ForEach(agentsStore.agents) { agent in
 AgentCard(agent: agent)
 }
 }
 .padding(.horizontal, 12)
 }
 }
 }
 .background(.swarmCanvas)
 }
}

struct FleetStatCard: View {
 let title: String
 let count: Int
 let color: Color

 var body: some View {
 VStack(spacing: 2) {
 Text("\(count)")
 .font(.swarm(.xl, weight: .bold))
 .foregroundStyle(color)

 Text(title)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .frame(maxWidth: .infinity)
 .padding(.vertical, 8)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmSurface)
 .overlay {
 RoundedRectangle(cornerRadius: 8)
 .stroke(color.opacity(0.3), lineWidth: 1)
 }
 }
 }
}

struct AgentCard: View {
 let agent: Agent

 var body: some View {
 VStack(spacing: 6) {
 // Agent icon
 ZStack {
 RoundedRectangle(cornerRadius: 8)
 .fill(agent.agentType.brandColor.opacity(0.15))

 Text(agent.agentType.icon)
 .font(.system(size: 24))
 }
 .frame(height: 40)

 Text(agent.name)
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 .lineLimit(1)

 Text(agent.agentType.displayName)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)

 // Status
 HStack(spacing: 4) {
 Circle()
 .fill(agent.statusColor)
 .frame(width: 6, height: 6)

 Text(agent.status.rawValue)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 }
 .padding(8)
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface)
 }
 }
}
