import SwiftUI

// MARK: - Window Title Bar

struct SwarmTitleBar: View {
 @Environment(\.appState) private var appState
 @Environment(\.uiStore) private var uiStore

 // Entrance animation state
 @State private var hasAppeared = false

 // Shimmer mask state for workspace name
 @State private var shimmerOffset: CGFloat = -1.0

 // Separator draw state
 @State private var separatorScale: CGFloat = 0

 var body: some View {
 HStack(spacing: 0) {
 // Left: workspace name
 HStack(spacing: 8) {
 Image(systemName: "ant.fill")
 .font(.system(size: 14))
 .foregroundStyle(.swarmGold)
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : -30)
 .animation(.swarmTitleEntry.delay(0.00), value: hasAppeared)

 Text(appState.workspaceName)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 .mask(
 LinearGradient(
 gradient: Gradient(stops: [
 .init(color: .clear, location: max(0, shimmerOffset - 0.15)),
 .init(color: .black, location: shimmerOffset),
 .init(color: .clear, location: min(1, shimmerOffset + 0.15))
 ]),
 startPoint: .leading,
 endPoint: .trailing
 )
 )
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : -30)
 .animation(.swarmTitleEntry.delay(0.00), value: hasAppeared)
 .onChange(of: hasAppeared) { _, appeared in
 if appeared {
 withAnimation(.linear(duration: 0.7).delay(0.15)) {
 shimmerOffset = 1.1
 }
 } else {
 shimmerOffset = -1.0
 }
 }
 }
 .padding(.leading, 16)

 Spacer()

 // Right: controls
 HStack(spacing: 16) {
 // Voice toggle
 Button {
 withAnimation(.swarmQuick) {
 appState.isVoiceActive.toggle()
 }
 } label: {
 Image(systemName: appState.isVoiceActive ? "mic.fill" : "mic.slash.fill")
 .font(.system(size: 13))
 .foregroundStyle(appState.isVoiceActive ? .swarmGold : .swarmTextTertiary)
 .frame(width: 28, height: 28)
 }
 .buttonStyle(.plain)
 .help("Toggle Voice Input")
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : -30)
 .animation(.swarmTitleEntry.delay(0.03), value: hasAppeared)

 // Plane switcher
 Picker("", selection: $appState.activePlane) {
 ForEach(Plane.allCases) { plane in
 Image(systemName: plane.icon)
 .tag(plane)
 }
 }
 .pickerStyle(.segmented)
 .frame(width: 160)
 .labelsHidden()
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : -30)
 .animation(.swarmTitleEntry.delay(0.06), value: hasAppeared)

 // Board view toggle (only for board plane)
 if appState.activePlane == .board {
 Picker("", selection: $appState.boardView) {
 ForEach(BoardView.allCases) { view in
 Text(view.title)
 .tag(view)
 }
 }
 .pickerStyle(.segmented)
 .frame(width: 120)
 .labelsHidden()
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : -30)
 .animation(.swarmTitleEntry.delay(0.09), value: hasAppeared)
 }
 }
 .padding(.trailing, 80)
 .opacity(hasAppeared ? 1 : 0)
 .offset(y: hasAppeared ? 0 : -30)
 .animation(.swarmTitleEntry.delay(0.03), value: hasAppeared)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background {
 // Semi-transparent toolbar background
 ZStack {
 Color.black.opacity(0.15)
 }
 .ignoresSafeArea(edges: .horizontal)
 }
 .overlay(alignment: .bottom) {
 Capsule()
 .fill(.swarmBorderSubtle)
 .frame(height: 1)
 .scaleEffect(x: separatorScale, y: 1, anchor: .leading)
 }
 .onAppear {
 if !hasAppeared {
 withAnimation(.swarmTitleEntry) {
 hasAppeared = true
 }
 withAnimation(.swarmDrawLine.delay(0.35)) {
 separatorScale = 1
 }
 }
 }
 }
}
