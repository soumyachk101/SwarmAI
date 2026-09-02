import SwiftUI
import AppKit

// MARK: - GitHub Release Models

public struct GitHubReleaseAsset: Identifiable, Hashable, Sendable, Codable {
    public let id: Int
    public let name: String
    public let size: Int
    public let browserDownloadUrl: String
    public var platformLabel: String
    public var isCurrentPlatform: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case size
        case browserDownloadUrl = "browser_download_url"
    }

    public init(
        id: Int,
        name: String,
        size: Int,
        browserDownloadUrl: String,
        platformLabel: String = "Installer",
        isCurrentPlatform: Bool = false
    ) {
        self.id = id
        self.name = name
        self.size = size
        self.browserDownloadUrl = browserDownloadUrl
        self.platformLabel = platformLabel
        self.isCurrentPlatform = isCurrentPlatform
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        size = try container.decode(Int.self, forKey: .size)
        browserDownloadUrl = try container.decode(String.self, forKey: .browserDownloadUrl)
        platformLabel = "Installer"
        isCurrentPlatform = false
    }
}

public struct GitHubReleaseInfo: Identifiable, Hashable, Sendable, Codable {
    public var id: String { tagName }
    public let tagName: String
    public let name: String?
    public let body: String?
    public let publishedAt: String?
    public let htmlUrl: String?
    public var assets: [GitHubReleaseAsset]

    enum CodingKeys: String, CodingKey {
        case tagName = "tag_name"
        case name
        case body
        case publishedAt = "published_at"
        case htmlUrl = "html_url"
        case assets
    }

    public init(
        tagName: String,
        name: String? = nil,
        body: String? = nil,
        publishedAt: String? = nil,
        htmlUrl: String? = nil,
        assets: [GitHubReleaseAsset] = []
    ) {
        self.tagName = tagName
        self.name = name
        self.body = body
        self.publishedAt = publishedAt
        self.htmlUrl = htmlUrl
        self.assets = assets
    }
}

// MARK: - Update Checker Modal

public struct UpdateCheckerModal: View {
    @Binding public var isOpen: Bool

    public static let currentAppVersion = "0.1.0"
    public static let githubRepo = "soumyachk101/SwarmAI"

    @State private var isChecking: Bool = false
    @State private var isDownloading: Bool = false
    @State private var downloadProgressText: String? = nil
    @State private var downloadPercent: Double = 0.0
    @State private var hasUpdate: Bool = false
    @State private var latestRelease: GitHubReleaseInfo? = nil
    @State private var matchedAsset: GitHubReleaseAsset? = nil
    @State private var errorMessage: String? = nil
    @State private var lastCheckedDate: Date? = nil
    @State private var showOtherPlatforms: Bool = false
    @State private var isPresented: Bool = false

