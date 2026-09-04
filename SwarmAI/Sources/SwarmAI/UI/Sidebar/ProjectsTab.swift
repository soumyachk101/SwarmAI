import SwiftUI
import AppKit

// MARK: - Projects Tab

struct ProjectsTab: View {
  @Environment(\.workspaceStore) private var workspaceStore
  @State private var isHoveredWorkspaceId: UUID?

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack {
        Text("Workspaces")
          .font(.swarm(.sm, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)

        Spacer()

        // Open Folder Button
        Button {
          openFolderDialog()
        } label: {
          Image(systemName: "folder.badge.plus")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmGold)
        }
        .buttonStyle(.plain)
        .help("Open Directory as Workspace...")

        // Quick New Project Button
        Button {
          let name = "Project \(workspaceStore.workspaces.count + 1)"
          _ = workspaceStore.createWorkspace(name: name, path: NSHomeDirectory())
        } label: {
          Image(systemName: "plus")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmGold)
        }
        .buttonStyle(.plain)
        .help("Quick Add Project")
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)

      Divider()
        .background(.swarmBorderSubtle)

      // Workspace list
      if workspaceStore.workspaces.isEmpty {
        VStack(spacing: 12) {
          Spacer()
          Image(systemName: "folder.badge.plus")
            .font(.system(size: 28))
            .foregroundStyle(.swarmTextTertiary)

          Text("No Workspaces")
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmTextSecondary)

          Button("Open Directory...") {
            openFolderDialog()
          }
          .buttonStyle(.borderedProminent)
          .tint(.swarmGold)
          .controlSize(.small)

          Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity)
      } else {
        ScrollView {
          VStack(spacing: 4) {
            ForEach(workspaceStore.workspaces) { workspace in
              let isSelected = workspaceStore.activeWorkspaceId == workspace.id
              let isHovered = isHoveredWorkspaceId == workspace.id

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
                      .foregroundStyle(isSelected ? .swarmGold : .swarmTextPrimary)
                      .frame(maxWidth: .infinity, alignment: .leading)

                    Text(workspace.path)
                      .font(.swarm(.micro))
                      .foregroundStyle(.swarmTextTertiary)
                      .lineLimit(1)
                      .truncationMode(.middle)
                  }

                  if isSelected {
                    Image(systemName: "checkmark")
                      .font(.swarm(.xs))
                      .foregroundStyle(.swarmGold)
                  }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background {
                  RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? .swarmGold.opacity(0.12) : (isHovered ? .swarmSurfaceHover : .clear))
                }
              }
              .buttonStyle(.plain)
              .onHover { isHoveredWorkspaceId = $0 ? workspace.id : nil }
              .contextMenu {
                Button("Switch to This Workspace") {
                  workspaceStore.switchWorkspace(workspace.id)
                }

                Divider()

                Button("Reveal in Finder") {
                  WorkspaceFileManager.shared.revealInFinder(path: workspace.path)
                }

                Button("Copy Path") {
                  NSPasteboard.general.clearContents()
                  NSPasteboard.general.setString(workspace.path, forType: .string)
                }

                Divider()

                Button("Remove Workspace", role: .destructive) {
                  workspaceStore.removeWorkspace(workspace.id)
                }
              }
            }
          }
          .padding(.horizontal, 8)
          .padding(.top, 8)
        }
      }
    }
    .background(.swarmCanvas)
  }

  private func openFolderDialog() {
    let panel = NSOpenPanel()
    panel.canChooseFiles = false
    panel.canChooseDirectories = true
    panel.allowsMultipleSelection = false
    panel.canCreateDirectories = true
    panel.prompt = "Open Workspace"
    if panel.runModal() == .OK, let url = panel.url {
      let name = url.lastPathComponent
      _ = workspaceStore.createWorkspace(name: name, path: url.path)
    }
  }
}
