import SwiftUI

// MARK: - Lead Panel (Right Dock)

struct LeadPanel: View {
  @State private var missionDirective: String = ""
  @State private var selectedMode: LeadMode = .steward
  @State private var activeTab: LeadPanelSection = .orchestration
  @Environment(\.agentsStore) private var agentsStore
  @Environment(\.workspaceStore) private var workspaceStore
  @Environment(\.taskStore) private var taskStore
  @Environment(\.settingsStore) private var settingsStore

  private var swarmMind: SwarmMind { SwarmMind.shared }
  private var leadBridge: LeadBridge { LeadBridge.shared }
  private var lockRegistry: LockRegistry { LockRegistry.shared }
  private var handoffManager: HandoffManager { HandoffManager.shared }

  @State private var contentAppeared = false

  enum LeadPanelSection: String, CaseIterable, Identifiable {
    case orchestration = "Orchestration"
    case dag = "DAG Plan"
    case tools = "Tool Activity"
    case locks = "Locks & Handoffs"

    var id: String { rawValue }
    var icon: String {
      switch self {
      case .orchestration: "brain.head.profile"
      case .dag: "point.3.filled.connected.trianglepath.dotted"
      case .tools: "wrench.and.screwdriver"
      case .locks: "lock.shield"
      }
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      headerView

      Divider()
        .background(.swarmBorderSubtle)

      // Section Navigation Bar
      sectionTabBar

      Divider()
        .background(.swarmBorderSubtle)

      // Main Content Area
      ScrollView {
        VStack(spacing: 14) {
          switch activeTab {
          case .orchestration:
            orchestrationSection
          case .dag:
            dagPlanSection
          case .tools:
            toolActivitySection
          case .locks:
            locksAndHandoffsSection
          }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
      }
      .background(.swarmCanvas)

      Divider()
        .background(.swarmBorderSubtle)

      // Status Footer HUD
      statusFooterView
    }
    .modifier(PanelEntryModifier(appeared: $contentAppeared))
    .onAppear {
      contentAppeared = false
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
        contentAppeared = true
      }
    }
  }

  // MARK: - Header

