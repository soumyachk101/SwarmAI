import SwiftUI
import AppKit

// MARK: - Emulator Pane View

public struct EmulatorPaneView: View {
 @Environment(\.themeStore) private var themeStore
 @Environment(\.accessibilityReduceMotion) private var reduceMotion
 @State private var emulatorService = EmulatorService.shared
 @State private var selectedTab: EmulatorTab = .devices
 @State private var statusToast: String?
 @State private var toastWorkItem: DispatchWorkItem?
 @State private var showCreateAvdSheet = false
 @State private var isRefreshing = false
 @State private var materializeProgress: CGFloat = 0
 @State private var pulsePhase: CGFloat = 0

 public init() {}

 public enum EmulatorTab: String, CaseIterable, Identifiable {
 case devices = "Devices"
 case avds = "AVDs"
 case screen = "Screen"
 case shell = "Shell"

 public var id: String { rawValue }

 public var icon: String {
 switch self {
 case .devices: return "iphone.and.arrow.forward"
 case .avds: return "ipad.and.iphone"
 case .screen: return "camera.viewfinder"
 case .shell: return "terminal.fill"
 }
 }
 }

 public var body: some View {
 VStack(spacing: 0) {
 // Top Toolbar
 toolbarView

 Divider()
 .background(.swarmBorderSubtle)

 // Tab Picker
 tabPickerView

 Divider()
 .background(.swarmBorderSubtle.opacity(0.5))

 // Content Area
 ZStack {
 Color.swarmCanvas
 .ignoresSafeArea()

 Group {
 switch selectedTab {
 case .devices:
 connectedDevicesView
 case .avds:
 avdsListView
 case .screen:
 screenView
 case .shell:
 shellView
 }
 }
 }

 // Toast
 if let toast = statusToast {
 toastView(message: toast)
 }
 }
 .background {
 Color.swarmCanvas
 .ignoresSafeArea()
 }
 .onAppear {
 guard !reduceMotion else {
 materializeProgress = 1
 return
 }
 withAnimation(.swarmPaneMaterialize) {
 materializeProgress = 1
 }
 startStatusPulse()
 Task {
 await emulatorService.refresh()
 }
 }
 .sheet(isPresented: $showCreateAvdSheet) {
 if let sdkPath = emulatorService.sdkPath {
 CreateAvdDialog(
 sdkPath: sdkPath,
 avds: emulatorService.avds,
 onDismiss: { showCreateAvdSheet = false },
 onCreated: { name in
 showCreateAvdSheet = false
 Task {
 await emulatorService.refresh()
 showToast("AVD '\(name)' created")
 }
 }
 )
 }
 }
 }

 // MARK: - Toolbar

