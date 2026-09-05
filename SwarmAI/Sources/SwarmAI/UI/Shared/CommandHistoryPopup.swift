import SwiftUI

// MARK: - Command History Item

public struct CommandHistoryItem: Sendable, Identifiable, Codable {
 public let id: UUID
 public let command: String
 public let timestamp: Date
 public let agentName: String?
 public let result: String?

 public init(
 id: UUID,
 command: String,
 timestamp: Date = Date(),
 agentName: String? = nil,
 result: String? = nil
 ) {
 self.id = id
 self.command = command
 self.timestamp = timestamp
 self.agentName = agentName
 self.result = result
 }
}

// MARK: - Command History Store

@MainActor
@Observable
public final class CommandHistoryStore {
 public static let shared = CommandHistoryStore()

 public var history: [CommandHistoryItem] = []
 public var maxItems: Int = 20

 public init() {
 loadHistory()
 }

 public func add(_ command: String, agentName: String? = nil, result: String? = nil) {
 let item = CommandHistoryItem(id: UUID(), command: command, timestamp: Date(), agentName: agentName, result: result)
 history.insert(item, at: 0)

 if history.count > maxItems {
 history.removeLast()
 }

 saveHistory()
 }

 public func clear() {
 history.removeAll()
 saveHistory()
 }

 public func recent(limit: Int = 10) -> [CommandHistoryItem] {
 Array(history.prefix(limit))
 }

 private func loadHistory() {
 if let data = UserDefaults.standard.data(forKey: "commandHistory"),
 let decoded = try? JSONDecoder().decode([CommandHistoryItem].self, from: data) {
 history = decoded
 }
 }

 private func saveHistory() {
 if let data = try? JSONEncoder().encode(history) {
 UserDefaults.standard.set(data, forKey: "commandHistory")
 }
 }
}

// MARK: - Command History Popup

public struct CommandHistoryPopup: View {
 @State private var isExpanded: Bool = false
 @State private var selectedIndex: Int = 0
 @FocusState private var isFocused: Bool

 let onSelect: (CommandHistoryItem) -> Void
 let maxVisible: Int = 8

 public init(onSelect: @escaping (CommandHistoryItem) -> Void) {
 self.onSelect = onSelect
 }

 public var body: some View {
 VStack(spacing: 0) {
 // Search bar
 HStack(spacing: 8) {
 Image(systemName: "clock.arrow.circlepath")
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextTertiary)

 Text("Command History")
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(Color.swarmTextSecondary)

 Spacer()

 Button("Clear") {
 CommandHistoryStore.shared.clear()
 }
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background(Color.swarmSurface)

 Divider()
 .background(Color.swarmBorderSubtle)

 // History list
 ScrollView {
 LazyVStack(spacing: 0) {
 let items = CommandHistoryStore.shared.recent(limit: maxVisible)

 if items.isEmpty {
 ContentUnavailableView(
 "No History",
 systemImage: "clock.arrow.circlepath",
 description: Text("Your recent commands will appear here")
 )
 .padding(.vertical, 24)
 } else {
 ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
 historyRow(item, index: index)
 }
 }
 }
 }
 .frame(maxHeight: CGFloat(min(maxVisible, items.count)) * 44)
 }
 .background {
 RoundedRectangle(cornerRadius: 8, style: .continuous)
 .fill(.ultraThinMaterial)
 .overlay(
 RoundedRectangle(cornerRadius: 8, style: .continuous)
 .stroke(Color.swarmBorderSubtle.opacity(0.5), lineWidth: 1)
 )
 }
 .shadow(color: .black.opacity(0.2), radius: 12, x: 0, y: 4)
 }

 private var items: [CommandHistoryItem] {
 CommandHistoryStore.shared.recent(limit: maxVisible)
 }

 private func historyRow(_ item: CommandHistoryItem, index: Int) -> some View {
 let isSelected = index == selectedIndex

 return Button {
 onSelect(item)
 } label: {
 HStack(spacing: 8) {
 // Agent indicator
 if let agent = item.agentName {
 Text(agent.prefix(1))
 .font(Font.swarmMono(.micro))
 .foregroundStyle(Color.swarmCanvas)
 .frame(width: 20, height: 20)
 .background(Circle().fill(Color.swarmGold))
 }

 // Command text
 VStack(alignment: .leading, spacing: 2) {
 Text(item.command)
 .font(.swarmMono(.micro))
 .foregroundStyle(isSelected ? Color.swarmGold : Color.swarmTextPrimary)
 .lineLimit(1)

 if let result = item.result, !result.isEmpty {
 Text(result)
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 .lineLimit(1)
 }
 }

 Spacer()

 // Timestamp
 Text(timeAgo(item.timestamp))
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background(isSelected ? Color.swarmSurfaceHover : Color.clear)
 }
 .buttonStyle(.plain)
 }

 private func timeAgo(_ date: Date) -> String {
 let interval = Date().timeIntervalSince(date)
 if interval < 60 { return "now" }
 if interval < 3600 { return "\(Int(interval / 60))m" }
 if interval < 86400 { return "\(Int(interval / 3600))h" }
 return "\(Int(interval / 86400))d"
 }
}

// MARK: - Preview

struct CommandHistoryPopup_Previews: PreviewProvider {
 static var previews: some View {
 CommandHistoryPopup { item in
 print("Selected: \(item.command)")
 }
 .padding()
 .background(Color.swarmCanvas)
 .environment(CommandHistoryStore())
 }
}
