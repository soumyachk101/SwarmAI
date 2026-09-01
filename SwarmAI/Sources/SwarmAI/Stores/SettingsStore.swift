import SwiftUI

@Observable
final class SettingsStore {
 var apiKeys: [Provider] = []
 var defaultAgent: AgentType = .claudeCode
 var terminalShell: String = "zsh"
 var themeMode: ThemeMode = .dark
 var enableNotifications: Bool = true
 var autoSaveInterval: Int = 30

 init() {
 loadFromStorage()
 }

 func setApiKey(_ provider: String, key: String) {
 if let index = apiKeys.firstIndex(where: { $0.name == provider }) {
 apiKeys[index].apiKey = key
 } else {
 apiKeys.append(Provider(name: provider, apiKey: key))
 }
 saveToStorage()
 }

 func removeApiKey(_ provider: String) {
 apiKeys.removeAll { $0.name == provider }
 saveToStorage()
 }

 func setDefaultAgent(_ type: AgentType) {
 defaultAgent = type
 saveToStorage()
 }

 func apiKey(for provider: String) -> String? {
 apiKeys.first { $0.name == provider }?.apiKey
 }

 private func saveToStorage() {
 if let data = try? JSONEncoder().encode(apiKeys) {
 UserDefaults.standard.set(data, forKey: "savedApiKeys")
 }
 UserDefaults.standard.set(defaultAgent.rawValue, forKey: "defaultAgent")
 UserDefaults.standard.set(terminalShell, forKey: "terminalShell")
 UserDefaults.standard.set(themeMode.rawValue, forKey: "themeMode")
 UserDefaults.standard.set(enableNotifications, forKey: "enableNotifications")
 UserDefaults.standard.set(autoSaveInterval, forKey: "autoSaveInterval")
 }

 private func loadFromStorage() {
 if let data = UserDefaults.standard.data(forKey: "savedApiKeys"),
 let decoded = try? JSONDecoder().decode([Provider].self, from: data) {
 apiKeys = decoded
 }
 if let agent = UserDefaults.standard.string(forKey: "defaultAgent") {
 defaultAgent = AgentType(rawValue: agent) ?? .claudeCode
 }
 terminalShell = UserDefaults.standard.string(forKey: "terminalShell") ?? "zsh"
 if let mode = UserDefaults.standard.string(forKey: "themeMode"),
 let tm = ThemeMode(rawValue: mode) {
 themeMode = tm
 }
 enableNotifications = UserDefaults.standard.object(forKey: "enableNotifications") as? Bool ?? true
 autoSaveInterval = UserDefaults.standard.object(forKey: "autoSaveInterval") as? Int ?? 30
 }
}
