import Foundation
import SwiftUI
import Darwin

// MARK: - PATH Discovery & Environment Helper

/// Helper to discover the user's interactive login shell PATH and environment.
public final class PathDiscovery: @unchecked Sendable {
    public static let shared = PathDiscovery()
    
    private let lock = NSLock()
    private var cachedPath: String
    private var isProbing: Bool = false
    
    // Standard developer binary locations on macOS
    private static let standardCandidatePaths: [String] = {
        let homeDir = NSHomeDirectory()
        return [
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin",
            "/usr/local/bin",
            "/usr/local/sbin",
            "\(homeDir)/.cargo/bin",
            "\(homeDir)/.local/bin",
            "\(homeDir)/.bun/bin",
            "\(homeDir)/.npm-global/bin",
            "\(homeDir)/.yarn/bin",
            "/Library/Apple/usr/bin",
            "/usr/bin",
            "/bin",
            "/usr/sbin",
            "/sbin"
        ]
    }()
    
    private init() {
        // Compute fast immediate path synchronously without blocking subprocesses
        self.cachedPath = Self.buildFastPath()
        // Trigger background shell probe for any extra shell environment variables
        triggerBackgroundShellProbe()
    }
    
    /// Build fast initial PATH using process environment, standard directories, and nvm.
    private static func buildFastPath() -> String {
        let homeDir = NSHomeDirectory()
        let discoveredPath = ProcessInfo.processInfo.environment["PATH"] ?? ""
        var components = discoveredPath.components(separatedBy: ":").filter { !$0.isEmpty }
        
        // Scan nvm node versions if present
        let nvmDir = "\(homeDir)/.nvm/versions/node"
        if let versions = try? FileManager.default.contentsOfDirectory(atPath: nvmDir) {
            for v in versions.sorted().reversed() {
                let binDir = "\(nvmDir)/\(v)/bin"
                if FileManager.default.fileExists(atPath: binDir) && !components.contains(binDir) {
                    components.insert(binDir, at: 0)
                }
            }
        }
        
        // Append missing standard paths
        for candidate in standardCandidatePaths {
            if FileManager.default.fileExists(atPath: candidate) && !components.contains(candidate) {
                components.append(candidate)
            }
        }
        
        return components.joined(separator: ":")
    }
    
    private func triggerBackgroundShellProbe() {
        lock.lock()
        guard !isProbing else {
            lock.unlock()
            return
        }
        isProbing = true
        lock.unlock()
        
        DispatchQueue.global(qos: .utility).async { [weak self] in
            guard let self = self else { return }
            let probed = self.probeLoginShellPath()
            if !probed.isEmpty {
                self.lock.lock()
                self.cachedPath = probed
                self.isProbing = false
                self.lock.unlock()
            } else {
                self.lock.lock()
                self.isProbing = false
                self.lock.unlock()
            }
        }
    }
    
    /// Resolve the full interactive login shell PATH (instant & non-blocking).
    public func resolveUserPath() -> String {
        lock.lock()
        defer { lock.unlock() }
        return cachedPath
    }
    
    /// Probe user's default login shell for the full exported PATH in the background.
    private func probeLoginShellPath() -> String {
        var userShell = ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh"
        if !FileManager.default.isExecutableFile(atPath: userShell) {
            userShell = "/bin/zsh"
            if !FileManager.default.isExecutableFile(atPath: userShell) {
                userShell = "/bin/sh"
            }
        }
        
        guard FileManager.default.isExecutableFile(atPath: userShell) else {
            return Self.buildFastPath()
        }
        
        let pipe = Pipe()
        let process = Process()
        process.executableURL = URL(fileURLWithPath: userShell)
        // -l for login shell, -i for interactive, -c to execute command
        process.arguments = ["-lic", "printf \"%s\" \"$PATH\""]
        process.standardOutput = pipe
        process.standardError = Pipe() // Suppress stderr warnings
        
        var discoveredPath = ""
        do {
            try process.run()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            if let output = String(data: data, encoding: .utf8), !output.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                discoveredPath = output.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        } catch {
            discoveredPath = ProcessInfo.processInfo.environment["PATH"] ?? ""
        }
        
        let homeDir = NSHomeDirectory()
        var components = discoveredPath.components(separatedBy: ":").filter { !$0.isEmpty }
        
        // Scan nvm node versions if present
        let nvmDir = "\(homeDir)/.nvm/versions/node"
        if let versions = try? FileManager.default.contentsOfDirectory(atPath: nvmDir) {
            for v in versions.sorted().reversed() {
                let binDir = "\(nvmDir)/\(v)/bin"
                if FileManager.default.fileExists(atPath: binDir) && !components.contains(binDir) {
                    components.insert(binDir, at: 0)
                }
            }
        }
        
        // Append missing standard paths
        for candidate in Self.standardCandidatePaths {
            if FileManager.default.fileExists(atPath: candidate) && !components.contains(candidate) {
                components.append(candidate)
            }
        }
        
        return components.joined(separator: ":")
    }
    
