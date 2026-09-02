import SwiftUI

// MARK: - Projects Tab

struct ProjectsTab: View {
 @Environment(\.workspaceStore) private var workspaceStore

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Header
 HStack {
 Text("Workspaces")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Button {
 let name = "Project \(workspaceStore.workspaces.count + 1)"
 _ = workspaceStore.createWorkspace(name: name, path: NSHomeDirectory())
 } label: {
 Image(systemName: "plus")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)

 Divider()
 .background(.swarmBorderSubtle)

 // Workspace list
 ScrollView {
 VStack(spacing: 4) {
 ForEach(workspaceStore.workspaces) { workspace in
 Button {
 workspaceStore.switchWorkspace(workspace.id)
 } label: {
 HStack(spacing: 10) {
 // Color indicator
 RoundedRectangle(cornerRadius: 4)
 .fill(workspace.color)
 .frame(width: 12, height: 12)

 VStack(alignment: .leading, spacing: 2) {
 Text(workspace.name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(workspaceStore.activeWorkspaceId == workspace.id ? .swarmGold : .swarmTextPrimary)
 .frame(maxWidth: .infinity, alignment: .leading)

 Text(workspace.path)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .lineLimit(1)
 }

 if workspaceStore.activeWorkspaceId == workspace.id {
 Image(systemName: "checkmark")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(workspaceStore.activeWorkspaceId == workspace.id ? .swarmGold.opacity(0.1) : .clear)
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 8)
 .padding(.top, 8)
 }
 }
 .background(.swarmCanvas)
 }
}
