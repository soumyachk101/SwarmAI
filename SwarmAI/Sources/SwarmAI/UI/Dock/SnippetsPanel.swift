import SwiftUI
import AppKit

// MARK: - Models

public struct SnippetItem: Identifiable, Codable, Equatable {
    public var id: UUID
    public var title: String
    public var description: String
    public var category: SnippetCategory
    public var content: String
    public var language: String
    public var tags: [String]

    public init(
        id: UUID = UUID(),
        title: String,
        description: String = "",
        category: SnippetCategory,
        content: String,
        language: String = "bash",
        tags: [String] = []
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.content = content
        self.language = language
        self.tags = tags
    }
}

public enum SnippetCategory: String, CaseIterable, Identifiable, Codable {
    case all = "All"
    case git = "Git"
    case swarm = "Swarm"
    case build = "Build"
    case docker = "Docker"
    case shell = "Shell"
    case custom = "Custom"

    public var id: String { rawValue }

    public var icon: String {
        switch self {
        case .all: return "square.grid.2x2.fill"
        case .git: return "arrow.triangle.branch"
        case .swarm: return "ant.fill"
        case .build: return "hammer.fill"
        case .docker: return "shippingbox.fill"
        case .shell: return "terminal.fill"
        case .custom: return "star.fill"
        }
    }
}

// MARK: - Snippets Panel

public struct SnippetsPanel: View {
    @Environment(\.agentsStore) private var agentsStore

    @State private var snippets: [SnippetItem] = []
    @State private var selectedCategory: SnippetCategory = .all
    @State private var searchText: String = ""
    @State private var showingAddSheet: Bool = false
    @State private var editingSnippet: SnippetItem?
    @State private var contentAppeared: Bool = false
    @State private var toastMessage: String?

    public init() {}

    private let defaultSnippets: [SnippetItem] = [
        SnippetItem(
            title: "Git Status",
            description: "Show working tree status concisely",
            category: .git,
            content: "git status -sb",
            language: "bash",
            tags: ["git", "status", "vcs"]
        ),
        SnippetItem(
            title: "Git Log Graph",
            description: "Pretty one-line commit history graph",
            category: .git,
            content: "git log --graph --oneline --decorate --all -n 15",
            language: "bash",
            tags: ["git", "log", "history"]
        ),
        SnippetItem(
            title: "Git Clean Stale Branches",
            description: "Prune deleted remote references",
            category: .git,
            content: "git fetch -p && git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D",
            language: "bash",
            tags: ["git", "cleanup"]
        ),
        SnippetItem(
            title: "Dispatch Swarm Goal",
            description: "Trigger autonomous multi-agent task execution",
            category: .swarm,
            content: "swarm dispatch 'Refactor auth module with async/await and add tests'",
            language: "bash",
            tags: ["swarm", "lead", "orchestration"]
        ),
        SnippetItem(
            title: "List Active Swarm Fleet",
            description: "Inspect all live agents and worktrees",
            category: .swarm,
            content: "swarm fleet --status active --json",
            language: "bash",
            tags: ["swarm", "fleet", "monitoring"]
        ),
        SnippetItem(
            title: "Pheromone Broadcast",
            description: "Broadcast context signal to swarm memory pool",
            category: .swarm,
            content: "swarm memory broadcast --tag arch-decision --message 'Adopted modern @Observable state store'",
            language: "bash",
            tags: ["swarm", "memory", "mcp"]
        ),
        SnippetItem(
            title: "Swift Build & Test",
            description: "Compile and execute swift test suite",
            category: .build,
            content: "swift test --enable-code-coverage --parallel",
            language: "bash",
            tags: ["swift", "test", "build"]
        ),
        SnippetItem(
            title: "Docker Compose Up",
            description: "Start local development containers detached",
            category: .docker,
            content: "docker compose up -d --build --remove-orphans",
            language: "bash",
            tags: ["docker", "dev"]
        ),
        SnippetItem(
            title: "Docker Container Stats",
            description: "Live CPU & RAM utilization stream",
            category: .docker,
            content: "docker stats --format \"table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\"",
            language: "bash",
            tags: ["docker", "stats"]
        ),
        SnippetItem(
            title: "Kill Port Process",
            description: "Find and kill process listening on specific port",
            category: .shell,
            content: "lsof -ti:8080 | xargs kill -9",
            language: "bash",
            tags: ["port", "kill", "network"]
        ),
        SnippetItem(
            title: "Watch Directory Changes",
            description: "Live file tree watch using fswatch",
            category: .shell,
            content: "fswatch -o ./Sources | xargs -n1 -I{} swift build",
            language: "bash",
            tags: ["watch", "dev"]
        )
    ]