    /// Locate full binary path for an executable name.
    public func findExecutable(_ name: String, in customPath: String? = nil) -> String? {
        let fm = FileManager.default
        if name.contains("/") {
            if fm.isExecutableFile(atPath: name) {
                return name
            }
        }
        
        let pathString = customPath ?? resolveUserPath()
        let directories = pathString.components(separatedBy: ":")
        
        for dir in directories {
            let fullPath = (dir as NSString).appendingPathComponent(name)
            if fm.isExecutableFile(atPath: fullPath) {
                return fullPath
            }
        }
        
        // Fallback candidate search
        for dir in Self.standardCandidatePaths {
            let fullPath = (dir as NSString).appendingPathComponent(name)
            if fm.isExecutableFile(atPath: fullPath) {
                return fullPath
            }
        }
        
        return nil
    }
    
    /// Build base environment dictionary for spawned processes.
    public func defaultEnvironment(injecting custom: [String: String] = [:]) -> [String: String] {
        var env = ProcessInfo.processInfo.environment
        let fullPath = resolveUserPath()
        
        env["PATH"] = fullPath
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        env["LANG"] = "en_US.UTF-8"
        env["LC_ALL"] = "en_US.UTF-8"
        env["HOME"] = NSHomeDirectory()
        env["USER"] = NSUserName()
        if env["SHELL"] == nil {
            env["SHELL"] = "/bin/zsh"
        }
        if env["TMPDIR"] == nil {
            env["TMPDIR"] = NSTemporaryDirectory()
        }
        
        // Merge user custom environment variables
        for (k, v) in custom {
            env[k] = v
        }
        
        return env
    }
}

// MARK: - PTY Session

/// Represents an active POSIX Pseudo-Terminal session with a running Process.
@Observable
public final class PTYSession: Identifiable, @unchecked Sendable {
    public let id: UUID
    public let agentId: UUID
    
    public var command: String
    public var arguments: [String]
    public var workingDirectory: String
    public var environment: [String: String]
    
    public var isRunning: Bool = false
    public var exitCode: Int32? = nil
    public var processId: pid_t? = nil
    
    public var outputLines: [String] = []
    public var maxOutputLines: Int = 10_000
    
    public var cols: Int = 120
    public var rows: Int = 30
    
    private var masterFd: Int32 = -1
    private var slaveFd: Int32 = -1
    private var process: Process?
    private var readSource: (any DispatchSourceRead)?
    private let readQueue = DispatchQueue(label: "com.swarmai.pty.read", qos: .userInteractive)
    private let lock = NSLock()
    
    public var onOutput: ((String) -> Void)?
    public var onTerminated: ((Int32) -> Void)?
    
    public init(
        id: UUID = UUID(),
        agentId: UUID,
        command: String = "/bin/zsh",
        arguments: [String] = [],
        workingDirectory: String = NSHomeDirectory(),
        environment: [String: String] = [:],
        cols: Int = 120,
        rows: Int = 30
    ) {
        self.id = id
        self.agentId = agentId
        self.command = command
        self.arguments = arguments
        self.workingDirectory = workingDirectory
        self.environment = environment
        self.cols = cols
        self.rows = rows
    }
    
    deinit {
        cleanup()
    }
    
    // MARK: - Process Lifecycle
    