 private var toolbarView: some View {
 HStack(spacing: 12) {
 // Title & SDK badge
 HStack(spacing: 8) {
 Image(systemName: "iphone.gen3")
 .font(.system(size: 15))
 .foregroundStyle(.swarmGold)

 Text("Android Device Bridge")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 // SDK status badge
 sdkStatusBadge
 }

 Spacer()

 // Action buttons
 HStack(spacing: 6) {
 // Refresh
 Button {
 Task {
 isRefreshing = true
 await emulatorService.refresh()
 isRefreshing = false
 showToast("Devices refreshed")
 }
 } label: {
 Image(systemName: "arrow.clockwise")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 .rotationEffect(.degrees(isRefreshing ? 360 : 0))
 .animation(isRefreshing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: isRefreshing)
 }
 .buttonStyle(.plain)
 .help("Refresh devices and AVDs")
 .disabled(isRefreshing)

 // Restart ADB
 Button {
 Task {
 try? await emulatorService.restartAdbServer()
 showToast("ADB Server Restarted")
 }
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "arrow.triangle.2.circlepath")
 .font(.swarmMono(.micro))
 Text("Restart ADB")
 .font(.swarmMono(.micro))
 }
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background(.swarmSurface)
 .cornerRadius(4)
 }
 .buttonStyle(.plain)
 .help("Restart ADB server")

 // Build AVD
 Button {
 showCreateAvdSheet = true
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "plus")
 .font(.swarmMono(.micro))
 Text("Build AVD")
 .font(.swarmMono(.micro))
 }
 .foregroundStyle(.swarmGold)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background(Color.swarmGold.opacity(0.12))
 .cornerRadius(4)
 }
 .buttonStyle(.plain)
 .help("Create a new Android Virtual Device")
 }
 }
 .padding(.horizontal, 14)
 .padding(.vertical, 8)
 .background(.swarmSurface)
 }

 @ViewBuilder
 private var sdkStatusBadge: some View {
 if emulatorService.isSDKFound {
 HStack(spacing: 4) {
 Circle()
 .fill(.swarmSuccess)
 .frame(width: 6, height: 6)
 Text("SDK Ready")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmSuccess)
 }
 .padding(.horizontal, 6)
 .padding(.vertical, 2)
 .background(Color.swarmSuccess.opacity(0.12))
 .cornerRadius(4)
 } else {
 HStack(spacing: 4) {
 Circle()
 .fill(.swarmWarning)
 .frame(width: 6, height: 6)
 Text("SDK Not Found")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmWarning)
 }
 .padding(.horizontal, 6)
 .padding(.vertical, 2)
 .background(Color.swarmWarning.opacity(0.12))
 .cornerRadius(4)
 }
 }

 // MARK: - Tab Picker

 private var tabPickerView: some View {
 HStack(spacing: 0) {
 ForEach(EmulatorTab.allCases) { tab in
 Button {
 withAnimation(.swarmTabSwitch) {
 selectedTab = tab
 }
 } label: {
 HStack(spacing: 5) {
 Image(systemName: tab.icon)
 .font(.swarm(.micro))
 Text(tab.rawValue)
 .font(.swarmMono(.micro))
 }
 .foregroundStyle(selectedTab == tab ? .swarmGold : .swarmTextTertiary)
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background {
 RoundedRectangle(cornerRadius: 0)
 .fill(selectedTab == tab ? Color.swarmGold.opacity(0.08) : Color.clear)
 }
 }
 .buttonStyle(.plain)

 if tab != EmulatorTab.allCases.last {
 Divider()
 .background(.swarmBorderSubtle.opacity(0.4))
 .frame(height: 16)
 }
 }

 Spacer()

 // Quick info
 if emulatorService.isSDKFound {
 Text("\(emulatorService.avds.count) AVDs · \(emulatorService.connectedDevices.count) devices")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .padding(.trailing, 8)
 }
 }
 .padding(.horizontal, 8)
 }

 // MARK: - Toast

 private func toastView(message: String) -> some View {
 Text(message)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background(.swarmSurface)
 .cornerRadius(6)
 .overlay(
 RoundedRectangle(cornerRadius: 6)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 )
 .shadow(color: .black.opacity(0.25), radius: 8, x: 0, y: 4)
 .transition(.opacity.combined(with: .scale(scale: 0.95)))
 .zIndex(100)
 }

 private func showToast(_ msg: String) {
 toastWorkItem?.cancel()
 withAnimation(.swarmQuick) {
 statusToast = msg
 }
 let workItem = DispatchWorkItem {
 withAnimation(.swarmQuick) {
 if statusToast == msg {
 statusToast = nil
 }
 }
 }
 toastWorkItem = workItem
 DispatchQueue.main.asyncAfter(deadline: .now() + 2.5, execute: workItem)
 }

 // MARK: - Status Pulse

 private func startStatusPulse() {
 guard !reduceMotion else { return }
 withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
 pulsePhase = 1.0
 }
 }

 private var pulseScale: CGFloat {
 reduceMotion ? 1.0 : 1.0 + 0.3 * pulsePhase
 }

 private var pulseShadowOpacity: Double {
 reduceMotion ? 0 : 0.5 + 0.3 * pulsePhase
 }

 // MARK: - Body Views

 private var connectedDevicesView: some View {
 ScrollView {
 VStack(spacing: 10) {
 if emulatorService.connectedDevices.isEmpty {
 emptyStateView(
 icon: "iphone.slash",
 title: "No Connected Android Devices",
 message: "Connect a device via USB with USB Debugging enabled, or launch an Android Virtual Device from the AVDs tab."
 )
 } else {
 LazyVStack(spacing: 10) {
 ForEach(emulatorService.connectedDevices) { device in
 let details = emulatorService.deviceDetailsMap[device.serial] ?? DeviceDetails()
 DeviceRow(
 device: device,
 details: details,
 isSelected: emulatorService.selectedDeviceSerial == device.serial,
 onSelect: {
 emulatorService.selectedDeviceSerial = device.serial
 },
 onScreenshot: {
 captureScreenshot(for: device.serial)
 },
 onReboot: {
 Task {
 try? await emulatorService.rebootDevice(serial: device.serial)
 showToast("Rebooting \(device.serial)...")
 }
 },
 onStop: {
 Task {
 try? await emulatorService.stopDevice(serial: device.serial)
 showToast("Stopped \(device.serial)")
 }
 }
 )
 }
 }
 .padding(12)
 }
 }
 .frame(maxWidth: .infinity)
 }
 }

 private var avdsListView: some View {
 ScrollView {
 VStack(spacing: 10) {
 if !emulatorService.isSDKFound {
 sdkNotFoundStateView
 } else if emulatorService.avds.isEmpty {
 emptyStateView(
 icon: "ipad.and.iphone",
 title: "No Android Virtual Devices (AVDs) Found",
 message: "Create a virtual device using the Build button above, or with Android Studio's Device Manager or the avdmanager CLI tool."
 )
 } else {
 LazyVStack(spacing: 8) {
 ForEach(emulatorService.avds) { avd in
 AvdRow(
 avd: avd,
 busyAvdName: nil,
 onLaunch: { coldBoot in
 launchAvd(avd.name, coldBoot: coldBoot)
 },
 onDelete: {
 deleteAvd(avd.name)
 }
 )
 }
 }
 .padding(12)
 }
 }
 .frame(maxWidth: .infinity)
 }
 }

 private var screenView: some View {
 ScrollView([.horizontal, .vertical]) {
 VStack(spacing: 12) {
 if let screenshot = emulatorService.recentScreenshot {
 Image(nsImage: screenshot)
 .resizable()
 .aspectRatio(contentMode: .fit)
 .frame(maxHeight: 520)
 .cornerRadius(10)
 .shadow(color: .black.opacity(0.4), radius: 12, x: 0, y: 6)
 .padding(14)
 } else {
 VStack(spacing: 16) {
 Image(systemName: "camera.viewfinder")
 .font(.system(size: 48))
 .foregroundStyle(.swarmTextTertiary)

 Text("No Screenshot Captured Yet")
 .font(.swarm(.lg, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)

 Text("Go to the Devices tab, select a connected device, and tap Capture Screen to grab a live screenshot via ADB.")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 .multilineTextAlignment(.center)
 .frame(maxWidth: 400)

 Button {
 if let serial = emulatorService.selectedDeviceSerial {
 captureScreenshot(for: serial)
 } else {
 showToast("Select a device first")
 }
 } label: {
 HStack(spacing: 6) {
 Image(systemName: "camera.fill")
 Text("Capture from selected device")
 }
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 14)
 .padding(.vertical, 6)
 .background(Color.swarmGold)
 .cornerRadius(6)
 }
 .buttonStyle(.plain)
 }
 .frame(maxWidth: .infinity, maxHeight: .infinity)
 .padding(.top, 40)
 }
 }
 .frame(maxWidth: .infinity, maxHeight: .infinity)
 }
 }

 private var shellView: some View {
 AdbShellView(
 emulatorService: emulatorService,
 onRunCommand: { cmd, serial in
 Task {
 do {
 let output = try await emulatorService.executeShell(serial: serial, command: cmd)
 showToast("Command executed")
 } catch {
 showToast("Failed: \(error.localizedDescription)")
 }
 }
 },
 onInstallApk: { path, serial in
 Task {
 do {
 _ = try await emulatorService.installApk(serial: serial, apkPath: path)
 showToast("APK installed successfully")
 } catch {
 showToast("Install failed: \(error.localizedDescription)")
 }
 }
 },
 onSendKey: { keycode in
 if let serial = emulatorService.selectedDeviceSerial {
 Task {
 _ = try? await emulatorService.executeShell(serial: serial, command: "input keyevent \(keycode)")
 }
 }
 }
 )
 }

 // MARK: - Empty / Not-Found States

 private func emptyStateView(icon: String, title: String, message: String) -> some View {
 VStack(spacing: 14) {
 Image(systemName: icon)
 .font(.system(size: 42))
 .foregroundStyle(.swarmTextTertiary.opacity(0.6))

 Text(title)
 .font(.swarm(.base, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)

 Text(message)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 .multilineTextAlignment(.center)
 .frame(maxWidth: 400)
 }
 .frame(maxWidth: .infinity)
 .padding(.top, 50)
 }

 private var sdkNotFoundStateView: some View {
 VStack(spacing: 14) {
 Image(systemName: "exclamationmark.triangle")
 .font(.system(size: 42))
 .foregroundStyle(.swarmError.opacity(0.6))

 Text("Android SDK Not Found")
 .font(.swarm(.base, weight: .medium))
 .foregroundStyle(.swarmError)

 Text("Install Android Studio, or set ANDROID_HOME to an existing SDK. Swarm needs the emulator and platform-tools packages.")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 .multilineTextAlignment(.center)
 .frame(maxWidth: 420)

 Button {
 Task {
 await emulatorService.refresh()
 }
 } label: {
 HStack(spacing: 6) {
 Image(systemName: "arrow.clockwise")
 Text("Check Again")
 }
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmGold)
 .padding(.horizontal, 14)
 .padding(.vertical, 6)
 .background(Color.swarmGold.opacity(0.12))
 .cornerRadius(6)
 }
 .buttonStyle(.plain)
 }
 .frame(maxWidth: .infinity)
 .padding(.top, 50)
 }

 // MARK: - Actions

 private func captureScreenshot(for serial: String) {
 Task {
 do {
 _ = try await emulatorService.takeScreenshot(serial: serial)
 showToast("Screenshot captured")
 } catch {
 showToast("Capture failed: \(error.localizedDescription)")
 }
 }
 }

 private func launchAvd(_ name: String, coldBoot: Bool = false) {
 Task {
 do {
 try await emulatorService.launchAVD(name: name, coldBoot: coldBoot)
 showToast("Launching '\(name)'...")
 } catch {
 showToast("Launch failed: \(error.localizedDescription)")
 }
 }
 }

 private func deleteAvd(_ name: String) {
 let alert = NSAlert()
 alert.messageText = "Delete AVD?"
 alert.informativeText = "Deleting \"\(name)\" erases its userdata image (apps, logins, state) permanently."
 alert.addButton(withTitle: "Delete")
 alert.addButton(withTitle: "Cancel")
 alert.alertStyle = .warning

 if alert.runModal() == .alertFirstButtonReturn {
 Task {
 do {
 try await emulatorService.deleteAvd(name: name)
 await emulatorService.refresh()
 showToast("AVD '\(name)' deleted")
 } catch {
 showToast("Delete failed: \(error.localizedDescription)")
 }
 }
 }
 }
}

