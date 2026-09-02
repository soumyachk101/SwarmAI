import SwiftUI

// MARK: - Fleet Tab

struct FleetTab: View {
 @Environment(\.agentsStore) private var agentsStore

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

 HStack(spacing: 4) {
 Circle()
 .fill(agent.status.color)
 .frame(width: 6, height: 6)

 Text(agent.status.displayName)
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
