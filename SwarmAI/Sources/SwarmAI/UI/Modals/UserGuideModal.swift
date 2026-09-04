import SwiftUI
import AppKit

// MARK: - Guide Chapter Model

public struct GuideChapter: Identifiable, Hashable, Sendable {
    public let id: String
    public let title: String
    public let subtitle: String
    public let icon: String
    public let category: String

    public init(id: String, title: String, subtitle: String, icon: String, category: String = "Operation") {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.category = category
    }
}

// MARK: - User Guide Modal

public struct UserGuideModal: View {
    @Binding public var isOpen: Bool
    public var initialChapter: String = "getting-started"

    @Environment(\.appState) private var appState
    @State private var selectedTab: GuideTab = .guide
    @State private var selectedChapterId: String = "getting-started"
    @State private var searchQuery: String = ""
    @State private var isPresented: Bool = false

    public enum GuideTab: String, CaseIterable {
        case guide = "Operational Guide"
        case privacy = "Privacy & Security"
    }

    public init(isOpen: Binding<Bool> = .constant(true), initialChapter: String = "getting-started") {
        self._isOpen = isOpen
        self.initialChapter = initialChapter
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

                // Body: Chapter List Sidebar + Rich Content View
                HStack(spacing: 0) {
                    sidebarNavView
                        .frame(width: 280)

                    Divider().background(.swarmBorderSubtle)

                    contentAreaView
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
        .onKeyPress(.escape) {
            closeModal()
            return .handled
        }
        .onAppear {
            selectedChapterId = initialChapter
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

                Image(systemName: selectedTab == .guide ? "book.fill" : "lock.shield.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.swarmGold)
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text(selectedTab == .guide ? "SwarmAI Comprehensive User Manual" : "Privacy Policy & Security Guarantees")
                        .font(.swarm(.base, weight: .bold))
                        .foregroundStyle(.swarmTextPrimary)

                    Text("v0.1.0 PRO")
                        .font(.swarmMono(.micro, weight: .bold))
                        .foregroundStyle(.swarmGold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.swarmGold.opacity(0.12))
                        .cornerRadius(4)
                }

                Text(selectedTab == .guide ? "Interactive architectural blueprint and operational manual for multi-agent workflows" : "Local-first data ownership, zero-telemetry architecture, and encrypted secrets storage")
                    .font(.swarm(.xs))
                    .foregroundStyle(.swarmTextTertiary)
            }

            Spacer()

            // Tab Switcher
            Picker("", selection: $selectedTab) {
                ForEach(GuideTab.allCases, id: \.self) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 240)

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

    // MARK: - Sidebar Navigation View

    private var sidebarNavView: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Search field
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 12))
                    .foregroundStyle(.swarmTextTertiary)
                TextField("Search manual...", text: $searchQuery)
                    .font(.swarm(.xs))
                    .textFieldStyle(.plain)
                    .foregroundStyle(.swarmTextPrimary)
                if !searchQuery.isEmpty {
                    Button {
                        searchQuery = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.swarmTextTertiary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(Color.swarmSurface)
            .cornerRadius(6)
            .padding(10)

            Divider().background(.swarmBorderSubtle)

            ScrollView {
                VStack(spacing: 3) {
                    if selectedTab == .guide {
                        ForEach(filteredChapters) { chapter in
                            let isSel = selectedChapterId == chapter.id
                            Button {
                                selectedChapterId = chapter.id
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: chapter.icon)
                                        .font(.system(size: 13))
                                        .foregroundStyle(isSel ? .swarmGold : .swarmTextTertiary)
                                        .frame(width: 20)

                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(chapter.title)
                                            .font(.swarm(.xs, weight: isSel ? .bold : .medium))
                                            .foregroundStyle(isSel ? .swarmGold : .swarmTextPrimary)
                                            .lineLimit(1)

                                        Text(chapter.subtitle)
                                            .font(.swarmMono(.micro))
                                            .foregroundStyle(.swarmTextTertiary)
                                            .lineLimit(1)
                                    }

                                    Spacer()
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background {
                                    if isSel {
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(Color.swarmGold.opacity(0.15))
                                            .overlay {
                                                RoundedRectangle(cornerRadius: 6)
                                                    .stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
                                            }
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    } else {
                        // Privacy topics
                        ForEach(Self.privacyChapters) { chapter in
                            let isSel = selectedChapterId == chapter.id
                            Button {
                                selectedChapterId = chapter.id
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: chapter.icon)
                                        .font(.system(size: 13))
                                        .foregroundStyle(isSel ? .swarmSuccess : .swarmTextTertiary)
                                        .frame(width: 20)

                                    VStack(alignment: .leading, spacing: 1) {
                                        Text(chapter.title)
                                            .font(.swarm(.xs, weight: isSel ? .bold : .medium))
                                            .foregroundStyle(isSel ? .swarmSuccess : .swarmTextPrimary)
                                            .lineLimit(1)

                                        Text(chapter.subtitle)
                                            .font(.swarmMono(.micro))
                                            .foregroundStyle(.swarmTextTertiary)
                                            .lineLimit(1)
                                    }

                                    Spacer()
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background {
                                    if isSel {
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(Color.swarmSuccess.opacity(0.15))
                                            .overlay {
                                                RoundedRectangle(cornerRadius: 6)
                                                    .stroke(Color.swarmSuccess.opacity(0.35), lineWidth: 1)
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

    // MARK: - Content Area View

    private var contentAreaView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if selectedTab == .guide {
                    switch selectedChapterId {
                    case "getting-started":
                        gettingStartedChapter
                    case "architecture":
                        architectureChapter
                    case "lead-modes":
                        leadModesChapter
                    case "worktrees":
                        worktreesChapter
                    case "pheromone":
                        pheromoneMemoryChapter
                    case "voice":
                        voiceCommandsChapter
                    case "canvas":
                        flowCanvasChapter
                    case "shortcuts":
                        keyboardShortcutsChapter
                    default:
                        gettingStartedChapter
                    }
                } else {
                    switch selectedChapterId {
                    case "privacy-local":
                        privacyLocalFirstChapter
                    case "privacy-keychain":
                        privacyKeychainChapter
                    case "privacy-scrubbing":
                        privacyScrubbingChapter
                    default:
                        privacyLocalFirstChapter
                    }
                }
            }
            .padding(24)
        }
        .background(Color.swarmCanvas)
    }

    // MARK: - Guide Chapters Detail Views

    private var gettingStartedChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "1. Getting Started & Hive Setup", badge: "Setup")

            Text("Swarm AI transforms isolated AI CLI coding tools (Claude Code, OpenAI Codex, OpenCode, Aider, Cursor, Antigravity) into a synchronized parallel swarm that shares memory and coordinates work without merge collisions.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            VStack(alignment: .leading, spacing: 10) {
                Text("3-Step Quick Launch Workflow:")
                    .font(.swarmMono(.xs, weight: .bold))
                    .foregroundStyle(.swarmGold)

                stepCard(number: 1, title: "Bind Local Project Repository", desc: "Open any git repository using Cmd+O or the Top Logo Menu. Swarm AI auto-scaffolds the .pheromone/ directory containing project.md, architecture.md, decisions.md, and vector database.")
                stepCard(number: 2, title: "Spawn Worker Agents", desc: "Use the + Agent button in the Tab Strip or press Cmd+K to launch CLI agents into native PTY terminal panes with real-time streaming.")
                stepCard(number: 3, title: "Dispatch Strategic Directives", desc: "Enter your goal in the Lead panel or Flow Hub. Lead breaks down tasks, assigns roles, locks file scopes, and dispatches parallel worktrees.")
            }

            infoCallout(
                title: "Zero Setup Required",
                text: "Swarm AI auto-discovers global npm packages, PATH binaries, and MCP configurations on macOS. No background daemons or external servers are necessary.",
                color: .swarmSuccess
            )
        }
    }

    private var architectureChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "2. Swarm Architecture & Purity Boundary", badge: "Architecture")

            Text("Swarm AI is engineered around a strict ports-and-adapters architecture with self-enforcing purity boundaries. The core orchestration and state machines remain pure and decoupled from filesystem and process drivers.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            VStack(spacing: 8) {
                archLayerCard(layer: "User Interaction Layer", desc: "Goal Input → Lead Planner → SwarmMind Orchestrator → Agent Panes", color: .swarmGold)
                archLayerCard(layer: "Presentation & State", desc: "Native SwiftUI macOS Engine + @Observable State Stores", color: .swarmInfo)
                archLayerCard(layer: "Native Driver Layer", desc: "POSIX PTY (openpty), Process Spawner, SQLite3, URLSession", color: .swarmWarning)
                archLayerCard(layer: "Shared Memory (Pheromone)", desc: "SQLite + FTS5 BM25 + 384-dim Char N-Gram Vectors + RRF Fusion (k=60)", color: .swarmSuccess)
            }
        }
    }

    private var leadModesChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "3. Lead Agent Operating Modes", badge: "Lead Engine")

            Text("The Lead agent operates in three distinct modes, each configured with specific prompt directives and tool privileges:")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)