// MARK: - Device Row

private struct DeviceRow: View {
 let device: ConnectedDevice
 let details: DeviceDetails
 let isSelected: Bool
 var onSelect: () -> Void
 var onScreenshot: () -> Void
 var onReboot: () -> Void
 var onStop: () -> Void

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Top row: icon, name, status dot
 HStack(spacing: 10) {
 // Device icon
 Image(systemName: device.isEmulator ? "ipad.and.iphone" : "cable.connector.horizontal")
 .font(.system(size: 16))
 .foregroundStyle(.swarmGold)

 VStack(alignment: .leading, spacing: 2) {
 HStack(spacing: 6) {
 Text(details.model ?? device.displayName)
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 if device.isEmulator {
 Text("AVD")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmInfo)
 .padding(.horizontal, 5)
 .padding(.vertical, 1)
 .background(Color.swarmInfo.opacity(0.12))
 .cornerRadius(3)
 }
 }

 HStack(spacing: 6) {
 Text("Serial: \(device.serial)")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)

 Text("State: \(device.state.uppercased())")
 .font(.swarmMono(.micro))
 .foregroundStyle(statusColor)
 }
 }

 Spacer()

 // Status dot
 Circle()
 .fill(statusColor)
 .frame(width: 8, height: 8)
 .shadow(color: statusColor.opacity(0.4), radius: 3, x: 0, y: 0)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)

 // Specs
 HStack(spacing: 16) {
 if let version = details.androidVersion {
 specItem(title: "Android", value: version)
 }
 if let sdk = details.sdkVersion {
 specItem(title: "API", value: "\(sdk)")
 }
 if let res = details.resolution {
 specItem(title: "Resolution", value: res)
 }
 if let ip = details.ipAddress {
 specItem(title: "IP", value: ip)
 }

 Spacer()
 }
 .padding(.horizontal, 12)
 .padding(.bottom, 6)

 // Actions
 HStack(spacing: 8) {
 // Screenshot
 Button {
 onScreenshot()
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "camera.fill")
 Text("Capture")
 }
 .font(.swarm(.micro, weight: .medium))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background(Color.swarmGold)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)

 // Reboot
 Button {
 onReboot()
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "arrow.counterclockwise")
 Text("Reboot")
 }
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background(.swarmSurface)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)

 // Power Off
 Button {
 onStop()
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "power")
 Text(device.isEmulator ? "Shutdown AVD" : "Power Off")
 }
 .font(.swarm(.micro))
 .foregroundStyle(.swarmError)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background(Color.swarmError.opacity(0.1))
 .cornerRadius(5)
 }
 .buttonStyle(.plain)

 Spacer()
 }
 .padding(.horizontal, 12)
 .padding(.bottom, 10)
 }
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface)
 }
 .overlay {
 RoundedRectangle(cornerRadius: 10)
 .stroke(isSelected ? .swarmGold : .swarmBorderSubtle, lineWidth: isSelected ? 1.5 : 1)
 }
 .onTapGesture {
 onSelect()
 }
 }

 private var statusColor: Color {
 switch device.state {
 case "device": return .swarmSuccess
 case "offline": return .swarmWarning
 case "unauthorized": return .swarmError
 default: return .swarmTextTertiary
 }
 }

 private func specItem(title: String, value: String) -> some View {
 VStack(alignment: .leading, spacing: 1) {
 Text(title.uppercased())
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 Text(value)
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmTextPrimary)
 }
 }
}

