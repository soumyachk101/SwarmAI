import SwiftUI
import AppKit

// MARK: - Projects Tab (Matching Tauri WorkspacesSidebar.tsx)

struct ProjectsTab: View {
  @Environment(\.workspaceStore) private var workspaceStore
  @Environment(\.agentsStore) private var agentsStore
  @State private var searchQuery: String = ""
  @State private var isHoveredWorkspaceId: UUID?
  @State private var hideSleeping: Bool = false

  private var visibleWorkspaces: [Workspace] {
    workspaceStore.workspaces.filter { ws in
      if !searchQuery.isEmpty {
        let q = searchQuery.lowercased()
        if !ws.name.lowercased().contains(q) && !ws.path.lowercased().contains(q) {
          return false
        }
      }
      return true
    }
  }

  private func hasRunningAgents(for ws: Workspace) -> Bool {
    for a in agentsStore.agents {
      if a.status == .running {
        if let wt = a.worktree, wt == ws.path {
          return true
        }
      }
    }
    return false
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // ── Sub-header: WORKSPACES (count) + Actions ───────────────────
      HStack(spacing: 8) {
        HStack(spacing: 6) {
          Text("WORKSPACES")
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.8)
            .foregroundStyle(Color.zinc300)

          Text("\(visibleWorkspaces.count)")
            .font(.system(size: 10, weight: .medium, design: .monospaced))
            .foregroundStyle(Color.zinc400)
            .padding(.horizontal, 5)
            .padding(.vertical, 1.5)
            .background(Color.white.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 4))
            .overlay(
              RoundedRectangle(cornerRadius: 4)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
        }

        Spacer()

        Button {
          withAnimation(.swarmQuick) {
            hideSleeping.toggle()
          }
        } label: {
          Image(systemName: hideSleeping ? "eye.slash" : "eye")
            .font(.system(size: 11))
            .foregroundStyle(hideSleeping ? Color.swarmGold : Color.zinc400)
            .frame(width: 24, height: 24)
            .background(hideSleeping ? Color.swarmGold.opacity(0.15) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 5))
        }
        .buttonStyle(.plain)
        .help(hideSleeping ? "Show all workspaces" : "Hide sleeping workspaces")

        Button {
          openFolderDialog()
        } label: {
          Image(systemName: "plus")
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Color.zinc200)
            .frame(width: 24, height: 24)
            .background(Color.white.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 5))
            .overlay(
              RoundedRectangle(cornerRadius: 5)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .help("Add Workspace Folder")
      }
      .padding(.horizontal, 12)
      .frame(height: 36)
      .background(Color(red: 12/255, green: 14/255, blue: 22/255).opacity(0.9))
      .overlay(alignment: .bottom) {
        Rectangle()
          .fill(Color.white.opacity(0.06))
          .frame(height: 1)
      }

      // ── Search Input ───────────────────────────────────────────────
      HStack(spacing: 6) {
        Image(systemName: "magnifyingglass")
          .font(.system(size: 11))
          .foregroundStyle(Color.zinc500)

        TextField("Search workspaces...", text: $searchQuery)
          .font(.system(size: 11.5))
          .textFieldStyle(.plain)
          .foregroundStyle(Color.zinc200)

        if !searchQuery.isEmpty {
          Button {
            searchQuery = ""
          } label: {
            Image(systemName: "xmark.circle.fill")
              .font(.system(size: 10))
              .foregroundStyle(Color.zinc500)
          }
          .buttonStyle(.plain)
        }
      }
      .padding(.horizontal, 9)
      .frame(height: 28)
      .background(Color.white.opacity(0.03))
      .clipShape(RoundedRectangle(cornerRadius: 7))
      .overlay(
        RoundedRectangle(cornerRadius: 7)
          .stroke(Color.white.opacity(0.06), lineWidth: 1)
      )
      .padding(.horizontal, 10)
      .padding(.vertical, 8)
      .overlay(alignment: .bottom) {
        Rectangle()
          .fill(Color.white.opacity(0.04))
          .frame(height: 1)
      }

      // ── Workspace Cards List ───────────────────────────────────────
      ScrollView {
        LazyVStack(spacing: 6) {
          if visibleWorkspaces.isEmpty {
            VStack(spacing: 8) {
              Spacer(minLength: 20)
              Image(systemName: "folder.badge.plus")
                .font(.system(size: 24))
                .foregroundStyle(Color.zinc500)
              Text("No workspaces yet")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.zinc400)
              Button("New Workspace") {
                openFolderDialog()
              }
              .buttonStyle(.plain)
              .font(.system(size: 11, weight: .medium))
              .foregroundStyle(Color.swarmGold)
              .padding(.horizontal, 10)
              .padding(.vertical, 4)
              .background(Color.swarmGold.opacity(0.12))
              .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 24)
          } else {
            ForEach(visibleWorkspaces) { ws in
              WorkspaceCard(
                workspace: ws,
                isActive: workspaceStore.activeWorkspaceId == ws.id,
                hasRunningAgents: hasRunningAgents(for: ws),
                onSelect: {
                  workspaceStore.switchWorkspace(ws.id)
                },
                onOpenFolder: {
                  openFolderDialog()
                },
                onRemove: {
                  workspaceStore.removeWorkspace(ws.id)
                }
              )
            }
          }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
      }
    }
    .background(Color(red: 9/255, green: 11/255, blue: 16/255))
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

