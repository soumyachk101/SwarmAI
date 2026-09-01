import SwiftUI

// MARK: - Window Title Bar

struct SwarmTitleBar: View {
 @Bindable var appState: AppState
 @Bindable var uiStore: UiStore

 var body: some View {
 HStack(spacing: 0) {
 // Left: workspace name
 HStack(spacing: 8) {
 Image(systemName: "ant.fill")
 .font(.system(size: 14))
 .foregroundStyle(.swarmGold)

 Text(appState.workspaceName)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
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

 // Board view toggle (only for board plane)
 if appState.activePlane == .board {
 Picker("", selection: $appState.boardView) {
 ForEach(BoardView.allCases) { view in
 Text(view.rawValue)
 .tag(view)
 }
 }
 .pickerStyle(.segmented)
 .frame(width: 120)
 .labelsHidden()
 }
 }
 .padding(.trailing, 80)
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
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}
