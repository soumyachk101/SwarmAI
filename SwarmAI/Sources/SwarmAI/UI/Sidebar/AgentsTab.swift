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
  }
}
