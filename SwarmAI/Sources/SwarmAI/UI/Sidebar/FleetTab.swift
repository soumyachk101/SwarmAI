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

        Text("\(agentsStore.agents.count) Agents")
          .font(.swarmMono(.micro))
          .foregroundStyle(.swarmGold)
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)

      Divider()
        .background(.swarmBorderSubtle)

      ScrollView {
        VStack(spacing: 12) {
          // Fleet stats in 2x2 grid
          LazyVGrid(columns: [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)], spacing: 6) {
            FleetStatCard(title: "Total", count: agentsStore.agents.count, color: .swarmInfo)
            FleetStatCard(title: "Running", count: agentsStore.agentCount(for: .running), color: .swarmSuccess)
            FleetStatCard(title: "Idle", count: agentsStore.agentCount(for: .idle), color: .swarmTextTertiary)
            FleetStatCard(title: "Errors", count: agentsStore.agentCount(for: .error), color: .swarmError)
          }
          .padding(.horizontal, 10)

          Divider()
            .background(.swarmBorderSubtle)

          if agentsStore.agents.isEmpty {
            ContentUnavailableView(
              "No Agents in Fleet",
              systemImage: "antenna.radiowaves.left.and.right",
              description: Text("Spawn agents to see them here")
            )
            .padding(.top, 20)
          } else {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
              ForEach(agentsStore.agents) { agent in
                AgentCard(
                  agent: agent,
                  isSelected: agentsStore.activePaneId == agent.id.uuidString,
                  onSelect: {
                    agentsStore.activePaneId = agent.id.uuidString
                  }
                )
              }
            }
            .padding(.horizontal, 10)
          }
        }
        .padding(.top, 8)
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
        .font(.swarm(.lg, weight: .bold))
        .foregroundStyle(color)

      Text(title)
        .font(.swarm(.micro))
        .foregroundStyle(.swarmTextTertiary)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 6)
    .background {
      RoundedRectangle(cornerRadius: 6)
        .fill(.swarmSurface)
        .overlay {
          RoundedRectangle(cornerRadius: 6)
            .stroke(color.opacity(0.3), lineWidth: 1)
        }
    }
  }
}

struct AgentCard: View {
  let agent: Agent
  let isSelected: Bool
  let onSelect: () -> Void
  @Environment(\.agentsStore) private var agentsStore
  @State private var isHovered = false

  var body: some View {
    Button {
      onSelect()
    } label: {
      VStack(spacing: 6) {
        ZStack {
          RoundedRectangle(cornerRadius: 6)
            .fill(agent.agentType.brandColor.opacity(0.15))

          Text(agent.agentType.icon)
            .font(.system(size: 20))
        }
        .frame(height: 36)

        Text(agent.name)
          .font(.swarm(.xs, weight: .medium))
          .foregroundStyle(isSelected ? .swarmGold : .swarmTextPrimary)
          .lineLimit(1)

        Text(agent.agentType.displayName)
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
          .lineLimit(1)

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
      .frame(maxWidth: .infinity)
      .background {
        RoundedRectangle(cornerRadius: 8)
          .fill(.swarmSurface)
      }
      .overlay {
        RoundedRectangle(cornerRadius: 8)
          .stroke(isSelected ? .swarmGold : (isHovered ? .swarmBorderSubtle : .clear), lineWidth: 1)
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

      Button("Terminate Agent", role: .destructive) {
        agentsStore.removeAgent(agent.id)
      }
    }
  }
}
