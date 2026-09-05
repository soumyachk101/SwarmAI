import SwiftUI

 @MainActor
@Observable
public final class WorkspaceStore: @unchecked Sendable {
  public static let shared = WorkspaceStore()
  public var workspaces: [Workspace] = []
  public var activeWorkspaceId: UUID?

  public init() {
    loadFromStorage()
    if workspaces.isEmpty {
      let defaultWorkspace = Workspace(
        name: "Swarm Workspace",
        path: NSHomeDirectory(),
        color: Color.swarmGold
      )
      workspaces.append(defaultWorkspace)
      activeWorkspaceId = defaultWorkspace.id
    }
  }

 public func createWorkspace(name: String, path: String) -> Workspace {
 let workspace = Workspace(name: name, path: path, color: Color.swarmGold)
 workspaces.append(workspace)
 activeWorkspaceId = workspace.id
 saveToStorage()
 return workspace
 }

 public func switchWorkspace(_ id: UUID) {
 activeWorkspaceId = id
 saveToStorage()
 }

 public func removeWorkspace(_ id: UUID) {
 workspaces.removeAll { $0.id == id }
 if activeWorkspaceId == id {
 activeWorkspaceId = workspaces.first?.id
 }
 saveToStorage()
 }

 var activeWorkspace: Workspace? {
 workspaces.first { $0.id == activeWorkspaceId }
 }

 public func addWorktree(_ workspaceId: UUID, name: String, branch: String) -> Worktree {
 guard let workspace = workspaces.first(where: { $0.id == workspaceId }) else {
 fatalError("Workspace not found")
 }
 let worktree = Worktree(name: name, path: "\(workspace.path)/.worktrees/\(name)", branch: branch)
 workspace.worktrees.append(worktree)
 saveToStorage()
 return worktree
 }

 public func removeWorktree(_ workspaceId: UUID, worktreeId: UUID) {
 guard let workspace = workspaces.first(where: { $0.id == workspaceId }) else { return }
 workspace.worktrees.removeAll { $0.id == worktreeId }
 saveToStorage()
 }

 private func saveToStorage() {
 if let data = try? JSONEncoder().encode(workspaces) {
 UserDefaults.standard.set(data, forKey: "savedWorkspaces")
 }
 if let wsId = activeWorkspaceId {
 UserDefaults.standard.set(wsId.uuidString, forKey: "activeWorkspace")
 }
 }

 private func loadFromStorage() {
 guard let data = UserDefaults.standard.data(forKey: "savedWorkspaces"),
 let decoded = try? JSONDecoder().decode([Workspace].self, from: data) else { return }
 workspaces = decoded
 if let wsIdString = UserDefaults.standard.string(forKey: "activeWorkspace"),
 let wsId = UUID(uuidString: wsIdString) {
 activeWorkspaceId = wsId
 }
 }
}
