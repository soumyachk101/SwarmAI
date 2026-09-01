import SwiftUI

// MARK: - Browser Pane

struct BrowserPaneView: View {
 @Bindable var browserStore: BrowserStore

 var body: some View {
 VStack(spacing: 0) {
 // Browser toolbar
 HStack(spacing: 8) {
 Button {
 browserStore.goBack()
 } label: {
 Image(systemName: "chevron.left")
 .font(.swarm(.xs))
 .foregroundStyle(browserStore.canGoBack ? .swarmTextPrimary : .swarmTextTertiary)
 }
 .buttonStyle(.plain)
 .disabled(!browserStore.canGoBack)

 Button {
 browserStore.goForward()
 } label: {
 Image(systemName: "chevron.right")
 .font(.swarm(.xs))
 .foregroundStyle(browserStore.canGoForward ? .swarmTextPrimary : .swarmTextTertiary)
 }
 .buttonStyle(.plain)
 .disabled(!browserStore.canGoForward)

 Button {
 browserStore.reload()
 } label: {
 Image(systemName: "arrow.clockwise")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextPrimary)
 }
 .buttonStyle(.plain)

 TextField("Search or enter URL", text: $browserStore.currentUrl, onCommit: {
 browserStore.navigate(browserStore.currentUrl)
 })
 .font(.swarm(.sm))
 .textFieldStyle(.plain)
 .onSubmit {
 browserStore.navigate(browserStore.currentUrl)
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmSurface)

 Divider()
 .background(.swarmBorderSubtle)

 // Browser content area
 ZStack {
 Color.swarmCanvas

 if browserStore.isLoading {
 ProgressView()
 .tint(.swarmGold)
 }

 VStack(spacing: 12) {
 Image(systemName: "globe")
 .font(.system(size: 48))
 .foregroundStyle(.swarmTextTertiary)

 Text("Browser Plane")
 .font(.swarm(.lg, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)

 Text("Enter a URL above to start browsing")
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextTertiary)
 }
 }
 }
 .background(.swarmCanvas)
 }
}

// MARK: - Emulator Pane

struct EmulatorPaneView: View {
 let avds: [(String, String)] = [
 ("Pixel 7 API 34", "Running"),
 ("Pixel 6 API 33", "Stopped"),
 ("Nexus 5X API 30", "Stopped"),
 ]

 @State private var selectedAvd: String = "Pixel 7 API 34"

 var body: some View {
 VStack(spacing: 0) {
 // Emulator toolbar
 HStack {
 Text("Emulator")
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Picker("", selection: $selectedAvd) {
 ForEach(avds, id: \.0) { name, _ in
 Text(name)
 }
 }
 .pickerStyle(.menu)
 .font(.swarm(.xs))
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmSurface)

 Divider()
 .background(.swarmBorderSubtle)

 // AVD list
 ScrollView {
 VStack(spacing: 8) {
 ForEach(avds, id: \.0) { name, status in
 AvdRow(name: name, status: status)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 4)
 }
 }

 Spacer()
 }
 .background(.swarmCanvas)
 }
}

struct AvdRow: View {
 let name: String
 let status: String

 var body: some View {
 HStack(spacing: 10) {
 Circle()
 .fill(status == "Running" ? .swarmSuccess : .swarmTextTertiary)
 .frame(width: 8, height: 8)

 VStack(alignment: .leading, spacing: 2) {
 Text(name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Text(status)
 .font(.swarm(.micro))
 .foregroundStyle(status == "Running" ? .swarmSuccess : .swarmTextTertiary)
 }

 Spacer()

 Button(status == "Running" ? "Stop" : "Launch") { }
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 .buttonStyle(.plain)
 }
 .padding(10)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmSurface)
 }
 }
}