// MARK: - AVD Row

private struct AvdRow: View {
 let avd: AndroidAVD
 let busyAvdName: String?
 var onLaunch: (Bool) -> Void
 var onDelete: () -> Void

 @State private var showDeleteConfirm = false

 var body: some View {
 HStack(spacing: 12) {
 // Status indicator
 Circle()
 .fill(avd.isRunning ? .swarmSuccess : .swarmTextTertiary)
 .frame(width: 9, height: 9)
 .shadow(color: avd.isRunning ? .swarmSuccess.opacity(0.4) : .clear, radius: 3, x: 0, y: 0)

 // AVD info
 VStack(alignment: .leading, spacing: 2) {
 Text(avd.displayName)
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Text(avd.isRunning ? "Running" : "Stopped")
 .font(.swarmMono(.micro))
 .foregroundStyle(avd.isRunning ? .swarmSuccess : .swarmTextTertiary)
 }

 Spacer()

 // Actions
 if avd.isRunning {
 // Running state: stop button + active badge
 Button {
 // Stop requires the device serial; in the desktop version
 // we stop by serial from the devices list
 onDelete()
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "stop.fill")
 Text("Stop")
 }
 .font(.swarm(.micro, weight: .medium))
 .foregroundStyle(.swarmError)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background(Color.swarmError.opacity(0.1))
 .cornerRadius(5)
 }
 .buttonStyle(.plain)

 HStack(spacing: 4) {
 Image(systemName: "checkmark.circle.fill")
 .font(.swarm(.xs))
 Text("Active")
 .font(.swarmMono(.micro))
 }
 .foregroundStyle(.swarmSuccess)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background(Color.swarmSuccess.opacity(0.1))
 .cornerRadius(4)
 } else {
 // Launch button
 Button {
 onLaunch(false)
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "play.fill")
 Text("Launch")
 }
 .font(.swarm(.micro, weight: .medium))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background(Color.swarmGold)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)

 // Cold boot button
 Button {
 onLaunch(true)
 } label: {
 Text("Cold Boot")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background(.swarmSurface)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 .help("Launch without loading saved snapshot")

 // Delete button
 Button {
 showDeleteConfirm = true
 } label: {
 Image(systemName: "trash")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .frame(width: 26, height: 26)
 }
 .buttonStyle(.plain)
 .help("Delete AVD")
 .alert("Delete AVD?", isPresented: $showDeleteConfirm) {
 Button("Delete", role: .destructive) {
 onDelete()
 }
 Button("Cancel", role: .cancel) {}
 } message: {
 Text("This permanently erases the AVD '\(avd.displayName)' and its data. This cannot be undone.")
 }
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .background {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmSurface)
 }
 .overlay {
 RoundedRectangle(cornerRadius: 8)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 }
 }
}