    private var filteredSnippets: [SnippetItem] {
        var list = snippets
        if selectedCategory != .all {
            list = list.filter { $0.category == selectedCategory }
        }
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !query.isEmpty {
            list = list.filter {
                $0.title.lowercased().contains(query) ||
                $0.description.lowercased().contains(query) ||
                $0.content.lowercased().contains(query) ||
                $0.tags.contains(where: { $0.lowercased().contains(query) })
            }
        }
        return list
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left.forwardslash.chevron.right")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmGold)

                    Text("Code Snippets")
                        .font(.swarm(.sm, weight: .semibold))
                        .foregroundStyle(.swarmTextPrimary)
                }

                Spacer()

                Button {
                    showingAddSheet = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text("Add")
                    }
                    .font(.swarm(.xs, weight: .medium))
                    .foregroundStyle(.swarmGold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.swarmGold.opacity(0.12))
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)

            Divider()
                .background(.swarmBorderSubtle)

            // Search Bar
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass")
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextTertiary)

                TextField("Search snippets, commands, tags...", text: $searchText)
                    .font(.swarmMono(.xs))
                    .textFieldStyle(.plain)

                if !searchText.isEmpty {
                    Button {
                        searchText = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.swarm(.micro))
                            .foregroundStyle(.swarmTextTertiary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(.swarmSurface)
            .cornerRadius(6)
            .padding(.horizontal, 10)
            .padding(.top, 8)

            // Category filter pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(SnippetCategory.allCases) { cat in
                        Button {
                            withAnimation(.swarmQuick) {
                                selectedCategory = cat
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: cat.icon)
                                    .font(.swarm(.micro))
                                Text(cat.rawValue)
                                    .font(.swarm(.micro, weight: .medium))
                            }
                            .foregroundStyle(selectedCategory == cat ? .swarmCanvas : .swarmTextSecondary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(selectedCategory == cat ? .swarmGold : .swarmSurface)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 10)
            }
            .padding(.vertical, 8)

            Divider()
                .background(.swarmBorderSubtle)

            // Toast feedback
            if let toast = toastMessage {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmSuccess)
                    Text(toast)
                        .font(.swarm(.micro, weight: .medium))
                        .foregroundStyle(.swarmSuccess)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.swarmSuccess.opacity(0.12))
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            // Snippet list
            ScrollView {
                if filteredSnippets.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 28))
                            .foregroundStyle(.swarmTextTertiary)
                        Text("No snippets match your filter")
                            .font(.swarm(.sm))
                            .foregroundStyle(.swarmTextSecondary)
                        if !searchText.isEmpty {
                            Button("Clear Search") {
                                searchText = ""
                            }
                            .font(.swarm(.micro))
                            .foregroundStyle(.swarmGold)
                            .buttonStyle(.plain)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                } else {
                    LazyVStack(spacing: 8) {
                        ForEach(Array(filteredSnippets.enumerated()), id: \.element.id) { index, snippet in
                            SnippetCardRow(
                                snippet: snippet,
                                index: index,
                                onSendToTerminal: { snippet in
                                    sendSnippetToActiveAgent(snippet)
                                },
                                onEdit: { snippet in
                                    editingSnippet = snippet
                                },
                                onDelete: { snippet in
                                    deleteSnippet(snippet)
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.top, 8)
                    .padding(.bottom, 20)
                }
            }
            .background(.swarmCanvas)
        }
        .sheet(isPresented: $showingAddSheet) {
            AddSnippetSheet { newSnippet in
                snippets.insert(newSnippet, at: 0)
                saveSnippets()
                showToast("Snippet '\(newSnippet.title)' added")
            }
        }
        .sheet(item: $editingSnippet) { snippet in
            EditSnippetSheet(snippet: snippet) { updated in
                if let idx = snippets.firstIndex(where: { $0.id == updated.id }) {
                    snippets[idx] = updated
                    saveSnippets()
                    showToast("Snippet '\(updated.title)' updated")
                }
            }
        }
        .onAppear {
            loadSnippets()
            contentAppeared = true
        }
    }

    // MARK: - Actions

    private func sendSnippetToActiveAgent(_ snippet: SnippetItem) {
        // Find active agent or first available agent
        let targetAgent: Agent?
        if let activeId = agentsStore.activePaneId,
           let agent = agentsStore.agents.first(where: { $0.id.uuidString == activeId }) {
            targetAgent = agent
        } else if let runningAgent = agentsStore.agents.first(where: { $0.status == .running }) {
            targetAgent = runningAgent
        } else {
            targetAgent = agentsStore.agents.first
        }

        if let agent = targetAgent {
            agent.appendOutput("$ \(snippet.content)")
            showToast("Sent '\(snippet.title)' to \(agent.name)")
        } else {
            // Fallback to clipboard
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(snippet.content, forType: .string)
            showToast("Copied to clipboard (No active agent running)")
        }
    }

    private func deleteSnippet(_ snippet: SnippetItem) {
        snippets.removeAll { $0.id == snippet.id }
        saveSnippets()
        showToast("Deleted '\(snippet.title)'")
    }

    private func showToast(_ msg: String) {
        withAnimation(.swarmQuick) {
            toastMessage = msg
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation(.swarmQuick) {
                if toastMessage == msg {
                    toastMessage = nil
                }
            }
        }
    }

    private func loadSnippets() {
        if let data = UserDefaults.standard.data(forKey: "saved_snippets_v2"),
           let decoded = try? JSONDecoder().decode([SnippetItem].self, from: data) {
            snippets = decoded
        } else {
            snippets = defaultSnippets
            saveSnippets()
        }
    }

    private func saveSnippets() {
        if let data = try? JSONEncoder().encode(snippets) {
            UserDefaults.standard.set(data, forKey: "saved_snippets_v2")
        }
    }
}