  private var headerView: some View {
    HStack {
      HStack(spacing: 6) {
        Image(systemName: "cpu.fill")
          .font(.swarm(.sm))
          .foregroundStyle(.swarmGold)

        Text("Autonomous Lead")
          .font(.swarm(.sm, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)
      }

      Spacer()

      // Mode selector
      Picker("", selection: $selectedMode) {
        ForEach(LeadMode.allCases) { mode in
          Text(mode.displayName).tag(mode)
        }
      }
      .pickerStyle(.segmented)
      .frame(width: 170)
      .labelsHidden()
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 10)
    .overlay(alignment: .bottom) {
      Rectangle()
        .fill(.swarmGold)
        .frame(height: 1.5)
        .frame(width: contentAppeared ? 44 : 0, alignment: .center)
        .animation(.easeOut(duration: 0.5), value: contentAppeared)
    }
  }

  // MARK: - Section Tab Bar

  private var sectionTabBar: some View {
    HStack(spacing: 4) {
      ForEach(LeadPanelSection.allCases) { section in
        Button {
          withAnimation(.easeInOut(duration: 0.2)) {
            activeTab = section
          }
        } label: {
          HStack(spacing: 4) {
            Image(systemName: section.icon)
              .font(.swarm(.micro))
            Text(section.rawValue)
              .font(.swarm(.xs, weight: activeTab == section ? .semibold : .regular))
          }
          .foregroundStyle(activeTab == section ? .swarmGold : .swarmTextSecondary)
          .padding(.horizontal, 8)
          .padding(.vertical, 6)
          .background {
            if activeTab == section {
              RoundedRectangle(cornerRadius: 6)
                .fill(.swarmSurfaceActive)
            }
          }
        }
        .buttonStyle(.plain)
      }
    }
    .padding(.horizontal, 8)
    .padding(.vertical, 4)
    .background(.swarmSurface)
  }

  // MARK: - Orchestration Section

  private var orchestrationSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      // Mission directive input card
      VStack(alignment: .leading, spacing: 6) {
        HStack {
          Text("Mission Directive")
            .font(.swarm(.xs, weight: .semibold))
            .foregroundStyle(.swarmTextSecondary)

          Spacer()

          if leadBridge.isExecuting || swarmMind.isRunning {
            HStack(spacing: 4) {
              ProgressView()
                .scaleEffect(0.6)
                .frame(width: 12, height: 12)
              Text("Executing")
                .font(.swarm(.micro, weight: .medium))
                .foregroundStyle(.swarmWarning)
            }
          }
        }

        TextEditor(text: $missionDirective)
          .font(.swarm(.sm))
          .frame(height: 70)
          .scrollContentBackground(.hidden)
          .padding(8)
          .background(.swarmSurface)
          .cornerRadius(8)
          .overlay {
            RoundedRectangle(cornerRadius: 8)
              .stroke(leadBridge.isExecuting ? .swarmGold : .swarmBorderSubtle, lineWidth: 1)
          }

        // Quick Presets
        HStack(spacing: 6) {
          quickPresetButton(label: "Full Feature", icon: "hammer.fill", directive: "Design, implement, test, and review new feature with full DAG pipeline.")
          quickPresetButton(label: "Hunt Bugs", icon: "ant.fill", directive: "Isolate root cause, apply surgical bugfix, and verify regression tests.")
          quickPresetButton(label: "Security Audit", icon: "shield.fill", directive: "Perform attack surface threat audit and harden input boundaries.")
        }
      }

      // Dispatch / Control Buttons
      HStack(spacing: 8) {
        if leadBridge.isExecuting || swarmMind.isRunning {
          Button {
            leadBridge.cancelMission()
            swarmMind.stop()
          } label: {
            HStack {
              Image(systemName: "stop.fill")
              Text("Cancel Mission")
            }
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmError)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(.swarmSurface)
            .cornerRadius(8)
            .overlay {
              RoundedRectangle(cornerRadius: 8).stroke(.swarmError.opacity(0.4), lineWidth: 1)
            }
          }
          .buttonStyle(.plain)

          Button {
            if swarmMind.isPaused {
              swarmMind.resume()
            } else {
              swarmMind.pause()
            }
          } label: {
            HStack {
              Image(systemName: swarmMind.isPaused ? "play.fill" : "pause.fill")
              Text(swarmMind.isPaused ? "Resume" : "Pause")
            }
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmTextPrimary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(.swarmSurface)
            .cornerRadius(8)
          }
          .buttonStyle(.plain)

        } else {
          Button {
            dispatchMission()
          } label: {
            HStack {
              Image(systemName: "paperplane.fill")
                .font(.swarm(.xs))

              Text("Dispatch Autonomous Mission")
                .font(.swarm(.sm, weight: .semibold))
            }
            .foregroundStyle(.swarmCanvas)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(missionDirective.trimmingCharacters(in: .whitespaces).isEmpty ? .gray : .swarmGold)
            .cornerRadius(8)
          }
          .buttonStyle(.plain)
          .disabled(missionDirective.trimmingCharacters(in: .whitespaces).isEmpty)
        }
      }

