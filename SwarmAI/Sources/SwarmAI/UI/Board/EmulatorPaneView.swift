import SwiftUI
import AppKit

// MARK: - Emulator Pane View

public struct EmulatorPaneView: View {
    @State private var emulatorService = EmulatorService.shared
    @State private var selectedTab: EmulatorTab = .devices
    @State private var shellCommand: String = "getprop ro.build.version.release"
    @State private var apkPath: String = ""
    @State private var isAutoRefreshing: Bool = false
    @State private var autoRefreshTimer: Timer?
    @State private var statusToast: String?

    public init() {}

    public enum EmulatorTab: String, CaseIterable, Identifiable {
        case devices = "Connected Devices"
        case avds = "Virtual Devices (AVDs)"
        case screenshot = "Screen Capture"
        case shell = "ADB Console & Actions"

        public var id: String { rawValue }

        public var icon: String {
            switch self {
            case .devices: return "iphone.and.arrow.forward"
            case .avds: return "ipad.and.iphone"
            case .screenshot: return "camera.viewfinder"
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

            // Content Area
            ZStack {
                Color.swarmCanvas
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    switch selectedTab {
                    case .devices:
                        ConnectedDevicesView(
                            emulatorService: emulatorService,
                            onTakeScreenshot: { serial in
                                captureScreenshot(for: serial)
                            },
                            onStopDevice: { serial in
                                stopDevice(serial)
                            },
                            onRebootDevice: { serial in
                                rebootDevice(serial)
                            }
                        )
                    case .avds:
                        AvdsListView(
                            emulatorService: emulatorService,
                            onLaunch: { name, coldBoot in
                                launchAVD(name: name, coldBoot: coldBoot)
                            }
                        )
                    case .screenshot:
                        ScreenshotInspectorView(
                            emulatorService: emulatorService,
                            onCapture: {
                                if let serial = emulatorService.selectedDeviceSerial {
                                    captureScreenshot(for: serial)
                                }
                            }
                        )
                    case .shell:
                        AdbConsoleView(
                            emulatorService: emulatorService,
                            shellCommand: $shellCommand,
                            apkPath: $apkPath,
                            onRunShell: { cmd in
                                runShell(cmd)
                            },
                            onInstallApk: { path in
                                installApk(path)
                            },
                            onSendKeyEvent: { key in
                                sendKeyEvent(key)
                            }
                        )
                    }
                }
            }
        }
        .task {
            await emulatorService.refresh()
        }
        .onDisappear {
            autoRefreshTimer?.invalidate()
            autoRefreshTimer = nil
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

            Spacer()

            // Tab Picker
            Picker("", selection: $selectedTab) {
                ForEach(EmulatorTab.allCases) { tab in
                    Label(tab.rawValue, systemImage: tab.icon)
                        .tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: 480)

            Spacer()

            // Actions: Restart ADB & Refresh
            HStack(spacing: 6) {
                Button {
                    _Concurrency.Task {
                        try? await emulatorService.restartAdbServer()
                        showToast("ADB Server Restarted")
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.swarm(.micro))
                        Text("Restart ADB")
                            .font(.swarm(.micro, weight: .medium))
                    }
                    .foregroundStyle(.swarmTextSecondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.swarmSurface)
                    .cornerRadius(4)
                }
                .buttonStyle(.plain)

                Button {
                    _Concurrency.Task {
                        await emulatorService.refresh()
                        showToast("Refreshed devices")
                    }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmGold)
                        .rotationEffect(.degrees(emulatorService.isLoading ? 360 : 0))
                        .animation(emulatorService.isLoading ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: emulatorService.isLoading)
                }
                .buttonStyle(.plain)
                .help("Refresh device and AVD status")
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.swarmSurface)
    }

    // MARK: - Actions

    private func captureScreenshot(for serial: String) {
        _Concurrency.Task {
            do {
                _ = try await emulatorService.takeScreenshot(serial: serial)
                selectedTab = .screenshot
                showToast("Screenshot captured from \(serial)")
            } catch {
                showToast("Capture failed: \(error.localizedDescription)")
            }
        }
    }

    private func stopDevice(_ serial: String) {
        _Concurrency.Task {
            do {
                try await emulatorService.stopDevice(serial: serial)
                showToast("Stopped \(serial)")
            } catch {
                showToast("Stop failed: \(error.localizedDescription)")
            }
        }
    }

    private func rebootDevice(_ serial: String) {
        _Concurrency.Task {
            do {
                try await emulatorService.rebootDevice(serial: serial)
                showToast("Rebooting \(serial)...")
            } catch {
                showToast("Reboot failed: \(error.localizedDescription)")
            }
        }
    }

