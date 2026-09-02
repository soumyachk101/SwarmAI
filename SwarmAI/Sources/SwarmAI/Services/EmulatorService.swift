import Foundation
import SwiftUI
import AppKit

// MARK: - Models

public struct AndroidAVD: Identifiable, Hashable, Sendable {
    public var id: String { name }
    public let name: String
    public var isRunning: Bool
    public var target: String?
    public var path: String?

    public init(name: String, isRunning: Bool = false, target: String? = nil, path: String? = nil) {
        self.name = name
        self.isRunning = isRunning
        self.target = target
        self.path = path
    }
}

public struct ConnectedDevice: Identifiable, Hashable, Sendable {
    public var id: String { serial }
    public let serial: String
    public let state: String // "device", "offline", "unauthorized", "bootloader"
    public let model: String
    public let product: String
    public let device: String
    public let transportId: String

    public var isEmulator: Bool {
        serial.lowercased().starts(with: "emulator-")
    }

    public var displayName: String {
        if !model.isEmpty {
            return model.replacingOccurrences(of: "_", with: " ")
        }
        return serial
    }

    public init(serial: String, state: String, model: String = "", product: String = "", device: String = "", transportId: String = "") {
        self.serial = serial
        self.state = state
        self.model = model
        self.product = product
        self.device = device
        self.transportId = transportId
    }
}

public struct DeviceDetails: Sendable {
    public var batteryLevel: Int?
    public var isCharging: Bool?
    public var androidVersion: String?
    public var sdkVersion: String?
    public var manufacturer: String?
    public var model: String?
    public var resolution: String?
    public var ipAddress: String?

    public init(
        batteryLevel: Int? = nil,
        isCharging: Bool? = nil,
        androidVersion: String? = nil,
        sdkVersion: String? = nil,
        manufacturer: String? = nil,
        model: String? = nil,
        resolution: String? = nil,
        ipAddress: String? = nil
    ) {
        self.batteryLevel = batteryLevel
        self.isCharging = isCharging
        self.androidVersion = androidVersion
        self.sdkVersion = sdkVersion
        self.manufacturer = manufacturer
        self.model = model
        self.resolution = resolution
        self.ipAddress = ipAddress
    }
}

// MARK: - Android Emulator Service

@Observable
public final class EmulatorService: @unchecked Sendable {
    public static let shared = EmulatorService()

    // MARK: - Published State
    public var sdkPath: String?
    public var adbPath: String?
    public var emulatorPath: String?
    public var isSDKFound: Bool = false

    public var avds: [AndroidAVD] = []
    public var connectedDevices: [ConnectedDevice] = []
    public var selectedDeviceSerial: String?
    public var deviceDetailsMap: [String: DeviceDetails] = [:]

    public var isLoading: Bool = false
    public var lastError: String?
    public var lastCommandOutput: String = ""
    public var recentScreenshot: NSImage?

    private var runningProcesses: [String: Process] = [:]
    private let queue = DispatchQueue(label: "com.swarmai.emulatorservice", qos: .userInitiated)

    public init() {
        detectSDKAndBinaries()
    }

    // MARK: - Detection

