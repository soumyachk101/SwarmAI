import SwiftUI
import WebKit

// MARK: - Browser Pane View

public struct BrowserPaneView: View {
  @Environment(\.browserStore) private var browserStore
  @State private var urlInput: String = ""
  @State private var showScreenshotHistory: Bool = false
  @State private var showDevSettings: Bool = false
  @State private var selectedPort: String = "3000"

  private let devPorts = ["3000", "5173", "8000", "8080", "4321"]

  public init() {}

  public var body: some View {
    VStack(spacing: 0) {
      // Top Navigation & Address Toolbar
      browserToolbar

      // Smooth Loading Progress Bar
      if browserStore.isLoading {
        GeometryReader { geometry in
          Rectangle()
            .fill(
              LinearGradient(
                colors: [.swarmGold, .swarmGoldHover, .swarmGold.opacity(0.8)],
                startPoint: .leading,
                endPoint: .trailing
              )
            )
            .frame(width: max(10, geometry.size.width * CGFloat(browserStore.estimatedProgress)), height: 2)
            .animation(.easeOut(duration: 0.2), value: browserStore.estimatedProgress)
        }
        .frame(height: 2)
        .background(Color.swarmBorderSubtle)
      } else {
        Divider()
          .background(Color.swarmBorderSubtle)
      }

      // Main Viewport Area
      ZStack {
        // Native WebKit Web View
        WKWebViewRepresentable()
          .opacity(browserStore.currentUrl.isEmpty ? 0 : 1)

        // Welcome / Dev Launcher Screen when no URL is loaded
        if browserStore.currentUrl.isEmpty {
          browserWelcomeView
        }

        // Error banner overlay if connection failed
        if let errorMessage = browserStore.errorMessage, !browserStore.isLoading {
          browserErrorOverlay(message: errorMessage)
        }

        // Screenshot Flash Effect
        if browserStore.isScreenshotFlashActive {
          Color.white.opacity(0.7)
            .ignoresSafeArea()
            .transition(.opacity)
            .animation(.easeOut(duration: 0.3), value: browserStore.isScreenshotFlashActive)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(Color.swarmCanvas)

      // Screenshot Drawer / Drawer preview if opened
      if showScreenshotHistory {
        screenshotDrawer
      }
    }
    .background(Color.swarmCanvas)
    .onAppear {
      if urlInput.isEmpty && !browserStore.currentUrl.isEmpty {
        urlInput = browserStore.currentUrl
      }
    }
    .onChange(of: browserStore.currentUrl) { _, newUrl in
      urlInput = newUrl
    }
  }

  // MARK: - Toolbar View

  private var browserToolbar: some View {
    HStack(spacing: 8) {
      // Navigation Group
      HStack(spacing: 2) {
        Button {
          browserStore.goBack()
        } label: {
          Image(systemName: "chevron.left")
            .font(.swarm(.xs, weight: .semibold))
            .foregroundStyle(browserStore.canGoBack ? Color.swarmTextPrimary : Color.swarmTextTertiary)
            .frame(width: 26, height: 24)
            .background(
              RoundedRectangle(cornerRadius: 5)
                .fill(browserStore.canGoBack ? Color.swarmSurfaceHover.opacity(0.5) : Color.clear)
            )
        }
        .buttonStyle(.plain)
        .disabled(!browserStore.canGoBack)
        .help("Go Back")

        Button {
          browserStore.goForward()
        } label: {
          Image(systemName: "chevron.right")
            .font(.swarm(.xs, weight: .semibold))
            .foregroundStyle(browserStore.canGoForward ? Color.swarmTextPrimary : Color.swarmTextTertiary)
            .frame(width: 26, height: 24)
            .background(
              RoundedRectangle(cornerRadius: 5)
                .fill(browserStore.canGoForward ? Color.swarmSurfaceHover.opacity(0.5) : Color.clear)
            )
        }
        .buttonStyle(.plain)
        .disabled(!browserStore.canGoForward)
        .help("Go Forward")

        Button {
          if browserStore.isLoading {
            browserStore.stopLoading()
          } else {
            browserStore.reload()
          }
        } label: {
          Image(systemName: browserStore.isLoading ? "xmark" : "arrow.clockwise")
            .font(.swarm(.xs, weight: .semibold))
            .foregroundStyle(Color.swarmTextPrimary)
            .frame(width: 26, height: 24)
            .background(
              RoundedRectangle(cornerRadius: 5)
                .fill(Color.swarmSurfaceHover.opacity(0.5))
            )
        }
        .buttonStyle(.plain)
        .help(browserStore.isLoading ? "Stop Loading" : "Reload")

        Button {
          browserStore.goHome()
        } label: {
          Image(systemName: "house")
            .font(.swarm(.xs, weight: .medium))
            .foregroundStyle(Color.swarmTextSecondary)
            .frame(width: 26, height: 24)
            .background(
              RoundedRectangle(cornerRadius: 5)
                .fill(Color.swarmSurfaceHover.opacity(0.5))
            )
        }
        .buttonStyle(.plain)
        .help("Localhost Dev Server (Port 3000)")
      }

      // Address Bar
      HStack(spacing: 6) {
        // Security Lock / Globe Icon
        Image(systemName: browserStore.isSecure ? "lock.fill" : (browserStore.currentUrl.starts(with: "http://localhost") ? "laptopcomputer" : "globe"))
          .font(.swarm(.micro))
          .foregroundStyle(browserStore.isSecure ? Color.swarmSuccess : Color.swarmTextTertiary)

        // URL Input
        TextField("Enter URL or port (e.g. 3000, 5173, localhost:8000)", text: $urlInput)
          .font(.swarm(.sm))
          .textFieldStyle(.plain)
          .onSubmit {
            browserStore.navigate(urlInput)
          }

        if !urlInput.isEmpty {
          Button {
            urlInput = ""
          } label: {
            Image(systemName: "xmark.circle.fill")
              .font(.swarm(.xs))
              .foregroundStyle(Color.swarmTextTertiary)
          }
          .buttonStyle(.plain)
        }

        // Quick Port Shortcuts
        Menu {
          ForEach(devPorts, id: \.self) { port in
            Button("http://localhost:\(port)") {
              urlInput = "http://localhost:\(port)"
              browserStore.navigate("http://localhost:\(port)")
            }
          }
          Divider()
          Button("Custom Port...") {
            urlInput = "http://localhost:"
          }
        } label: {
          HStack(spacing: 2) {
            Text("Port")
              .font(.swarm(.micro, weight: .medium))
            Image(systemName: "chevron.down")
              .font(.system(size: 8))
          }
          .foregroundStyle(Color.swarmTextSecondary)
          .padding(.horizontal, 6)
          .padding(.vertical, 2)
          .background(
            RoundedRectangle(cornerRadius: 4)
              .fill(Color.swarmCanvas.opacity(0.6))
          )
        }
        .menuStyle(.borderlessButton)
        .fixedSize()
      }
      .padding(.horizontal, 8)
      .padding(.vertical, 5)
      .background(
        RoundedRectangle(cornerRadius: 6)
          .fill(Color.swarmCanvas)
          .overlay(
            RoundedRectangle(cornerRadius: 6)
              .stroke(Color.swarmBorderSubtle, lineWidth: 1)
          )
      )

      // Right Action Group (Screenshot, Agent Screencast, DevTools)
      HStack(spacing: 4) {
        // Screenshot Capture Button
        Button {
          Task {
            await browserStore.captureScreenshot()
          }
        } label: {
          HStack(spacing: 4) {
            Image(systemName: "camera.fill")
              .font(.swarm(.xs))
            Text("Capture")
              .font(.swarm(.xs, weight: .medium))
          }
          .foregroundStyle(Color.swarmGold)
          .padding(.horizontal, 8)
          .padding(.vertical, 4)
          .background(
            RoundedRectangle(cornerRadius: 6)
              .fill(Color.swarmGold.opacity(0.12))
              .overlay(
                RoundedRectangle(cornerRadius: 6)
                  .stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
              )
          )
        }
        .buttonStyle(.plain)
        .help("Capture screenshot for Lead and Vision agents")

        // Screenshot Gallery / Drawer Toggle
        if !browserStore.screenshotHistory.isEmpty {
          Button {
            withAnimation(.swarmQuick) {
              showScreenshotHistory.toggle()
            }
          } label: {
            HStack(spacing: 3) {
              Image(systemName: "photo.stack")
                .font(.swarm(.xs))
              Text("\(browserStore.screenshotHistory.count)")
                .font(.swarm(.micro, weight: .bold))
            }
            .foregroundStyle(showScreenshotHistory ? Color.swarmGold : Color.swarmTextSecondary)
            .padding(.horizontal, 6)
            .padding(.vertical, 4)
            .background(
              RoundedRectangle(cornerRadius: 6)
                .fill(showScreenshotHistory ? Color.swarmGold.opacity(0.15) : Color.swarmSurface)
            )
          }
          .buttonStyle(.plain)
          .help("View captured screenshots")
        }

        // Open in Default Safari Browser
        Button {
          if let url = URL(string: browserStore.currentUrl) {
            NSWorkspace.shared.open(url)
          }
        } label: {
          Image(systemName: "safari")
            .font(.swarm(.xs))
            .foregroundStyle(Color.swarmTextSecondary)
            .frame(width: 26, height: 24)
            .background(
              RoundedRectangle(cornerRadius: 5)
                .fill(Color.swarmSurfaceHover.opacity(0.5))
            )
        }
        .buttonStyle(.plain)
        .help("Open in Safari")
        .disabled(browserStore.currentUrl.isEmpty)
      }
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .background(Color.swarmSurface)
  }

  // MARK: - Welcome View

  private var browserWelcomeView: some View {
    VStack(spacing: 24) {
      VStack(spacing: 12) {
        ZStack {
          Circle()
            .fill(Color.swarmGold.opacity(0.1))
            .frame(width: 72, height: 72)
          Image(systemName: "globe.americas.fill")
            .font(.system(size: 36))
            .foregroundStyle(Color.swarmGold)
        }

        Text("WebKit Browser & Screencast")
          .font(.swarm(.xl, weight: .semibold))
          .foregroundStyle(Color.swarmTextPrimary)

        Text("Preview local development servers, inspect web apps, and capture live screenshots for AI agent vision tools.")
          .font(.swarm(.sm))
          .foregroundStyle(Color.swarmTextSecondary)
          .multilineTextAlignment(.center)
          .frame(maxWidth: 480)
      }

      // Quick Launch Dev Servers
      VStack(alignment: .leading, spacing: 10) {
        Text("QUICK LAUNCH LOCAL DEV SERVERS")
          .font(.swarm(.micro, weight: .bold))
          .foregroundStyle(Color.swarmTextTertiary)

        HStack(spacing: 12) {
          devServerCard(title: "Port 3000", subtitle: "Next.js / React / CRA", port: "3000")
          devServerCard(title: "Port 5173", subtitle: "Vite / Vue / Svelte", port: "5173")
          devServerCard(title: "Port 8000", subtitle: "FastAPI / Django", port: "8000")
          devServerCard(title: "Port 8080", subtitle: "Webpack / Spring", port: "8080")
        }
      }
      .padding(16)
      .background(
        RoundedRectangle(cornerRadius: 12)
          .fill(Color.swarmSurface)
          .overlay(
            RoundedRectangle(cornerRadius: 12)
              .stroke(Color.swarmBorderSubtle, lineWidth: 1)
          )
      )

      // Agent Vision Note
      HStack(spacing: 8) {
        Image(systemName: "sparkles")
          .font(.swarm(.sm))
          .foregroundStyle(Color.swarmGold)
        Text("AI Agents can capture high-resolution snapshots directly from this pane for visual debugging and UI validation.")
          .font(.swarm(.xs))
          .foregroundStyle(Color.swarmTextTertiary)
      }
    }
    .padding(32)
  }

  private func devServerCard(title: String, subtitle: String, port: String) -> some View {
    Button {
      let target = "http://localhost:\(port)"
      urlInput = target
      browserStore.navigate(target)
    } label: {
      VStack(alignment: .leading, spacing: 4) {
        HStack {
          Circle()
            .fill(Color.swarmSuccess)
            .frame(width: 6, height: 6)
          Text(title)
            .font(.swarm(.sm, weight: .semibold))
            .foregroundStyle(Color.swarmTextPrimary)
        }

        Text(subtitle)
          .font(.swarm(.micro))
          .foregroundStyle(Color.swarmTextTertiary)
      }
      .frame(width: 140, alignment: .leading)
      .padding(10)
      .background(
        RoundedRectangle(cornerRadius: 8)
          .fill(Color.swarmCanvas)
          .overlay(
            RoundedRectangle(cornerRadius: 8)
              .stroke(Color.swarmBorderSubtle, lineWidth: 1)
          )
      )
    }
    .buttonStyle(.plain)
  }

  // MARK: - Error Overlay

  private func browserErrorOverlay(message: String) -> some View {
    VStack(spacing: 14) {
      Image(systemName: "exclamationmark.triangle.fill")
        .font(.system(size: 36))
        .foregroundStyle(Color.swarmWarning)

      VStack(spacing: 4) {
        Text("Could not connect to server")
          .font(.swarm(.lg, weight: .semibold))
          .foregroundStyle(Color.swarmTextPrimary)

        Text(message)
          .font(.swarm(.xs))
          .foregroundStyle(Color.swarmTextSecondary)
          .multilineTextAlignment(.center)
          .frame(maxWidth: 400)

        Text("Ensure your local development server is running (e.g. npm run dev or uvicorn) on this port.")
          .font(.swarm(.micro))
          .foregroundStyle(Color.swarmTextTertiary)
          .multilineTextAlignment(.center)
          .frame(maxWidth: 380)
          .padding(.top, 4)
      }

      Button {
        browserStore.reload()
      } label: {
        HStack(spacing: 6) {
          Image(systemName: "arrow.clockwise")
            .font(.swarm(.xs))
          Text("Retry Connection")
            .font(.swarm(.sm, weight: .medium))
        }
        .foregroundStyle(Color.swarmGold)
        .padding(.horizontal, 14)
        .padding(.vertical, 6)
        .background(
          RoundedRectangle(cornerRadius: 6)
            .fill(Color.swarmGold.opacity(0.15))
            .overlay(
              RoundedRectangle(cornerRadius: 6)
                .stroke(Color.swarmGold.opacity(0.35), lineWidth: 1)
            )
        )
      }
      .buttonStyle(.plain)
    }
    .padding(24)
    .background(
      RoundedRectangle(cornerRadius: 12)
        .fill(Color.swarmSurface.opacity(0.95))
        .overlay(
          RoundedRectangle(cornerRadius: 12)
            .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        )
    )
  }

  // MARK: - Screenshot Drawer

  private var screenshotDrawer: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text("CAPTURED SCREENSHOTS (\(browserStore.screenshotHistory.count))")
          .font(.swarm(.micro, weight: .bold))
          .foregroundStyle(Color.swarmTextTertiary)

        Spacer()

        Button("Clear All") {
          browserStore.clearScreenshots()
          showScreenshotHistory = false
        }
        .font(.swarm(.micro))
        .foregroundStyle(Color.swarmTextTertiary)
        .buttonStyle(.plain)

        Button {
          withAnimation(.swarmQuick) {
            showScreenshotHistory = false
          }
        } label: {
          Image(systemName: "xmark")
            .font(.swarm(.micro))
            .foregroundStyle(Color.swarmTextTertiary)
        }
        .buttonStyle(.plain)
      }
      .padding(.horizontal, 12)
      .padding(.top, 8)

      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 12) {
          ForEach(browserStore.screenshotHistory) { shot in
            VStack(alignment: .leading, spacing: 4) {
              if let img = shot.image {
                Image(nsImage: img)
                  .resizable()
                  .scaledToFit()
                  .frame(height: 100)
                  .cornerRadius(6)
                  .overlay(
                    RoundedRectangle(cornerRadius: 6)
                      .stroke(Color.swarmBorderSubtle, lineWidth: 1)
                  )
              }

              HStack {
                Text(shot.takenAt.formatted(date: .omitted, time: .standard))
                  .font(.swarm(.micro))
                  .foregroundStyle(Color.swarmTextTertiary)

                Spacer()

                Button {
                  let pasteboard = NSPasteboard.general
                  pasteboard.clearContents()
                  if let img = shot.image {
                    pasteboard.writeObjects([img])
                  }
                } label: {
                  Image(systemName: "doc.on.doc")
                    .font(.swarm(.micro))
                    .foregroundStyle(Color.swarmGold)
                }
                .buttonStyle(.plain)
                .help("Copy PNG to clipboard")
              }
            }
            .frame(width: 140)
          }
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
      }
    }
    .background(Color.swarmSurface)
    .overlay(
      Rectangle()
        .frame(height: 1)
        .foregroundStyle(Color.swarmBorderSubtle),
      alignment: .top
    )
  }
}