    private func launchAVD(name: String, coldBoot: Bool) {
        _Concurrency.Task {
            do {
                try await emulatorService.launchAVD(name: name, coldBoot: coldBoot)
                showToast("Launching '\(name)'...")
            } catch {
                showToast("Launch failed: \(error.localizedDescription)")
            }
        }
    }

    private func runShell(_ cmd: String) {
        guard let serial = emulatorService.selectedDeviceSerial else {
            showToast("No target device selected")
            return
        }
        _Concurrency.Task {
            do {
                _ = try await emulatorService.executeShell(serial: serial, command: cmd)
            } catch {
                showToast("Execution failed: \(error.localizedDescription)")
            }
        }
    }

    private func installApk(_ path: String) {
        guard let serial = emulatorService.selectedDeviceSerial else {
            showToast("No target device selected")
            return
        }
        _Concurrency.Task {
            do {
                _ = try await emulatorService.installApk(serial: serial, apkPath: path)
                showToast("APK Installed successfully")
            } catch {
                showToast("Installation failed: \(error.localizedDescription)")
            }
        }
    }

    private func sendKeyEvent(_ keycode: Int) {
        guard let serial = emulatorService.selectedDeviceSerial else { return }
        _Concurrency.Task {
            _ = try? await emulatorService.executeShell(serial: serial, command: "input keyevent \(keycode)")
        }
    }

    private func showToast(_ msg: String) {
        withAnimation(.swarmQuick) {
            statusToast = msg
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            withAnimation(.swarmQuick) {
                if statusToast == msg {
                    statusToast = nil
                }
            }
        }
    }
}

// MARK: - 1. Connected Devices View

private struct ConnectedDevicesView: View {
    let emulatorService: EmulatorService
    var onTakeScreenshot: (String) -> Void
    var onStopDevice: (String) -> Void
    var onRebootDevice: (String) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if emulatorService.connectedDevices.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "iphone.slash")
                            .font(.system(size: 40))
                            .foregroundStyle(.swarmTextTertiary)

                        Text("No Connected Android Devices")
                            .font(.swarm(.base, weight: .medium))
                            .foregroundStyle(.swarmTextSecondary)

                        Text("Connect a device via USB with USB Debugging enabled, or launch an Android Virtual Device (AVD) from the AVDs tab.")
                            .font(.swarm(.xs))
                            .foregroundStyle(.swarmTextTertiary)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: 400)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                } else {
                    LazyVStack(spacing: 10) {
                        ForEach(emulatorService.connectedDevices) { device in
                            let details = emulatorService.deviceDetailsMap[device.serial] ?? DeviceDetails()
                            DeviceCard(
                                device: device,
                                details: details,
                                isSelected: emulatorService.selectedDeviceSerial == device.serial,
                                onSelect: {
                                    emulatorService.selectedDeviceSerial = device.serial
                                },
                                onTakeScreenshot: {
                                    onTakeScreenshot(device.serial)
                                },
                                onStop: {
                                    onStopDevice(device.serial)
                                },
                                onReboot: {
                                    onRebootDevice(device.serial)
                                }
                            )
                        }
                    }
                    .padding(14)
                }
            }
        }
    }
}

private struct DeviceCard: View {
    let device: ConnectedDevice
    let details: DeviceDetails
    let isSelected: Bool
    var onSelect: () -> Void
    var onTakeScreenshot: () -> Void
    var onStop: () -> Void
    var onReboot: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header: Device Type & Name
            HStack(spacing: 8) {
                Image(systemName: device.isEmulator ? "ipad.and.iphone" : "cable.connector.horizontal")
                    .font(.system(size: 16))
                    .foregroundStyle(.swarmGold)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(details.model ?? device.displayName)
                            .font(.swarm(.sm, weight: .semibold))
                            .foregroundStyle(.swarmTextPrimary)

                        if device.isEmulator {
                            Text("AVD EMULATOR")
                                .font(.swarmMono(.micro))
                                .foregroundStyle(.swarmInfo)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 1)
                                .background(Color.swarmInfo.opacity(0.15))
                                .cornerRadius(3)
                        }
                    }

                    Text("Serial: \(device.serial) • State: \(device.state.uppercased())")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }

                Spacer()

                // Battery Status
                if let battery = details.batteryLevel {
                    HStack(spacing: 4) {
                        Image(systemName: details.isCharging == true ? "battery.100.bolt" : "battery.75")
                            .font(.system(size: 12))
                            .foregroundStyle(battery > 20 ? .swarmSuccess : .swarmError)
                        Text("\(battery)%")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextSecondary)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(.swarmCanvas)
                    .cornerRadius(4)
                }

                // Status dot
                Circle()
                    .fill(device.state == "device" ? .swarmSuccess : .swarmWarning)
                    .frame(width: 8, height: 8)
            }

            Divider()
                .background(.swarmBorderSubtle)

            // Specs grid
            HStack(spacing: 16) {
                if let version = details.androidVersion {
                    SpecItem(title: "Android OS", value: version)
                }
                if let sdk = details.sdkVersion {
                    SpecItem(title: "API Level", value: "API \(sdk)")
                }
                if let res = details.resolution {
                    SpecItem(title: "Resolution", value: res)
                }
                if let ip = details.ipAddress {
                    SpecItem(title: "IP Address", value: ip)
                }
                Spacer()
            }

            // Quick Actions Bar
            HStack(spacing: 8) {
                Button {
                    onTakeScreenshot()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "camera.fill")
                        Text("Capture Screen")
                    }
                    .font(.swarm(.xs, weight: .medium))
                    .foregroundStyle(.swarmCanvas)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.swarmGold)
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)

                Button {
                    onReboot()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.counterclockwise")
                        Text("Reboot")
                    }
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextSecondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(.swarmCanvas)
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)

                Button {
                    onStop()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "power")
                        Text(device.isEmulator ? "Shutdown AVD" : "Power Off")
                    }
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmError)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(Color.swarmError.opacity(0.12))
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)

                Spacer()
            }
        }
        .padding(12)
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
}