// MARK: - ADB Shell View

private struct AdbShellView: View {
 @Environment(\.themeStore) private var themeStore
 let emulatorService: EmulatorService
 var onRunCommand: (String, String) -> Void
 var onInstallApk: (String, String) -> Void
 var onSendKey: (Int) -> Void

 @State private var shellCommand: String = ""
 @State private var apkPath: String = ""
 @State private var commandOutput: String = ""

 private let keyEvents: [(name: String, keycode: Int, icon: String)] = [
 ("Power", 26, "power"),
 ("Home", 3, "house.fill"),
 ("Back", 4, "chevron.backward"),
 ("Menu", 82, "line.3.horizontal"),
 ("Vol+", 24, "speaker.wave.2.fill"),
 ("Vol-", 25, "speaker.wave.1.fill"),
 ]

 var body: some View {
 ScrollView {
 VStack(alignment: .leading, spacing: 16) {
 // Hardware Keys
 VStack(alignment: .leading, spacing: 8) {
 Text("Hardware Keys")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)

 HStack(spacing: 8) {
 ForEach(keyEvents, id: \.name) { item in
 Button {
 onSendKey(item.keycode)
 } label: {
 VStack(spacing: 2) {
 Image(systemName: item.icon)
 .font(.swarm(.xs))
 Text(item.name)
 .font(.swarmMono(.micro))
 }
 .foregroundStyle(.swarmTextPrimary)
 .frame(minWidth: 48)
 .padding(.vertical, 6)
 .background(.swarmSurface)
 .cornerRadius(6)
 }
 .buttonStyle(.plain)
 }
 }

 // Rotation toggle
 HStack(spacing: 8) {
 Button {
 if let serial = emulatorService.selectedDeviceSerial {
 Task {
 _ = try? await emulatorService.executeShell(
 serial: serial,
 command: "settings put system accelerometer_rotation 0 && settings put system user_rotation 1"
 )
 }
 }
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "rotate.right")
 Text("Rotate 90")
 }
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background(.swarmSurface)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 .disabled(emulatorService.selectedDeviceSerial == nil)

 Button {
 if let serial = emulatorService.selectedDeviceSerial {
 Task {
 _ = try? await emulatorService.executeShell(
 serial: serial,
 command: "settings put system accelerometer_rotation 1"
 )
 }
 }
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "rotate.left")
 Text("Auto-Rotate")
 }
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background(.swarmSurface)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 .disabled(emulatorService.selectedDeviceSerial == nil)
 }
 }