// MARK: - Emulator Pane

public struct EmulatorPaneView: View {
  let avds: [(String, String)] = [
    ("Pixel 7 API 34", "Running"),
    ("Pixel 6 API 33", "Stopped"),
    ("Nexus 5X API 30", "Stopped"),
  ]

  @State private var selectedAvd: String = "Pixel 7 API 34"

  public init() {}

  public var body: some View {
    VStack(spacing: 0) {
      // Emulator toolbar
      HStack {
        Text("Emulator")
          .font(.swarm(.sm, weight: .medium))
          .foregroundStyle(Color.swarmTextPrimary)

        Spacer()

        Picker("", selection: $selectedAvd) {
          ForEach(avds, id: \.0) { name, _ in
            Text(name)
          }
        }
        .pickerStyle(.menu)
        .font(.swarm(.xs))
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 6)
      .background(Color.swarmSurface)

      Divider()
        .background(Color.swarmBorderSubtle)

      // AVD list
      ScrollView {
        VStack(spacing: 8) {
          ForEach(avds, id: \.0) { name, status in
            AvdRow(name: name, status: status)
          }
          .padding(.horizontal, 12)
          .padding(.vertical, 4)
        }
      }

      Spacer()
    }
    .background(Color.swarmCanvas)
  }
}

public struct AvdRow: View {
  let name: String
  let status: String

  public init(name: String, status: String) {
    self.name = name
    self.status = status
  }

  public var body: some View {
    HStack(spacing: 10) {
      Circle()
        .fill(status == "Running" ? Color.swarmSuccess : Color.swarmTextTertiary)
        .frame(width: 8, height: 8)

      VStack(alignment: .leading, spacing: 2) {
        Text(name)
          .font(.swarm(.sm, weight: .medium))
          .foregroundStyle(Color.swarmTextPrimary)

        Text(status)
          .font(.swarm(.micro))
          .foregroundStyle(status == "Running" ? Color.swarmSuccess : Color.swarmTextTertiary)
      }

      Spacer()

      Button(status == "Running" ? "Stop" : "Launch") { }
        .font(.swarm(.xs))
        .foregroundStyle(Color.swarmGold)
        .buttonStyle(.plain)
    }
    .padding(10)
    .background {
      RoundedRectangle(cornerRadius: 8)
        .fill(Color.swarmSurface)
    }
  }
}