      // Mode description
      HStack(spacing: 6) {
        Image(systemName: "info.circle")
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
        Text(selectedMode.description)
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)
      }

      Divider()

      // Live Reasoning & Thought Stream
      VStack(alignment: .leading, spacing: 6) {
        Text("Autonomous Reasoning Stream")
          .font(.swarm(.xs, weight: .semibold))
          .foregroundStyle(.swarmTextSecondary)

        if leadBridge.thoughts.isEmpty {
          HStack {
            Text("Awaiting mission directive...")
              .font(.swarm(.xs))
              .foregroundStyle(.swarmTextTertiary)
              .italic()
            Spacer()
          }
          .padding(10)
          .background(RoundedRectangle(cornerRadius: 8).fill(.swarmSurface))
        } else {
          ForEach(leadBridge.thoughts.prefix(5)) { item in
            ThoughtCard(thought: item)
          }
        }
      }

      Divider()

      // Active Leads
      if let lead = agentsStore.agents.first(where: { $0.role == .lead }) {
        LeadCard(agent: lead)
      }
    }
  }

  // MARK: - DAG Plan Section

  private var dagPlanSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      if let plan = swarmMind.currentPlan {
        HStack {
          VStack(alignment: .leading, spacing: 2) {
            Text("Goal: \(plan.goal)")
              .font(.swarm(.sm, weight: .bold))
              .foregroundStyle(.swarmTextPrimary)
              .lineLimit(2)

            Text("Mode: \(plan.leadMode.displayName) • \(plan.nodes.count) Tasks")
              .font(.swarm(.micro))
              .foregroundStyle(.swarmTextTertiary)
          }

          Spacer()

          // Progress Circle
          ZStack {
            Circle()
              .stroke(.swarmSurfaceActive, lineWidth: 3)
              .frame(width: 34, height: 34)
            Circle()
              .trim(from: 0, to: plan.progress)
              .stroke(.swarmGold, style: StrokeStyle(lineWidth: 3, lineCap: .round))
              .rotationEffect(.degrees(-90))
              .frame(width: 34, height: 34)
            Text("\(Int(plan.progress * 100))%")
              .font(.swarm(.micro, weight: .bold))
              .foregroundStyle(.swarmTextPrimary)
          }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 8).fill(.swarmSurface))

        // Node Cards
        VStack(spacing: 8) {
          ForEach(plan.nodes) { node in
            DAGNodeCard(node: node, plan: plan)
          }
        }

      } else {
        VStack(spacing: 8) {
          Image(systemName: "point.3.filled.connected.trianglepath.dotted")
            .font(.system(size: 28))
            .foregroundStyle(.swarmTextTertiary)
          Text("No Active DAG Plan")
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmTextSecondary)
          Text("Dispatch a mission directive from the Orchestration tab to generate a structured dependency graph.")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
            .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
      }
    }
  }

  // MARK: - Tool Activity Section

  private var toolActivitySection: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("Tool Executions (\(leadBridge.recentToolCalls.count))")
          .font(.swarm(.xs, weight: .semibold))
          .foregroundStyle(.swarmTextSecondary)
        Spacer()
      }

      if leadBridge.recentToolCalls.isEmpty {
        VStack(spacing: 6) {
          Image(systemName: "wrench.and.screwdriver")
            .font(.system(size: 24))
            .foregroundStyle(.swarmTextTertiary)
          Text("No tool invocations recorded yet.")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
      } else {
        ForEach(leadBridge.recentToolCalls) { call in
          ToolCallCard(call: call)
        }
      }
    }
  }

  // MARK: - Locks & Handoffs Section

  private var locksAndHandoffsSection: some View {
    VStack(alignment: .leading, spacing: 14) {
      // Active File Locks
      VStack(alignment: .leading, spacing: 6) {
        HStack {
          Label("File Mutex Locks (\(lockRegistry.locks.count))", systemImage: "lock.shield.fill")
            .font(.swarm(.xs, weight: .semibold))
            .foregroundStyle(.swarmTextSecondary)
          Spacer()
          if !lockRegistry.locks.isEmpty {
            Button("Unlock All") {
              lockRegistry.forceUnlockAll()
            }
            .font(.swarm(.micro))
            .buttonStyle(.plain)
            .foregroundStyle(.swarmError)
          }
        }

        if lockRegistry.locks.isEmpty {
          Text("No active file locks held.")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
        } else {
          ForEach(lockRegistry.locks) { lockEntry in
            HStack(spacing: 8) {
              Image(systemName: lockEntry.lockType.icon)
                .font(.swarm(.xs))
                .foregroundStyle(lockEntry.lockType == .exclusive ? .swarmWarning : .swarmInfo)

              VStack(alignment: .leading, spacing: 1) {
                Text(lockEntry.filePath)
                  .font(.swarmMono(.xs, weight: .medium))
                  .foregroundStyle(.swarmTextPrimary)
                  .lineLimit(1)

                Text("Holder: \(lockEntry.holderAgentName) • \(lockEntry.holderRole)")
                  .font(.swarm(.micro))
                  .foregroundStyle(.swarmTextTertiary)
              }

              Spacer()

              Button {
                lockRegistry.releaseById(lockEntry.id)
              } label: {
                Image(systemName: "xmark.circle")
                  .font(.swarm(.sm))
                  .foregroundStyle(.swarmTextSecondary)
              }
              .buttonStyle(.plain)
            }
            .padding(8)
            .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
          }
        }
      }

      Divider()

      // Active Handoffs
      VStack(alignment: .leading, spacing: 6) {
        Text("Inter-Agent Handoffs (\(handoffManager.handoffs.count))")
          .font(.swarm(.xs, weight: .semibold))
          .foregroundStyle(.swarmTextSecondary)

        if handoffManager.handoffs.isEmpty {
          Text("No active delegations.")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
            .padding(8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
        } else {
          ForEach(handoffManager.handoffs) { h in
            VStack(alignment: .leading, spacing: 4) {
              HStack {
                Text("[\(h.fromAgentName)] → [\(h.toAgentName)]")
                  .font(.swarm(.xs, weight: .bold))
                  .foregroundStyle(.swarmTextPrimary)
                Spacer()
                Text(h.status.displayName)
                  .font(.swarm(.micro, weight: .semibold))
                  .padding(.horizontal, 6)
                  .padding(.vertical, 2)
                  .background(RoundedRectangle(cornerRadius: 4).fill(.swarmSurfaceActive))
                  .foregroundStyle(.swarmGold)
              }

              Text(h.instructions)
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)

              if h.status == .pending {
                HStack(spacing: 8) {
                  Button("Accept") {
                    handoffManager.acceptHandoff(id: h.id)
                  }
                  .buttonStyle(.plain)
                  .font(.swarm(.micro, weight: .bold))
                  .foregroundStyle(.swarmSuccess)

                  Button("Reject") {
                    handoffManager.rejectHandoff(id: h.id, reason: "Busy")
                  }
                  .buttonStyle(.plain)
                  .font(.swarm(.micro))
                  .foregroundStyle(.swarmError)
                }
                .padding(.top, 2)
              }
            }
            .padding(8)
            .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
          }
        }
      }
    }
  }

  // MARK: - Footer HUD

  private var statusFooterView: some View {
    HStack(spacing: 12) {
      StatusItem(label: "Agents", value: "\(agentsStore.agents.count)")
      StatusItem(label: "Locks", value: "\(lockRegistry.locks.count)")
      StatusItem(
        label: "DAG",
        value: swarmMind.currentPlan != nil
          ? "\(swarmMind.currentPlan!.nodes.filter { $0.status == .completed }.count)/\(swarmMind.currentPlan!.nodes.count)"
          : "0"
      )
      Spacer()
      Text(leadBridge.missionStatusText)
        .font(.swarm(.micro))
        .foregroundStyle(.swarmTextTertiary)
        .lineLimit(1)
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background(.swarmSurface)
  }

  // MARK: - Helpers

  private func quickPresetButton(label: String, icon: String, directive: String) -> some View {
    Button {
      missionDirective = directive
    } label: {
      HStack(spacing: 3) {
        Image(systemName: icon)
          .font(.swarm(.micro))
        Text(label)
          .font(.swarm(.micro))
      }
      .foregroundStyle(.swarmTextSecondary)
      .padding(.horizontal, 6)
      .padding(.vertical, 4)
      .background(RoundedRectangle(cornerRadius: 4).fill(.swarmSurface))
    }
    .buttonStyle(.plain)
  }

  private func dispatchMission() {
    let goal = missionDirective.trimmingCharacters(in: .whitespaces)
    guard !goal.isEmpty else { return }

    let provider = settingsStore.apiKeys.first { $0.isActive }

    leadBridge.dispatchMission(
      goal: goal,
      mode: selectedMode,
      provider: provider,
      workspaceStore: workspaceStore,
      taskStore: taskStore,
      agentsStore: agentsStore
    )
  }
}

