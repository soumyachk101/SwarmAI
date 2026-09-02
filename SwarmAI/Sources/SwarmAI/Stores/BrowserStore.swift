import SwiftUI
import WebKit
import AppKit

// MARK: - Browser Screenshot

public struct BrowserScreenshot: Identifiable, Sendable {
  public let id: UUID
  public let data: String // Base64 PNG string
  public let pngData: Data
  public let image: NSImage?
  public let url: String
  public let title: String
  public let takenAt: Date

  public init(
    id: UUID = UUID(),
    data: String,
    pngData: Data,
    image: NSImage?,
    url: String,
    title: String,
    takenAt: Date = Date()
  ) {
    self.id = id
    self.data = data
    self.pngData = pngData
    self.image = image
    self.url = url
    self.title = title
    self.takenAt = takenAt
  }
}

// MARK: - Browser Store

@Observable
@MainActor
public final class BrowserStore {
  public var currentUrl: String = ""
  public var currentTitle: String = "Browser"
  public var canGoBack: Bool = false
  public var canGoForward: Bool = false
  public var isLoading: Bool = false
  public var estimatedProgress: Double = 0.0
  public var errorMessage: String? = nil
  public var isSecure: Bool = false
  public var history: [String] = []

  // Customization & DevTools
  public var customUserAgent: String? = nil
  public var isInspectable: Bool = true
  public var isDeveloperToolsEnabled: Bool = true

  // Screencast & Agent Vision
  public var latestScreenshot: BrowserScreenshot? = nil
  public var screenshotHistory: [BrowserScreenshot] = []
  public var isScreenshotFlashActive: Bool = false
  public var isScreencastActive: Bool = false
  public var lastCapturedAt: Date? = nil

  // Active WKWebView reference for direct native control
  public weak var activeWebView: WKWebView? = nil

  public init() {}

  // MARK: - Navigation

  public func navigate(_ rawUrl: String) {
    let trimmed = rawUrl.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }

    guard let normalizedURL = Self.normalizeUrl(trimmed) else {
      errorMessage = "Invalid URL: \(trimmed)"
      return
    }

    errorMessage = nil
    let urlString = normalizedURL.absoluteString
    currentUrl = urlString

    if !history.contains(urlString) {
      history.append(urlString)
    }

    if let webView = activeWebView {
      let request = URLRequest(url: normalizedURL)
      webView.load(request)
    }
  }

  public func goBack() {
    guard let webView = activeWebView, webView.canGoBack else { return }
    webView.goBack()
  }

  public func goForward() {
    guard let webView = activeWebView, webView.canGoForward else { return }
    webView.goForward()
  }

  public func reload() {
    guard let webView = activeWebView else {
      if !currentUrl.isEmpty { navigate(currentUrl) }
      return
    }
    webView.reload()
  }

  public func stopLoading() {
    activeWebView?.stopLoading()
    isLoading = false
  }

  public func goHome() {
    navigate("http://localhost:3000")
  }

  // MARK: - Screenshot Capture (Agent Vision & User)

  @discardableResult
  public func captureScreenshot() async -> BrowserScreenshot? {
    guard let webView = activeWebView else { return nil }

    let config = WKSnapshotConfiguration()
    config.afterScreenUpdates = true

    return await withCheckedContinuation { (continuation: CheckedContinuation<BrowserScreenshot?, Never>) in
      webView.takeSnapshot(with: config) { [weak self] image, error in
        guard let self = self, let image = image else {
          continuation.resume(returning: nil)
          return
        }

        guard let tiff = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff),
              let pngData = bitmap.representation(using: .png, properties: [:]) else {
          continuation.resume(returning: nil)
          return
        }

        let base64 = pngData.base64EncodedString()
        let screenshot = BrowserScreenshot(
          data: base64,
          pngData: pngData,
          image: image,
          url: webView.url?.absoluteString ?? self.currentUrl,
          title: webView.title ?? self.currentTitle,
          takenAt: Date()
        )

        self.latestScreenshot = screenshot
        self.screenshotHistory.insert(screenshot, at: 0)
        self.lastCapturedAt = Date()

        // Trigger visual flash
        self.isScreenshotFlashActive = true
        _Concurrency.Task { @MainActor in
          try? await _Concurrency.Task.sleep(for: .milliseconds(300))
          self.isScreenshotFlashActive = false
        }

        continuation.resume(returning: screenshot)
      }
    }
  }

  public func copyScreenshotToClipboard() {
    guard let image = latestScreenshot?.image else { return }
    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    pasteboard.writeObjects([image])
  }

  public func clearScreenshots() {
    latestScreenshot = nil
    screenshotHistory.removeAll()
  }

  // MARK: - JavaScript Evaluation

  public func evaluateJavaScript(_ script: String) async throws -> Any? {
    guard let webView = activeWebView else { return nil }
    return try await webView.evaluateJavaScript(script)
  }

  // MARK: - URL Normalization

  public static func normalizeUrl(_ raw: String) -> URL? {
    let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { return nil }

    // Pure port number (e.g. "3000", "5173", "8080")
    if let port = Int(trimmed), port > 0, port <= 65535 {
      return URL(string: "http://localhost:\(port)")
    }

    // Colon + port (e.g. ":3000")
    if trimmed.hasPrefix(":") && Int(trimmed.dropFirst()) != nil {
      return URL(string: "http://localhost\(trimmed)")
    }

    // Localhost or loopback IP without scheme
    if trimmed.starts(with: "localhost") || trimmed.starts(with: "127.0.0.1") {
      return URL(string: "http://\(trimmed)")
    }

    // Explicit scheme
    let lower = trimmed.lowercased()
    if lower.hasPrefix("http://") || lower.hasPrefix("https://") || lower.hasPrefix("file://") || lower.hasPrefix("about:") {
      return URL(string: trimmed)
    }

    // Domain with dot and no whitespace (e.g. "google.com", "apple.com/mac")
    if trimmed.contains(".") && !trimmed.contains(" ") {
      return URL(string: "https://\(trimmed)")
    }

    // Search query fallback
    if let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
      return URL(string: "https://www.google.com/search?q=\(encoded)")
    }

    return URL(string: "https://\(trimmed)")
  }
}