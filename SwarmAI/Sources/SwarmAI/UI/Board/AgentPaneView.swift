import SwiftUI
import AppKit

// MARK: - Agent Pane View

struct AgentPaneView: View {
 let agent: Agent
 @Environment(\.agentsStore) private var agentsStore
 @Environment(\.accessibilityReduceMotion) private var reduceMotion
 @Environment(\.themeStore) private var themeStore

 @State private var inputText: String = ""
 @State private var materializeProgress: CGFloat = 0
 @State private var exitProgress: CGFloat = 0
 @State private var isDismissing: Bool = false
 @State private var pulsePhase: CGFloat = 0
 @State private var scanLinePosition: CGFloat = -1
 @State private var isHovered: Bool = false
 @State private var isCRTScanlinesEnabled: Bool = true
 @State private var autoScroll: Bool = true
 @State private var commandHistory: [String] = []
 @State private var historyIndex: Int = -1

 var body: some View {
 VStack(spacing: 0) {
 // Pane header
 headerView

 // Terminal output with ANSI rendering and CRT effect
 terminalView
 .modifier(ScanLineModifier(
 scanLinePosition: scanLinePosition,
 isEnabled: isCRTScanlinesEnabled,
 reduceMotion: reduceMotion
 ))

 // Input prompt bar
 inputBarView
 }
 .scaleEffect(reduceMotion ? 1 : (1 - exitProgress * 0.05))
 .opacity(reduceMotion ? 1 : (1 - exitProgress))
 .blur(radius: contentBlur)
 .background {
 Rectangle()
 .fill(.swarmSurface)
 .glassEffect(.glass, showBorder: true)
 .opacity(reduceMotion ? 1 : materializeProgress)
 }
 .clipShape(RoundedRectangle(cornerRadius: lerp(16, 8, materializeProgress)))
 .overlay {
 hoverGlowOverlay
 }
 .shadow(color: .black.opacity(0.25 * materializeProgress), radius: lerp(0, 8, materializeProgress), x: 0, y: lerp(0, 4, materializeProgress))
 .onHover { hovering in
 isHovered = hovering
 }
 .onAppear {
 ensureSessionStarted()

 guard !reduceMotion else {
 materializeProgress = 1
 return
 }
 withAnimation(.swarmPaneMaterialize) {
 materializeProgress = 1
 }
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
 withAnimation(.easeInOut(duration: 0.8)) {
 scanLinePosition = 1.5
 }
 }
 startStatusPulse()
 }
 }

 // MARK: - Subviews

 private var headerView: some View {
 HStack(spacing: 8) {
 // Agent Icon & Name
 HStack(spacing: 6) {
 Text(agent.agentType.icon)
 .font(.system(size: 12))

 Text(agent.name)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 .lineLimit(1)
 }

 if !agent.model.isEmpty {
 Text(agent.model)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .padding(.horizontal, 4)
 .padding(.vertical, 2)
 .background(Color.swarmSurfaceHover.opacity(0.08))
 .clipShape(RoundedRectangle(cornerRadius: 3))
 }

 Spacer()

 // Process Status Badge
 statusBadgeView

 if let worktree = agent.worktree {
 Text(worktree.components(separatedBy: "/").last ?? worktree)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .lineLimit(1)
 }

 // CRT Scanlines Toggle Button
 Button {
 withAnimation(.swarmQuick) {
 isCRTScanlinesEnabled.toggle()
 }
 } label: {
 Image(systemName: isCRTScanlinesEnabled ? "tv.fill" : "tv")
 .font(.swarm(.xs))
 .foregroundStyle(isCRTScanlinesEnabled ? .swarmGold : .swarmTextTertiary)
 }
 .buttonStyle(.plain)
 .help(isCRTScanlinesEnabled ? "Disable CRT Scanlines" : "Enable CRT Scanlines")

 // Ctrl+C Interrupt Button
 Button {
 sendInterrupt()
 } label: {
 Text("\u{2303}C")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmWarning)
 .padding(.horizontal, 4)
 .padding(.vertical, 2)
 .background(Color.swarmWarning.opacity(0.12))
 .clipShape(RoundedRectangle(cornerRadius: 3))
 }
 .buttonStyle(.plain)
 .help("Send SIGINT (Ctrl+C)")

 // Clear Output Button
 Button {
 clearTerminal()
 } label: {
 Image(systemName: "trash")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 .help("Clear Terminal Output")

 // Maximize / Restore
 let isMaximized = agentsStore.maximizedPaneId == agent.id.uuidString
 Button {
 withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
 if isMaximized {
 agentsStore.maximizePane(nil)
 } else {
 agentsStore.maximizePane(agent.id)
 }
 }
 } label: {
 Image(systemName: isMaximized ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
 .font(.swarm(.xs))
 .foregroundStyle(isMaximized ? .swarmGold : .swarmTextTertiary)
 }
 .buttonStyle(.plain)
 .help(isMaximized ? "Restore Pane" : "Maximize Pane")

 // Close Agent
 Button {
 dismissAgent()
 } label: {
 Image(systemName: "xmark")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 .help("Close Agent")
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmSurface)
 }

 private var statusBadgeView: some View {
 HStack(spacing: 4) {
 Circle()
 .fill(agent.status.color)
 .frame(width: 6, height: 6)
 .scaleEffect(reduceMotion ? 1 : (agent.status.isActive ? 1.0 + 0.3 * pulsePhase : 1.0))
 .shadow(
 color: agent.status.color.opacity(reduceMotion ? 0 : 0.5 + 0.3 * pulsePhase),
 radius: reduceMotion ? 0 : 2 + 4 * pulsePhase,
 x: 0,
 y: 0
 )

 Text(statusDisplayText)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 }

 private var statusDisplayText: String {
 if let exitCode = agent.exitCode {
 return "Exit \(exitCode)"
 }
 return agent.status.displayName
 }

 private var terminalView: some View {
 ScrollViewReader { proxy in
 ScrollView {
 LazyVStack(alignment: .leading, spacing: 0) {
 if agent.terminalOutput.isEmpty {
 Text("Session ready. Type commands or prompts below...")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmTextTertiary)
 .padding(.horizontal, 10)
 .padding(.vertical, 8)
 } else {
 ForEach(Array(agent.terminalOutput.enumerated()), id: \.offset) { index, line in
 Text(ANSIParser.parseToAttributedString(line, standardColors: themeScheme.ansiStandard, brightColors: themeScheme.ansiBright))
 .font(.swarmMono(.xs))
 .padding(.horizontal, 10)
 .padding(.vertical, 0.5)
 .textSelection(.enabled)
 .frame(maxWidth: .infinity, alignment: .leading)
 }
 }

 Color.clear
 .frame(height: 1)
 .id("bottom")
 }
 }
 .onChange(of: agent.terminalOutput.count) { _, _ in
 if autoScroll {
 withAnimation(.easeOut(duration: 0.15)) {
 proxy.scrollTo("bottom", anchor: .bottom)
 }
 }
 }
 .background(Color.swarmTerminalBackground(for: themeStore.themeMode))
 }
 }

 private var inputBarView: some View {
 HStack(spacing: 8) {
 Text("$")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmGold)

 TextField("Enter command or prompt...", text: $inputText)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .onSubmit {
 sendCommand()
 }
 .onKeyPress(.upArrow) {
 navigateHistory(step: -1)
 return .handled
 }
 .onKeyPress(.downArrow) {
 navigateHistory(step: 1)
 return .handled
 }

 if !inputText.isEmpty {
 Button {
 sendCommand()
 } label: {
 Image(systemName: "return")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 8)
 .background(.swarmSurface)
 .overlay(alignment: .top) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }

 // MARK: - Hover

 private var hoverGlowOverlay: some View {
 RoundedRectangle(cornerRadius: 8)
 .stroke(.swarmGold, lineWidth: 1)
 .opacity(reduceMotion ? 0 : (isHovered ? 0.3 : 0))
 .animation(.swarmQuick, value: isHovered)
 }

 // MARK: - Computed Properties

 private var contentBlur: CGFloat {
 if reduceMotion { return 0 }
 if exitProgress > 0 { return exitProgress * 6 }
 return (1 - materializeProgress) * 8
 }

 private func lerp(_ a: CGFloat, _ b: CGFloat, _ t: CGFloat) -> CGFloat {
 a + (b - a) * t
 }

 // MARK: - Actions

 private func ensureSessionStarted() {
 _Concurrency.Task.detached(priority: .userInitiated) {
 let session = PTYService.shared.getOrCreateSession(for: agent)
 if !session.isRunning && agent.status != .done {
 do {
 try session.start()
 } catch {
 await MainActor.run {
 agent.status = .error
 agent.appendOutput("[PTY start error: \(error.localizedDescription)]")
 }
 }
 }
 }
 }

 private func startStatusPulse() {
 guard agent.status.isActive, !reduceMotion else { return }
 withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
 pulsePhase = 1.0
 }
 }

 private func dismissAgent() {
 guard !isDismissing else { return }
 isDismissing = true
 PTYService.shared.terminateSession(for: agent.id)

 if reduceMotion {
 agentsStore.removeAgent(agent.id)
 return
 }
 withAnimation(.spring(duration: 0.3)) {
 exitProgress = 1
 }
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
 agentsStore.removeAgent(agent.id)
 }
 }

 private func sendCommand() {
 let cmd = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
 guard cmd.isEmpty == false else { return }

 commandHistory.append(cmd)
 historyIndex = -1

 let session = PTYService.shared.getOrCreateSession(for: agent)
 if session.isRunning {
 session.write(cmd + "\n")
 } else {
 _Concurrency.Task.detached(priority: .userInitiated) {
 do {
 try session.start()
 session.write(cmd + "\n")
 } catch {
 await MainActor.run {
 agent.appendOutput("[Error starting session: \(error.localizedDescription)]")
 }
 }
 }
 }

 agent.lastActivity = Date()
 inputText = ""
 }

 private func navigateHistory(step: Int) {
 guard !commandHistory.isEmpty else { return }
 if step < 0 {
 // Move backward in history
 if historyIndex == -1 || historyIndex > commandHistory.count - 1 {
 historyIndex = commandHistory.count - 1
 } else if historyIndex > 0 {
 historyIndex -= 1
 }
 inputText = commandHistory[historyIndex]
 } else {
 // Move forward in history
 if historyIndex >= 0 && historyIndex < commandHistory.count - 1 {
 historyIndex += 1
 inputText = commandHistory[historyIndex]
 } else {
 historyIndex = -1
 inputText = ""
 }
 }
 }

 private func sendInterrupt() {
 let session = PTYService.shared.getOrCreateSession(for: agent)
 session.sendInterrupt()
 agent.appendOutput("^C")
 agent.lastActivity = Date()
 }

 private func clearTerminal() {
 agent.clearOutput()
 let session = PTYService.shared.getOrCreateSession(for: agent)
 session.clearBuffer()
 }
}

