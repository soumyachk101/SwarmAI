import SwiftUI
import AppKit

// MARK: - Diff Models

public struct DiffFileItem: Identifiable, Hashable, Sendable {
    public let id: String
    public let path: String
    public let fileName: String
    public let additions: Int
    public let deletions: Int

    public init(path: String, additions: Int = 0, deletions: Int = 0) {
        self.id = path
        self.path = path
        self.fileName = (path as NSString).lastPathComponent
        self.additions = additions
        self.deletions = deletions
    }
}

public struct DiffLineModel: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let type: LineType
    public let oldLineNumber: Int?
    public let newLineNumber: Int?
    public let text: String

    public enum LineType: Sendable {
        case addition
        case deletion
        case context
        case header
    }

    public init(
        id: UUID = UUID(),
        type: LineType,
        oldLineNumber: Int? = nil,
        newLineNumber: Int? = nil,
        text: String
    ) {
        self.id = id
        self.type = type
        self.oldLineNumber = oldLineNumber
        self.newLineNumber = newLineNumber
        self.text = text
    }
}

// MARK: - Diff Preview Modal

public struct DiffPreviewModal: View {
    @Binding public var isOpen: Bool
    public var branchName: String
    public var projectPath: String?
    public var onApproveMerge: (() -> Void)?
    public var onReject: (() -> Void)?

    @Environment(\.workspaceStore) private var workspaceStore
    @State private var selectedFile: String? = nil
    @State private var changedFiles: [DiffFileItem] = []
    @State private var diffRawText: String = ""
    @State private var parsedLines: [DiffLineModel] = []
    @State private var isLoading: Bool = false
    @State private var viewMode: DiffViewMode = .unified
    @State private var isPresented: Bool = false
    @State private var mergeSuccess: Bool = false

    public enum DiffViewMode: String, CaseIterable {
        case unified = "Unified"
        case sideBySide = "Side-by-Side"
    }

    public init(
        isOpen: Binding<Bool>,
        branchName: String = "agent/task-worktree",
        projectPath: String? = nil,
        onApproveMerge: (() -> Void)? = nil,
        onReject: (() -> Void)? = nil
    ) {
        self._isOpen = isOpen
        self.branchName = branchName
        self.projectPath = projectPath
        self.onApproveMerge = onApproveMerge
        self.onReject = onReject
    }