// MARK: - Subcomponents

struct ThoughtCard: View {
  let thought: LeadThought

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        Text("Step \(thought.step) [\(thought.mode.displayName)]")
          .font(.swarm(.micro, weight: .bold))
          .foregroundStyle(.swarmGold)

        Spacer()

        Text(thought.timestamp.formatted(date: .omitted, time: .standard))
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
      }

      Text(thought.thought)
        .font(.swarm(.xs))
        .foregroundStyle(.swarmTextPrimary)

      if !thought.toolCalls.isEmpty {
        HStack(spacing: 4) {
          ForEach(thought.toolCalls) { call in
            HStack(spacing: 2) {
              Image(systemName: "wrench")
                .font(.system(size: 9))
              Text(call.toolName)
                .font(.swarmMono(.micro))
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
            .background(RoundedRectangle(cornerRadius: 3).fill(.swarmSurfaceActive))
            .foregroundStyle(.swarmInfo)
          }
        }
        .padding(.top, 2)
      }
    }
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
  }
}

struct DAGNodeCard: View {
  let node: SwarmDAGNode
  let plan: SwarmDAGPlan

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 6) {
        Image(systemName: node.status.icon)
          .font(.swarm(.sm))
          .foregroundStyle(node.status.color)

        Text(node.title)
          .font(.swarm(.xs, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)
          .lineLimit(1)

        Spacer()

        // Role Badge
        HStack(spacing: 2) {
          Image(systemName: node.role.icon)
            .font(.system(size: 9))
          Text(node.role.displayName)
            .font(.swarm(.micro, weight: .medium))
        }
        .padding(.horizontal, 5)
        .padding(.vertical, 2)
        .background(RoundedRectangle(cornerRadius: 4).fill(node.role.color.opacity(0.15)))
        .foregroundStyle(node.role.color)

        // Priority Badge
        Text(node.priority.displayName)
          .font(.swarm(.micro, weight: .bold))
          .foregroundStyle(node.priority.color)
      }

      Text(node.description)
        .font(.swarm(.micro))
        .foregroundStyle(.swarmTextSecondary)
        .lineLimit(2)

      if !node.prerequisites.isEmpty {
        HStack(spacing: 4) {
          Text("Prereqs:")
            .font(.swarm(.micro))
            .foregroundStyle(.swarmTextTertiary)
          ForEach(node.prerequisites, id: \.self) { prereqId in
            if let prereqNode = plan.node(for: prereqId) {
              Text(prereqNode.role.displayName)
                .font(.swarm(.micro))
                .padding(.horizontal, 4)
                .padding(.vertical, 1)
                .background(RoundedRectangle(cornerRadius: 3).fill(.swarmSurfaceActive))
                .foregroundStyle(prereqNode.status == .completed ? .swarmSuccess : .swarmTextTertiary)
            }
          }
        }
      }
    }
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
    .overlay {
      RoundedRectangle(cornerRadius: 6)
        .stroke(node.status == .inProgress ? .swarmWarning : .swarmBorderSubtle, lineWidth: 1)
    }
  }
}