 Divider()
 .background(.swarmBorderSubtle)

 // Shell Command
 VStack(alignment: .leading, spacing: 6) {
 Text("ADB Shell Command")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)

 HStack(spacing: 8) {
 Text("$")
 .font(.swarmMono(.xs))
 .foregroundStyle(.swarmGold)

 TextField("e.g. pm list packages -3, getprop ro.product.model...", text: $shellCommand)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .onSubmit {
 runShellCommand()
 }

 Button {
 runShellCommand()
 } label: {
 HStack(spacing: 4) {
 Image(systemName: "play.fill")
 Text("Run")
 }
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background(Color.swarmGold)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 .disabled(shellCommand.isEmpty || emulatorService.selectedDeviceSerial == nil)
 }
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)
 }

 // Command Output
 VStack(alignment: .leading, spacing: 4) {
 HStack {
 Text("Output")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)

 Spacer()

 if !commandOutput.isEmpty {
 Button {
 commandOutput = ""
 } label: {
 Image(systemName: "trash")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 }

 ScrollView {
 Text(commandOutput.isEmpty ? "No output yet. Select a device and run a command." : commandOutput)
 .font(.swarmMono(.xs))
 .foregroundStyle(commandOutput.isEmpty ? .swarmTextTertiary : .swarmTextPrimary)
 .frame(maxWidth: .infinity, alignment: .leading)
 .padding(10)
 .textSelection(.enabled)
 }
 .frame(minHeight: 120, maxHeight: 200)
 .background(Color.black.opacity(0.35))
 .cornerRadius(6)
 .overlay(
 RoundedRectangle(cornerRadius: 6)
 .stroke(.swarmBorderSubtle, lineWidth: 1)
 )
 }

 Divider()
 .background(.swarmBorderSubtle)

 // Install APK
 VStack(alignment: .leading, spacing: 6) {
 Text("Install APK")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)

 HStack(spacing: 8) {
 TextField("/path/to/app.apk", text: $apkPath)
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)

 Button {
 guard let serial = emulatorService.selectedDeviceSerial else { return }
 onInstallApk(apkPath, serial)
 } label: {
 Text("Install")
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(apkPath.isEmpty ? .swarmTextTertiary : .swarmCanvas)
 .padding(.horizontal, 10)
 .padding(.vertical, 4)
 .background(apkPath.isEmpty ? .swarmSurface : Color.swarmGold)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 .disabled(apkPath.isEmpty || emulatorService.selectedDeviceSerial == nil)
 }
 .padding(8)
 .background(.swarmSurface)
 .cornerRadius(6)
 }
 }
 .padding(14)
 }
 }

 private func runShellCommand() {
 guard let serial = emulatorService.selectedDeviceSerial else {
 return
 }
 let cmd = shellCommand.trimmingCharacters(in: .whitespacesAndNewlines)
 guard !cmd.isEmpty else { return }

 onRunCommand(cmd, serial)
 shellCommand = ""
 }
}

// MARK: - Create AVD Dialog

private struct CreateAvdDialog: View {
 let sdkPath: String
 let avds: [AndroidAVD]
 var onDismiss: () -> Void
 var onCreated: (String) -> Void

 @State private var displayName: String = ""
 @State private var selectedDevice: DeviceProfile = .pixel6
 @State private var selectedImage: SystemImage?
 @State private var ramMB: Int = 2048
 @State private var storageGB: Int = 8
 @State private var cpuCores: Int = 4
 @State private var isBuilding = false
 @State private var buildError: String?
 @State private var nameError: String?