    public func detectSDKAndBinaries() {
        let fm = FileManager.default
        let env = ProcessInfo.processInfo.environment

        var candidates: [String] = []

        if let home = env["ANDROID_HOME"], !home.isEmpty {
            candidates.append(home)
        }
        if let sdkRoot = env["ANDROID_SDK_ROOT"], !sdkRoot.isEmpty {
            candidates.append(sdkRoot)
        }

        let userHome = fm.homeDirectoryForCurrentUser.path
        candidates.append("\(userHome)/Library/Android/sdk")
        candidates.append("/opt/homebrew/share/android-commandlinetools")
        candidates.append("/usr/local/share/android-sdk")

        var resolvedSdk: String?
        for candidate in candidates {
            var isDir: ObjCBool = false
            if fm.fileExists(atPath: candidate, isDirectory: &isDir), isDir.boolValue {
                resolvedSdk = candidate
                break
            }
        }

        self.sdkPath = resolvedSdk
        self.isSDKFound = (resolvedSdk != nil)

        // Find ADB
        if let sdk = resolvedSdk {
            let adbCandidate = "\(sdk)/platform-tools/adb"
            if fm.isExecutableFile(atPath: adbCandidate) {
                self.adbPath = adbCandidate
            }
        }

        if self.adbPath == nil {
            if let whichAdb = runSyncCommand(executable: "/usr/bin/which", args: ["adb"])?.trimmingCharacters(in: .whitespacesAndNewlines),
               !whichAdb.isEmpty, fm.isExecutableFile(atPath: whichAdb) {
                self.adbPath = whichAdb
            } else if fm.isExecutableFile(atPath: "/opt/homebrew/bin/adb") {
                self.adbPath = "/opt/homebrew/bin/adb"
            } else if fm.isExecutableFile(atPath: "/usr/local/bin/adb") {
                self.adbPath = "/usr/local/bin/adb"
            }
        }

        // Find Emulator
        if let sdk = resolvedSdk {
            let emulatorCandidate = "\(sdk)/emulator/emulator"
            if fm.isExecutableFile(atPath: emulatorCandidate) {
                self.emulatorPath = emulatorCandidate
            } else {
                let toolsEmulator = "\(sdk)/tools/emulator"
                if fm.isExecutableFile(atPath: toolsEmulator) {
                    self.emulatorPath = toolsEmulator
                }
            }
        }

        if self.emulatorPath == nil {
            if let whichEmu = runSyncCommand(executable: "/usr/bin/which", args: ["emulator"])?.trimmingCharacters(in: .whitespacesAndNewlines),
               !whichEmu.isEmpty, fm.isExecutableFile(atPath: whichEmu) {
                self.emulatorPath = whichEmu
            } else if fm.isExecutableFile(atPath: "/opt/homebrew/bin/emulator") {
                self.emulatorPath = "/opt/homebrew/bin/emulator"
            }
        }
    }

    // MARK: - Actions

    public func refresh() async {
        await MainActor.run {
            self.isLoading = true
            self.lastError = nil
        }

        detectSDKAndBinaries()

        let fetchedDevices = await fetchConnectedDevices()
        let fetchedAvds = await fetchAVDs(runningSerials: fetchedDevices.map { $0.serial })

        var fetchedDetails: [String: DeviceDetails] = [:]
        for device in fetchedDevices where device.state == "device" {
            fetchedDetails[device.serial] = await fetchDetails(for: device.serial)
        }

        await MainActor.run {
            self.connectedDevices = fetchedDevices
            self.avds = fetchedAvds
            self.deviceDetailsMap = fetchedDetails
            if self.selectedDeviceSerial == nil || !fetchedDevices.contains(where: { $0.serial == self.selectedDeviceSerial }) {
                self.selectedDeviceSerial = fetchedDevices.first?.serial
            }
            self.isLoading = false
        }
    }

    public func launchAVD(name: String, coldBoot: Bool = false) async throws {
        guard let emu = emulatorPath else {
            throw NSError(domain: "EmulatorService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Android Emulator binary not found."])
        }

        var args = ["-avd", name]
        if coldBoot {
            args.append("-no-snapshot-load")
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: emu)
        process.arguments = args

        var environment = ProcessInfo.processInfo.environment
        if let sdk = sdkPath {
            environment["ANDROID_HOME"] = sdk
            environment["ANDROID_SDK_ROOT"] = sdk
        }
        process.environment = environment

        try process.run()
        runningProcesses[name] = process

