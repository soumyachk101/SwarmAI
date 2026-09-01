import SwiftUI

// MARK: - Lead Panel (Right Dock)

struct LeadPanel: View {
 @State private var missionDirective: String = ""
 @State private var selectedMode: LeadMode = .steward
 @Bindable var agentsStore: AgentsStore

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Header
 HStack {
 Text("Lead Orchestrator")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 // Mode selector
 Picker("", selection: $selectedMode) {
 ForEach(LeadMode.allCases) { mode in
 Text(mode.rawValue).tag(mode)
 }
 }
 .pickerStyle(.segmented)
 .frame(width: 160)
 .labelsHidden()
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)

 Divider()
 .background(.swarmBorderSubtle)

 ScrollView {
 VStack(spacing: 12) {
 // Mission directive input
 VStack(alignment: .leading, spacing: 6) {
 Text("Mission Directive")
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)

 TextEditor(text: $missionDirective)
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
 }

 // Dispatch button
 Button {
 dispatchMission()
 } label: {
 HStack {
 Image(systemName: "paperplane.fill")
 .font(.swarm(.xs))

 Text("Dispatch Mission")
 .font(.swarm(.sm, weight: .medium))
 }
 .foregroundStyle(.swarmCanvas)
 .frame(maxWidth: .infinity)
 .padding(.vertical, 8)
 .background(.swarmGold)
 .cornerRadius(8)
 }
 .buttonStyle(.plain)
 .disabled(missionDirective.isEmpty)

 // Lead mode description
 Text(selectedMode.description)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)

 Divider()

 // Active leads
 if let lead = agentsStore.agents.first(where: { $0.role == .lead }) {
 LeadCard(agent: lead)
 }

 // Swarm status
 VStack(alignment: .leading, spacing: 6) {
 Text("Swarm Status")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 HStack(spacing: 16) {
 StatusItem(label: "Agents", value: "\(agentsStore.agents.count)")
 StatusItem(label: "Active", value: "\(agentsStore.agentCount(for: .running))")
 StatusItem(label: "Tasks", value: "0")
 }
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 }
 }
 .background(.swarmCanvas)
 }

 private func dispatchMission() {
 let _ = agentsStore.spawnAgent(.claudeCode, name: "Lead-\(agentsStore.agents.count + 1)")
 missionDirective = ""
 }
}

struct LeadCard: View {
 let agent: Agent

 var body: some View {
 VStack(alignment: .leading, spacing: 6) {
 HStack(spacing: 8) {
 Text(agent.agentType.icon)
 .font(.system(size: 20))

 VStack(alignment: .leading, spacing: 1) {
 Text(agent.name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Text(agent.leadMode?.rawValue ?? "")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 Spacer()

 Circle()
 .fill(agent.status.color)
 .frame(width: 8, height: 8)
 }
 .padding(10)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmSurface)
 }
 }
 }
}

struct StatusItem: View {
 let label: String
 let value: String

 var body: some View {
 VStack(spacing: 1) {
 Text(value)
 .font(.swarm(.sm, weight: .bold))
 .foregroundStyle(.swarmTextPrimary)

 Text(label)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 }
}