// MARK: - Snippet Card Row

public struct SnippetCardRow: View {
    let snippet: SnippetItem
    let index: Int
    var onSendToTerminal: (SnippetItem) -> Void
    var onEdit: (SnippetItem) -> Void
    var onDelete: (SnippetItem) -> Void

    @State private var isCopied = false
    @State private var isHovered = false

    public var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Top row: Title, Category pill, Actions
            HStack(alignment: .center, spacing: 6) {
                Circle()
                    .fill(categoryColor)
                    .frame(width: 7, height: 7)

                Text(snippet.title)
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                    .lineLimit(1)

                Spacer()

                // Category Tag
                Text(snippet.category.rawValue)
                    .font(.swarmMono(.micro))
                    .foregroundStyle(categoryColor)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(categoryColor.opacity(0.12))
                    .cornerRadius(4)

                // Send to Agent Terminal
                Button {
                    onSendToTerminal(snippet)
                } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmGold)
                }
                .buttonStyle(.plain)
                .help("Send command to active agent terminal")

                // Copy Button
                Button {
                    copyToClipboard(snippet.content)
                } label: {
                    Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                        .font(.swarm(.micro))
                        .foregroundStyle(isCopied ? .swarmSuccess : .swarmTextSecondary)
                }
                .buttonStyle(.plain)
                .help("Copy command to clipboard")

                // Context Menu Button
                Menu {
                    Button("Copy Command") {
                        copyToClipboard(snippet.content)
                    }
                    Button("Send to Active Agent") {
                        onSendToTerminal(snippet)
                    }
                    Divider()
                    Button("Edit Snippet...") {
                        onEdit(snippet)
                    }
                    Button("Delete Snippet", role: .destructive) {
                        onDelete(snippet)
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }
                .menuStyle(.borderlessButton)
            }

            // Description (if present)
            if !snippet.description.isEmpty {
                Text(snippet.description)
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextSecondary)
                    .lineLimit(2)
            }

            // Code Content Box
            HStack {
                Text(snippet.content)
                    .font(.swarmMono(.xs))
                    .foregroundStyle(.swarmTextPrimary)
                    .lineLimit(3)
                Spacer()
            }
            .padding(8)
            .background(Color.black.opacity(0.35))
            .cornerRadius(6)
            .overlay {
                RoundedRectangle(cornerRadius: 6)
                    .stroke(.swarmBorderSubtle, lineWidth: 1)
            }

            // Tags row (if present)
            if !snippet.tags.isEmpty {
                HStack(spacing: 4) {
                    ForEach(snippet.tags, id: \.self) { tag in
                        Text("#\(tag)")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextTertiary)
                    }
                }
            }
        }
        .padding(10)
        .background {
            RoundedRectangle(cornerRadius: 8)
                .fill(.swarmSurface)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(isHovered ? .swarmGold.opacity(0.4) : .swarmBorderSubtle, lineWidth: 1)
        }
        .onHover { hovering in
            isHovered = hovering
        }
    }

    private var categoryColor: Color {
        switch snippet.category {
        case .git: return .swarmInfo
        case .swarm: return .swarmGold
        case .build: return .swarmSuccess
        case .docker: return .swarmInfo
        case .shell: return .swarmWarning
        case .custom: return .swarmGold
        case .all: return .swarmTextTertiary
        }
    }

    private func copyToClipboard(_ text: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        isCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isCopied = false
        }
    }
}

// MARK: - Add Snippet Sheet

