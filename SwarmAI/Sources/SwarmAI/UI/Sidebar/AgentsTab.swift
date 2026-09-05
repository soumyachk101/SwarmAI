import SwiftUI

// MARK: - Agents Tab

struct AgentsTab: View {
  @Environment(\.agentsStore) private var agentsStore
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
          let agent = agentsStore.spawnAgent(selectedAgentType)
          agentsStore.activePaneId = agent.id.uuidString
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
              AgentListRow(
                agent: agent,
                isSelected: agentsStore.activePaneId == agent.id.uuidString,
                onSelect: {
                  agentsStore.activePaneId = agent.id.uuidString
                }
              )
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
  let isSelected: Bool
  let onSelect: () -> Void
  @Environment(\.agentsStore) private var agentsStore
  @State private var isHovered = false

  var body: some View {
    Button {
      onSelect()
    } label: {
      HStack(spacing: 8) {
        // Status indicator
        Circle()
          .fill(agent.status.color)
          .frame(width: 8, height: 8)

        // Agent type icon
        Image(systemName: agent.agentType.icon)
          .font(.system(size: 12))
          .foregroundStyle(agent.agentType.color)

        // Name and info
        VStack(alignment: .leading, spacing: 1) {
          Text(agent.name)
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(isSelected ? .swarmGold : .swarmTextPrimary)
            .lineLimit(1)

          Text("\(agent.agentType.displayName) \u{2022} \(agent.status.displayName)")
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
      .background {
        if isSelected {
          RoundedRectangle(cornerRadius: 6)
            .fill(Color.swarmGold.opacity(0.12))
        } else if isHovered {
          RoundedRectangle(cornerRadius: 6)
            .fill(Color.swarmSurfaceHover)
        }
      }
    }
    .buttonStyle(.plain)
    .onHover { isHovered = $0 }
    .contextMenu {
      Button("Focus Agent") {
        agentsStore.activePaneId = agent.id.uuidString
      }

      Button("Maximize Pane") {
        agentsStore.maximizePane(agent.id)
      }

      Divider()

      if agent.status == .running {
        Button("Pause Agent") {
          agentsStore.updateAgentStatus(agent.id, status: .idle)
        }
      } else {
        Button("Start Agent") {
          agentsStore.updateAgentStatus(agent.id, status: .running)
        }
      }

      Button("Copy Agent ID") {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(agent.id.uuidString, forType: .string)
      }

      Divider()

      Button("Terminate Agent", role: .destructive) {
        agentsStore.removeAgent(agent.id)
      }
    }
  }
}