// MARK: - Workspace Card (Matching Tauri ProjectGroup)

struct WorkspaceCard: View {
  let workspace: Workspace
  let isActive: Bool
  let hasRunningAgents: Bool
  let onSelect: () -> Void
  let onOpenFolder: () -> Void
  let onRemove: () -> Void

  @State private var isHovered: Bool = false

  private var initials: String {
    let words = workspace.name.components(separatedBy: " ").filter { !$0.isEmpty }
    if words.count >= 2 {
      return "\(words[0].prefix(1))\(words[1].prefix(1))".uppercased()
    }
    return String(workspace.name.prefix(2)).uppercased()
  }

  var body: some View {
    Button {
      onSelect()
    } label: {
      HStack(spacing: 9) {
        // Monogram Badge
        Text(initials)
          .font(.system(size: 11, weight: .bold, design: .monospaced))
          .foregroundStyle(isActive ? Color.swarmGoldHi : Color.zinc400)
          .frame(width: 32, height: 32)
          .background(
            isActive
              ? Color.swarmGold.opacity(0.15)
              : Color.white.opacity(0.04)
          )
          .clipShape(RoundedRectangle(cornerRadius: 8))
          .overlay(
            RoundedRectangle(cornerRadius: 8)
              .stroke(isActive ? Color.swarmGold.opacity(0.35) : Color.white.opacity(0.08), lineWidth: 1)
          )

        // Workspace Details
        VStack(alignment: .leading, spacing: 2.5) {
          Text(workspace.name)
            .font(.system(size: 12.5, weight: isActive ? .semibold : .medium))
            .foregroundStyle(isActive ? Color.white : Color.zinc300)
            .lineLimit(1)
            .frame(maxWidth: .infinity, alignment: .leading)

          HStack(spacing: 5) {
            // Branch / Status Pill
            Text(workspace.path.isEmpty ? "unbound" : "main")
              .font(.system(size: 9.5, weight: .medium, design: .monospaced))
              .foregroundStyle(Color.zinc400)
              .padding(.horizontal, 4)
              .padding(.vertical, 1)
              .background(Color.black.opacity(0.4))
              .clipShape(RoundedRectangle(cornerRadius: 3))
              .overlay(
                RoundedRectangle(cornerRadius: 3)
                  .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
              )

            if hasRunningAgents {
              HStack(spacing: 3) {
                Circle()
                  .fill(Color.swarmOk)
                  .frame(width: 5, height: 5)
                  .shadow(color: Color.swarmOk.opacity(0.8), radius: 3)

                Text("running")
                  .font(.system(size: 9.5, weight: .medium, design: .monospaced))
                  .foregroundStyle(Color.swarmOk)
              }
            }
          }
        }

        // Action icons on hover
        if isHovered || isActive {
          Menu {
            Button("Switch to This Workspace") { onSelect() }
            Divider()
            Button("Open Directory...") { onOpenFolder() }
            Button("Reveal in Finder") {
              WorkspaceFileManager.shared.revealInFinder(path: workspace.path)
            }
            Button("Copy Path") {
              NSPasteboard.general.clearContents()
              NSPasteboard.general.setString(workspace.path, forType: .string)
            }
            Divider()
            Button("Remove Workspace", role: .destructive) { onRemove() }
          } label: {
            Image(systemName: "ellipsis")
              .font(.system(size: 11))
              .foregroundStyle(Color.zinc400)
              .frame(width: 20, height: 20)
              .background(Color.white.opacity(0.06))
              .clipShape(RoundedRectangle(cornerRadius: 4))
          }
          .buttonStyle(.plain)
        }
      }
      .padding(8)
      .background {
        if isActive {
          LinearGradient(
            colors: [
              Color(red: 24/255, green: 26/255, blue: 36/255),
              Color(red: 18/255, green: 20/255, blue: 28/255),
              Color(red: 12/255, green: 13/255, blue: 20/255)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
          .clipShape(RoundedRectangle(cornerRadius: 11))
          .overlay(
            RoundedRectangle(cornerRadius: 11)
              .stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
          )
          .shadow(color: Color.black.opacity(0.4), radius: 8, y: 2)
          .shadow(color: Color.swarmGold.opacity(0.08), radius: 6)
        } else {
          RoundedRectangle(cornerRadius: 11)
            .fill(isHovered ? Color(red: 20/255, green: 22/255, blue: 34/255) : Color(red: 14/255, green: 16/255, blue: 23/255).opacity(0.8))
            .overlay(
              RoundedRectangle(cornerRadius: 11)
                .stroke(Color.white.opacity(isHovered ? 0.12 : 0.06), lineWidth: 1)
            )
        }
      }
    }
    .buttonStyle(.plain)
    .onHover { isHovered = $0 }
  }
}
