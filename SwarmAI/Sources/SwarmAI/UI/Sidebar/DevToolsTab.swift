import SwiftUI

// MARK: - DevTools Tab

struct DevToolsTab: View {
 @State private var selectedTool: DevTool = .regex

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Tool selector
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 4) {
 ForEach(DevTool.allCases) { tool in
 Button {
 withAnimation(.swarmQuick) {
 selectedTool = tool
 }
 } label: {
 Text(tool.rawValue)
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(selectedTool == tool ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(selectedTool == tool ? .swarmGold : .swarmSurface)
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 12)
 }
 }
 .padding(.vertical, 8)

 Divider()
 .background(.swarmBorderSubtle)

 // Tool content
 ScrollView {
 VStack(spacing: 12) {
 switch selectedTool {
 case .regex:
 RegexTool()
 case .jsonFormatter:
 JsonFormatterTool()
 case .base64:
 Base64Tool()
 case .epoch:
 EpochTool()
 case .scripts:
 ScriptsTool()
 }
 }
 .padding(.horizontal, 12)
 .padding(.top, 12)
 }
 .background(.swarmCanvas)
 }
}

enum DevTool: String, CaseIterable, Identifiable {
 case regex = "Regex"
 case jsonFormatter = "JSON"
 case base64 = "Base64"
 case epoch = "Epoch"
 case scripts = "Scripts"

 var id: String { rawValue }
}

// MARK: - Tool Views

struct RegexTool: View {
 @State private var pattern: String = ""
 @State private var text: String = ""

 var body: some View {
 VStack(alignment: .leading, spacing: 8) {
 Text("Regex Tester")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 TextField("Pattern...", text: $pattern)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)
 .overlay {
 RoundedRectangle(cornerRadius: 6)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }

 TextEditor(text: $text)
 .font(.swarmMono(.xs))
 .frame(height: 120)
 .scrollContentBackground(.hidden)
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)
 .overlay {
 RoundedRectangle(cornerRadius: 6)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }
 }
 }
}

struct JsonFormatterTool: View {
 @State private var jsonInput: String = ""

 var body: some View {
 VStack(alignment: .leading, spacing: 8) {
 Text("JSON Formatter")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 TextEditor(text: $jsonInput)
 .font(.swarmMono(.xs))
 .frame(height: 150)
 .scrollContentBackground(.hidden)
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)

 Button("Format") { }
 .font(.swarm(.xs))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background(.swarmGold)
 .cornerRadius(6)
 }
 }
 }
}

struct Base64Tool: View {
 @State private var input: String = ""
 @State private var output: String = ""

 var body: some View {
 VStack(alignment: .leading, spacing: 8) {
 Text("Base64 Encoder/Decoder")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 HStack(spacing: 8) {
 Button("Encode") { }
 Button("Decode") { }
 }
 }

 struct EpochTool: View {
 @State private var epochInput: String = ""
 @State private var dateOutput: String = ""

 var body: some View {
 VStack(alignment: .leading, spacing: 8) {
 Text("Unix Epoch Converter")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 TextField("Timestamp...", text: $epochInput)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)

 if let epoch = TimeInterval(epochInput) {
 Text(Date(timeIntervalSince1970: epoch), style: .date)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextSecondary)
 }
 }
 }
}

struct ScriptsTool: View {
 let scripts: [(String, String)] = [
 ("Git Status", "git status"),
 ("Git Diff", "git diff"),
 ("Git Log", "git log --oneline -10"),
 ]

 var body: some View {
 VStack(alignment: .leading, spacing: 8) {
 Text("Quick Scripts")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 ForEach(scripts, id: \.0) { name, command in
 Button {
 } label: {
 HStack {
 Image(systemName: "terminal.fill")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)

 VStack(alignment: .leading, spacing: 2) {
 Text(name)
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 Text(command)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 Spacer()

 Image(systemName: "play.fill")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 }
 .buttonStyle(.plain)
 }
 }
 }
}
