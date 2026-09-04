import SwiftUI
import AppKit

// MARK: - Template Data Models

public struct TemplateSubtask: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let title: String
    public let role: String
    public let roleColor: Color
    public let description: String

    public init(
        id: UUID = UUID(),
        title: String,
        role: String,
        roleColor: Color? = nil,
        description: String
    ) {
        self.id = id
        self.title = title
        self.role = role
        self.roleColor = roleColor ?? .yellow
        self.description = description
    }
}

public struct BlueprintTemplate: Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let category: String
    public let icon: String
    public let accentColor: Color
    public let description: String
    public let subtasks: [TemplateSubtask]

    public init(
        id: String,
        title: String,
        category: String,
        icon: String,
        accentColor: Color,
        description: String,
        subtasks: [TemplateSubtask]
    ) {
        self.id = id
        self.title = title
        self.category = category
        self.icon = icon
        self.accentColor = accentColor
        self.description = description
        self.subtasks = subtasks
    }
}

// MARK: - Task Templates Modal

public struct TaskTemplatesModal: View {
    @Binding public var isOpen: Bool
    public var initialTab: ModalTab = .templates

    @Environment(\.appState) private var appState
    @Environment(\.taskStore) private var taskStore
    @Environment(\.workspaceStore) private var workspaceStore
    @State private var selectedTab: ModalTab = .templates
    @State private var selectedTemplate: BlueprintTemplate = TaskTemplatesModal.allTemplates[0]
    @State private var selectedGuideTopic: String = "quickstart"
    @State private var selectedPrivacyTopic: String = "local-first"
    @State private var applied: Bool = false
    @State private var isPresented: Bool = false

    public enum ModalTab: String, CaseIterable {
        case templates = "Templates"
        case guide = "User Guide"
        case privacy = "Privacy & Security"
    }

    public init(isOpen: Binding<Bool> = .constant(true), initialTab: ModalTab = .templates) {
        self._isOpen = isOpen
        self.initialTab = initialTab
    }

