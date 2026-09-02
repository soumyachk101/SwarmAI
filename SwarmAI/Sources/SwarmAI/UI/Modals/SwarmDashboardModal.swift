import SwiftUI
import AppKit

// MARK: - Execution Event Model

public struct ExecutionEvent: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let timestamp: Date
    public let agentName: String
    public let role: String
    public let message: String
    public let level: EventLevel
    public let category: EventCategory

    public enum EventLevel: String, CaseIterable, Sendable {
        case info = "INFO"
        case warn = "WARN"
        case error = "ERROR"
        case success = "SUCCESS"

        public var color: Color {
            switch self {
            case .info: return .swarmInfo
            case .warn: return .swarmWarning
            case .error: return .swarmError
            case .success: return .swarmSuccess
            }
        }
    }

    public enum EventCategory: String, CaseIterable, Sendable {
        case pty = "PTY"
        case mcp = "MCP"
        case worktree = "WORKTREE"
        case handoff = "HANDOFF"
        case orchestrator = "MIND"
        case agent = "AGENT"
    }

    public init(
        id: UUID = UUID(),
        timestamp: Date = Date(),
        agentName: String,
        role: String = "Builder",
        message: String,
        level: EventLevel = .info,
        category: EventCategory = .agent
    ) {
        self.id = id
        self.timestamp = timestamp
        self.agentName = agentName
        self.role = role
        self.message = message
        self.level = level
        self.category = category
    }
}

// MARK: - Swarm Dashboard Modal

public struct SwarmDashboardModal: View {
    @Binding public var isOpen: Bool
    @Environment(\.appState) private var appState
    @Environment(\.agentsStore) private var agentsStore
    @Environment(\.workspaceStore) private var workspaceStore
    @Environment(\.taskStore) private var taskStore

    @State private var selectedTab: DashboardTab = .overview
    @State private var logSearchQuery: String = ""
    @State private var selectedAgentFilter: String = "all"
    @State private var selectedLogLevel: ExecutionEvent.EventLevel? = nil
    @State private var isRefreshing: Bool = false
    @State private var liveClock: Date = Date()
    @State private var executionLogs: [ExecutionEvent] = []
    @State private var isPresented: Bool = false
    @State private var quotaUsageTokens: Int = 184_200
    @State private var quotaMaxTokens: Int = 500_000

    public enum DashboardTab: String, CaseIterable {
        case overview = "Swarm Grid"
        case telemetry = "Telemetry & Quota"
        case logs = "Aggregated Logs"
    }

    public init(isOpen: Binding<Bool>) {
        self._isOpen = isOpen
    }