    /// Spawns the pseudo-terminal and launches the process.
    public func start() throws {
        lock.lock()
        defer { lock.unlock() }
        
        guard !isRunning else { return }
        
        // 1. Prepare winsize
        var win = winsize()
        win.ws_col = UInt16(max(10, cols))
        win.ws_row = UInt16(max(5, rows))
        win.ws_xpixel = 0
        win.ws_ypixel = 0
        
        // 2. Open pseudo-terminal master/slave pair
        var master: Int32 = -1
        var slave: Int32 = -1
        let ptyResult = openpty(&master, &slave, nil, nil, &win)
        guard ptyResult == 0 else {
            let errorDesc = String(cString: strerror(errno))
            throw NSError(domain: "PTYService", code: Int(errno), userInfo: [NSLocalizedDescriptionKey: "Failed openpty: \(errorDesc)"])
        }
        
        _ = grantpt(slave)
        _ = unlockpt(slave)
        
        // Set master non-blocking for asynchronous reads
        let flags = fcntl(master, F_GETFL, 0)
        _ = fcntl(master, F_SETFL, flags | O_NONBLOCK)
        
        self.masterFd = master
        self.slaveFd = slave
        
        // 3. Resolve binary executable path
        let resolvedCommand: String
        let resolvedArgs: [String]
        
        let shellPath = PathDiscovery.shared.findExecutable("zsh")
            ?? PathDiscovery.shared.findExecutable("bash")
            ?? PathDiscovery.shared.findExecutable("sh")
            ?? "/bin/zsh"
        
        let isShell = ["zsh", "bash", "sh", "/bin/zsh", "/bin/bash", "/bin/sh"].contains(command)
        
        if let fullPath = PathDiscovery.shared.findExecutable(command) {
            resolvedCommand = fullPath
            resolvedArgs = arguments
        } else if !isShell {
            // Fallback: spawn interactive login shell and execute requested command
            resolvedCommand = shellPath
            if arguments.isEmpty {
                resolvedArgs = ["-lc", "exec \(command)"]
            } else {
                let escapedArgs = arguments.map { "\"\($0.replacingOccurrences(of: "\"", with: "\\\""))\"" }.joined(separator: " ")
                resolvedArgs = ["-lc", "exec \(command) \(escapedArgs)"]
            }
        } else {
            resolvedCommand = shellPath
            resolvedArgs = arguments.isEmpty ? ["-l"] : arguments
        }
        
        // 4. Configure Process
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: resolvedCommand)
        proc.arguments = resolvedArgs
        
        let fm = FileManager.default
        var cwd = workingDirectory
        if !fm.fileExists(atPath: cwd) {
            cwd = NSHomeDirectory()
        }
        proc.currentDirectoryURL = URL(fileURLWithPath: cwd)
        
        let mergedEnv = PathDiscovery.shared.defaultEnvironment(injecting: environment)
        proc.environment = mergedEnv
        
        // Attach slave file descriptor to standard I/O
        let slaveHandle = FileHandle(fileDescriptor: slave, closeOnDealloc: false)
        proc.standardInput = slaveHandle
        proc.standardOutput = slaveHandle
        proc.standardError = slaveHandle
        
        // 5. Setup Read DispatchSource for master FD
        let source = DispatchSource.makeReadSource(fileDescriptor: master, queue: readQueue)
        source.setEventHandler(handler: DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            var buffer = [UInt8](repeating: 0, count: 4096)
            let bytesRead = Darwin.read(master, &buffer, buffer.count)
            if bytesRead > 0 {
                let data = Data(buffer[0..<bytesRead])
                let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .isoLatin1) ?? ""
                if !text.isEmpty {
                    _Concurrency.Task { @MainActor in
                        self.appendOutputText(text)
                    }
                }
            } else if bytesRead == 0 || (bytesRead < 0 && errno != EAGAIN && errno != EINTR) {
                source.cancel()
            }
        })
        
        source.setCancelHandler(handler: DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            self.lock.lock()
            if self.masterFd >= 0 {
                Darwin.close(self.masterFd)
                self.masterFd = -1
            }
            self.lock.unlock()
        })
        
        self.readSource = source
        source.resume()
        
        // 6. Termination Handler
        proc.terminationHandler = { [weak self] p in
            guard let self = self else { return }
            let code = p.terminationStatus
            _Concurrency.Task { @MainActor in
                self.handleTerminated(exitCode: code)
            }
        }
        
        // 7. Launch process
        do {
            try proc.run()
            self.process = proc
            self.processId = proc.processIdentifier
            self.isRunning = true
            self.exitCode = nil
            
            // Close slave FD in parent process so EOF triggers properly on master FD
            if slaveFd >= 0 {
                Darwin.close(slaveFd)
                self.slaveFd = -1
            }
        } catch {
            cleanup()
            throw error
        }
    }
    
    // MARK: - I/O and Control
    
    /// Write string to standard input of the PTY.
    public func write(_ string: String) {
        guard let data = string.data(using: .utf8) else { return }
        write(data)
    }
    
    /// Write raw data bytes to standard input of the PTY.
    public func write(_ data: Data) {
        lock.lock()
        let fd = masterFd
        lock.unlock()
        
        guard fd >= 0 else { return }
        data.withUnsafeBytes { rawBuffer in
            guard let ptr = rawBuffer.baseAddress else { return }
            _ = Darwin.write(fd, ptr, data.count)
        }
    }
    
    /// Send interrupt signal (Ctrl+C).
    public func sendInterrupt() {
        write("\u{03}")
        if let pid = processId, pid > 0 {
            Darwin.kill(pid, SIGINT)
        }
    }
    
    /// Send End-Of-File (Ctrl+D).
    public func sendEOF() {
        write("\u{04}")
    }
    
    /// Resize the pseudo-terminal window dimensions.
    public func resize(cols: Int, rows: Int) {
        lock.lock()
        self.cols = cols
        self.rows = rows
        let fd = masterFd
        lock.unlock()
        
        guard fd >= 0 else { return }
        var ws = winsize()
        ws.ws_col = UInt16(max(10, cols))
        ws.ws_row = UInt16(max(5, rows))
        ws.ws_xpixel = 0
        ws.ws_ypixel = 0
        _ = ioctl(fd, UInt(TIOCSWINSZ), &ws)
    }
    
    /// Gracefully terminate the process (SIGTERM).
    public func terminate() {
        if let proc = process, proc.isRunning {
            proc.terminate()
        } else if let pid = processId, pid > 0 {
            Darwin.kill(pid, SIGTERM)
        }
    }
    
    /// Force kill the process (SIGKILL).
    public func killProcess() {
        if let pid = processId, pid > 0 {
            Darwin.kill(pid, SIGKILL)
        }
        cleanup()
    }
    
    /// Clear the session output buffer.
    public func clearBuffer() {
        outputLines.removeAll(keepingCapacity: true)
    }
    
    // MARK: - Internal Handlers
    
    @MainActor
    private func appendOutputText(_ text: String) {
        let normalized = text.replacingOccurrences(of: "\r\n", with: "\n")
        let lines = normalized.components(separatedBy: "\n")
        for (idx, line) in lines.enumerated() {
            if idx == 0, let last = outputLines.last, !text.hasPrefix("\n") {
                outputLines[outputLines.count - 1] = last + line
            } else {
                outputLines.append(line)
            }
            if outputLines.count > maxOutputLines {
                outputLines.removeFirst(outputLines.count - maxOutputLines)
            }
        }
        onOutput?(text)
    }
    
    @MainActor
    private func handleTerminated(exitCode: Int32) {
        self.isRunning = false
        self.exitCode = exitCode
        self.processId = nil
        onTerminated?(exitCode)
    }
    
    private func cleanup() {
        lock.lock()
        defer { lock.unlock() }
        
        readSource?.cancel()
        readSource = nil
        
        if slaveFd >= 0 {
            Darwin.close(slaveFd)
            slaveFd = -1
        }
        if masterFd >= 0 {
            Darwin.close(masterFd)
            masterFd = -1
        }
        process = nil
        processId = nil
        isRunning = false
    }
}