            VStack(spacing: 10) {
                modeCard(
                    title: "Steward (Strategic Planner)",
                    role: "Mutating + Read Tools",
                    desc: "Analyzes prompt directives, loads architecture & conventions from Pheromone, breaks goals into task cards with 'owns' / 'reads' / 'dependsOn' sets, and dispatches to SwarmMind.",
                    color: .swarmGold
                )
                modeCard(
                    title: "Forager (Autonomous Bug Hunter)",
                    role: "Read-Only Tools",
                    desc: "Proactively scans codebase AST and logs, investigates edge cases, detects regression risks, and drafts detailed bug reproduction reports.",
                    color: .swarmInfo
                )
                modeCard(
                    title: "Stinger (Security Auditor)",
                    role: "Read-Only Tools",
                    desc: "Executes 5-check security audits (SEC-01 through SEC-05) covering dependency vulnerabilities, SQL injection, XSS vectors, path traversal, and sensitive credential exposure.",
                    color: .swarmError
                )
            }
        }
    }

    private var worktreesChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "4. Git Worktrees & 3-Way Merge Concurrency", badge: "Worktrees")

            Text("Swarm AI achieves safe parallel multi-agent development by provisioning ephemeral git worktrees under .swarm/worktrees/<task-id>. Agents never overwrite each other's working directory.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            VStack(alignment: .leading, spacing: 8) {
                Text("Concurrency Guarantees:")
                    .font(.swarmMono(.xs, weight: .bold))
                    .foregroundStyle(.swarmGold)

                bulletItem(title: "File Ownership Locks:", text: "When a task launches, file paths in its 'owns' declaration are locked. Any conflicting task is sequenced until locks are released.")
                bulletItem(title: "In-Memory 3-Way Dry Run:", text: "Before merging back to main, SwarmMind executes git merge-tree dry-run validation to verify 100% clean mergeability.")
                bulletItem(title: "Atomic Cleanup:", text: "Upon merge approval, worktree directory is unlinked and branches are pruned with zero git history pollution.")
            }
            .padding(14)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }
        }
    }

    private var pheromoneMemoryChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "5. Pheromone Hybrid Vector Memory", badge: "Memory")

            Text("Pheromone provides shared cross-agent memory combining keyword and semantic vector search:")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)

            VStack(spacing: 8) {
                featureBox(title: "SQLite + FTS5 BM25", desc: "Full-text search indexed across .pheromone/memory/*.md files (architecture, conventions, decisions, bugs).", icon: "magnifyingglass")
                featureBox(title: "Deterministic 384-Dim Embeddings", desc: "Trigram, bigram, and unigram character n-gram embeddings calculated locally with zero external network calls.", icon: "brain")
                featureBox(title: "Reciprocal Rank Fusion (k=60)", desc: "Merges BM25 keyword rankings with vector cosine similarity scores into a single unified relevance ranking.", icon: "arrow.triangle.merge")
                featureBox(title: "Token-Budgeted Context Injection", desc: "Injects relevant memory chunks into agent sessions up to a strict token budget cap.", icon: "chart.bar.fill")
            }
        }
    }

    private var voiceCommandsChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "6. Offline Voice Commands & Local STT", badge: "Voice")

            Text("Swarm AI includes fully offline speech-to-text powered by local whisper.cpp models. Voice audio is processed entirely on-device without sending voice data over the internet.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            VStack(alignment: .leading, spacing: 8) {
                Text("Supported Voice Modes:")
                    .font(.swarmMono(.xs, weight: .bold))
                    .foregroundStyle(.swarmGold)

                bulletItem(title: "Dictation Mode:", text: "Transcribes spoken audio, optionally cleans up punctuation, and injects directly into the active terminal field.")
                bulletItem(title: "Voice Command Mode:", text: "Transcribes spoken prompt and sends it directly as a mission directive to Lead Steward.")
            }
            .padding(14)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }
        }
    }

    private var flowCanvasChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "7. Infinite Flow Canvas & Synapses", badge: "Flow Canvas")

            Text("The Flow Canvas provides spatial awareness of your entire swarm. Pan, zoom, rearrange agent cards, and connect synapses to construct custom pipelines.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Image(systemName: "dot.radiowaves.left.and.right")
                            .foregroundStyle(.swarmGold)
                        Text("Broadcast All Mode")
                            .font(.swarm(.xs, weight: .bold))
                            .foregroundStyle(.swarmTextPrimary)
                    }
                    Text("Broadcasts input prompt concurrently to all active worker panes.")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.swarmSurface)
                .cornerRadius(8)
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                }

                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.triangle.branch")
                            .foregroundStyle(.swarmInfo)
                        Text("Wire Pipeline Mode")
                            .font(.swarm(.xs, weight: .bold))
                            .foregroundStyle(.swarmTextPrimary)
                    }
                    Text("Follows drawn wire synapse edges, streaming output of agent A into agent B.")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.swarmSurface)
                .cornerRadius(8)
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                }
            }
        }
    }

    private var keyboardShortcutsChapter: some View {
        VStack(alignment: .leading, spacing: 12) {
            chapterHeading(title: "8. Keyboard Shortcuts Cheatsheet", badge: "Shortcuts")

            VStack(spacing: 4) {
                shortcutRow(keys: "⌘K", action: "Open Unified Command Palette")
                shortcutRow(keys: "⌘Enter", action: "Dispatch Mission to Active Swarm")
                shortcutRow(keys: "Space + Drag", action: "Smoothly Pan Flow Canvas")
                shortcutRow(keys: "⌘1 .. ⌘9", action: "Focus specific Agent Terminal Pane")
                shortcutRow(keys: "⌘0", action: "Reset Flow Canvas Camera to 100%")
                shortcutRow(keys: "⌘B", action: "Toggle Left Navigation Sidebar")
                shortcutRow(keys: "⌘\\", action: "Toggle Right Inspection Dock")
                shortcutRow(keys: "⌘,", action: "Open SwarmAI Settings Modal")
                shortcutRow(keys: "⌘Shift+T", action: "Cycle Theme Color Palettes")
            }
        }
    }

    // MARK: - Privacy Chapters Detail Views

    private var privacyLocalFirstChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "Zero Cloud Middleman Guarantee", badge: "Local-First")

            Text("Swarm AI operates on a strict local-first architectural model. The application contains zero remote proxies, zero telemetry loggers, and zero cloud intermediaries.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            infoCallout(
                title: "Direct Localhost-to-Provider Sockets",
                text: "All API calls to Anthropic, OpenAI, or local Ollama servers originate strictly from your localhost machine. Your source code, file trees, and project diffs are never transmitted to any third-party Swarm server.",
                color: .swarmSuccess
            )
        }
    }

    private var privacyKeychainChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "OS-Native Keychain Encryption", badge: "Security")

            Text("Your model provider API keys (Anthropic, OpenAI, DeepSeek, Google) are stored directly inside Apple Keychain Services via Security.framework on macOS.")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)

            VStack(alignment: .leading, spacing: 6) {
                Text("• Zero plaintext keys saved in configuration files.")
                Text("• Keys are decrypted only at memory runtime during active agent API calls.")
                Text("• Memory buffers are securely scrubbed upon agent termination.")
            }
            .font(.swarmMono(.xs))
            .foregroundStyle(.swarmTextSecondary)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmBorderSubtle, lineWidth: 1)
            }
        }
    }

    private var privacyScrubbingChapter: some View {
        VStack(alignment: .leading, spacing: 14) {
            chapterHeading(title: "Sensitive Secret & Token Scrubbing", badge: "Data Protection")

            Text("Swarm AI's PTY streaming pipeline actively monitors terminal stdout for sensitive patterns before writing to local vector memory or displaying in logs:")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmTextSecondary)

            VStack(alignment: .leading, spacing: 6) {
                Text("• RSA / SSH Private Keys (-----BEGIN RSA PRIVATE KEY-----)")
                Text("• JWT Bearer Tokens and Session IDs")
                Text("• Environment file secrets (.env credentials)")
                Text("• Database connection strings (postgresql://, mongodb://)")
            }
            .font(.swarmMono(.xs))
            .foregroundStyle(.swarmWarning)
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.swarmSurface)
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmWarning.opacity(0.3), lineWidth: 1)
            }
        }
    }

    // MARK: - Reusable UI Components

    private func chapterHeading(title: String, badge: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(badge.uppercased())
                .font(.swarmMono(.micro, weight: .bold))
                .foregroundStyle(.swarmGold)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.swarmGold.opacity(0.12))
                .cornerRadius(4)

            Text(title)
                .font(.swarm(.lg, weight: .bold))
                .foregroundStyle(.swarmTextPrimary)
        }
    }

    private func stepCard(number: Int, title: String, desc: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            ZStack {
                Circle()
                    .fill(Color.swarmGold.opacity(0.15))
                    .frame(width: 26, height: 26)
                Text("\(number)")
                    .font(.swarmMono(.xs, weight: .bold))
                    .foregroundStyle(.swarmGold)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.swarm(.xs, weight: .bold))
                    .foregroundStyle(.swarmTextPrimary)
                Text(desc)
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                    .lineSpacing(2)
            }
        }
        .padding(10)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func archLayerCard(layer: String, desc: String, color: Color) -> some View {
        HStack {
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 4, height: 28)

            VStack(alignment: .leading, spacing: 1) {
                Text(layer)
                    .font(.swarmMono(.xs, weight: .bold))
                    .foregroundStyle(color)
                Text(desc)
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextSecondary)
            }
            Spacer()
        }
        .padding(10)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func modeCard(title: String, role: String, desc: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.swarm(.xs, weight: .bold))
                    .foregroundStyle(color)
                Spacer()
                Text(role)
                    .font(.swarmMono(.micro, weight: .bold))
                    .foregroundStyle(color)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(color.opacity(0.12))
                    .cornerRadius(4)
            }
            Text(desc)
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(2)
        }
        .padding(12)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(color.opacity(0.3), lineWidth: 1)
        }
    }

    private func bulletItem(title: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•")
                .font(.swarmMono(.xs, weight: .bold))
                .foregroundStyle(.swarmGold)
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.swarm(.xs, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                Text(text)
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                    .lineSpacing(2)
            }
        }
    }

    private func featureBox(title: String, desc: String, icon: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(.swarmGold)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.swarm(.xs, weight: .bold))
                    .foregroundStyle(.swarmTextPrimary)
                Text(desc)
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextSecondary)
            }
            Spacer()
        }
        .padding(10)
        .background(Color.swarmSurface)
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    private func infoCallout(title: String, text: String, color: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 16))
                .foregroundStyle(color)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.swarm(.xs, weight: .bold))
                    .foregroundStyle(.swarmTextPrimary)
                Text(text)
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                    .lineSpacing(2)
            }
        }
        .padding(12)
        .background(color.opacity(0.08))
        .cornerRadius(8)
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(color.opacity(0.25), lineWidth: 1)
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

    // MARK: - Footer View

    private var footerView: some View {
        HStack {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.swarmSuccess)
                Text("Operational manual embedded • Press Esc to close")
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextTertiary)
            }

            Spacer()

            Button {
                closeModal()
            } label: {
                Text("Close Manual")
                    .font(.swarm(.xs, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
                    .overlay {
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                    }
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(Color.swarmSurface.opacity(0.3))
    }

    // MARK: - Helpers

    private func closeModal() {
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            isPresented = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            isOpen = false
            appState.isUserGuidePresented = false
        }
    }

    private var filteredChapters: [GuideChapter] {
        if searchQuery.isEmpty { return Self.allChapters }
        return Self.allChapters.filter {
            $0.title.localizedCaseInsensitiveContains(searchQuery) ||
            $0.subtitle.localizedCaseInsensitiveContains(searchQuery)
        }
    }

    // MARK: - All Chapters Definitions

    public static let allChapters: [GuideChapter] = [
        GuideChapter(id: "getting-started", title: "Quickstart & Hive Setup", subtitle: "3-step launch & project binding", icon: "bolt.fill"),
        GuideChapter(id: "architecture", title: "Swarm Architecture", subtitle: "Purity boundary & ports/adapters", icon: "square.3.layers.3d.down.right"),
        GuideChapter(id: "lead-modes", title: "Lead Agent Modes", subtitle: "Steward, Forager, Stinger", icon: "brain.head.profile"),
        GuideChapter(id: "worktrees", title: "Git Worktrees & 3-Way Merge", subtitle: "Ephemeral multi-agent isolation", icon: "arrow.triangle.branch"),
        GuideChapter(id: "pheromone", title: "Pheromone Vector Memory", subtitle: "SQLite FTS5 + 384-dim RRF", icon: "memorychip"),
        GuideChapter(id: "voice", title: "Voice Commands & Offline STT", subtitle: "Local whisper.cpp dictation", icon: "waveform"),
        GuideChapter(id: "canvas", title: "Flow Canvas & Synapses", subtitle: "Spatial visual orchestration", icon: "network"),
        GuideChapter(id: "shortcuts", title: "Keyboard Shortcuts", subtitle: "Quick navigation cheatsheet", icon: "command")
    ]

    public static let privacyChapters: [GuideChapter] = [
        GuideChapter(id: "privacy-local", title: "Zero Cloud Middleman", subtitle: "Localhost direct sockets", icon: "shield.checkered", category: "Privacy"),
        GuideChapter(id: "privacy-keychain", title: "OS Keychain Encryption", subtitle: "Apple Keychain Services", icon: "key.fill", category: "Privacy"),
        GuideChapter(id: "privacy-scrubbing", title: "Secret & Token Scrubbing", subtitle: "PTY stdout pattern filtering", icon: "eye.slash.fill", category: "Privacy")
    ]
}
