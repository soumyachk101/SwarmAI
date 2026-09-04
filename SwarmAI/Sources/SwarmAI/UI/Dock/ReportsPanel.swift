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
 VStack(spacing: 16) {
 // Execution metrics — glass card
 VStack(alignment: .leading, spacing: 6) {
 Text("Execution Metrics")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 MetricRow(
 label: "Total Sessions",
 value: "\(agentsStore.agents.count)",
 icon: "cpu.fill",
 appeared: contentAppeared,
 delay: 0.10
 )
 MetricRow(
 label: "Tokens Used",
 value: "\(agentsStore.agents.reduce(0) { $0 + $1.tokenUsage.total })",
 icon: "text.alignleft",
 appeared: contentAppeared,
 delay: 0.15
 )
 MetricRow(
 label: "Avg Duration",
 value: "2.4m",
 icon: "clock.fill",
 appeared: contentAppeared,
 delay: 0.20
 )
 MetricRow(
 label: "Tasks Completed",
 value: "\(taskStore.tasks.filter { $0.status == .done }.count)",
 icon: "checkmark.circle.fill",
 appeared: contentAppeared,
 delay: 0.25
 )
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface)
 }
 .overlay {
 RoundedRectangle(cornerRadius: 10)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }

 Divider()
 .background(.swarmBorderSubtle)

 // Cost breakdown — glass card
 VStack(alignment: .leading, spacing: 8) {
 Text("Cost Breakdown")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 if agentsStore.agents.isEmpty {
 Text("No active agent sessions")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .padding(.vertical, 4)
 } else {
 ForEach(Array(agentsStore.agents.enumerated()), id: \.element.id) { index, agent in
 CostBar(
 agent: agent,
 appeared: contentAppeared,
 delay: 0.20 + Double(index) * 0.04
 )
 }
 }

 // Action buttons with glassInteractive hover effects
 HStack(spacing: 8) {
 Button {
 // Placeholder export action
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "arrow.down.to.line")
 .font(.swarm(.micro))
 Text("Export CSV")
 .font(.swarm(.micro, weight: .medium))
 }
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmSurface)
 }
 }
 .buttonStyle(.plain)

 Button {
 // Placeholder refresh action
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "arrow.clockwise")
 .font(.swarm(.micro))
 Text("Refresh")
 .font(.swarm(.micro, weight: .medium))
 }
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmSurface)
 }
 }
 .buttonStyle(.plain)
 }
 .padding(.top, 4)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface)
 }
 .overlay {
 RoundedRectangle(cornerRadius: 10)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }

 Divider()
 .background(.swarmBorderSubtle)

 // Event stream — glass card
 VStack(alignment: .leading, spacing: 6) {
 Text("Recent Events")
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 EventRow(
 icon: "play.circle",
 text: "Worker-1 started",
 time: "2m ago",
 appeared: contentAppeared,
 delay: 0.28
 )
 EventRow(
 icon: "checkmark.circle",
 text: "Task completed",
 time: "5m ago",
 appeared: contentAppeared,
 delay: 0.32
 )
 EventRow(
 icon: "exclamationmark.triangle",
 text: "Worker-2 error",
 time: "8m ago",
 appeared: contentAppeared,
 delay: 0.36
 )
 EventRow(
 icon: "arrow.triangle.branch",
 text: "Git push to main",
 time: "12m ago",
 appeared: contentAppeared,
 delay: 0.40
 )
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface)
 }
 .overlay {
 RoundedRectangle(cornerRadius: 10)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background(.swarmCanvas)
 }
 .modifier(PanelEntryModifier(appeared: $contentAppeared))
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
 let appeared: Bool
 let delay: Double

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
 .modifier(RowEntryModifier(appeared: appeared, delay: delay))
 }
}

struct CostBar: View {
 let agent: Agent
 let appeared: Bool
 let delay: Double

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
 .modifier(RowEntryModifier(appeared: appeared, delay: delay))
 }
}

struct EventRow: View {
 let icon: String
 let text: String
 let time: String
 let appeared: Bool
 let delay: Double

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
 .modifier(RowEntryModifier(appeared: appeared, delay: delay))
 }
}
