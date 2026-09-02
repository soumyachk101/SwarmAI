import SwiftUI

// MARK: - Reports Panel

struct ReportsPanel: View {
 @Environment(\.agentsStore) private var agentsStore
 @Environment(\.taskStore) private var taskStore
 @State private var contentAppeared = false

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 HStack {
 Text("Reports")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .overlay(alignment: .bottom) {
 Rectangle()
 .fill(.swarmGold)
 .frame(height: 1.5)
 .frame(width: contentAppeared ? 40 : 0, alignment: .center)
 .animation(.easeOut(duration: 0.5), value: contentAppeared)
 }
 .opacity(contentAppeared ? 1 : 0)
 .animation(.easeOut(duration: 0.4).delay(0.05), value: contentAppeared)

 Divider()
 .background(.swarmBorderSubtle)

 ScrollView {
 VStack(spacing: 12) {
 // Execution metrics
 VStack(alignment: .leading, spacing: 8) {
 Text("Execution Metrics")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 MetricRow(label: "Total Sessions", value: "\(agentsStore.agents.count)", icon: "cpu.fill")
 MetricRow(label: "Tokens Used", value: "\(agentsStore.agents.reduce(0) { $0 + $1.tokenUsage.total })", icon: "text.alignleft")
 MetricRow(label: "Avg Duration", value: "2.4m", icon: "clock.fill")
 MetricRow(label: "Tasks Completed", value: "\(taskStore.tasks.filter { $0.status == .done }.count)", icon: "checkmark.circle.fill")
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)

 Divider()
 .background(.swarmBorderSubtle)

 // Cost breakdown
 VStack(alignment: .leading, spacing: 8) {
 Text("Cost Breakdown")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 ForEach(Array(agentsStore.agents.enumerated()), id: \.element.id) { index, agent in
 CostBar(agent: agent)
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)

 Divider()
 .background(.swarmBorderSubtle)

 // Event stream
 VStack(alignment: .leading, spacing: 8) {
 Text("Recent Events")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 EventRow(icon: "play.circle", text: "Worker-1 started", time: "2m ago")
 EventRow(icon: "checkmark.circle", text: "Task completed", time: "5m ago")
 EventRow(icon: "exclamationmark.triangle", text: "Worker-2 error", time: "8m ago")
 EventRow(icon: "arrow.triangle.branch", text: "Git push to main", time: "12m ago")
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background(.swarmCanvas)
 }
 .modifier(PanelEntryModifier(appeared: contentAppeared))
 .onAppear {
 contentAppeared = false
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
 contentAppeared = true
 }
 }
 }
}

struct MetricRow: View {
 let label: String
 let value: String
 let icon: String
 @State private var rowAppeared = false

 var body: some View {
 HStack(spacing: 8) {
 Image(systemName: icon)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)

 Text(label)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextSecondary)

 Spacer()

 Text(value)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 }
 .modifier(RowEntryModifier(appeared: $rowAppeared, delay: 0.15))
 }
}

struct CostBar: View {
 let agent: Agent
 @State private var barAppeared = false

 var body: some View {
 HStack(spacing: 8) {
 // Agent color indicator
 Circle()
 .fill(agent.agentType.brandColor)
 .frame(width: 8, height: 8)

 Text(agent.name)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 .frame(width: 80, alignment: .leading)

 // Cost bar
 let cost = Double(agent.tokenUsage.total) / 100000.0
 let clampedCost = min(max(cost, 0), 1.0)

 GeometryReader { geo in
 RoundedRectangle(cornerRadius: 3)
 .fill(.swarmSurfaceHover)
 .frame(height: 6)

 RoundedRectangle(cornerRadius: 3)
 .fill(agent.agentType.brandColor)
 .frame(width: geo.size.width * clampedCost, height: 6)
 }

 Text("$\(String(format: "%.2f", cost))")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .frame(width: 40, alignment: .trailing)
 }
 .padding(.vertical, 2)
 .modifier(RowEntryModifier(appeared: $barAppeared, delay: 0.22))
 }
}

struct EventRow: View {
 let icon: String
 let text: String
 let time: String
 @State private var rowAppeared = false

 var body: some View {
 HStack(spacing: 8) {
 Image(systemName: icon)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)

 Text(text)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)

 Spacer()

 Text(time)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .padding(.vertical, 2)
 .modifier(RowEntryModifier(appeared: $rowAppeared, delay: 0.28))
 }
}
