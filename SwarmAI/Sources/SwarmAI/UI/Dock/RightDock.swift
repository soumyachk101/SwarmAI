import SwiftUI
import AppKit

// MARK: - Right Dock (Rail)

public struct RightDock: View {
 @Environment(\.appState) private var appState
 @Environment(\.agentsStore) private var agentsStore

 @State private var contentAppeared: Bool = false
 @State private var isResizing: Bool = false
 @State private var dockWidth: CGFloat = 340
 @State private var collapsed: Bool = false

 private let minWidth: CGFloat = 260
 private let maxWidth: CGFloat = 520
 private let railWidth: CGFloat = 44

 private var clampedWidth: CGFloat {
 min(maxWidth, max(minWidth, dockWidth))
 }

 private var activeTab: DockTab {
 appState.activeRightTab
 }

 public init() {}

 public var body: some View {
 Group {
 if collapsed {
 railView
 } else {
 expandedView
 }
 }
 .animation(.swarmTabSwitch, value: collapsed)
 .onAppear {
 withAnimation(.easeOut(duration: 0.35).delay(0.25)) {
 contentAppeared = true
 }
 }
 }

 // MARK: - Rail View (Collapsed)

 private var railView: some View {
 VStack(spacing: 0) {
 Spacer(minLength: 0)

 ForEach(DockTab.allCases) { tab in
 railTabButton(for: tab)
 .padding(.vertical, 3)

 if tab != .reports {
 Divider()
 .background(.swarmBorder.opacity(0.3))
 .padding(.horizontal, 10)
 }
 }

 Spacer(minLength: 0)
 }
 .frame(width: railWidth)
 .background(.swarmSurface.opacity(0.95))
 .overlay(
 Rectangle()
 .fill(.swarmBorder.opacity(0.4))
 .frame(width: 1),
 alignment: .leading
 )
 }