    public var body: some View {
        ZStack {
            // Backdrop
            Color.black.opacity(isPresented ? 0.65 : 0)
                .ignoresSafeArea()
                .allowsHitTesting(isPresented)
                .onTapGesture {
                    closeModal()
                }

            // Hidden Escape Button for macOS keyboard shortcut routing
            Button("") {
                closeModal()
            }
            .keyboardShortcut(.cancelAction)
            .keyboardShortcut(.escape, modifiers: [])
            .opacity(0)
            .frame(width: 0, height: 0)

            // Main Modal Window
            VStack(spacing: 0) {
                headerView
                Divider().background(.swarmBorderSubtle)

                // Body content based on tab
                Group {
                    switch selectedTab {
                    case .templates:
                        templatesTabContent
                    case .guide:
                        guideTabContent
                    case .privacy:
                        privacyTabContent
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .frame(width: 960, height: 680)
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
        .onKeyPress(.escape) {
            closeModal()
            return .handled
        }
        .onAppear {
            selectedTab = initialTab
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
                    .fill(Color.swarmGold.opacity(0.15))
                    .frame(width: 38, height: 38)
                    .overlay {
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
                    }

                Image(systemName: "square.stack.3d.up.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.swarmGold)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(selectedTab == .templates ? "Multi-Agent Task Templates" : (selectedTab == .guide ? "Operational User Guide" : "Privacy & Security Guarantees"))
                    .font(.swarm(.base, weight: .bold))
                    .foregroundStyle(.swarmTextPrimary)

                Text(selectedTab == .templates ? "Pre-configured autonomous blueprints for Builder, Reviewer, and Scout roles" : (selectedTab == .guide ? "Interactive manual for multi-agent parallel workflows" : "Cryptographic and local-first data privacy guarantees"))
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextTertiary)
            }

            Spacer()

            // Tab Switcher
            HStack(spacing: 2) {
                ForEach(ModalTab.allCases, id: \.self) { tab in
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedTab = tab
                        }
                    } label: {
                        Text(tab.rawValue)
                            .font(.swarm(.xs, weight: selectedTab == tab ? .semibold : .regular))
                            .foregroundStyle(selectedTab == tab ? .black : .swarmTextSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background {
                                if selectedTab == tab {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(Color.swarmGold)
                                }
                            }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(2)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }

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

    // MARK: - Templates Tab Content

    private var templatesTabContent: some View {
        HStack(spacing: 0) {
            // Left Templates Sidebar
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("SELECT BLUEPRINT")
                        .font(.swarmMono(.micro, weight: .bold))
                        .foregroundStyle(.swarmTextTertiary)
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.swarmSurface.opacity(0.2))

                Divider().background(.swarmBorderSubtle)

                ScrollView {
                    VStack(spacing: 6) {
                        ForEach(Self.allTemplates) { tmpl in
                            let isSel = selectedTemplate.id == tmpl.id
                            Button {
                                withAnimation(.easeInOut(duration: 0.15)) {
                                    selectedTemplate = tmpl
                                }
                            } label: {
                                HStack(spacing: 10) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(tmpl.accentColor.opacity(0.15))
                                            .frame(width: 32, height: 32)
                                        Image(systemName: tmpl.icon)
                                            .font(.system(size: 14))
                                            .foregroundStyle(tmpl.accentColor)
                                    }

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(tmpl.title)
                                            .font(.swarm(.xs, weight: isSel ? .bold : .medium))
                                            .foregroundStyle(isSel ? .swarmGold : .swarmTextPrimary)
                                            .lineLimit(1)

                                        Text(tmpl.category)
                                            .font(.swarmMono(.micro))
                                            .foregroundStyle(.swarmTextTertiary)
                                    }

                                    Spacer()
                                }
                                .padding(10)
                                .background {
                                    if isSel {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(Color.swarmGold.opacity(0.15))
                                            .overlay {
                                                RoundedRectangle(cornerRadius: 8)
                                                    .stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
                                            }
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(10)
                }
            }
            .frame(width: 280)
            .background(Color.swarmSurface.opacity(0.25))

            Divider().background(.swarmBorderSubtle)

            // Right Template Details & Subtasks
            VStack(alignment: .leading, spacing: 16) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Title header
                        VStack(alignment: .leading, spacing: 6) {
                            Text(selectedTemplate.category.uppercased())
                                .font(.swarmMono(.micro, weight: .bold))
                                .foregroundStyle(selectedTemplate.accentColor)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 2)
                                .background(selectedTemplate.accentColor.opacity(0.12))
                                .cornerRadius(4)

                            Text(selectedTemplate.title)
                                .font(.swarm(.lg, weight: .bold))
                                .foregroundStyle(.swarmTextPrimary)

                            Text(selectedTemplate.description)
                                .font(.swarm(.xs))
                                .foregroundStyle(.swarmTextSecondary)
                                .lineSpacing(3)
                        }

                        Divider().background(.swarmBorderSubtle)

                        // Subtasks list
                        VStack(alignment: .leading, spacing: 8) {
                            Text("INCLUDED SUBTASKS PIPELINE (\(selectedTemplate.subtasks.count))")
                                .font(.swarmMono(.micro, weight: .bold))
                                .foregroundStyle(.swarmTextTertiary)

                            VStack(spacing: 8) {
                                ForEach(Array(selectedTemplate.subtasks.enumerated()), id: \.element.id) { idx, subtask in
                                    HStack(alignment: .top, spacing: 10) {
                                        // Step number
                                        ZStack {
                                            Circle()
                                                .fill(Color.swarmSurface)
                                                .frame(width: 24, height: 24)
                                                .overlay {
                                                    Circle().stroke(Color.swarmBorderSubtle, lineWidth: 1)
                                                }
                                            Text("\(idx + 1)")
                                                .font(.swarmMono(.micro, weight: .bold))
                                                .foregroundStyle(.swarmGold)
                                        }

                                        VStack(alignment: .leading, spacing: 3) {
                                            HStack {
                                                Text(subtask.title)
                                                    .font(.swarm(.xs, weight: .semibold))
                                                    .foregroundStyle(.swarmTextPrimary)

                                                Spacer()

                                                Text(subtask.role.uppercased())
                                                    .font(.swarmMono(.micro, weight: .bold))
                                                    .foregroundStyle(subtask.roleColor)
                                                    .padding(.horizontal, 6)
                                                    .padding(.vertical, 2)
                                                    .background(subtask.roleColor.opacity(0.12))
                                                    .cornerRadius(4)
                                            }

                                            Text(subtask.description)
                                                .font(.swarm(.micro))
                                                .foregroundStyle(.swarmTextTertiary)
                                                .lineSpacing(2)
                                        }
                                    }
                                    .padding(12)
                                    .background(Color.swarmSurface)
                                    .cornerRadius(8)
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                                    }
                                }
                            }
                        }
                    }
                    .padding(20)
                }

                Divider().background(.swarmBorderSubtle)

                // Launch Pipeline Action Footer
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.swarmGold)
                        Text("Instantiates \(selectedTemplate.subtasks.count) parallel worktree cards on the Kanban board")
                            .font(.swarm(.micro))
                            .foregroundStyle(.swarmTextTertiary)
                    }

                    Spacer()

                    Button {
                        launchPipeline()
                    } label: {
                        HStack(spacing: 6) {
                            if applied {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Launched Pipeline!")
                            } else {
                                Image(systemName: "play.fill")
                                Text("Launch Pipeline")
                            }
                        }
                        .font(.swarm(.xs, weight: .bold))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 8)
                        .background(applied ? Color.swarmSuccess : Color.swarmGold)
                        .cornerRadius(6)
                        .shadow(color: (applied ? Color.swarmSuccess : Color.swarmGold).opacity(0.35), radius: 8, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)
                    .disabled(applied)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(Color.swarmSurface.opacity(0.3))
            }
        }
    }

    // MARK: - Guide Tab Content

    private var guideTabContent: some View {
        HStack(spacing: 0) {
            // Guide Topics Sidebar
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("OPERATIONAL MANUAL")
                        .font(.swarmMono(.micro, weight: .bold))
                        .foregroundStyle(.swarmTextTertiary)
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.swarmSurface.opacity(0.2))

                Divider().background(.swarmBorderSubtle)

                VStack(spacing: 3) {
                    guideTopicButton(id: "quickstart", title: "Quickstart & Setup", icon: "bolt.fill")
                    guideTopicButton(id: "lead", title: "Lead Steward Modes", icon: "brain.head.profile")
                    guideTopicButton(id: "worktrees", title: "Git Worktree Concurrency", icon: "arrow.triangle.branch")
                    guideTopicButton(id: "canvas", title: "Flow Canvas Synapses", icon: "network")
                    guideTopicButton(id: "shortcuts", title: "Keyboard Shortcuts", icon: "command")
                }
                .padding(8)

                Spacer()
            }
            .frame(width: 240)
            .background(Color.swarmSurface.opacity(0.25))

            Divider().background(.swarmBorderSubtle)

            // Guide Topic Detail
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    switch selectedGuideTopic {
                    case "quickstart":
                        guideDetailSection(
                            title: "1. Getting Started with Swarm AI",
                            bodyText: "Swarm AI is designed to coordinate multiple autonomous CLI coding bots (Claude Code, OpenAI Codex, OpenCode, Aider, Antigravity) concurrently inside your workspace.",
                            highlights: [
                                "Open a Project: Bind any local git repository with Cmd+O. Swarm AI scaffolds .pheromone/ vector memory automatically.",
                                "Spawn Worker Agents: Launch your installed CLIs from the Top Tab Strip or Cmd+K Command Palette.",
                                "Dispatch Missions: Hand high-level directives to Lead Steward for parallel task breakdown."
                            ]
                        )
                    case "lead":
                        guideDetailSection(
                            title: "2. Lead Steward Orchestrator",
                            bodyText: "The Lead Steward is your high-level AI architect. Instead of writing code directly in your primary branch, it analyzes your prompt, breaks it down into subtasks, and assigns them to worker agents.",
                            highlights: [
                                "Goal Decomposition: Automatically isolates frontend, backend, and testing responsibilities.",
                                "File Ownership Locks: Reserves specific file paths for each worker to prevent concurrent edit collisions.",
                                "Pheromone Context Synthesis: Ingests memory updates and synchronizes project architecture."
                            ]
                        )
                    case "worktrees":
                        guideDetailSection(
                            title: "3. Git Worktrees & 3-Way Merge",
                            bodyText: "Swarm AI eliminates multi-agent merge conflicts by giving every worker agent its own ephemeral Git worktree under .swarm/worktrees/<task-id>.",
                            highlights: [
                                "Workers write code on isolated ephemeral branches.",
                                "SwarmMind executes an in-memory 3-way dry-run validation using git merge-tree.",
                                "Once validated, changes are fast-forward merged into your primary branch with zero git pollution."
                            ]
                        )
                    case "canvas":
                        guideDetailSection(
                            title: "4. Infinite Flow Canvas & Synapses",
                            bodyText: "The Flow Canvas provides spatial awareness of your entire swarm. You can zoom, pan, rearrange agent nodes, and draw wire connections between them.",
                            highlights: [
                                "Broadcast All Mode: Sends input prompt simultaneously to all active CLI agents in parallel.",
                                "Wire Pipeline Mode: Follows drawn wire synapse connections, passing output from one agent into the next."
                            ]
                        )
                    case "shortcuts":
                        VStack(alignment: .leading, spacing: 10) {
                            Text("5. Keyboard Shortcuts Cheatsheet")
                                .font(.swarm(.base, weight: .bold))
                                .foregroundStyle(.swarmTextPrimary)

                            VStack(spacing: 4) {
                                shortcutRow(keys: "⌘K", action: "Open Unified Command Palette")
                                shortcutRow(keys: "⌘Enter", action: "Dispatch Parallel Mission to Active Swarm")
                                shortcutRow(keys: "Space + Drag", action: "Smoothly Pan Flow Canvas")
                                shortcutRow(keys: "⌘1 .. ⌘9", action: "Focus specific Agent Terminal Pane")
                                shortcutRow(keys: "⌘0", action: "Reset Canvas Camera to 100% Zoom")
                                shortcutRow(keys: "⌘B", action: "Toggle Left Sidebar")
                                shortcutRow(keys: "⌘\\", action: "Toggle Right Dock")
                            }
                        }
                    default:
                        EmptyView()
                    }
                }
                .padding(20)
            }
        }
    }

    private func guideTopicButton(id: String, title: String, icon: String) -> some View {
        let isSel = selectedGuideTopic == id
        return Button {
            selectedGuideTopic = id
        } label: {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundStyle(isSel ? .swarmGold : .swarmTextTertiary)
                Text(title)
                    .font(.swarm(.xs, weight: isSel ? .semibold : .regular))
                    .foregroundStyle(isSel ? .swarmGold : .swarmTextPrimary)
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background {
                if isSel {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.swarmGold.opacity(0.15))
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func guideDetailSection(title: String, bodyText: String, highlights: [String]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.swarm(.base, weight: .bold))
                .foregroundStyle(.swarmTextPrimary)

            Text(bodyText)
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            VStack(alignment: .leading, spacing: 6) {
                ForEach(highlights, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(.swarmGold)
                            .padding(.top, 2)
                        Text(item)
                            .font(.swarm(.xs))
                            .foregroundStyle(.swarmTextSecondary)
                    }
                }
            }
            .padding(12)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }
        }
    }

    private func shortcutRow(keys: String, action: String) -> some View {
        HStack {
            Text(keys)
                .font(.swarmMono(.xs, weight: .bold))
                .foregroundStyle(.swarmGold)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.swarmCanvas)
                .cornerRadius(4)
                .overlay {
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                }

            Spacer()

            Text(action)
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
        }
        .padding(8)
        .background(Color.swarmSurface)
        .cornerRadius(6)
    }

    // MARK: - Privacy Tab Content

    private var privacyTabContent: some View {
        HStack(spacing: 0) {
            // Privacy Topics Sidebar
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("SECURITY GUARANTEES")
                        .font(.swarmMono(.micro, weight: .bold))
                        .foregroundStyle(.swarmTextTertiary)
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.swarmSurface.opacity(0.2))

                Divider().background(.swarmBorderSubtle)

                VStack(spacing: 3) {
                    privacyTopicButton(id: "local-first", title: "Zero Cloud Middleman", icon: "shield.checkered")
                    privacyTopicButton(id: "keychain", title: "Keychain Encryption", icon: "key.fill")
                    privacyTopicButton(id: "scrubbing", title: "Secret & Token Scrubbing", icon: "eye.slash.fill")
                }
                .padding(8)

                Spacer()
            }
            .frame(width: 240)
            .background(Color.swarmSurface.opacity(0.25))

            Divider().background(.swarmBorderSubtle)

            // Privacy Detail View
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    switch selectedPrivacyTopic {
                    case "local-first":
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Zero Cloud Middleman Guarantee")
                                .font(.swarm(.base, weight: .bold))
                                .foregroundStyle(.swarmTextPrimary)

                            Text("Swarm AI operates on a strict local-first architectural model. The application contains zero remote proxies, zero telemetry loggers, and zero cloud intermediaries.")
                                .font(.swarm(.xs))
                                .foregroundStyle(.swarmTextSecondary)
                                .lineSpacing(3)

                            HStack(spacing: 10) {
                                Image(systemName: "checkmark.shield.fill")
                                    .font(.system(size: 20))
                                    .foregroundStyle(.swarmSuccess)
                                Text("All API calls to Anthropic, OpenAI, or local Ollama servers originate strictly from your localhost machine. Your source code, file trees, and project diffs are never transmitted to any third-party Swarm server.")
                                    .font(.swarm(.xs))
                                    .foregroundStyle(.swarmTextSecondary)
                            }
                            .padding(14)
                            .background(Color.swarmSurface)
                            .cornerRadius(8)
                            .overlay {
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.swarmSuccess.opacity(0.3), lineWidth: 1)
                            }
                        }
                    case "keychain":
                        VStack(alignment: .leading, spacing: 10) {
                            Text("OS-Native Keychain Encryption")
                                .font(.swarm(.base, weight: .bold))
                                .foregroundStyle(.swarmTextPrimary)

                            Text("Your model provider API keys (Anthropic, OpenAI, DeepSeek, Google) are stored directly inside your operating system's native encrypted credential store:")
                                .font(.swarm(.xs))
                                .foregroundStyle(.swarmTextSecondary)

                            VStack(alignment: .leading, spacing: 6) {
                                Text("• macOS: Apple Keychain Services via Security.framework.")
                                Text("• Windows: Windows Data Protection API (DPAPI) and Credential Manager.")
                                Text("• Linux: FreeDesktop Secret Service API via libsecret / GNOME Keyring.")
                            }
                            .font(.swarmMono(.xs))
                            .foregroundStyle(.swarmTextSecondary)
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.swarmSurface)
                            .cornerRadius(8)
                        }
                    case "scrubbing":
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Sensitive Secret & Token Scrubbing")
                                .font(.swarm(.base, weight: .bold))
                                .foregroundStyle(.swarmTextPrimary)

                            Text("Swarm AI's PTY streaming pipeline actively monitors terminal stdout for sensitive patterns before writing to local vector memory or displaying in logs:")
                                .font(.swarm(.xs))
                                .foregroundStyle(.swarmTextSecondary)

                            VStack(alignment: .leading, spacing: 6) {
                                Text("• RSA / SSH Private Keys (-----BEGIN RSA PRIVATE KEY-----)")
                                Text("• JWT Bearer Tokens and Session IDs")
                                Text("• Environment file secrets (.env credentials)")
                            }
                            .font(.swarmMono(.xs))
                            .foregroundStyle(.swarmWarning)
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.swarmSurface)
                            .cornerRadius(8)
                        }
                    default:
                        EmptyView()
                    }
                }
                .padding(20)
            }
        }
    }

    private func privacyTopicButton(id: String, title: String, icon: String) -> some View {
        let isSel = selectedPrivacyTopic == id
        return Button {
            selectedPrivacyTopic = id
        } label: {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundStyle(isSel ? .swarmGold : .swarmTextTertiary)
                Text(title)
                    .font(.swarm(.xs, weight: isSel ? .semibold : .regular))
                    .foregroundStyle(isSel ? .swarmGold : .swarmTextPrimary)
                Spacer()
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background {
                if isSel {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.swarmGold.opacity(0.15))
                }
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Actions

    private func launchPipeline() {
        for subtask in selectedTemplate.subtasks {
            _ = taskStore.createTask(
                title: subtask.title,
                description: subtask.description
            )
        }

        applied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            closeModal()
        }
    }

    private func closeModal() {
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            isPresented = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            isOpen = false
            appState.isTaskTemplatesPresented = false
        }
    }

    // MARK: - All Templates Definition

    public static let allTemplates: [BlueprintTemplate] = [
        BlueprintTemplate(
            id: "bugfix",
            title: "Bug Fix & Verification Workflow",
            category: "Maintenance",
            icon: "ant.fill",
            accentColor: .swarmWarning,
            description: "Multi-agent loop: scout locates root cause, builder implements fix, reviewer verifies regression tests.",
            subtasks: [
                TemplateSubtask(title: "Investigate and isolate bug root cause", role: "Scout", roleColor: .swarmWarning, description: "Search logs, inspect stack trace and identify faulty module."),
                TemplateSubtask(title: "Implement bug fix and regression test", role: "Builder", roleColor: .swarmSuccess, description: "Apply code changes and ensure regression test case passes."),
                TemplateSubtask(title: "Code review & edge case audit", role: "Reviewer", roleColor: .swarmInfo, description: "Check edge cases, type safety, and security impacts.")
            ]
        ),
        BlueprintTemplate(
            id: "feature",
            title: "Full-Stack Feature Implementation",
            category: "Development",
            icon: "sparkles",
            accentColor: .swarmGold,
            description: "End-to-end flow: lead coordinates, builder drafts UI & API, reviewer runs quality & integration checks.",
            subtasks: [
                TemplateSubtask(title: "Architecture breakdown & interface design", role: "Coordinator", roleColor: Color(hex: "#B388FF") ?? .purple, description: "Define data schemas, component contracts, and subtasks."),
                TemplateSubtask(title: "Implement frontend components and styling", role: "Builder", roleColor: .swarmSuccess, description: "Build interactive SwiftUI / React UI matching design specs."),
                TemplateSubtask(title: "Implement backend logic and API endpoints", role: "Builder", roleColor: .swarmSuccess, description: "Connect database, state stores, and backend handlers."),
                TemplateSubtask(title: "End-to-end integration and UX audit", role: "Reviewer", roleColor: .swarmInfo, description: "Test the user flow end to end with zero regressions.")
            ]
        ),
        BlueprintTemplate(
            id: "security",
            title: "Security & Vulnerability Audit",
            category: "Safety",
            icon: "shield.checkered",
            accentColor: .swarmError,
            description: "Deep audit of dependencies, inputs, auth tokens, and file system access points.",
            subtasks: [
                TemplateSubtask(title: "Scan dependencies and package configs", role: "Scout", roleColor: .swarmWarning, description: "Identify outdated or vulnerable dependencies and packages."),
                TemplateSubtask(title: "Review auth flows and input sanitization", role: "Reviewer", roleColor: .swarmInfo, description: "Check SQL injection, XSS, and path traversal attack vectors (SEC-01..05)."),
                TemplateSubtask(title: "Generate audit report and remediation patch", role: "Builder", roleColor: .swarmSuccess, description: "Draft formal security report with targeted patch recommendations.")
            ]
        ),
        BlueprintTemplate(
            id: "refactor",
            title: "Codebase Exploration & Refactoring",
            category: "Architecture",
            icon: "compass.drawing",
            accentColor: .swarmInfo,
            description: "Discover legacy patterns, decouple modules, and optimize compilation speed.",
            subtasks: [
                TemplateSubtask(title: "Analyze dependency graph and circular imports", role: "Scout", roleColor: .swarmWarning, description: "Map out module interdependencies and decouple tight couplings."),
                TemplateSubtask(title: "Refactor core modules to clean abstractions", role: "Builder", roleColor: .swarmSuccess, description: "Extract reusable utilities and improve Swift 6 type-safety."),
                TemplateSubtask(title: "Verify backwards compatibility and benchmarks", role: "Reviewer", roleColor: .swarmInfo, description: "Confirm existing features and tests run without regression.")
            ]
        )
    ]
}