// MARK: - PTY Service Manager

/// Central service managing pseudo-terminal sessions for AI agents and terminals.
@Observable
public final class PTYService: @unchecked Sendable {
    public static let shared = PTYService()
    
    public var sessions: [UUID: PTYSession] = [:]
    private let lock = NSLock()
    
    private init() {}
    
    /// Retrieve an existing session by agent ID.
    public func getSession(for agentId: UUID) -> PTYSession? {
        lock.lock()
        defer { lock.unlock() }
        return sessions[agentId]
    }
    
    /// Get or spawn a PTY session for a given agent.
    @discardableResult
    public func getOrCreateSession(for agent: Agent) -> PTYSession {
        lock.lock()
        if let existing = sessions[agent.id] {
            lock.unlock()
            return existing
        }
        lock.unlock()
        
        let session = createSession(for: agent)
        lock.lock()
        sessions[agent.id] = session
        lock.unlock()
        
        return session
    }
    
    /// Spawn a new interactive session for an agent.
    @discardableResult
    public func spawn(
        for agent: Agent,
        command: String? = nil,
        arguments: [String]? = nil,
        cwd: String? = nil,
        env: [String: String]? = nil
    ) throws -> PTYSession {
        let session = createSession(for: agent, command: command, arguments: arguments, cwd: cwd, env: env)
        
        lock.lock()
        sessions[agent.id] = session
        lock.unlock()
        
        try session.start()
        return session
    }
    