        // Trigger refresh after a delay to detect boot
        Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            await self.refresh()
        }
    }

    public func stopDevice(serial: String) async throws {
        guard let adb = adbPath else {
            throw NSError(domain: "EmulatorService", code: 2, userInfo: [NSLocalizedDescriptionKey: "ADB binary not found."])
        }

        if serial.starts(with: "emulator-") {
            _ = try await runProcessAsync(executable: adb, args: ["-s", serial, "emu", "kill"])
        } else {
            _ = try await runProcessAsync(executable: adb, args: ["-s", serial, "reboot", "-p"])
        }

        try? await Task.sleep(nanoseconds: 1_000_000_000)
        await refresh()
    }

    public func takeScreenshot(serial: String) async throws -> NSImage {
        guard let adb = adbPath else {
            throw NSError(domain: "EmulatorService", code: 2, userInfo: [NSLocalizedDescriptionKey: "ADB binary not found."])
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: adb)
        process.arguments = ["-s", serial, "exec-out", "screencap", "-p"]

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = Pipe()

        try process.run()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()

        guard let image = NSImage(data: data) else {
            throw NSError(domain: "EmulatorService", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to decode screenshot PNG data."])
        }

        await MainActor.run {
            self.recentScreenshot = image
        }
        return image
    }

    public func executeShell(serial: String, command: String) async throws -> String {
        guard let adb = adbPath else {
            throw NSError(domain: "EmulatorService", code: 2, userInfo: [NSLocalizedDescriptionKey: "ADB binary not found."])
        }

        let output = try await runProcessAsync(executable: adb, args: ["-s", serial, "shell", command])
        await MainActor.run {
            self.lastCommandOutput = output
        }
        return output
    }

    public func installApk(serial: String, apkPath: String) async throws -> String {
        guard let adb = adbPath else {
            throw NSError(domain: "EmulatorService", code: 2, userInfo: [NSLocalizedDescriptionKey: "ADB binary not found."])
        }

        let output = try await runProcessAsync(executable: adb, args: ["-s", serial, "install", "-r", apkPath])
        await MainActor.run {
            self.lastCommandOutput = output
        }
        return output
    }

    public func rebootDevice(serial: String) async throws {
        guard let adb = adbPath else {
            throw NSError(domain: "EmulatorService", code: 2, userInfo: [NSLocalizedDescriptionKey: "ADB binary not found."])
        }
        _ = try await runProcessAsync(executable: adb, args: ["-s", serial, "reboot"])
        await refresh()
    }

    public func restartAdbServer() async throws {
        guard let adb = adbPath else {
            throw NSError(domain: "EmulatorService", code: 2, userInfo: [NSLocalizedDescriptionKey: "ADB binary not found."])
        }
        _ = try? await runProcessAsync(executable: adb, args: ["kill-server"])
        _ = try await runProcessAsync(executable: adb, args: ["start-server"])
        await refresh()
    }

    // MARK: - Private Helpers

    private func fetchConnectedDevices() async -> [ConnectedDevice] {
        guard let adb = adbPath else { return [] }

        do {
            let output = try await runProcessAsync(executable: adb, args: ["devices", "-l"])
            var devices: [ConnectedDevice] = []

            let lines = output.components(separatedBy: .newlines)
            for line in lines {
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                if trimmed.isEmpty || trimmed.hasPrefix("List of devices") || trimmed.hasPrefix("*") {
                    continue
                }

                let parts = trimmed.components(separatedBy: .whitespaces).filter { !$0.isEmpty }
                guard parts.count >= 2 else { continue }

                let serial = parts[0]
                let state = parts[1]

                var model = ""
                var product = ""
                var device = ""
                var transportId = ""

                for part in parts.dropFirst(2) {
                    if part.starts(with: "model:") {
                        model = String(part.dropFirst(6))
                    } else if part.starts(with: "product:") {
                        product = String(part.dropFirst(8))
                    } else if part.starts(with: "device:") {
                        device = String(part.dropFirst(7))
                    } else if part.starts(with: "transport_id:") {
                        transportId = String(part.dropFirst(13))
                    }
                }

                devices.append(ConnectedDevice(
                    serial: serial,
                    state: state,
                    model: model,
                    product: product,
                    device: device,
                    transportId: transportId
                ))
            }
            return devices
        } catch {
            await MainActor.run {
                self.lastError = "ADB error: \(error.localizedDescription)"
            }
            return []
        }
    }

    private func fetchAVDs(runningSerials: [String]) async -> [AndroidAVD] {
        guard let emu = emulatorPath else { return [] }

        do {
            let output = try await runProcessAsync(executable: emu, args: ["-list-avds"])
            let lines = output.components(separatedBy: .newlines)
            var avdList: [AndroidAVD] = []

            for line in lines {
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                if trimmed.isEmpty { continue }

                // Check if running
                let isRunning = runningSerials.contains(where: { $0.starts(with: "emulator-") })
                avdList.append(AndroidAVD(name: trimmed, isRunning: isRunning))
            }
            return avdList
        } catch {
            return []
        }
    }

    private func fetchDetails(for serial: String) async -> DeviceDetails {
        guard let adb = adbPath else { return DeviceDetails() }

        var details = DeviceDetails()

        // Battery info
        if let batteryOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "dumpsys", "battery"]) {
            for line in batteryOut.components(separatedBy: .newlines) {
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                if trimmed.starts(with: "level:") {
                    let levelStr = trimmed.replacingOccurrences(of: "level:", with: "").trimmingCharacters(in: .whitespaces)
                    details.batteryLevel = Int(levelStr)
                } else if trimmed.starts(with: "status:") {
                    let statusVal = trimmed.replacingOccurrences(of: "status:", with: "").trimmingCharacters(in: .whitespaces)
                    details.isCharging = (statusVal == "2") // 2 = CHARGING
                }
            }
        }

        // Android version
        if let versionOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "getprop", "ro.build.version.release"]) {
            details.androidVersion = versionOut.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        // SDK Version
        if let sdkOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "getprop", "ro.build.version.sdk"]) {
            details.sdkVersion = sdkOut.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        // Manufacturer & Model
        if let mfgOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "getprop", "ro.product.manufacturer"]) {
            details.manufacturer = mfgOut.trimmingCharacters(in: .whitespacesAndNewlines).capitalized
        }
        if let modelOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "getprop", "ro.product.model"]) {
            details.model = modelOut.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        // Display resolution
        if let wmOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "wm", "size"]) {
            if let sizeLine = wmOut.components(separatedBy: .newlines).first(where: { $0.contains("Physical size:") }) {
                details.resolution = sizeLine.replacingOccurrences(of: "Physical size:", with: "").trimmingCharacters(in: .whitespaces)
            }
        }

        // IP Address
        if let ipOut = try? await runProcessAsync(executable: adb, args: ["-s", serial, "shell", "ip", "route"]) {
            for line in ipOut.components(separatedBy: .newlines) {
                if line.contains("src ") {
                    let parts = line.components(separatedBy: "src ")
                    if parts.count > 1 {
                        let ip = parts[1].components(separatedBy: .whitespaces).first ?? ""
                        if !ip.isEmpty {
                            details.ipAddress = ip
                            break
                        }
                    }
                }
            }
        }

        return details
    }

    private func runProcessAsync(executable: String, args: [String]) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                let process = Process()
                process.executableURL = URL(fileURLWithPath: executable)
                process.arguments = args

                var environment = ProcessInfo.processInfo.environment
                if let sdk = self.sdkPath {
                    environment["ANDROID_HOME"] = sdk
                    environment["ANDROID_SDK_ROOT"] = sdk
                }
                process.environment = environment

                let outPipe = Pipe()
                let errPipe = Pipe()
                process.standardOutput = outPipe
                process.standardError = errPipe

                do {
                    try process.run()
                    let outData = outPipe.fileHandleForReading.readDataToEndOfFile()
                    let errData = errPipe.fileHandleForReading.readDataToEndOfFile()
                    process.waitUntilExit()

                    let output = String(data: outData, encoding: .utf8) ?? ""
                    let errOutput = String(data: errData, encoding: .utf8) ?? ""

                    if process.terminationStatus == 0 {
                        continuation.resume(returning: output)
                    } else {
                        let msg = errOutput.isEmpty ? output : errOutput
                        continuation.resume(throwing: NSError(domain: "ProcessError", code: Int(process.terminationStatus), userInfo: [NSLocalizedDescriptionKey: msg.trimmingCharacters(in: .whitespacesAndNewlines)]))
                    }
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    private func runSyncCommand(executable: String, args: [String]) -> String? {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executable)
        process.arguments = args
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = Pipe()

        do {
            try process.run()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            return String(data: data, encoding: .utf8)
        } catch {
            return nil
        }
    }
}