    public init(isOpen: Binding<Bool> = .constant(true)) {
        self._isOpen = isOpen
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

                // Scrollable Content
                ScrollView {
                    VStack(spacing: 16) {
                        statusBannerView

                        if let asset = matchedAsset {
                            detectedPlatformCard(asset: asset)
                        }

                        if let body = latestRelease?.body, !body.isEmpty {
                            changelogSection(body: body)
                        }

                        if otherAssets.count > 0 {
                            otherPlatformsSection
                        }
                    }
                    .padding(20)
                }

                Divider().background(.swarmBorderSubtle)
                footerView
            }
            .frame(width: 580, height: 560)
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
            withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                isPresented = true
            }
            checkForUpdates()
        }
    }

    // MARK: - Header View

    private var headerView: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.swarmGold.opacity(0.15))
                    .frame(width: 36, height: 36)
                    .overlay {
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
                    }

                Image(systemName: "sparkles")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.swarmGold)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("SwarmAI Updates")
                    .font(.swarm(.sm, weight: .bold))
                    .foregroundStyle(.swarmTextPrimary)

                HStack(spacing: 6) {
                    Text("Current:")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                    Text("v\(Self.currentAppVersion)")
                        .font(.swarmMono(.micro, weight: .bold))
                        .foregroundStyle(.swarmGold)
                    Text("•")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                    Text(detectedPlatformName)
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                }
            }

            Spacer()

            Button {
                checkForUpdates()
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 12))
                    .foregroundStyle(.swarmTextSecondary)
                    .rotationEffect(.degrees(isChecking ? 360 : 0))
                    .animation(isChecking ? .linear(duration: 0.8).repeatForever(autoreverses: false) : .default, value: isChecking)
                    .frame(width: 28, height: 28)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
            .disabled(isChecking || isDownloading)
            .help("Check again for updates")

            Button {
                closeModal()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.swarmTextTertiary)
                    .frame(width: 28, height: 28)
                    .background(Color.swarmSurface)
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.swarmSurface.opacity(0.4))
    }

    // MARK: - Status Banner View

    @ViewBuilder
    private var statusBannerView: some View {
        if isChecking {
            HStack(spacing: 12) {
                ProgressView()
                    .scaleEffect(0.85)
                VStack(alignment: .leading, spacing: 1) {
                    Text("Checking for updates...")
                        .font(.swarm(.xs, weight: .semibold))
                        .foregroundStyle(.swarmGold)
                    Text("Connecting to GitHub Releases server (api.github.com)")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }
                Spacer()
            }
            .padding(12)
            .background(Color.swarmGold.opacity(0.08))
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmGold.opacity(0.25), lineWidth: 1)
            }
        } else if let err = errorMessage {
            HStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(.swarmError)
                VStack(alignment: .leading, spacing: 1) {
                    Text("Update Check Notice")
                        .font(.swarm(.xs, weight: .semibold))
                        .foregroundStyle(.swarmError)
                    Text(err)
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                }
                Spacer()
            }
            .padding(12)
            .background(Color.swarmError.opacity(0.08))
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmError.opacity(0.25), lineWidth: 1)
            }
        } else if hasUpdate {
            HStack(spacing: 12) {
                Image(systemName: "arrow.down.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(.swarmGold)
                VStack(alignment: .leading, spacing: 1) {
                    Text("New Version Available: \(latestRelease?.tagName ?? "Latest")")
                        .font(.swarm(.xs, weight: .bold))
                        .foregroundStyle(.swarmGold)
                    Text("A newer release of SwarmAI is available for download.")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                }
                Spacer()
            }
            .padding(12)
            .background(Color.swarmGold.opacity(0.12))
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
            }
        } else {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(.swarmSuccess)
                VStack(alignment: .leading, spacing: 1) {
                    Text("You are on the latest version!")
                        .font(.swarm(.xs, weight: .bold))
                        .foregroundStyle(.swarmSuccess)
                    Text("SwarmAI v\(Self.currentAppVersion) is currently up to date.")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                }
                Spacer()
            }
            .padding(12)
            .background(Color.swarmSuccess.opacity(0.08))
            .cornerRadius(8)
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.swarmSuccess.opacity(0.25), lineWidth: 1)
            }
        }
    }

    // MARK: - Detected Platform Card

    private func detectedPlatformCard(asset: GitHubReleaseAsset) -> some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.swarmGold.opacity(0.15))
                        .frame(width: 42, height: 42)
                        .overlay {
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
                        }

                    Image(systemName: iconForAsset(asset.name))
                        .font(.system(size: 18))
                        .foregroundStyle(.swarmGold)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(asset.platformLabel)
                            .font(.swarm(.xs, weight: .bold))
                            .foregroundStyle(.swarmTextPrimary)

                        Text("AUTO-DETECTED")
                            .font(.swarmMono(.micro, weight: .bold))
                            .foregroundStyle(.swarmSuccess)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.swarmSuccess.opacity(0.12))
                            .cornerRadius(3)
                    }

                    Text("\(asset.name) • \(formatBytes(asset.size))")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }

                Spacer()

                Button {
                    startDirectDownload(asset: asset)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: isDownloading ? "arrow.triangle.2.circlepath" : "arrow.down.circle.fill")
                        Text(isDownloading ? "Downloading..." : (hasUpdate ? "Update Now" : "Download DMG"))
                    }
                    .font(.swarm(.xs, weight: .bold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(Color.swarmGold)
                    .cornerRadius(6)
                    .shadow(color: .swarmGold.opacity(0.3), radius: 6, x: 0, y: 2)
                }
                .buttonStyle(.plain)
                .disabled(isDownloading)
            }

            // Download Progress Bar
            if let progress = downloadProgressText {
                VStack(spacing: 4) {
                    HStack {
                        Text(progress)
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmGold)
                        Spacer()
                        Text(String(format: "%.0f%%", downloadPercent * 100))
                            .font(.swarmMono(.micro, weight: .bold))
                            .foregroundStyle(.swarmGold)
                    }

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.swarmCanvas)
                                .frame(height: 6)

                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color.swarmGold)
                                .frame(width: geo.size.width * CGFloat(downloadPercent), height: 6)
                        }
                    }
                    .frame(height: 6)
                }
                .padding(10)
                .background(Color.swarmCanvas.opacity(0.7))
                .cornerRadius(6)
            }
        }
        .padding(14)
        .background(Color.swarmSurface)
        .cornerRadius(10)
        .overlay {
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        }
    }

    // MARK: - Changelog Section

    private func changelogSection(body: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("RELEASE NOTES & CHANGELOG:")
                .font(.swarmMono(.micro, weight: .bold))
                .foregroundStyle(.swarmTextTertiary)

            Text(body)
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextSecondary)
                .lineSpacing(3)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.swarmSurface.opacity(0.5))
                .cornerRadius(8)
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                }
        }
    }

    // MARK: - Other Platforms Section

    private var otherPlatformsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showOtherPlatforms.toggle()
                }
            } label: {
                HStack {
                    Text("Other Platform Packages (\(otherAssets.count))")
                        .font(.swarm(.xs, weight: .medium))
                        .foregroundStyle(.swarmTextTertiary)
                    Spacer()
                    Image(systemName: showOtherPlatforms ? "chevron.up" : "chevron.down")
                        .font(.system(size: 11))
                        .foregroundStyle(.swarmTextTertiary)
                }
            }
            .buttonStyle(.plain)

            if showOtherPlatforms {
                VStack(spacing: 6) {
                    ForEach(otherAssets) { asset in
                        HStack {
                            Image(systemName: iconForAsset(asset.name))
                                .font(.system(size: 13))
                                .foregroundStyle(.swarmTextSecondary)
                                .frame(width: 20)

                            VStack(alignment: .leading, spacing: 1) {
                                Text(asset.name)
                                    .font(.swarmMono(.micro, weight: .semibold))
                                    .foregroundStyle(.swarmTextPrimary)
                                    .lineLimit(1)
                                Text(asset.platformLabel)
                                    .font(.swarm(.micro))
                                    .foregroundStyle(.swarmTextTertiary)
                            }

                            Spacer()

                            Button {
                                startDirectDownload(asset: asset)
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: "arrow.down")
                                    Text("Download")
                                }
                                .font(.swarmMono(.micro, weight: .semibold))
                                .foregroundStyle(.swarmGold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.swarmSurface)
                                .cornerRadius(4)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(8)
                        .background(Color.swarmSurface.opacity(0.4))
                        .cornerRadius(6)
                    }
                }
            }
        }
        .padding(.top, 4)
    }

    // MARK: - Footer View

    private var footerView: some View {
        HStack {
            if let date = lastCheckedDate {
                Text("Last checked at \(formattedTime(date))")
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextTertiary)
            }

            Spacer()

            Button {
                if let url = URL(string: "https://github.com/\(Self.githubRepo)/releases") {
                    NSWorkspace.shared.open(url)
                }
            } label: {
                HStack(spacing: 4) {
                    Text("GitHub Releases")
                    Image(systemName: "arrow.up.right.square")
                }
                .font(.swarm(.micro, weight: .semibold))
                .foregroundStyle(.swarmGold)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.swarmSurface.opacity(0.3))
    }

    // MARK: - Update Check & Download Logic

    private func checkForUpdates() {
        isChecking = true
        errorMessage = nil

        guard let url = URL(string: "https://api.github.com/repos/\(Self.githubRepo)/releases/latest") else {
            isChecking = false
            return
        }

        var request = URLRequest(url: url)
        request.setValue("application/vnd.github.v3+json", forHTTPHeaderField: "Accept")
        request.setValue("SwarmAI-macOS", forHTTPHeaderField: "User-Agent")

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isChecking = false
                self.lastCheckedDate = Date()

                if let httpRes = response as? HTTPURLResponse, httpRes.statusCode == 404 {
                    self.hasUpdate = false
                    self.latestRelease = GitHubReleaseInfo(
                        tagName: "v\(Self.currentAppVersion)",
                        name: "SwarmAI v\(Self.currentAppVersion) (Current)",
                        body: "You are running the latest version of SwarmAI."
                    )
                    return
                }

                guard let data = data, error == nil else {
                    self.errorMessage = error?.localizedDescription ?? "Failed to connect to GitHub update server."
                    // Populate local demo latest for fallback display
                    self.latestRelease = GitHubReleaseInfo(
                        tagName: "v\(Self.currentAppVersion)",
                        name: "SwarmAI v\(Self.currentAppVersion)",
                        body: "• Native Swift 6 + SwiftUI macOS engine\n• Real-time POSIX PTY streaming\n• Pheromone SQLite vector memory engine\n• Multi-agent git worktrees & 3-way merge validation"
                    )
                    return
                }

                do {
                    var release = try JSONDecoder().decode(GitHubReleaseInfo.self, from: data)

                    // Classify asset platform labels
                    for idx in 0..<release.assets.count {
                        let name = release.assets[idx].name.lowercased()
                        if name.hasSuffix(".dmg") {
                            if name.contains("arm64") || name.contains("aarch64") || name == "swarmai.dmg" {
                                release.assets[idx].platformLabel = "macOS (Apple Silicon)"
                                release.assets[idx].isCurrentPlatform = true
                            } else {
                                release.assets[idx].platformLabel = "macOS (Intel)"
                                release.assets[idx].isCurrentPlatform = false
                            }
                        } else if name.hasSuffix(".exe") || name.hasSuffix(".msi") {
                            release.assets[idx].platformLabel = "Windows"
                        } else if name.hasSuffix(".deb") || name.hasSuffix(".appimage") {
                            release.assets[idx].platformLabel = "Linux"
                        }
                    }

                    let cleanRemote = release.tagName.replacingOccurrences(of: "v", with: "").trimmingCharacters(in: .whitespaces)
                    let isNewer = compareVersions(current: Self.currentAppVersion, latest: cleanRemote)

                    self.latestRelease = release
                    self.hasUpdate = isNewer
                    self.matchedAsset = release.assets.first(where: { $0.isCurrentPlatform }) ?? release.assets.first
                } catch {
                    self.errorMessage = "Failed to parse release response: \(error.localizedDescription)"
                }
            }
        }.resume()
    }

    private func startDirectDownload(asset: GitHubReleaseAsset) {
        guard let downloadUrl = URL(string: asset.browserDownloadUrl) else { return }

        isDownloading = true
        downloadPercent = 0.1
        downloadProgressText = "Downloading \(asset.name)..."

        let destinationDir = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!
        let destinationUrl = destinationDir.appendingPathComponent(asset.name)

        let session = URLSession(configuration: .default)
        let downloadTask = session.downloadTask(with: downloadUrl) { tempUrl, response, error in
            DispatchQueue.main.async {
                self.isDownloading = false

                if let temp = tempUrl {
                    try? FileManager.default.removeItem(at: destinationUrl)
                    do {
                        try FileManager.default.moveItem(at: temp, to: destinationUrl)
                        self.downloadPercent = 1.0
                        self.downloadProgressText = "Downloaded to Downloads folder!"

                        // Reveal in Finder
                        NSWorkspace.shared.activateFileViewerSelecting([destinationUrl])
                    } catch {
                        self.downloadProgressText = "Saved: \(destinationUrl.path)"
                    }
                } else {
                    // Fallback to opening browser link directly
                    self.downloadProgressText = "Opening download in browser..."
                    NSWorkspace.shared.open(downloadUrl)
                }
            }
        }

        downloadTask.resume()
    }

    private func compareVersions(current: String, latest: String) -> Bool {
        let cur = current.split(separator: ".").compactMap { Int($0) }
        let lat = latest.split(separator: ".").compactMap { Int($0) }

        for i in 0..<max(cur.count, lat.count) {
            let c = i < cur.count ? cur[i] : 0
            let l = i < lat.count ? lat[i] : 0
            if l > c { return true }
            if l < c { return false }
        }
        return false
    }

    private var otherAssets: [GitHubReleaseAsset] {
        guard let latest = latestRelease else { return [] }
        return latest.assets.filter { $0.id != matchedAsset?.id }
    }

    private var detectedPlatformName: String {
        #if arch(arm64)
        return "macOS (Apple Silicon)"
        #else
        return "macOS (Intel)"
        #endif
    }

    private func iconForAsset(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.hasSuffix(".dmg") {
            return "applelogo"
        } else if lower.hasSuffix(".exe") || lower.hasSuffix(".msi") {
            return "display"
        } else {
            return "arrow.down.doc.fill"
        }
    }

    private func formatBytes(_ bytes: Int) -> String {
        guard bytes > 0 else { return "0 MB" }
        let mb = Double(bytes) / (1024.0 * 1024.0)
        return String(format: "%.1f MB", mb)
    }

    private func formattedTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }

    private func closeModal() {
        withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
            isPresented = false
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            isOpen = false
        }
    }
}
