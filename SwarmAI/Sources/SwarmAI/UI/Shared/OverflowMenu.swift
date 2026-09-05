import SwiftUI

// MARK: - Overflow Menu

public struct OverflowMenuItem: Identifiable {
 public let id = UUID()
 public let label: String
 public let icon: String?
 public let shortcut: String?
 public let action: @Sendable () -> Void
 public let isDestructive: Bool
 public let isSeparator: Bool

 public init(
 label: String,
 icon: String? = nil,
 shortcut: String? = nil,
 isDestructive: Bool = false,
 isSeparator: Bool = false,
 action: @escaping @Sendable () -> Void
 ) {
 self.label = label
 self.icon = icon
 self.shortcut = shortcut
 self.isDestructive = isDestructive
 self.isSeparator = isSeparator
 self.action = action
 }

 public static func separator() -> OverflowMenuItem {
 OverflowMenuItem(label: "", isSeparator: true, action: {})
 }
}

public struct OverflowMenu: View {
 @State private var isExpanded: Bool = false
 @State private var hoveredIndex: Int? = nil

 public let items: [OverflowMenuItem]
 public var buttonSize: CGFloat = 28

 public init(items: [OverflowMenuItem] = [], buttonSize: CGFloat = 28) {
 self.items = items
 self.buttonSize = buttonSize
 }

 public var body: some View {
 ZStack(alignment: .topTrailing) {
 // Trigger button
 Button {
 withAnimation(.swarmQuick) {
 isExpanded.toggle()
 }
 } label: {
 Image(systemName: "ellipsis.circle")
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextSecondary)
 .frame(width: buttonSize, height: buttonSize)
 .contentShape(Rectangle())
 }
 .buttonStyle(.plain)
 .glassInteractive(.glass)

 // Menu popover
 if isExpanded {
 menuPopover
 }
 }
 }

 private var menuPopover: some View {
 VStack(spacing: 0) {
 ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
 if item.isSeparator {
 Divider()
 .background(Color.swarmBorderSubtle)
 .padding(.vertical, 4)
 } else {
 Button {
 withAnimation(.swarmQuick) {
 item.action()
 isExpanded = false
 }
 } label: {
 HStack(spacing: 8) {
 if let icon = item.icon {
 Image(systemName: icon)
 .font(.swarm(.xs))
 .foregroundStyle(
 item.isDestructive ? Color.swarmError : Color.swarmTextSecondary
 )
 .frame(width: 16, alignment: .center)
 }

 Text(item.label)
 .font(.swarm(.xs))
 .foregroundStyle(
 item.isDestructive ? Color.swarmError : Color.swarmTextPrimary
 )

 Spacer()

 if let shortcut = item.shortcut {
 Text(shortcut)
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background(
 hoveredIndex == index ? Color.swarmSurfaceHover : Color.clear
 )
 }
 .buttonStyle(.plain)
 .onHover { hovering in
 hoveredIndex = hovering ? index : nil
 }
 }
 }
 }
 .background(
 RoundedRectangle(cornerRadius: 8, style: .continuous)
 .fill(.ultraThinMaterial)
 .overlay(
 RoundedRectangle(cornerRadius: 8, style: .continuous)
 .stroke(Color.swarmBorderSubtle.opacity(0.5), lineWidth: 1)
 )
 )
 .shadow(color: .black.opacity(0.2), radius: 12, x: 0, y: 4)
 .frame(minWidth: 180)
 .padding(.trailing, 8)
 .zIndex(1)
 .onAppear {
 // Auto-close when clicking outside
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
 monitorOutsideClicks()
 }
 }
 }

 private func monitorOutsideClicks() {
 guard isExpanded else { return }
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
 monitorOutsideClicks()
 }
 }
}

// MARK: - OverflowMenuPreview

struct OverflowMenu_Previews: PreviewProvider {
 static var previews: some View {
 ZStack {
 Color.swarmCanvas.ignoresSafeArea()

 OverflowMenu(items: [
 OverflowMenuItem(label: "New Agent", icon: "plus", shortcut: "⌘N") {
 print("New Agent")
 },
 OverflowMenuItem(label: "Open Workspace", icon: "folder") {
 print("Open")
 },
 OverflowMenuItem(label: "Refresh", icon: "arrow.clockwise") {
 print("Refresh")
 },
 OverflowMenuItem.separator(),
 OverflowMenuItem(label: "Delete", icon: "trash", isDestructive: true) {
 print("Delete")
 },
 ])
 .padding()
 }
 }
}