    /// Terminate and remove a session for an agent.
    public func terminateSession(for agentId: UUID) {
        lock.lock()
        let session = sessions.removeValue(forKey: agentId)
        lock.unlock()
        
        session?.terminate()
    }
    
    /// Write input to an agent's terminal.
    public func write(agentId: UUID, input: String) {
        getSession(for: agentId)?.write(input)
    }
    
    /// Resize an agent's terminal.
    public func resize(agentId: UUID, cols: Int, rows: Int) {
        getSession(for: agentId)?.resize(cols: cols, rows: rows)
    }
    
    // MARK: - Private Factory
    
    private func createSession(
        for agent: Agent,
        command: String? = nil,
        arguments: [String]? = nil,
        cwd: String? = nil,
        env: [String: String]? = nil
    ) -> PTYSession {
        let cmd: String
        var args: [String] = arguments ?? []
        
        if let customCmd = command {
            cmd = customCmd
        } else {
            switch agent.agentType {
            case .claudeCode:
                cmd = "claude"
                if let prompt = agent.prompt, !prompt.isEmpty {
                    args = ["-p", prompt]
                }
            case .codex:
                cmd = "codex"
                if let prompt = agent.prompt, !prompt.isEmpty {
                    args = [prompt]
                }
            case .aider:
                cmd = "aider"
                if let prompt = agent.prompt, !prompt.isEmpty {
                    args = ["--message", prompt]
                }
            case .cursor:
                cmd = "cursor"
            case .openCode:
                cmd = "opencode"
            case .cline:
                cmd = "cline"
            case .kilo:
                cmd = "kilo"
            case .kimiCode:
                cmd = "kimi"
            case .kiro:
                cmd = "kiro"
            case .antigravity:
                cmd = "agy"
            case .geminiCli:
                cmd = "gemini"
            case .deepSeek:
                cmd = "deepseek"
            case .grok:
                cmd = "grok"
            case .droid:
                cmd = "droid"
            case .plainTerminal:
                cmd = ProcessInfo.processInfo.environment["SHELL"] ?? "/bin/zsh"
                args = ["-l"]
            }
        }
        
        let workingDir = cwd ?? agent.worktree ?? NSHomeDirectory()
        var environment = env ?? [:]
        
        // Inject API keys if present in environment
        for key in ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "DEEPSEEK_API_KEY", "MISTRAL_API_KEY", "COHERE_API_KEY", "XAI_API_KEY"] {
            if let val = ProcessInfo.processInfo.environment[key], environment[key] == nil {
                environment[key] = val
            }
        }
        
        let session = PTYSession(
            agentId: agent.id,
            command: cmd,
            arguments: args,
            workingDirectory: workingDir,
            environment: environment
        )
        
        // Hook callbacks back to Agent state
        session.onOutput = { [weak agent] chunk in
            guard let agent = agent else { return }
            agent.appendOutput(chunk)
            if agent.status != .running {
                agent.status = .running
            }
        }
        
        session.onTerminated = { [weak agent] code in
            guard let agent = agent else { return }
            agent.status = (code == 0 ? .done : .error)
            agent.exitCode = Int(code)
            agent.appendOutput("\n[Process exited with code \(code)]")
        }
        
        return session
    }
}