// MARK: - Scan Line Modifier

struct ScanLineModifier: ViewModifier {
 let scanLinePosition: CGFloat
 let isEnabled: Bool
 let reduceMotion: Bool

 func body(content: Content) -> some View {
 content
 .overlay {
 if isEnabled && !reduceMotion {
 CRTScanlineCanvasOverlay(scanLinePosition: scanLinePosition)
 .allowsHitTesting(false)
 }
 }
 }
}

// MARK: - CRT Scanline Canvas Overlay

private struct CRTScanlineCanvasOverlay: View {
 let scanLinePosition: CGFloat

 var body: some View {
 Canvas { context, size in
 // 1. Static subtle CRT scanlines
 var y: CGFloat = 0
 let scanlineColor = Color.black.opacity(0.04)
 while y < size.height {
 let rect = CGRect(x: 0, y: y, width: size.width, height: 1)
 context.fill(Path(rect), with: .color(scanlineColor))
 y += 3
 }

 // 2. Animated beam sweep
 if scanLinePosition >= 0 && scanLinePosition <= 1.5 {
 let beamHeight = max(10, size.height * 0.08)
 let beamY = scanLinePosition * size.height - beamHeight / 2
 let beamRect = CGRect(x: 0, y: beamY, width: size.width, height: beamHeight)

 let gradient = Gradient(colors: [
 .clear,
 Color.white.opacity(0.03),
 .clear
 ])
 context.fill(
 Path(beamRect),
 with: .linearGradient(
 gradient,
 startPoint: CGPoint(x: 0, y: beamY),
 endPoint: CGPoint(x: 0, y: beamY + beamHeight)
 )
 )
 }
 }
 }
}