private struct SpecItem: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
            Text(value)
                .font(.swarmMono(.xs))
                .foregroundStyle(.swarmTextPrimary)
        }
    }
}

// MARK: - 2. AVDs List View

private struct AvdsListView: View {
    let emulatorService: EmulatorService
    var onLaunch: (String, Bool) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if emulatorService.avds.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "ipad.and.iphone")
                            .font(.system(size: 40))
                            .foregroundStyle(.swarmTextTertiary)

                        Text("No Android Virtual Devices (AVDs) Found")
                            .font(.swarm(.base, weight: .medium))
                            .foregroundStyle(.swarmTextSecondary)

                        Text("Create a virtual device using Android Studio's Device Manager or the `avdmanager` CLI tool.")
                            .font(.swarm(.xs))
                            .foregroundStyle(.swarmTextTertiary)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: 400)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                } else {
                    LazyVStack(spacing: 10) {
                        ForEach(emulatorService.avds) { avd in
                            AvdCard(avd: avd, onLaunch: { cold in
                                onLaunch(avd.name, cold)
                            })
                        }
                    }
                    .padding(14)
                }
            }
        }
    }
}

private struct AvdCard: View {
    let avd: AndroidAVD
    var onLaunch: (Bool) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(avd.isRunning ? .swarmSuccess : .swarmTextTertiary)
                .frame(width: 9, height: 9)

            VStack(alignment: .leading, spacing: 2) {
                Text(avd.name.replacingOccurrences(of: "_", with: " "))
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)

                Text(avd.isRunning ? "Status: Running" : "Status: Powered Off")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(avd.isRunning ? .swarmSuccess : .swarmTextTertiary)
            }

            Spacer()

            if !avd.isRunning {
                Button {
                    onLaunch(false)
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "play.fill")
                        Text("Launch")
                    }
                    .font(.swarm(.xs, weight: .medium))
                    .foregroundStyle(.swarmCanvas)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.swarmGold)
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)

                Button {
                    onLaunch(true)
                } label: {
                    Text("Cold Boot")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextSecondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(.swarmCanvas)
                        .cornerRadius(6)
                }
                .buttonStyle(.plain)
                .help("Launch without loading saved snapshot")
            } else {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Active")
                }
                .font(.swarm(.xs, weight: .medium))
                .foregroundStyle(.swarmSuccess)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.swarmSuccess.opacity(0.12))
                .cornerRadius(4)
            }
        }
        .padding(12)
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

// MARK: - 3. Screenshot Inspector View

private struct ScreenshotInspectorView: View {
    let emulatorService: EmulatorService
    var onCapture: () -> Void

    @State private var isCopied: Bool = false

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Text("Live Device Screenshot")
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)

                Spacer()

                Button {
                    onCapture()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "camera.fill")
                        Text("Capture Frame")
                    }
                    .font(.swarm(.xs, weight: .medium))
                    .foregroundStyle(.swarmCanvas)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.swarmGold)
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)

                if let screenshot = emulatorService.recentScreenshot {
                    Button {
                        copyImage(screenshot)
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                            Text(isCopied ? "Copied!" : "Copy Image")
                        }
                        .font(.swarm(.xs))
                        .foregroundStyle(isCopied ? .swarmSuccess : .swarmGold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(.swarmSurface)
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, 10)

            Divider()
                .background(.swarmBorderSubtle)

            // Image Frame
            if let screenshot = emulatorService.recentScreenshot {
                ScrollView([.horizontal, .vertical]) {
                    Image(nsImage: screenshot)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxHeight: 520)
                        .cornerRadius(10)
                        .shadow(color: .black.opacity(0.4), radius: 12, x: 0, y: 6)
                        .padding(14)
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 44))
                        .foregroundStyle(.swarmTextTertiary)

                    Text("No Screenshot Captured Yet")
                        .font(.swarm(.base, weight: .medium))
                        .foregroundStyle(.swarmTextSecondary)

                    Text("Click 'Capture Frame' above to take a live high-resolution screencap from your active Android device via ADB.")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 380)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.top, 40)
            }
        }
    }

    private func copyImage(_ img: NSImage) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.writeObjects([img])
        isCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isCopied = false
        }
    }
}

