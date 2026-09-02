import SwiftUI
import WebKit
import AppKit

// MARK: - WKWebViewRepresentable

public struct WKWebViewRepresentable: NSViewRepresentable {
  @Environment(\.browserStore) private var browserStore

  public init() {}

  public func makeCoordinator() -> Coordinator {
    Coordinator(browserStore: browserStore)
  }

  public func makeNSView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.allowsAirPlayForMediaPlayback = true

    // Enable developer extras / inspector
    let preferences = WKPreferences()
    preferences.javaScriptCanOpenWindowsAutomatically = true
    preferences.setValue(true, forKey: "developerExtrasEnabled")
    configuration.preferences = preferences

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.autoresizingMask = [.width, .height]
    webView.allowsBackForwardNavigationGestures = true
    webView.allowsMagnification = true

    if #available(macOS 13.3, *) {
      webView.isInspectable = browserStore.isInspectable
    }

    if let customUA = browserStore.customUserAgent, !customUA.isEmpty {
      webView.customUserAgent = customUA
    }

    webView.navigationDelegate = context.coordinator
    webView.uiDelegate = context.coordinator

    // Setup KVO observers
    context.coordinator.setupObservers(for: webView)

    // Connect store to active webView
    browserStore.activeWebView = webView

    // Initial navigation if URL exists
    if !browserStore.currentUrl.isEmpty,
       let url = URL(string: browserStore.currentUrl),
       url.scheme != nil {
      webView.load(URLRequest(url: url))
    }

    return webView
  }

  public func updateNSView(_ webView: WKWebView, context: Context) {
    if #available(macOS 13.3, *) {
      if webView.isInspectable != browserStore.isInspectable {
        webView.isInspectable = browserStore.isInspectable
      }
    }

    if webView.customUserAgent != browserStore.customUserAgent {
      webView.customUserAgent = browserStore.customUserAgent
    }

    // Keep active webView ref updated
    if browserStore.activeWebView !== webView {
      browserStore.activeWebView = webView
    }
  }

  // MARK: - Coordinator

  @MainActor
  public final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
    private var browserStore: BrowserStore
    private var observations: [NSKeyValueObservation] = []

    init(browserStore: BrowserStore) {
      self.browserStore = browserStore
      super.init()
    }

    deinit {
      observations.forEach { $0.invalidate() }
      observations.removeAll()
    }

    func setupObservers(for webView: WKWebView) {
      observations.forEach { $0.invalidate() }
      observations.removeAll()

      // Estimated progress observer
      let progressObs = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] view, _ in
        guard let self = self else { return }
        _Concurrency.Task { @MainActor in
          self.browserStore.estimatedProgress = view.estimatedProgress
        }
      }
      observations.append(progressObs)

      // Title observer
      let titleObs = webView.observe(\.title, options: [.new]) { [weak self] view, _ in
        guard let self = self else { return }
        _Concurrency.Task { @MainActor in
          if let title = view.title, !title.isEmpty {
            self.browserStore.currentTitle = title
          }
        }
      }
      observations.append(titleObs)

      // URL observer
      let urlObs = webView.observe(\.url, options: [.new]) { [weak self] view, _ in
        guard let self = self else { return }
        _Concurrency.Task { @MainActor in
          if let urlStr = view.url?.absoluteString, !urlStr.isEmpty, urlStr != "about:blank" {
            self.browserStore.currentUrl = urlStr
            self.browserStore.isSecure = view.hasOnlySecureContent
          }
        }
      }
      observations.append(urlObs)

      // Loading observer
      let loadingObs = webView.observe(\.isLoading, options: [.new]) { [weak self] view, _ in
        guard let self = self else { return }
        _Concurrency.Task { @MainActor in
          self.browserStore.isLoading = view.isLoading
          self.browserStore.canGoBack = view.canGoBack
          self.browserStore.canGoForward = view.canGoForward
        }
      }
      observations.append(loadingObs)
    }

    // MARK: - WKNavigationDelegate

    public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
      browserStore.isLoading = true
      browserStore.errorMessage = nil
      browserStore.canGoBack = webView.canGoBack
      browserStore.canGoForward = webView.canGoForward
    }

    public func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
      browserStore.canGoBack = webView.canGoBack
      browserStore.canGoForward = webView.canGoForward
      if let url = webView.url?.absoluteString {
        browserStore.currentUrl = url
      }
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
      browserStore.isLoading = false
      browserStore.canGoBack = webView.canGoBack
      browserStore.canGoForward = webView.canGoForward
      browserStore.isSecure = webView.hasOnlySecureContent
      if let title = webView.title, !title.isEmpty {
        browserStore.currentTitle = title
      }
      if let url = webView.url?.absoluteString {
        browserStore.currentUrl = url
      }
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
      browserStore.isLoading = false
      browserStore.canGoBack = webView.canGoBack
      browserStore.canGoForward = webView.canGoForward
      let nsErr = error as NSError
      if nsErr.code != NSURLErrorCancelled {
        browserStore.errorMessage = error.localizedDescription
      }
    }

    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
      browserStore.isLoading = false
      browserStore.canGoBack = webView.canGoBack
      browserStore.canGoForward = webView.canGoForward
      let nsErr = error as NSError
      if nsErr.code != NSURLErrorCancelled {
        browserStore.errorMessage = error.localizedDescription
      }
    }

    @MainActor
    public func webView(
      _ webView: WKWebView,
      decidePolicyFor navigationAction: WKNavigationAction,
      decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void
    ) {
      if navigationAction.targetFrame == nil {
        webView.load(navigationAction.request)
        decisionHandler(.cancel)
        return
      }
      decisionHandler(.allow)
    }

    // MARK: - WKUIDelegate

    @MainActor
    public func webView(
      _ webView: WKWebView,
      createWebViewWith configuration: WKWebViewConfiguration,
      for navigationAction: WKNavigationAction,
      windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
      if navigationAction.targetFrame == nil {
        webView.load(navigationAction.request)
      }
      return nil
    }

    @MainActor
    public func webView(
      _ webView: WKWebView,
      runJavaScriptAlertPanelWithMessage message: String,
      initiatedByFrame frame: WKFrameInfo,
      completionHandler: @escaping @MainActor @Sendable () -> Void
    ) {
      let alert = NSAlert()
      alert.messageText = "JavaScript Alert"
      alert.informativeText = message
      alert.addButton(withTitle: "OK")
      alert.runModal()
      completionHandler()
    }

    @MainActor
    public func webView(
      _ webView: WKWebView,
      runJavaScriptConfirmPanelWithMessage message: String,
      initiatedByFrame frame: WKFrameInfo,
      completionHandler: @escaping @MainActor @Sendable (Bool) -> Void
    ) {
      let alert = NSAlert()
      alert.messageText = "JavaScript Confirmation"
      alert.informativeText = message
      alert.addButton(withTitle: "OK")
      alert.addButton(withTitle: "Cancel")
      let response = alert.runModal()
      completionHandler(response == .alertFirstButtonReturn)
    }
  }
}