struct ToolCallCard: View {
  let call: LeadToolCall

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        Image(systemName: call.status.icon)
          .font(.swarm(.xs))
          .foregroundStyle(call.status.color)

        Text(call.toolName)
          .font(.swarmMono(.xs, weight: .bold))
          .foregroundStyle(.swarmTextPrimary)

        Spacer()

        if let dur = call.duration {
          Text(String(format: "%.2fs", dur))
            .font(.swarmMono(.micro))
            .foregroundStyle(.swarmTextTertiary)
        }
      }

      if !call.arguments.isEmpty {
        Text(call.arguments.map { "\($0.key): \($0.value)" }.joined(separator: ", "))
          .font(.swarmMono(.micro))
          .foregroundStyle(.swarmTextSecondary)
          .lineLimit(2)
      }

      if let res = call.result {
        Text("→ \(res)")
          .font(.swarm(.micro))
          .foregroundStyle(.swarmSuccess)
          .lineLimit(2)
      } else if let err = call.error {
        Text("✕ \(err)")
          .font(.swarm(.micro))
          .foregroundStyle(.swarmError)
          .lineLimit(2)
      }
    }
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
  }
}

struct LeadCard: View {
  let agent: Agent

  var body: some View {
    HStack(spacing: 8) {
      Circle()
        .fill(agent.status.color)
        .frame(width: 8, height: 8)

      Text(agent.agentType.icon)
        .font(.swarm(.xs))

      VStack(alignment: .leading, spacing: 1) {
        Text(agent.name)
          .font(.swarm(.sm, weight: .medium))
          .foregroundStyle(.swarmTextPrimary)
        Text("\(agent.agentType.displayName) • \(agent.status.displayName)")
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
      }

      Spacer()

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
    .padding(8)
    .background(RoundedRectangle(cornerRadius: 6).fill(.swarmSurface))
  }
}

struct StatusItem: View {
  let label: String
  let value: String

  var body: some View {
    HStack(spacing: 4) {
      Text(label)
        .font(.swarm(.micro))
        .foregroundStyle(.swarmTextTertiary)
      Text(value)
        .font(.swarmMono(.micro, weight: .bold))
        .foregroundStyle(.swarmTextPrimary)
    }
  }
}
