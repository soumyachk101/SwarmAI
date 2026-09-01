import SwiftUI

@Observable
final class ExtensionStore {
 var installedExtensions: [Extension] = []

 init() {
 loadFromStorage()
 }

 func installExtension(_ ext: Extension) {
 if !installedExtensions.contains(where: { $0.id == ext.id }) {
 var installed = ext
 installed.installed = true
 installedExtensions.append(installed)
 saveToStorage()
 }
 }

 func uninstallExtension(_ id: String) {
 installedExtensions.removeAll { $0.id == id }
 saveToStorage()
 }

 func isInstalled(_ id: String) -> Bool {
 installedExtensions.contains { $0.id == id }
 }

 func installedExtension(_ id: String) -> Extension? {
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
