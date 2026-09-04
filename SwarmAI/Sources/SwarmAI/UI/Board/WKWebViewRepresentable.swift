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
    configuration.defaultWebpagePreferences.allowsContentJavaScript = true
    configuration.websiteDataStore = WKWebsiteDataStore.default()

    let preferences = WKPreferences()
    preferences.javaScriptCanOpenWindowsAutomatically = true
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

    // Connect store to active webView on next runloop tick to avoid SwiftUI view-tree mutation warnings
    let store = browserStore
    DispatchQueue.main.async { [weak webView, weak store] in
      if let view = webView, let bStore = store {
        bStore.activeWebView = view
      }
    }

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

    // Keep active webView ref updated asynchronously if it changed
    if browserStore.activeWebView !== webView {
      let store = browserStore
      DispatchQueue.main.async { [weak webView, weak store] in
        if let view = webView, let bStore = store {
          bStore.activeWebView = view
        }
      }
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

    @MainActor
    public func webView(
      _ webView: WKWebView,
      didReceive challenge: URLAuthenticationChallenge,
      completionHandler: @escaping @MainActor @Sendable (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
      // Support self-signed certificates for local development servers (localhost / 127.0.0.1 / .local)
      if challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
         let serverTrust = challenge.protectionSpace.serverTrust,
         let host = challenge.protectionSpace.host as String?,
         (host == "localhost" || host == "127.0.0.1" || host.hasSuffix(".local")) {
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
        return
      }
      completionHandler(.performDefaultHandling, nil)
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
      alert.messageText = "SwarmAI Browser"
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
      alert.messageText = "SwarmAI Browser"
      alert.informativeText = message
      alert.addButton(withTitle: "OK")
      alert.addButton(withTitle: "Cancel")
      let response = alert.runModal()
      completionHandler(response == .alertFirstButtonReturn)
    }
  }
}