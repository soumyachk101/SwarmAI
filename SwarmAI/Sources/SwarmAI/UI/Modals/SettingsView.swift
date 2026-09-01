import SwiftUI

// MARK: - Settings View

struct SettingsView: View {
 @Environment(\.dismiss) var dismiss
 @Bindable var settingsStore: SettingsStore

 var body: some View {
 ZStack {
 Color.black.opacity(0.4)
 .ignoresSafeArea()
 .onTapGesture { dismiss() }

 VStack(spacing: 0) {
 // Title bar
 HStack {
 Text("Settings")
 .font(.swarm(.lg, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Button { dismiss() } label: {
 Image(systemName: "xmark.circle.fill")
 .font(.system(size: 18))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 20)
 .padding(.vertical, 14)

 Divider()
 .background(.swarmBorderSubtle)

 HStack(spacing: 0) {
 // Sidebar nav
 ScrollView {
 VStack(alignment: .leading, spacing: 2) {
 ForEach(SettingsSection.allCases) { section in
 Button {
 // Select section
 } label: {
 HStack(spacing: 8) {
 Image(systemName: section.icon)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)

 Text(section.rawValue)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.vertical, 8)
 }
 .frame(width: 180)
 .background(.swarmCanvas)

 Divider()
 .background(.swarmBorderSubtle)

 // Content
 ScrollView {
 VStack(alignment: .leading, spacing: 16) {
 // Models section
 SettingsSectionHeader(title: "Models")

 HStack(spacing: 12) {
 ForEach(AgentType.allCases.filter { $0 != .plainTerminal }, id: \.self) { type in
 VStack(spacing: 4) {
 Text(type.icon)
 .font(.system(size: 28))

 Text(type.displayName)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 }
 .frame(maxWidth: .infinity)
 .padding(.vertical, 12)
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(settingsStore.defaultAgent == type ? .swarmGold.opacity(0.15) : .swarmSurface)
 .overlay {
 RoundedRectangle(cornerRadius: 10)
 .stroke(settingsStore.defaultAgent == type ? .swarmGold : .swarmBorderSubtle, lineWidth: 1)
 }
 }
 .onTapGesture {
 settingsStore.setDefaultAgent(type)
 }
 }
 }

 // Providers section
 SettingsSectionHeader(title: "Providers")

 ForEach(settingsStore.apiKeys) { provider in
 VStack(alignment: .leading, spacing: 4) {
 Text(provider.name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 SecureField("API Key", text: $provider.apiKey)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)
 }
 }
 }

 // Theme section
 SettingsSectionHeader(title: "Appearance")

 Picker("Theme Mode", selection: $settingsStore.themeMode) {
 ForEach(ThemeMode.allCases, id: \.self) { mode in
 Text(mode.rawValue).tag(mode)
 }
 }
 .pickerStyle(.segmented)
 .frame(width: 200)

 // Terminal
 SettingsSectionHeader(title: "Terminal")

 Picker("Shell", selection: $settingsStore.terminalShell) {
 Text("zsh").tag("zsh")
 Text("bash").tag("bash")
 Text("fish").tag("fish")
 }
 .pickerStyle(.menu)
 .frame(width: 120)
 }
 .padding(.horizontal, 20)
 .padding(.vertical, 16)
 }
 }
 .frame(width: 600, height: 500)
 .background(.swarmSurface)
 .cornerRadius(12)
 .shadow(color: .black.opacity(0.4), radius: 30, x: 0, y: 10)
 }
 }
}

struct SettingsSectionHeader: View {
 let title: String

 var body: some View {
 Text(title.uppercased())
 .font(.swarm(.xs, weight: .bold))
 .foregroundStyle(.swarmTextTertiary)
 .padding(.top, 8)
 }
}

enum SettingsSection: String, CaseIterable, Identifiable {
 case general = "General"
 case models = "Models"
 case providers = "Providers"
 case appearance = "Appearance"
 case terminal = "Terminal"
 case updates = "Updates"

 var icon: String {
 switch self {
 case .general: return "gearshape"
 case .models: return "cpu"
 case .providers: return "key.fill"
 case .appearance: return "paintbrush"
 case .terminal: return "terminal"
 case .updates: return "arrow.down.circle"
 }
 }

 var id: String { rawValue }
}