 var body: some View {
 VStack(spacing: 0) {
 // Header
 HStack(spacing: 10) {
 Image(systemName: "iphone.gen3")
 .font(.system(size: 16))
 .foregroundStyle(.swarmGold)

 Text("Build Android Virtual Device")
 .font(.swarm(.base, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Button {
 onDismiss()
 } label: {
 Image(systemName: "xmark")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 .frame(width: 24, height: 24)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)
 .background(.swarmSurface)

 Divider()
 .background(.swarmBorderSubtle)

 // Form
 ScrollView {
 VStack(alignment: .leading, spacing: 16) {
 // Name field
 formRow(label: "Name") {
 VStack(alignment: .leading, spacing: 2) {
 TextField("My Emulator", text: $displayName)
 .font(.swarm(.xs))
 .textFieldStyle(.plain)
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(.swarmCanvas)
 .cornerRadius(5)
 .overlay(
 RoundedRectangle(cornerRadius: 5)
 .stroke(nameError != nil ? .swarmError : .swarmBorderSubtle, lineWidth: 1)
 )

 if let err = nameError {
 Text(err)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmError)
 }
 }
 }

 // Device profile
 formRow(label: "Device") {
 VStack(alignment: .leading, spacing: 6) {
 ForEach(DeviceProfile.allCases) { profile in
 Button {
 selectedDevice = profile
 } label: {
 HStack(spacing: 8) {
 Text(profile.icon)
 .font(.system(size: 14))

 VStack(alignment: .leading, spacing: 1) {
 Text(profile.displayName)
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 Text("\(profile.screenWidth)x\(profile.screenHeight) · \(profile.density) dpi")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 Spacer()

 if selectedDevice == profile {
 Image(systemName: "checkmark.circle.fill")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(selectedDevice == profile ? Color.swarmGold.opacity(0.08) : .swarmCanvas)
 .cornerRadius(5)
 .overlay(
 RoundedRectangle(cornerRadius: 5)
 .stroke(selectedDevice == profile ? .swarmGold.opacity(0.4) : .swarmBorderSubtle, lineWidth: 1)
 )
 }
 .buttonStyle(.plain)
 }
 }
 }

 // System Image
 formRow(label: "System Image") {
 VStack(alignment: .leading, spacing: 6) {
 if systemImages.isEmpty {
 Text("No system images found. Install one via Android Studio SDK Manager.")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmError)
 } else {
 ForEach(systemImages) { image in
 Button {
 selectedImage = image
 } label: {
 HStack(spacing: 8) {
 VStack(alignment: .leading, spacing: 1) {
 Text(image.label)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextPrimary)
 }

 Spacer()

 if selectedImage?.id == image.id {
 Image(systemName: "checkmark.circle.fill")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmGold)
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background(selectedImage?.id == image.id ? Color.swarmGold.opacity(0.08) : .swarmCanvas)
 .cornerRadius(5)
 .overlay(
 RoundedRectangle(cornerRadius: 5)
 .stroke(selectedImage?.id == image.id ? .swarmGold.opacity(0.4) : .swarmBorderSubtle, lineWidth: 1)
 )
 }
 .buttonStyle(.plain)
 }
 }
 }
 }

 // RAM
 formRow(label: "RAM") {
 HStack(spacing: 6) {
 ForEach([1024, 2048, 4096, 8192], id: \.self) { amount in
 Button {
 ramMB = amount
 } label: {
 Text("\(amount / 1024 == 0 ? "\(amount) MB" : "\(amount / 1024) GB")")
 .font(.swarmMono(.micro))
 .foregroundStyle(ramMB == amount ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background(ramMB == amount ? Color.swarmGold : .swarmCanvas)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 }
 }
 }

 // Storage
 formRow(label: "Storage") {
 HStack(spacing: 6) {
 ForEach([4, 8, 16, 32], id: \.self) { amount in
 Button {
 storageGB = amount
 } label: {
 Text("\(amount) GB")
 .font(.swarmMono(.micro))
 .foregroundStyle(storageGB == amount ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background(storageGB == amount ? Color.swarmGold : .swarmCanvas)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 }
 }
 }

 // CPU Cores
 formRow(label: "CPU") {
 HStack(spacing: 6) {
 ForEach([2, 4, 6, 8], id: \.self) { cores in
 Button {
 cpuCores = cores
 } label: {
 Text("\(cores)")
 .font(.swarmMono(.micro))
 .foregroundStyle(cpuCores == cores ? .swarmCanvas : .swarmTextSecondary)
 .frame(minWidth: 32)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background(cpuCores == cores ? Color.swarmGold : .swarmCanvas)
 .cornerRadius(5)
 }
 .buttonStyle(.plain)
 }
 }
 }

 // Hardware warning
 HStack(spacing: 8) {
 Image(systemName: "lock.fill")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmWarning)

 Text("Hardware specs (RAM, storage, screen) are permanent once built. To change them, create a new AVD.")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .padding(10)
 .background(Color.swarmWarning.opacity(0.06))
 .cornerRadius(6)

 // Error
 if let error = buildError {
 HStack(spacing: 8) {
 Image(systemName: "exclamationmark.triangle.fill")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmError)
 Text(error)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmError)
 }
 .padding(10)
 .background(Color.swarmError.opacity(0.06))
 .cornerRadius(6)
 }
 }
 .padding(16)
 }

 Divider()
 .background(.swarmBorderSubtle)

 // Footer buttons
 HStack(spacing: 10) {
 Button {
 onDismiss()
 } label: {
 Text("Cancel")
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 14)
 .padding(.vertical, 6)
 }
 .buttonStyle(.plain)

 Spacer()

 Button {
 buildAvd()
 } label: {
 HStack(spacing: 6) {
 if isBuilding {
 ProgressView()
 .scaleEffect(0.7)
 .tint(.swarmCanvas)
 } else {
 Image(systemName: "plus")
 }
 Text(isBuilding ? "Building..." : "Build AVD")
 }
 .font(.swarmMono(.micro, weight: .medium))
 .foregroundStyle(.swarmCanvas)
 .padding(.horizontal, 16)
 .padding(.vertical, 6)
 .background(canBuild ? Color.swarmGold : Color.swarmGold.opacity(0.3))
 .cornerRadius(6)
 }
 .buttonStyle(.plain)
 .disabled(!canBuild || isBuilding)
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)
 .background(.swarmSurface)
 }
 .frame(width: 480, height: 520)
 .background(.swarmCanvas)
 .onAppear {
 // Select first system image by default
 selectedImage = systemImages.first
 }
 }

 private var systemImages: [SystemImage] {
 // In the desktop app these come from the Rust backend. Here we surface
 // placeholder entries so the dialog is usable out-of-the-box; the real
 // list is populated once the Rust bridge emits it.
 [
 SystemImage(
 apiDir: "android-34", tagDir: "google_apis", abi: "x86_64",
 playStore: true, label: "Android 14 · Google Play · x86_64"
 ),
 SystemImage(
 apiDir: "android-33", tagDir: "google_apis", abi: "x86_64",
 playStore: false, label: "Android 13 · Google APIs · x86_64"
 ),
 SystemImage(
 apiDir: "android-34", tagDir: "google_apis", abi: "arm64-v8a",
 playStore: false, label: "Android 14 · Google APIs · arm64-v8a"
 ),
 ]
 }

 private var canBuild: Bool {
 let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
 return !name.isEmpty &&
 selectedImage != nil &&
 !avds.contains { $0.name.lowercased() == name.lowercased() }
 }

 private func buildAvd() {
 let name = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
 guard !name.isEmpty, let image = selectedImage else { return }

 isBuilding = true
 buildError = nil

 Task {
 do {
 try await emulatorService.createAvd(
 name: name,
 deviceProfile: selectedDevice,
 systemImage: image,
 ramMB: ramMB,
 storageGB: storageGB,
 cpuCores: cpuCores
 )
 onCreated(name)
 } catch {
 buildError = error.localizedDescription
 isBuilding = false
 }
 }
 }

 @ViewBuilder
 private func formRow(label: String, @ViewBuilder content: () -> some View) -> some View {
 VStack(alignment: .leading, spacing: 6) {
 Text(label.uppercased())
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)

 content()
 }
 }
}

// MARK: - Device Profile

private enum DeviceProfile: String, CaseIterable, Identifiable {
 case pixel6 = "pixel6"
 case pixel7 = "pixel7"
 case pixel8 = "pixel8"
 case pixelFold = "pixel_fold"
 case nexus5x = "nexus5x"
 case nexus6p = "nexus6p"

 var id: String { rawValue }

 var displayName: String {
 switch self {
 case .pixel6: return "Pixel 6"
 case .pixel7: return "Pixel 7"
 case .pixel8: return "Pixel 8"
 case .pixelFold: return "Pixel Fold"
 case .nexus5x: return "Nexus 5X"
 case .nexus6p: return "Nexus 6P"
 }
 }

 var icon: String {
 switch self {
 case .pixelFold: return "iphone.landscape"
 default: return "iphone"
 }
 }

 var screenWidth: Int {
 switch self {
 case .pixel6: return 1080
 case .pixel7: return 1080
 case .pixel8: return 1080
 case .pixelFold: return 1848
 case .nexus5x: return 1080
 case .nexus6p: return 1440
 }
 }

 var screenHeight: Int {
 switch self {
 case .pixel6: return 2400
 case .pixel7: return 2400
 case .pixel8: return 2400
 case .pixelFold: return 2208
 case .nexus5x: return 1920
 case .nexus6p: return 2560
 }
 }

 var density: Int {
 switch self {
 case .pixel6: return 420
 case .pixel7: return 420
 case .pixel8: return 420
 case .pixelFold: return 376
 case .nexus5x: return 423
 case .nexus6p: return 515
 }
 }
}