private struct AddSnippetSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var title: String = ""
    @State private var description: String = ""
    @State private var category: SnippetCategory = .custom
    @State private var content: String = ""
    @State private var tagsString: String = ""

    var onSave: (SnippetItem) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Add New Snippet")
                .font(.swarm(.base, weight: .semibold))
                .foregroundStyle(.swarmTextPrimary)

            Divider()
                .background(.swarmBorderSubtle)

            VStack(alignment: .leading, spacing: 4) {
                Text("Title")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                TextField("Snippet Title (e.g. Docker Prune)", text: $title)
                    .textFieldStyle(.roundedBorder)
                    .font(.swarm(.sm))
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Category")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    Picker("", selection: $category) {
                        ForEach(SnippetCategory.allCases.filter { $0 != .all }) { cat in
                            Text(cat.rawValue).tag(cat)
                        }
                    }
                    .pickerStyle(.menu)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Tags (comma separated)")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    TextField("tag1, tag2", text: $tagsString)
                        .textFieldStyle(.roundedBorder)
                        .font(.swarm(.xs))
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Description (optional)")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                TextField("Short explanation of command", text: $description)
                    .textFieldStyle(.roundedBorder)
                    .font(.swarm(.xs))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Command / Code Content")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                TextEditor(text: $content)
                    .font(.swarmMono(.xs))
                    .frame(height: 100)
                    .padding(6)
                    .background(.swarmSurface)
                    .cornerRadius(6)
            }

            HStack {
                Button("Cancel") {
                    dismiss()
                }
                .buttonStyle(.plain)
                .foregroundStyle(.swarmTextTertiary)

                Spacer()

                Button("Save Snippet") {
                    let tags = tagsString.components(separatedBy: ",")
                        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                        .filter { !$0.isEmpty }

                    let item = SnippetItem(
                        title: title.isEmpty ? "Untitled Snippet" : title,
                        description: description,
                        category: category,
                        content: content,
                        tags: tags
                    )
                    onSave(item)
                    dismiss()
                }
                .font(.swarm(.xs, weight: .semibold))
                .foregroundStyle(.swarmCanvas)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(content.isEmpty ? Color.swarmSurface : Color.swarmGold)
                .cornerRadius(6)
                .disabled(content.isEmpty)
            }
            .padding(.top, 8)
        }
        .padding(16)
        .frame(width: 440)
        .background(.swarmCanvas)
    }
}

// MARK: - Edit Snippet Sheet

private struct EditSnippetSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var description: String
    @State private var category: SnippetCategory
    @State private var content: String
    @State private var tagsString: String
    let snippetId: UUID

    var onSave: (SnippetItem) -> Void

    init(snippet: SnippetItem, onSave: @escaping (SnippetItem) -> Void) {
        self.snippetId = snippet.id
        self._title = State(initialValue: snippet.title)
        self._description = State(initialValue: snippet.description)
        self._category = State(initialValue: snippet.category)
        self._content = State(initialValue: snippet.content)
        self._tagsString = State(initialValue: snippet.tags.joined(separator: ", "))
        self.onSave = onSave
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Edit Snippet")
                .font(.swarm(.base, weight: .semibold))
                .foregroundStyle(.swarmTextPrimary)

            Divider()
                .background(.swarmBorderSubtle)

            VStack(alignment: .leading, spacing: 4) {
                Text("Title")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                TextField("Snippet Title", text: $title)
                    .textFieldStyle(.roundedBorder)
                    .font(.swarm(.sm))
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Category")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    Picker("", selection: $category) {
                        ForEach(SnippetCategory.allCases.filter { $0 != .all }) { cat in
                            Text(cat.rawValue).tag(cat)
                        }
                    }
                    .pickerStyle(.menu)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Tags")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    TextField("tag1, tag2", text: $tagsString)
                        .textFieldStyle(.roundedBorder)
                        .font(.swarm(.xs))
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Description")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                TextField("Short explanation", text: $description)
                    .textFieldStyle(.roundedBorder)
                    .font(.swarm(.xs))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Code Content")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                TextEditor(text: $content)
                    .font(.swarmMono(.xs))
                    .frame(height: 100)
                    .padding(6)
                    .background(.swarmSurface)
                    .cornerRadius(6)
            }

            HStack {
                Button("Cancel") {
                    dismiss()
                }
                .buttonStyle(.plain)
                .foregroundStyle(.swarmTextTertiary)

                Spacer()

                Button("Update") {
                    let tags = tagsString.components(separatedBy: ",")
                        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                        .filter { !$0.isEmpty }

                    let updated = SnippetItem(
                        id: snippetId,
                        title: title.isEmpty ? "Untitled Snippet" : title,
                        description: description,
                        category: category,
                        content: content,
                        tags: tags
                    )
                    onSave(updated)
                    dismiss()
                }
                .font(.swarm(.xs, weight: .semibold))
                .foregroundStyle(.swarmCanvas)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(content.isEmpty ? Color.swarmSurface : Color.swarmGold)
                .cornerRadius(6)
                .disabled(content.isEmpty)
            }
            .padding(.top, 8)
        }
        .padding(16)
        .frame(width: 440)
        .background(.swarmCanvas)
    }
}