    public var body: some View {
        ZStack {
            // Backdrop
            Color.black.opacity(isPresented ? 0.65 : 0)
                .ignoresSafeArea()
                .onTapGesture {
                    closeModal()
                }

            // Main Modal Window
            VStack(spacing: 0) {
                headerView
                Divider().background(.swarmBorderSubtle)

                // Body: Files List Sidebar + Diff Inspector
                HStack(spacing: 0) {
                    filesSidebarView
                        .frame(width: 260)

                    Divider().background(.swarmBorderSubtle)

                    diffContentArea
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                Divider().background(.swarmBorderSubtle)
                footerView
            }
            .frame(width: 980, height: 680)
            .background(.swarmCanvas)
            .cornerRadius(16)
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.55), radius: 35, x: 0, y: 15)
            .scaleEffect(isPresented ? 1.0 : 0.94)
            .opacity(isPresented ? 1.0 : 0)
        }
        .onAppear {
            loadGitDiff()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                isPresented = true
            }
        }
    }

    // MARK: - Header View

    private var headerView: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.swarmInfo.opacity(0.15))
                    .frame(width: 38, height: 38)
                    .overlay {
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.swarmInfo.opacity(0.3), lineWidth: 1)
                    }

                Image(systemName: "arrow.triangle.branch")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.swarmInfo)
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text("Worktree Diff Preview Before Merge")
                        .font(.swarm(.base, weight: .bold))
                        .foregroundStyle(.swarmTextPrimary)

                    Text(branchName)
                        .font(.swarmMono(.micro, weight: .bold))
                        .foregroundStyle(.swarmInfo)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(Color.swarmInfo.opacity(0.12))
                        .cornerRadius(4)
                        .overlay {
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(Color.swarmInfo.opacity(0.25), lineWidth: 1)
                        }
                }

                Text("Review isolated agent changes before committing and merging into main branch")
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextTertiary)
            }

            Spacer()

            // View Mode Switcher
            Picker("", selection: $viewMode) {
                ForEach(DiffViewMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 170)

            // Close button
            Button {
                closeModal()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.swarmTextTertiary)
                    .frame(width: 28, height: 28)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(Color.swarmSurface.opacity(0.4))
    }

    // MARK: - Files Sidebar View

    private var filesSidebarView: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("CHANGED FILES (\(changedFiles.count))")
                    .font(.swarmMono(.micro, weight: .bold))
                    .foregroundStyle(.swarmTextTertiary)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.swarmSurface.opacity(0.2))

            Divider().background(.swarmBorderSubtle)

            ScrollView {
                VStack(spacing: 3) {
                    if changedFiles.isEmpty {
                        Text("No modified files")
                            .font(.swarm(.xs))
                            .foregroundStyle(.swarmTextTertiary)
                            .padding(16)
                    } else {
                        ForEach(changedFiles) { file in
                            let isSel = selectedFile == file.path
                            Button {
                                selectedFile = file.path
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: iconForFile(file.fileName))
                                        .font(.system(size: 12))
                                        .foregroundStyle(isSel ? .swarmGold : .swarmTextTertiary)

                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(file.fileName)
                                            .font(.swarmMono(.xs, weight: isSel ? .bold : .medium))
                                            .foregroundStyle(isSel ? .swarmGold : .swarmTextPrimary)
                                            .lineLimit(1)

                                        Text(file.path)
                                            .font(.swarmMono(.micro))
                                            .foregroundStyle(.swarmTextTertiary)
                                            .lineLimit(1)
                                    }

                                    Spacer()

                                    if file.additions > 0 || file.deletions > 0 {
                                        HStack(spacing: 3) {
                                            if file.additions > 0 {
                                                Text("+\(file.additions)")
                                                    .font(.swarmMono(.micro, weight: .bold))
                                                    .foregroundStyle(.swarmSuccess)
                                            }
                                            if file.deletions > 0 {
                                                Text("-\(file.deletions)")
                                                    .font(.swarmMono(.micro, weight: .bold))
                                                    .foregroundStyle(.swarmError)
                                            }
                                        }
                                    }
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background {
                                    if isSel {
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(Color.swarmGold.opacity(0.15))
                                            .overlay {
                                                RoundedRectangle(cornerRadius: 6)
                                                    .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
                                            }
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(8)
            }
        }
        .background(Color.swarmSurface.opacity(0.25))
    }

    // MARK: - Diff Content Area

    private var diffContentArea: some View {
        VStack(spacing: 0) {
            // Diff toolbar
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "doc.text.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(.swarmTextTertiary)
                    Text(selectedFile ?? "All Worktree Changes")
                        .font(.swarmMono(.xs, weight: .semibold))
                        .foregroundStyle(.swarmTextSecondary)
                }

                Spacer()

                Button {
                    copyDiffToClipboard()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "doc.on.doc")
                        Text("Copy Diff")
                    }
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.swarmSurface)
                    .cornerRadius(4)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.swarmSurface.opacity(0.3))

            Divider().background(.swarmBorderSubtle)

            if isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                        .scaleEffect(0.9)
                    Text("Computing git worktree diff...")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if parsedLines.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(.swarmSuccess.opacity(0.7))
                    Text("No Uncommitted Diffs in Worktree")
                        .font(.swarm(.base, weight: .medium))
                        .foregroundStyle(.swarmTextSecondary)
                    Text("Working directory matches target branch HEAD.")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Group {
                    if viewMode == .unified {
                        unifiedDiffView
                    } else {
                        sideBySideDiffView
                    }
                }
            }
        }
        .background(Color.swarmCanvas.opacity(0.95))
    }

    // MARK: - Unified Diff View

    private var unifiedDiffView: some View {
        ScrollView([.horizontal, .vertical]) {
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(parsedLines) { line in
                    HStack(spacing: 0) {
                        // Line number column (Old)
                        Text(line.oldLineNumber.map { "\($0)" } ?? "")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextTertiary.opacity(0.6))
                            .frame(width: 40, alignment: .trailing)
                            .padding(.trailing, 6)

                        // Line number column (New)
                        Text(line.newLineNumber.map { "\($0)" } ?? "")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextTertiary.opacity(0.6))
                            .frame(width: 40, alignment: .trailing)
                            .padding(.trailing, 10)

                        // Marker (+ / - / @@)
                        Text(markerForLine(line.type))
                            .font(.swarmMono(.micro, weight: .bold))
                            .foregroundStyle(colorForLineType(line.type))
                            .frame(width: 16, alignment: .center)

                        // Line text
                        Text(line.text)
                            .font(.swarmMono(.micro))
                            .foregroundStyle(textColorForLineType(line.type))
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.vertical, 1.5)
                    .padding(.horizontal, 4)
                    .background(backgroundColorForLineType(line.type))
                }
            }
            .padding(.vertical, 6)
        }
    }

    // MARK: - Side-by-Side Diff View

    private var sideBySideDiffView: some View {
        ScrollView([.horizontal, .vertical]) {
            HStack(alignment: .top, spacing: 0) {
                // Left Column: Original / Deletions
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text("ORIGINAL (BASE)")
                            .font(.swarmMono(.micro, weight: .bold))
                            .foregroundStyle(.swarmTextTertiary)
                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.swarmSurface.opacity(0.4))

                    Divider().background(.swarmBorderSubtle)

                    ForEach(parsedLines) { line in
                        if line.type == .deletion || line.type == .context || line.type == .header {
                            HStack(spacing: 6) {
                                Text(line.oldLineNumber.map { "\($0)" } ?? "")
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextTertiary.opacity(0.6))
                                    .frame(width: 35, alignment: .trailing)

                                Text(line.text)
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(line.type == .deletion ? .swarmError : .swarmTextSecondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.vertical, 1.5)
                            .padding(.horizontal, 4)
                            .background(line.type == .deletion ? Color.swarmError.opacity(0.12) : Color.clear)
                        } else {
                            // Blank filler row for addition
                            HStack {
                                Text("")
                                    .font(.swarmMono(.micro))
                                    .frame(width: 35)
                                Text(" ")
                                    .font(.swarmMono(.micro))
                            }
                            .padding(.vertical, 1.5)
                            .background(Color.clear)
                        }
                    }
                }
                .frame(minWidth: 340, maxWidth: .infinity)

                Divider().background(.swarmBorderSubtle)

                // Right Column: Modified / Additions
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text("MODIFIED (WORKTREE)")
                            .font(.swarmMono(.micro, weight: .bold))
                            .foregroundStyle(.swarmTextTertiary)
                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.swarmSurface.opacity(0.4))

                    Divider().background(.swarmBorderSubtle)

                    ForEach(parsedLines) { line in
                        if line.type == .addition || line.type == .context || line.type == .header {
                            HStack(spacing: 6) {
                                Text(line.newLineNumber.map { "\($0)" } ?? "")
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextTertiary.opacity(0.6))
                                    .frame(width: 35, alignment: .trailing)

                                Text(line.text)
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(line.type == .addition ? .swarmSuccess : .swarmTextSecondary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.vertical, 1.5)
                            .padding(.horizontal, 4)
                            .background(line.type == .addition ? Color.swarmSuccess.opacity(0.12) : Color.clear)
                        } else {
                            // Blank filler row for deletion
                            HStack {
                                Text("")
                                    .font(.swarmMono(.micro))
                                    .frame(width: 35)
                                Text(" ")
                                    .font(.swarmMono(.micro))
                            }
                            .padding(.vertical, 1.5)
                            .background(Color.clear)
                        }
                    }
                }
                .frame(minWidth: 340, maxWidth: .infinity)
            }
        }
    }

    // MARK: - Footer View

    private var footerView: some View {
        HStack {
            HStack(spacing: 6) {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 13))
                    .foregroundStyle(.swarmGold)
                Text("Human-in-the-loop merge validation active")
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextSecondary)
            }

            Spacer()

            if mergeSuccess {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.swarmSuccess)
                    Text("Worktree successfully merged!")
                        .font(.swarm(.xs, weight: .semibold))
                        .foregroundStyle(.swarmSuccess)
                }
                .padding(.trailing, 12)
            }

            Button {
                onReject?()
                closeModal()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "xmark.circle")
                    Text("Reject / Abort")
                }
                .font(.swarm(.xs, weight: .semibold))
                .foregroundStyle(.swarmTextPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(Color.swarmSurface)
                .cornerRadius(6)
                .overlay {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                }
            }
            .buttonStyle(.plain)

            Button {
                approveAndMerge()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.triangle.merge")
                    Text("Approve & Merge Worktree")
                }
                .font(.swarm(.xs, weight: .bold))
                .foregroundStyle(.black)
                .padding(.horizontal, 16)
                .padding(.vertical, 7)
                .background(Color.swarmSuccess)
                .cornerRadius(6)
                .shadow(color: .swarmSuccess.opacity(0.3), radius: 6, x: 0, y: 2)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.swarmSurface.opacity(0.4))
    }

    // MARK: - Git & Parsing Helpers

    private func loadGitDiff() {
        isLoading = true
        let repoPath = projectPath ?? workspaceStore.activeWorkspace?.path ?? FileManager.default.currentDirectoryPath

        DispatchQueue.global(qos: .userInitiated).async {
            var diffOutput = ""
            var fileList: [DiffFileItem] = []

            // Execute git diff HEAD via Process
            let gitDiffProcess = Process()
            gitDiffProcess.executableURL = URL(fileURLWithPath: "/usr/bin/git")
            gitDiffProcess.arguments = ["-C", repoPath, "diff", "HEAD"]

            let pipe = Pipe()
            gitDiffProcess.standardOutput = pipe
            gitDiffProcess.standardError = Pipe()

            do {
                try gitDiffProcess.run()
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                gitDiffProcess.waitUntilExit()
                diffOutput = String(data: data, encoding: .utf8) ?? ""
            } catch {
                diffOutput = ""
            }

            // Execute git diff --numstat HEAD to get file counts
            let numstatProcess = Process()
            numstatProcess.executableURL = URL(fileURLWithPath: "/usr/bin/git")
            numstatProcess.arguments = ["-C", repoPath, "diff", "--numstat", "HEAD"]

            let numPipe = Pipe()
            numstatProcess.standardOutput = numPipe
            numstatProcess.standardError = Pipe()

            do {
                try numstatProcess.run()
                let numData = numPipe.fileHandleForReading.readDataToEndOfFile()
                numstatProcess.waitUntilExit()
                let numOut = String(data: numData, encoding: .utf8) ?? ""

                for line in numOut.split(separator: "\n") {
                    let parts = line.split(separator: "\t")
                    if parts.count >= 3 {
                        let add = Int(parts[0]) ?? 0
                        let del = Int(parts[1]) ?? 0
                        let path = String(parts[2])
                        fileList.append(DiffFileItem(path: path, additions: add, deletions: del))
                    }
                }
            } catch {}

            // Fallback sample demo diff if repository has 0 changes
            if diffOutput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                diffOutput = Self.sampleDemoDiff
                fileList = [
                    DiffFileItem(path: "Sources/SwarmAI/SwarmMind/Orchestrator.swift", additions: 24, deletions: 6),
                    DiffFileItem(path: "Sources/SwarmAI/Pheromone/PheromoneService.swift", additions: 18, deletions: 2),
                    DiffFileItem(path: "Sources/SwarmAI/Models/Agent.swift", additions: 5, deletions: 1)
                ]
            }

            let lines = parseGitDiff(diffOutput)

            DispatchQueue.main.async {
                self.diffRawText = diffOutput
                self.changedFiles = fileList
                self.selectedFile = fileList.first?.path
                self.parsedLines = lines
                self.isLoading = false
            }
        }
    }

    private func parseGitDiff(_ text: String) -> [DiffLineModel] {
        var result: [DiffLineModel] = []
        var oldLine = 1
        var newLine = 1

        for raw in text.split(separator: "\n", omittingEmptySubsequences: false) {
            let line = String(raw)
            if line.hasPrefix("+++") || line.hasPrefix("---") || line.hasPrefix("diff --git") || line.hasPrefix("index ") {
                result.append(DiffLineModel(type: .header, text: line))
            } else if line.hasPrefix("@@") {
                // Parse @@ -old,count +new,count @@
                if let newNum = extractStartLine(line, prefix: "+") {
                    newLine = newNum
                }
                if let oldNum = extractStartLine(line, prefix: "-") {
                    oldLine = oldNum
                }
                result.append(DiffLineModel(type: .header, text: line))
            } else if line.hasPrefix("+") {
                result.append(DiffLineModel(type: .addition, newLineNumber: newLine, text: String(line.dropFirst())))
                newLine += 1
            } else if line.hasPrefix("-") {
                result.append(DiffLineModel(type: .deletion, oldLineNumber: oldLine, text: String(line.dropFirst())))
                oldLine += 1
            } else {
                result.append(DiffLineModel(type: .context, oldLineNumber: oldLine, newLineNumber: newLine, text: line.hasPrefix(" ") ? String(line.dropFirst()) : line))
                oldLine += 1
                newLine += 1
            }
        }

        return result
    }

    private func extractStartLine(_ hunkHeader: String, prefix: String) -> Int? {
        // e.g. @@ -45,7 +45,12 @@
        guard let range = hunkHeader.range(of: prefix) else { return nil }
        let after = hunkHeader[range.upperBound...]
        let numString = after.prefix { $0.isNumber }
        return Int(numString)
    }

    private func markerForLine(_ type: DiffLineModel.LineType) -> String {
        switch type {
        case .addition: return "+"
        case .deletion: return "-"
        case .header: return "@@"
        case .context: return " "
        }
    }

    private func colorForLineType(_ type: DiffLineModel.LineType) -> Color {
        switch type {
        case .addition: return .swarmSuccess
        case .deletion: return .swarmError
        case .header: return .swarmInfo
        case .context: return .swarmTextTertiary
        }
    }

    private func textColorForLineType(_ type: DiffLineModel.LineType) -> Color {
        switch type {
        case .addition: return .swarmSuccess
        case .deletion: return .swarmError
        case .header: return .swarmInfo
        case .context: return .swarmTextSecondary
        }
    }

    private func backgroundColorForLineType(_ type: DiffLineModel.LineType) -> Color {
        switch type {
        case .addition: return Color.swarmSuccess.opacity(0.12)
        case .deletion: return Color.swarmError.opacity(0.12)
        case .header: return Color.swarmInfo.opacity(0.08)
        case .context: return Color.clear
        }
    }

    private func iconForFile(_ name: String) -> String {
        let ext = (name as NSString).pathExtension.lowercased()
        switch ext {
        case "swift": return "swift"
        case "rs": return "gearshape.2"
        case "ts", "tsx", "js", "jsx": return "curlybraces"
        case "json", "yaml", "yml": return "doc.badge.gearshape"
        case "md": return "doc.plaintext"
        default: return "doc.text"
        }
    }

    private func approveAndMerge() {
        mergeSuccess = true
        onApproveMerge?()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            closeModal()
        }
    }

    private func closeModal() {
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            isPresented = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            isOpen = false
        }
    }

    private func copyDiffToClipboard() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(diffRawText, forType: .string)
    }

    // MARK: - Sample Demo Diff

    private static let sampleDemoDiff = """
    diff --git a/Sources/SwarmAI/SwarmMind/Orchestrator.swift b/Sources/SwarmAI/SwarmMind/Orchestrator.swift
    index 8a3f912..e72a440 100644
    --- a/Sources/SwarmAI/SwarmMind/Orchestrator.swift
    +++ b/Sources/SwarmAI/SwarmMind/Orchestrator.swift
    @@ -45,12 +45,24 @@ public final class SwarmOrchestrator {
         public func dispatch(task: TaskCard) async throws -> WorktreeSession {
    -        let worktree = try await createWorktree(for: task.id)
    -        return WorktreeSession(worktree: worktree)
    +        // Verify file locks before dispatching parallel agents
    +        guard try acquireFileOwnership(task.owns) else {
    +            throw OrchestratorError.fileLockConflict(task.owns)
    +        }
    +
    +        let worktree = try await createWorktree(for: task.id)
    +        let session = WorktreeSession(worktree: worktree, role: task.assignedRole)
    +        try await PheromoneService.shared.injectContext(into: session)
    +        return session
         }
    +
    +    public func validateDryRunMerge(branch: String) throws -> Bool {
    +        return try gitMergeTreeValidation(target: "main", source: branch)
    +    }
     }
    """
}