// MARK: - 4. ADB Console & Actions View

private struct AdbConsoleView: View {
    let emulatorService: EmulatorService
    @Binding var shellCommand: String
    @Binding var apkPath: String
    var onRunShell: (String) -> Void
    var onInstallApk: (String) -> Void
    var onSendKeyEvent: (Int) -> Void

    private let keyEvents: [(name: String, keycode: Int, icon: String)] = [
        ("Power", 26, "power"),
        ("Home", 3, "house.fill"),
        ("Back", 4, "chevron.backward"),
        ("Menu", 82, "line.3.horizontal"),
        ("Volume Up", 24, "speaker.plus.fill"),
        ("Volume Down", 25, "speaker.minus.fill")
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                // Hardware Keys
                VStack(alignment: .leading, spacing: 6) {
                    Text("Hardware Key Simulation")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    HStack(spacing: 8) {
                        ForEach(keyEvents, id: \.name) { item in
                            Button {
                                onSendKeyEvent(item.keycode)
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: item.icon)
                                        .font(.swarm(.micro))
                                    Text(item.name)
                                        .font(.swarm(.micro, weight: .medium))
                                }
                                .foregroundStyle(.swarmTextPrimary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 5)
                                .background(.swarmSurface)
                                .cornerRadius(6)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                Divider()
                    .background(.swarmBorderSubtle)

                // Shell Command Runner
                VStack(alignment: .leading, spacing: 6) {
                    Text("ADB Shell Command")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    HStack {
                        Image(systemName: "terminal")
                            .font(.swarm(.micro))
                            .foregroundStyle(.swarmGold)

                        TextField("e.g. pm list packages -3...", text: $shellCommand)
                            .font(.swarmMono(.xs))
                            .textFieldStyle(.plain)
                            .onSubmit {
                                onRunShell(shellCommand)
                            }

                        Button("Execute") {
                            onRunShell(shellCommand)
                        }
                        .font(.swarm(.xs, weight: .semibold))
                        .foregroundStyle(.swarmCanvas)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.swarmGold)
                        .cornerRadius(6)
                        .buttonStyle(.plain)
                    }
                    .padding(8)
                    .background(.swarmSurface)
                    .cornerRadius(6)
                }

                // Output Console
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("ADB Output Console")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextSecondary)

                        Spacer()

                        Button {
                            emulatorService.lastCommandOutput = ""
                        } label: {
                            Image(systemName: "trash")
                                .font(.swarm(.micro))
                                .foregroundStyle(.swarmTextTertiary)
                        }
                        .buttonStyle(.plain)
                    }

                    ScrollView {
                        Text(emulatorService.lastCommandOutput.isEmpty ? "No output. Run a command above to view response." : emulatorService.lastCommandOutput)
                            .font(.swarmMono(.xs))
                            .foregroundStyle(emulatorService.lastCommandOutput.isEmpty ? .swarmTextTertiary : .swarmTextPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                    }
                    .frame(minHeight: 140, maxHeight: 220)
                    .background(Color.black.opacity(0.4))
                    .cornerRadius(6)
                    .overlay {
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(.swarmBorderSubtle, lineWidth: 1)
                    }
                }

                Divider()
                    .background(.swarmBorderSubtle)

                // Install APK
                VStack(alignment: .leading, spacing: 6) {
                    Text("Install APK Package")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    HStack {
                        TextField("/path/to/app.apk", text: $apkPath)
                            .font(.swarmMono(.xs))
                            .textFieldStyle(.plain)

                        Button("Install APK") {
                            onInstallApk(apkPath)
                        }
                        .font(.swarm(.xs, weight: .medium))
                        .foregroundStyle(.swarmCanvas)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(apkPath.isEmpty ? Color.swarmSurface : Color.swarmGold)
                        .cornerRadius(6)
                        .buttonStyle(.plain)
                        .disabled(apkPath.isEmpty)
                    }
                    .padding(8)
                    .background(.swarmSurface)
                    .cornerRadius(6)
                }
            }
            .padding(14)
        }
    }
}
