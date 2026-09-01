import SwiftUI

// MARK: - Status Bar

struct StatusBar: View {
 @Bindable var appState: AppState

 var body: some View {
 HStack(spacing: 16) {
 // Git branch
 HStack(spacing: 6) {
 Image(systemName: "arrow.triangle.branch")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)

 Text(appState.gitBranch)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 }
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 4)
 .fill(.swarmSurfaceHover.opacity(0.5))
 }
 .onTapGesture {
 // Show Git Control Modal
 }

 Spacer()

 // Active agents count
 HStack(spacing: 6) {
 Circle()
 .fill(appState.activeAgentsCount > 0 ? .swarmSuccess : .swarmTextTertiary)
 .frame(width: 6, height: 6)
 .if(appState.activeAgentsCount > 0) { view in
 view.overlay(
 Circle()
 .fill(.swarmSuccess.opacity(0.3))
 .scaleEffect(1.5)
 .animation(.swarmVoicePulse, value: appState.activeAgentsCount)
 )
 }

 Text("\(appState.activeAgentsCount) agent\(appState.activeAgentsCount == 1 ? "" : "s")")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 }

 // Engine status
 HStack(spacing: 6) {
 Circle()
 .fill(appState.engineStatus == "Running" ? .swarmSuccess : .swarmTextTertiary)
 .frame(width: 6, height: 6)

 Text(appState.engineStatus)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 }

 // Spacer
 Spacer()

 // Connection indicator
 HStack(spacing: 4) {
 Circle()
 .fill(.swarmSuccess)
 .frame(width: 6, height: 6)

 Text("Connected")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 6)
 .background {
 Color.black.opacity(0.1)
 }
 .overlay(alignment: .top) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}