// MARK: - Terminal Pane View

struct TerminalPaneView: View {
 @Environment(\.themeStore) private var themeStore
 @State private var inputText: String = ""
 @State private var session: PTYSession?
 @State private var outputLines: [String] = ["Welcome to SwarmAI Interactive Terminal\n"]
 @State private var autoScroll: Bool = true

 private var themeScheme: ThemeScheme {
 ThemeScheme.preset(for: themeStore.themeMode) ?? .dark
 }

 var body: some View {
 VStack(spacing: 0) {
 HStack(spacing: 8) {
 Image(systemName: "terminal.fill")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)

 Text("Terminal")
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Text("zsh")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)

 Button {
 outputLines.removeAll()
 session?.clearBuffer()
 } label: {
 Image(systemName: "trash")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmSurface)

 ScrollViewReader { proxy in
 ScrollView {
 LazyVStack(alignment: .leading, spacing: 0) {
 ForEach(Array(outputLines.enumerated()), id: \.offset) { _, line in
 Text(ANSIParser.parseToAttributedString(line, standardColors: themeScheme.ansiStandard, brightColors: themeScheme.ansiBright))
 .font(.swarmMono(.xs))
 .padding(.horizontal, 10)
 .padding(.vertical, 0.5)
 .textSelection(.enabled)
 .frame(maxWidth: .infinity, alignment: .leading)
 }

 Color.clear
 .frame(height: 1)
 .id("bottom")
 }
 }
 .onChange(of: outputLines.count) { _, _ in
 if autoScroll {
 withAnimation {
 proxy.scrollTo("bottom", anchor: .bottom)
 }
 }
 }
 .background(Color.swarmTerminalBackground(for: themeStore.themeMode))
 }

 HStack(spacing: 8) {
 Text("$")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmGold)

 TextField("Enter command...", text: $inputText)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .onSubmit {
 submitCommand()
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 8)
 .background(.swarmSurface)
 }
 .onAppear {
 initTerminal()
 }
 }

 private func initTerminal() {
 guard session == nil else { return }
 _Concurrency.Task.detached(priority: .userInitiated) {
 let terminalSession = PTYSession(
 agentId: UUID(),
 command: ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh",
 arguments: ["-l"]
 )
 terminalSession.onOutput = { chunk in
 let lines = chunk.components(separatedBy: "\n")
 Task { @MainActor in
 for line in lines {
 outputLines.append(line)
 }
 }
 }
 do {
 try terminalSession.start()
 await MainActor.run {
 self.session = terminalSession
 }
 } catch {
 await MainActor.run {
 outputLines.append("[Failed to start terminal: \(error.localizedDescription)]")
 }
 }
 }
 }

 private func submitCommand() {
 let cmd = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
 guard cmd.isEmpty == false else { return }
 session?.write(cmd + "\n")
 inputText = ""
 }
}