 private func railTabButton(for tab: DockTab) -> some View {
 let isActive = activeTab == tab

 return Button {
 withAnimation(.swarmTabSwitch) {
 appState.activeRightTab = tab
 collapsed = false
 }
 } label: {
 ZStack {
 if isActive {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmGold.opacity(0.18))
 .frame(width: 28, height: 36)
 .overlay(
 RoundedRectangle(cornerRadius: 8)
 .stroke(.swarmGold.opacity(0.5), lineWidth: 1.5)
 )
 }

 Image(systemName: tab.icon)
 .font(.system(size: 16))
 .foregroundStyle(isActive ? .swarmGold : .swarmTextSecondary)
 .frame(width: 28, height: 28)
 }
 }
 .buttonStyle(.plain)
 .help(tab.title)
 .scaleEffect(isActive ? 1.08 : 1.0)
 }

 // MARK: - Expanded View

 private var expandedView: some View {
 HStack(spacing: 0) {
 // Resize handle
 resizeHandle

 // Content
 dockContent
 .frame(width: clampedWidth)
 .background(.swarmSurface.opacity(0.95))
 .overlay(
 Rectangle()
 .fill(.swarmBorder.opacity(0.3))
 .frame(width: 1),
 alignment: .leading
 )
 }
 }

 private var resizeHandle: some View {
 Rectangle()
 .fill(Color.clear)
 .frame(width: 6)
 .contentShape(Rectangle())
 .gesture(
 DragGesture(minimumDistance: 1)
 .onChanged { value in
 isResizing = true
 dockWidth = clampedWidth - value.translation.width
 NSCursor.colResize.push()
 }
 .onEnded { _ in
 isResizing = false
 NSCursor.pop()
 }
 )
 .onHover { hovering in
 if hovering {
 NSCursor.colResize.push()
 } else if !isResizing {
 NSCursor.pop()
 }
 }
 }

 private var dockContent: some View {
 VStack(spacing: 0) {
 // Header
 dockHeader

 // Tab bar
 tabBar

 // Content
 tabContent
 .frame(maxWidth: .infinity, maxHeight: .infinity)
 }
 .cornerRadius(10, corners: [.topLeft, .bottomLeft])
 .shadow(color: .black.opacity(0.25), radius: 8, x: -3, y: 0)
 }

 private var dockHeader: some View {
 HStack {
 Text("Swarm Dock")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 // Collapse button
 Button {
 withAnimation(.swarmTabSwitch) {
 collapsed = true
 }
 } label: {
 Image(systemName: "chevron.right")
 .font(.system(size: 11, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)
 .frame(width: 22, height: 22)
 }
 .buttonStyle(.plain)
 .help("Collapse dock")
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .background(.swarmSurface.opacity(0.8))
 }

 private var tabBar: some View {
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 4) {
 ForEach(DockTab.allCases) { tab in
 let isActive = activeTab == tab

 Button {
 withAnimation(.swarmTabSwitch) {
 appState.activeRightTab = tab
 }
 } label: {
 HStack(spacing: 5) {
 Image(systemName: tab.icon)
 .font(.system(size: 13))

 if !collapsed {
 Text(tab.title)
 .font(.swarm(.xs, weight: isActive ? .medium : .regular))
 }
 }
 .foregroundStyle(isActive ? .swarmGold : .swarmTextSecondary)
 .padding(.horizontal, isActive ? 10 : 8)
 .padding(.vertical, 5)
 .background(
 RoundedRectangle(cornerRadius: 6)
 .fill(isActive ? .swarmGold.opacity(0.15) : .clear)
 )
 .overlay(
 RoundedRectangle(cornerRadius: 6)
 .stroke(isActive ? .swarmGold.opacity(0.4) : .clear, lineWidth: 1)
 )
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 8)
 }
 .frame(height: 34)
 .background(.swarmSurface.opacity(0.6))
 .overlay(
 Rectangle()
 .fill(.swarmBorder.opacity(0.4))
 .frame(height: 1),
 alignment: .bottom
 )
 }

 @ViewBuilder
 private var tabContent: some View {
 switch activeTab {
 case .lead:
 LeadPanel()
 case .devChat:
 DevChatPanel()
 case .gitPanel:
 GitPanelView()
 case .snippets:
 SnippetsPanel()
 case .reports:
 ReportsPanel()
 }
 }
}

// MARK: - Corner Radius Extension

extension View {
 func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
 clipShape(RoundedCorner(radius: radius, corners: corners))
 }
}

struct RoundedCorner: Shape {
 let radius: CGFloat
 let corners: UIRectCorner

 func path(in rect: CGRect) -> Path {
 var path = Path()
 let cornersToRound: [CGFloat] = [
 corners.contains(.topLeft) ? 1 : 0,
 corners.contains(.topRight) ? 1 : 0,
 corners.contains(.bottomRight) ? 1 : 0,
 corners.contains(.bottomLeft) ? 1 : 0
 ]

 let topLeft = CGPoint(x: rect.minX + radius, y: rect.maxY - radius)
 let topRight = CGPoint(x: rect.maxX - radius, y: rect.maxY - radius)
 let bottomRight = CGPoint(x: rect.maxX - radius, y: rect.minY + radius)
 let bottomLeft = CGPoint(x: rect.minX + radius, y: rect.minY + radius)

 path.move(to: CGPoint(x: rect.minX, y: rect.maxY - radius))
 if corners.contains(.topLeft) {
 path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY),
 tangent2End: topLeft, radius: radius)
 } else {
 path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
 }

 path.addLine(to: CGPoint(x: rect.maxX - radius, y: rect.maxY))
 if corners.contains(.topRight) {
 path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY),
 tangent2End: topRight, radius: radius)
 } else {
 path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
 }

 path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + radius))
 if corners.contains(.bottomRight) {
 path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY),
 tangent2End: bottomRight, radius: radius)
 } else {
 path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
 }

 path.addLine(to: CGPoint(x: rect.minX + radius, y: rect.minY))
 if corners.contains(.bottomLeft) {
 path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY),
 tangent2End: bottomLeft, radius: radius)
 } else {
 path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
 }

 path.closeSubpath()
 return path
 }
}