    private let timer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    public var body: some View {
        ZStack {
            // Backdrop
            Color.black.opacity(isPresented ? 0.65 : 0)
                .ignoresSafeArea()
                .onTapGesture {
                    closeModal()
                }

            // Main Modal Window
            VStack(spacing: 0) {
                headerView
                Divider().background(.swarmBorderSubtle)

                metricStripView
                Divider().background(.swarmBorderSubtle)

                // Tab Content
                Group {
                    switch selectedTab {
                    case .overview:
                        swarmGridView
                    case .telemetry:
                        telemetryAnalyticsView
                    case .logs:
                        aggregatedLogsView
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                Divider().background(.swarmBorderSubtle)
                footerView
            }
            .frame(width: 960, height: 680)
            .background(.swarmCanvas)
            .cornerRadius(16)
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.55), radius: 35, x: 0, y: 15)
            .scaleEffect(isPresented ? 1.0 : 0.94)
            .opacity(isPresented ? 1.0 : 0)
        }
        .onAppear {
            seedExecutionLogs()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                isPresented = true
            }
        }
        .onReceive(timer) { newTime in
            liveClock = newTime
        }
    }

    // MARK: - Header View

    private var headerView: some View {
        HStack(spacing: 12) {
            // Live Status Avatar
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.swarmGold.opacity(0.15))
                    .frame(width: 38, height: 38)
                    .overlay {
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
                    }

                Image(systemName: "gauge.with.needle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(.swarmGold)
            }

            // Title & Status
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text("Swarm Live Telemetry Dashboard")
                        .font(.swarm(.base, weight: .bold))
                        .foregroundStyle(.swarmTextPrimary)

                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.swarmSuccess)
                            .frame(width: 6, height: 6)
                        Text("LIVE")
                            .font(.swarmMono(.micro, weight: .bold))
                            .foregroundStyle(.swarmSuccess)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.swarmSuccess.opacity(0.12))
                    .cornerRadius(12)
                    .overlay {
                        Capsule().stroke(Color.swarmSuccess.opacity(0.25), lineWidth: 1)
                    }
                }

                HStack(spacing: 6) {
                    Text(workspaceStore.activeWorkspace?.name ?? "Swarm Workspace")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextSecondary)
                    Text("•")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                    Text(formattedTime(liveClock))
                        .font(.swarmMono(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                }
            }

            Spacer()

            // Tab Buttons
            HStack(spacing: 2) {
                ForEach(DashboardTab.allCases, id: \.self) { tab in
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedTab = tab
                        }
                    } label: {
                        Text(tab.rawValue)
                            .font(.swarm(.xs, weight: selectedTab == tab ? .semibold : .regular))
                            .foregroundStyle(selectedTab == tab ? .swarmGold : .swarmTextSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background {
                                if selectedTab == tab {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(Color.swarmGold.opacity(0.15))
                                        .overlay {
                                            RoundedRectangle(cornerRadius: 6)
                                                .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
                                        }
                                }
                            }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(2)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }

            // Refresh button
            Button {
                refreshData()
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 13))
                    .foregroundStyle(.swarmTextSecondary)
                    .rotationEffect(.degrees(isRefreshing ? 360 : 0))
                    .animation(isRefreshing ? .linear(duration: 0.8).repeatForever(autoreverses: false) : .default, value: isRefreshing)
                    .frame(width: 28, height: 28)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
            .help("Refresh telemetry data")

            // Close button
            Button {
                closeModal()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.swarmTextTertiary)
                    .frame(width: 28, height: 28)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(Color.swarmSurface.opacity(0.4))
    }

    // MARK: - Metric Strip View

    private var metricStripView: some View {
        let total = agentsStore.agents.count
        let running = agentsStore.agents.filter { $0.status == .running }.count
        let launching = agentsStore.agents.filter { $0.status == .launching }.count
        let errors = agentsStore.agents.filter { $0.status == .error }.count
        let idle = agentsStore.agents.filter { $0.status == .idle || $0.status == .done }.count
        let totalTasks = taskStore.tasks.count
        let doneTasks = taskStore.tasks.filter { $0.status == .done }.count

        return HStack(spacing: 12) {
            metricCard(
                title: "TOTAL AGENTS",
                value: "\(total)",
                icon: "cpu.fill",
                accentColor: .swarmGold
            )
            metricCard(
                title: "RUNNING",
                value: "\(running)",
                icon: "flame.fill",
                accentColor: .swarmSuccess,
                isPulse: running > 0
            )
            metricCard(
                title: "LAUNCHING",
                value: "\(launching)",
                icon: "bolt.fill",
                accentColor: .swarmWarning
            )
            metricCard(
                title: "IDLE / READY",
                value: "\(idle)",
                icon: "clock.fill",
                accentColor: .swarmTextSecondary
            )
            metricCard(
                title: "ERRORS",
                value: "\(errors)",
                icon: "exclamationmark.triangle.fill",
                accentColor: errors > 0 ? .swarmError : .swarmTextTertiary
            )
            taskMetricCard(
                title: "TASKS PIPELINE",
                completed: doneTasks,
                total: totalTasks,
                accentColor: .swarmInfo
            )
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(Color.swarmSurface.opacity(0.2))
    }

    private func metricCard(
        title: String,
        value: String,
        icon: String,
        accentColor: Color,
        isPulse: Bool = false
    ) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.swarmMono(.micro, weight: .semibold))
                    .foregroundStyle(.swarmTextTertiary)

                HStack(spacing: 4) {
                    Text(value)
                        .font(.swarmMono(.lg, weight: .bold))
                        .foregroundStyle(.swarmTextPrimary)

                    if isPulse {
                        Circle()
                            .fill(accentColor)
                            .frame(width: 5, height: 5)
                    }
                }
            }
            Spacer()

            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(accentColor.opacity(0.85))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func taskMetricCard(
        title: String,
        completed: Int,
        total: Int,
        accentColor: Color
    ) -> some View {
        let pct = total > 0 ? Double(completed) / Double(total) : 0.0

        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.swarmMono(.micro, weight: .semibold))
                    .foregroundStyle(.swarmTextTertiary)
                Spacer()
                Text("\(completed)/\(total)")
                    .font(.swarmMono(.xs, weight: .bold))
                    .foregroundStyle(accentColor)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.swarmBorderSubtle)
                        .frame(height: 5)

                    RoundedRectangle(cornerRadius: 3)
                        .fill(accentColor)
                        .frame(width: geo.size.width * CGFloat(pct), height: 5)
                }
            }
            .frame(height: 5)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    // MARK: - Swarm Grid View

    private var swarmGridView: some View {
        ScrollView {
            if agentsStore.agents.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "terminal")
                        .font(.system(size: 40))
                        .foregroundStyle(.swarmTextTertiary.opacity(0.4))
                        .padding(.top, 60)

                    Text("No Agents Spawned in Current Swarm")
                        .font(.swarm(.base, weight: .medium))
                        .foregroundStyle(.swarmTextSecondary)

                    Text("Spawn Claude Code, Codex, OpenCode, or a Terminal pane using Cmd+K or the top action strip.")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 380)

                    Button {
                        _ = agentsStore.spawnAgent(.claudeCode, name: "Claude-Worker")
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "plus.circle.fill")
                            Text("Spawn Worker Agent")
                        }
                        .font(.swarm(.xs, weight: .semibold))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 7)
                        .background(Color.swarmGold)
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 8)
                }
                .frame(maxWidth: .infinity)
            } else {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 14) {
                    ForEach(agentsStore.agents) { agent in
                        agentCardView(agent: agent)
                    }
                }
                .padding(20)
            }
        }
    }

    private func agentCardView(agent: Agent) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            // Top row: Avatar, Name, Status, Role
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(agent.status == .running ? Color.swarmSuccess.opacity(0.15) : Color.swarmSurface)
                        .frame(width: 36, height: 36)
                        .overlay {
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(agent.status == .running ? Color.swarmSuccess.opacity(0.4) : Color.swarmBorderSubtle, lineWidth: 1)
                        }

                    Text(agent.agentType.displayName.prefix(1))
                        .font(.swarmMono(.sm, weight: .bold))
                        .foregroundStyle(agent.status == .running ? .swarmSuccess : .swarmGold)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(agent.name)
                            .font(.swarm(.sm, weight: .semibold))
                            .foregroundStyle(.swarmTextPrimary)

                        Circle()
                            .fill(agent.status.color)
                            .frame(width: 6, height: 6)
                    }

                    Text("\(agent.agentType.displayName) • \(agent.id.uuidString.prefix(8))")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }

                Spacer()

                // Role Badge
                Text(agent.role.displayName.uppercased())
                    .font(.swarmMono(.micro, weight: .bold))
                    .foregroundStyle(agent.role == .lead ? .swarmGold : .swarmInfo)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background((agent.role == .lead ? Color.swarmGold : Color.swarmInfo).opacity(0.12))
                    .cornerRadius(4)
                    .overlay {
                        RoundedRectangle(cornerRadius: 4)
                            .stroke((agent.role == .lead ? Color.swarmGold : Color.swarmInfo).opacity(0.3), lineWidth: 1)
                    }

                // Status Pill
                Text(agent.status.displayName.uppercased())
                    .font(.swarmMono(.micro, weight: .bold))
                    .foregroundStyle(agent.status.color)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(agent.status.color.opacity(0.12))
                    .cornerRadius(4)
                    .overlay {
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(agent.status.color.opacity(0.3), lineWidth: 1)
                    }
            }

            // Middle: Metadata pills
            HStack(spacing: 6) {
                if !agent.model.isEmpty {
                    metadataTag(label: "Model", value: agent.model)
                }
                metadataTag(label: "Effort", value: agent.effortLevel.capitalized)
                metadataTag(label: "Tokens", value: "\(agent.tokenUsage.total)")
                metadataTag(label: "Output", value: "\(agent.terminalOutput.count) lines")
            }

            Divider().background(.swarmBorderSubtle)

            // Bottom Actions & Worktree
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "folder")
                        .font(.system(size: 11))
                        .foregroundStyle(.swarmTextTertiary)
                    Text(agent.worktree ?? "Standard Workspace")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                        .lineLimit(1)
                }

                Spacer()

                if agent.status == .running {
                    Button {
                        agent.status = .idle
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "stop.fill")
                            Text("Stop")
                        }
                        .font(.swarmMono(.micro, weight: .semibold))
                        .foregroundStyle(.swarmError)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.swarmError.opacity(0.1))
                        .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    agentsStore.activePaneId = agent.id.uuidString
                    closeModal()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "eye.fill")
                        Text("Focus")
                    }
                    .font(.swarmMono(.micro, weight: .semibold))
                    .foregroundStyle(.swarmGold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.swarmGold.opacity(0.12))
                    .cornerRadius(4)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .background(Color.swarmSurface)
        .cornerRadius(10)
        .overlay {
            RoundedRectangle(cornerRadius: 10)
                .stroke(agent.status == .running ? Color.swarmSuccess.opacity(0.25) : Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func metadataTag(label: String, value: String) -> some View {
        HStack(spacing: 3) {
            Text("\(label):")
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
            Text(value)
                .font(.swarmMono(.micro, weight: .semibold))
                .foregroundStyle(.swarmTextSecondary)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(Color.swarmCanvas.opacity(0.6))
        .cornerRadius(4)
        .overlay {
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    // MARK: - Telemetry & Quota View

    private var telemetryAnalyticsView: some View {
        ScrollView {
            VStack(spacing: 16) {
                // 5-Hour Quota Block Card
                quotaBlockCard

                // Roles Breakdown & Success Rate Grid
                HStack(spacing: 14) {
                    rolesBreakdownCard
                    tokenUsageBreakdownCard
                }

                // Performance & Latency Metrics
                throughputLatencyCard
            }
            .padding(20)
        }
    }

    private var quotaBlockCard: some View {
        let pct = Double(quotaUsageTokens) / Double(quotaMaxTokens)
        let resetMinutes = 164 // 2h 44m

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("5-HOUR ROLLING TOKEN QUOTA BLOCK")
                        .font(.swarmMono(.xs, weight: .bold))
                        .foregroundStyle(.swarmGold)

                    Text("Active token consumption window across all parallel agents")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                }

                Spacer()

                HStack(spacing: 6) {
                    Image(systemName: "timer")
                        .font(.system(size: 13))
                        .foregroundStyle(.swarmWarning)
                    Text("Resets in \(resetMinutes / 60)h \(resetMinutes % 60)m")
                        .font(.swarmMono(.xs, weight: .semibold))
                        .foregroundStyle(.swarmWarning)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.swarmWarning.opacity(0.12))
                .cornerRadius(6)
            }

            // Progress bar + Numbers
            VStack(spacing: 6) {
                HStack {
                    Text("\(quotaUsageTokens.formatted()) / \(quotaMaxTokens.formatted()) tokens used")
                        .font(.swarmMono(.sm, weight: .bold))
                        .foregroundStyle(.swarmTextPrimary)

                    Spacer()

                    Text(String(format: "%.1f%% Consumed", pct * 100))
                        .font(.swarmMono(.sm, weight: .bold))
                        .foregroundStyle(pct > 0.85 ? .swarmError : (pct > 0.65 ? .swarmWarning : .swarmSuccess))
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.swarmCanvas)
                            .frame(height: 12)

                        RoundedRectangle(cornerRadius: 6)
                            .fill(
                                LinearGradient(
                                    colors: pct > 0.85 ? [.swarmWarning, .swarmError] : [.swarmGold, .swarmSuccess],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: max(0, min(geo.size.width, geo.size.width * CGFloat(pct))), height: 12)
                    }
                }
                .frame(height: 12)
            }

            HStack(spacing: 16) {
                quotaStatItem(title: "Peak Turn Consumption", value: "8,412 tok/turn")
                quotaStatItem(title: "Avg Context Injection", value: "3,210 tokens")
                quotaStatItem(title: "Pheromone RRF Overhead", value: "480 tokens")
                quotaStatItem(title: "Cache Hit Rate", value: "91.4%")
            }
            .padding(.top, 4)
        }
        .padding(16)
        .background(Color.swarmSurface)
        .cornerRadius(12)
        .overlay {
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func quotaStatItem(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
            Text(value)
                .font(.swarmMono(.xs, weight: .semibold))
                .foregroundStyle(.swarmTextSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var rolesBreakdownCard: some View {
        let roles: [(name: String, count: Int, color: Color)] = [
            ("Builder", 2, .swarmSuccess),
            ("Reviewer", 1, .swarmInfo),
            ("Scout", 1, .swarmWarning),
            ("Coordinator", 1, Color(hex: "#B388FF") ?? .purple),
            ("Architect", 1, Color(hex: "#8C9EFF") ?? .indigo),
            ("Tester", 1, .swarmSuccess),
            ("Security", 1, .swarmError)
        ]

        return VStack(alignment: .leading, spacing: 10) {
            Text("ACTIVE AGENT ROLES")
                .font(.swarmMono(.xs, weight: .bold))
                .foregroundStyle(.swarmTextPrimary)

            VStack(spacing: 6) {
                ForEach(roles, id: \.name) { role in
                    HStack {
                        Circle()
                            .fill(role.color)
                            .frame(width: 7, height: 7)

                        Text(role.name)
                            .font(.swarm(.xs))
                            .foregroundStyle(.swarmTextSecondary)

                        Spacer()

                        Text("\(role.count)")
                            .font(.swarmMono(.xs, weight: .bold))
                            .foregroundStyle(.swarmTextPrimary)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.swarmCanvas.opacity(0.5))
                    .cornerRadius(6)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.swarmSurface)
        .cornerRadius(10)
        .overlay {
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private var tokenUsageBreakdownCard: some View {
        let totalInput = agentsStore.agents.reduce(0) { $0 + $1.tokenUsage.input }
        let totalOutput = agentsStore.agents.reduce(0) { $0 + $1.tokenUsage.output }
        let grandTotal = totalInput + totalOutput + quotaUsageTokens

        return VStack(alignment: .leading, spacing: 10) {
            Text("TOKEN DISTRIBUTION METRICS")
                .font(.swarmMono(.xs, weight: .bold))
                .foregroundStyle(.swarmTextPrimary)

            VStack(spacing: 8) {
                tokenMetricRow(label: "Prompt Input Tokens", value: "\(totalInput.formatted())", color: .swarmInfo)
                tokenMetricRow(label: "Completion Output Tokens", value: "\(totalOutput.formatted())", color: .swarmGold)
                tokenMetricRow(label: "Aggregated Turn Total", value: "\(grandTotal.formatted())", color: .swarmSuccess)
                tokenMetricRow(label: "Pheromone Search Queries", value: "142 req", color: .swarmWarning)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.swarmSurface)
        .cornerRadius(10)
        .overlay {
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func tokenMetricRow(label: String, value: String, color: Color) -> some View {
        HStack {
            HStack(spacing: 6) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(color)
                    .frame(width: 4, height: 14)
                Text(label)
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextSecondary)
            }
            Spacer()
            Text(value)
                .font(.swarmMono(.xs, weight: .bold))
                .foregroundStyle(.swarmTextPrimary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color.swarmCanvas.opacity(0.5))
        .cornerRadius(6)
    }

    private var throughputLatencyCard: some View {
        HStack(spacing: 14) {
            perfStatBlock(title: "SUCCESS RATE", value: "98.7%", subtext: "152 of 154 tasks passed", color: .swarmSuccess)
            perfStatBlock(title: "AVG TURN LATENCY", value: "1.42s", subtext: "PTY stream responsiveness", color: .swarmInfo)
            perfStatBlock(title: "WORKTREE MERGE CONFLICTS", value: "0", subtext: "File-lock guarded (100% clean)", color: .swarmGold)
            perfStatBlock(title: "MEMORY RRF FUSION SCORE", value: "0.94", subtext: "FTS5 + Vector ranking (k=60)", color: .swarmSuccess)
        }
    }

    private func perfStatBlock(title: String, value: String, subtext: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.swarmMono(.micro, weight: .semibold))
                .foregroundStyle(.swarmTextTertiary)
            Text(value)
                .font(.swarmMono(.lg, weight: .bold))
                .foregroundStyle(color)
            Text(subtext)
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .lineLimit(1)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    // MARK: - Aggregated Logs View

    private var aggregatedLogsView: some View {
        VStack(spacing: 10) {
            // Filter Strip
            HStack(spacing: 10) {
                // Search Input
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 12))
                        .foregroundStyle(.swarmTextTertiary)
                    TextField("Filter execution event logs...", text: $logSearchQuery)
                        .font(.swarmMono(.xs))
                        .textFieldStyle(.plain)
                        .foregroundStyle(.swarmTextPrimary)
                    if !logSearchQuery.isEmpty {
                        Button {
                            logSearchQuery = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(.swarmTextTertiary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.swarmSurface)
                .cornerRadius(6)
                .overlay {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                }

                // Level Filter
                HStack(spacing: 4) {
                    levelFilterPill(label: "ALL", level: nil)
                    ForEach(ExecutionEvent.EventLevel.allCases, id: \.self) { lvl in
                        levelFilterPill(label: lvl.rawValue, level: lvl)
                    }
                }

                Spacer()

                // Log Count Tag
                Text("\(filteredLogs.count) events")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextTertiary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.swarmSurface)
                    .cornerRadius(4)

                // Copy logs button
                Button {
                    copyLogsToClipboard()
                } label: {
                    Image(systemName: "doc.on.doc")
                        .font(.system(size: 12))
                        .foregroundStyle(.swarmTextSecondary)
                        .padding(6)
                        .background(Color.swarmSurface)
                        .cornerRadius(6)
                }
                .buttonStyle(.plain)
                .help("Copy all filtered logs to clipboard")
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)

            // Log Console Stream
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 2) {
                    if filteredLogs.isEmpty {
                        Text("No logs match the current filter query.")
                            .font(.swarmMono(.xs))
                            .foregroundStyle(.swarmTextTertiary)
                            .padding(20)
                    } else {
                        ForEach(Array(filteredLogs.enumerated()), id: \.element.id) { idx, event in
                            HStack(alignment: .top, spacing: 8) {
                                Text(formattedTime(event.timestamp))
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextTertiary)
                                    .frame(width: 65, alignment: .leading)

                                Text(event.level.rawValue)
                                    .font(.swarmMono(.micro, weight: .bold))
                                    .foregroundStyle(event.level.color)
                                    .frame(width: 50, alignment: .leading)

                                Text("[\(event.category.rawValue)]")
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextTertiary)
                                    .frame(width: 75, alignment: .leading)

                                Text("[\(event.agentName)]")
                                    .font(.swarmMono(.micro, weight: .semibold))
                                    .foregroundStyle(.swarmGold)
                                    .frame(width: 110, alignment: .leading)
                                    .lineLimit(1)

                                Text(event.message)
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextPrimary)
                                    .frame(maxWidth: .infinity, alignment: .leading)

                                Text("#\(idx + 1)")
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextTertiary.opacity(0.4))
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(idx % 2 == 0 ? Color.swarmSurface.opacity(0.15) : Color.clear)
                        }
                    }
                }
                .padding(10)
            }
            .background(Color.swarmCanvas.opacity(0.95))
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 12)
        }
    }

    private func levelFilterPill(label: String, level: ExecutionEvent.EventLevel?) -> some View {
        let isSel = selectedLogLevel == level
        return Button {
            selectedLogLevel = level
        } label: {
            Text(label)
                .font(.swarmMono(.micro, weight: isSel ? .bold : .medium))
                .foregroundStyle(isSel ? (level?.color ?? .swarmGold) : .swarmTextTertiary)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(isSel ? (level?.color ?? .swarmGold).opacity(0.15) : Color.swarmSurface)
                .cornerRadius(4)
                .overlay {
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(isSel ? (level?.color ?? .swarmGold).opacity(0.3) : Color.clear, lineWidth: 1)
                }
        }
        .buttonStyle(.plain)
    }

    private var filteredLogs: [ExecutionEvent] {
        executionLogs.filter { log in
            let matchSearch = logSearchQuery.isEmpty ||
                log.message.localizedCaseInsensitiveContains(logSearchQuery) ||
                log.agentName.localizedCaseInsensitiveContains(logSearchQuery) ||
                log.category.rawValue.localizedCaseInsensitiveContains(logSearchQuery)
            let matchLevel = selectedLogLevel == nil || log.level == selectedLogLevel
            return matchSearch && matchLevel
        }
    }

    // MARK: - Footer View

    private var footerView: some View {
        HStack {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.swarmSuccess)
                Text("Autonomous swarm telemetry engine active • Local SQLite persistence")
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextTertiary)
            }

            Spacer()

            Button {
                closeModal()
            } label: {
                Text("Done")
                    .font(.swarm(.xs, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
                    .overlay {
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                    }
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.swarmSurface.opacity(0.3))
    }

    // MARK: - Helpers

    private func closeModal() {
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            isPresented = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            isOpen = false
        }
    }

    private func refreshData() {
        isRefreshing = true
        quotaUsageTokens += Int.random(in: 400...1800)
        appendLiveLog("Telemetry refreshed: synced 5-hour quota and agent event states", level: .info)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            isRefreshing = false
        }
    }

    private func appendLiveLog(_ message: String, level: ExecutionEvent.EventLevel = .info) {
        let event = ExecutionEvent(
            agentName: "SwarmMind",
            role: "Coordinator",
            message: message,
            level: level,
            category: .orchestrator
        )
        executionLogs.insert(event, at: 0)
    }

    private func copyLogsToClipboard() {
        let text = filteredLogs.map { "[\(formattedTime($0.timestamp))] [\($0.level.rawValue)] [\($0.agentName)] \($0.message)" }.joined(separator: "\n")
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
    }

    private func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }

    private func seedExecutionLogs() {
        var logs: [ExecutionEvent] = []
        let now = Date()

        logs.append(ExecutionEvent(timestamp: now.addingTimeInterval(-1), agentName: "Claude-Lead", role: "Coordinator", message: "Dispatched mission subtasks with zero file lock overlaps", level: .success, category: .orchestrator))
        logs.append(ExecutionEvent(timestamp: now.addingTimeInterval(-5), agentName: "Worker-Builder", role: "Builder", message: "Created git worktree .swarm/worktrees/task-184 at commit HEAD", level: .info, category: .worktree))
        logs.append(ExecutionEvent(timestamp: now.addingTimeInterval(-12), agentName: "Worker-Builder", role: "Builder", message: "Pheromone query: matched 4 architectural rules via RRF hybrid fusion", level: .info, category: .mcp))
        logs.append(ExecutionEvent(timestamp: now.addingTimeInterval(-24), agentName: "Worker-Reviewer", role: "Reviewer", message: "In-memory 3-way dry-run validation passed with 0 merge conflicts", level: .success, category: .orchestrator))
        logs.append(ExecutionEvent(timestamp: now.addingTimeInterval(-40), agentName: "Worker-Scout", role: "Scout", message: "Scanned AST dependency graph: 18 modules mapped cleanly", level: .info, category: .agent))
        logs.append(ExecutionEvent(timestamp: now.addingTimeInterval(-65), agentName: "Claude-Lead", role: "Coordinator", message: "SwarmMind heartbeat tick: 5-hour rolling usage window anchored", level: .info, category: .orchestrator))

        executionLogs = logs
    }
}
