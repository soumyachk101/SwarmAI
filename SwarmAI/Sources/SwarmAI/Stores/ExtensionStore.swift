import SwiftUI

 @MainActor
@Observable
public final class ExtensionStore: @unchecked Sendable {
  public static let shared = ExtensionStore()
  public var installedExtensions: [Extension] = []

  public init() {
    loadFromStorage()
  }

 public func installExtension(_ ext: Extension) {
 if !installedExtensions.contains(where: { $0.id == ext.id }) {
 var installed = ext
 installed.installed = true
 installedExtensions.append(installed)
 saveToStorage()
 }
 }

 public func uninstallExtension(_ id: String) {
 installedExtensions.removeAll { $0.id == id }
 saveToStorage()
 }

 public func isInstalled(_ id: String) -> Bool {
 installedExtensions.contains { $0.id == id }
 }

 public func installedExtension(_ id: String) -> Extension? {
 installedExtensions.first { $0.id == id }
 }

 private func saveToStorage() {
 if let data = try? JSONEncoder().encode(installedExtensions) {
 UserDefaults.standard.set(data, forKey: "installedExtensions")
 }
 }

 private func loadFromStorage() {
 guard let data = UserDefaults.standard.data(forKey: "installedExtensions"),
 let decoded = try? JSONDecoder().decode([Extension].self, from: data) else { return }
 installedExtensions = decoded
 }
}
