import SwiftUI

@Observable
final class BrowserStore {
 var currentUrl: String = "about:blank"
 var currentTitle: String = "New Tab"
 var canGoBack: Bool = false
 var canGoForward: Bool = false
 var isLoading: Bool = false
 var history: [String] = []

 func navigate(_ url: String) {
 if let encoded = url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
 let _ = URL(string: encoded) ?? URL(string: url) {
 history.append(url)
 currentUrl = url
 currentTitle = url
 canGoBack = history.count > 1
 canGoForward = false
 isLoading = true
 // Simulate load completion
 DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
 self.isLoading = false
 }
 }
 }

 func goBack() {
 guard history.count > 1 else { return }
 history.removeLast()
 let previous = history.last ?? "about:blank"
 currentUrl = previous
 canGoBack = history.count > 1
 canGoForward = true
 }

 func goForward() {
 }

 func reload() {
 isLoading = true
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
 self.isLoading = false
 }
 }
}
