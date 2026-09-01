import SwiftUI

// MARK: - Pheromone Shared Memory Service

@Observable
final class PheromoneService {
 static let shared = PheromoneService()

 var memories: [Memory] = []
 var sessionHistory: [TerminalSession] = []
 var searchIndex: [String: [UUID]] = [:] // keyword -> memory IDs

 func store(_ memory: Memory) {
 memories.append(memory)
 indexMemory(memory)
 }

 func search(query: String) -> [Memory] {
 memories.filter { memory in
 memory.content.localizedCaseInsensitiveContains(query) ||
 memory.tags.contains { $0.localizedCaseInsensitiveContains(query) }
 }
 .sorted { $0.importance > $1.importance }
 }

 func memoriesForWorkspace(_ workspaceId: UUID) -> [Memory] {
 memories.filter { $0.workspaceId == workspaceId }
 }

 func memoriesForAgent(_ agentId: UUID) -> [Memory] {
 memories.filter { $0.agentId == agentId }
 }

 func injectContext(for agent: Agent, context: [Memory]) -> String {
 // Build context injection string for agent prompt
 var contextStr = "# Pheromone Context\n\n"
 for memory in context {
 contextStr += "## [\(memory.type.rawValue)] \(memory.content)\n\n"
 }
 return contextStr
 }

 func recordSession(_ session: TerminalSession) {
 sessionHistory.append(session)
 }

 private func indexMemory(_ memory: Memory) {
 let words = memory.content.components(separatedBy: .whitespacesAndNewlines)
 for word in words where word.count > 3 {
 let lower = word.lowercased()
 if searchIndex[lower] == nil {
 searchIndex[lower] = []
 }
 searchIndex[lower]?.append(memory.id)
 }
 }
}

// MARK: - File Ownership Locks

@Observable
final class FileLockService {
 static let shared = FileLockService()

 var locks: [FileLock] = []

 func lock(file: String, owner: Agent) -> FileLock {
 let lock = FileLock(file: file, ownerId: owner.id, ownerName: owner.name)
 locks.append(lock)
 return lock
 }

 func unlock(file: String) {
 locks.removeAll { $0.file == file }
 }

 func isLocked(_ file: String) -> Bool {
 locks.contains { $0.file == file }
 }

 func owner(of file: String) -> FileLock? {
 locks.first { $0.file == file }
 }

 func releaseAll(for agent: Agent) {
 locks.removeAll { $0.ownerId == agent.id }
 }
}

struct FileLock: Identifiable {
 let id = UUID()
 let file: String
 let ownerId: UUID
 let ownerName: String
 let lockedAt: Date = Date()
}
