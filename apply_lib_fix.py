import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
	lines = f.readlines()

# Fix lines 679-697 (0-indexed: 678-696)
# Line 679: #[cfg(not(windows))] should be 8 spaces
lines[678] = ' #[cfg(not(windows))]\n'
# Line 680: { should be 8 spaces
lines[679] = ' {\n'
# Line 681: comment should be 12 spaces
lines[680] = ' // On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n'
# Lines 682-695: launchctl block, each should be 12 spaces base
lines[681] = ' if cfg!(target_os = "macos") {\n'
lines[682] = ' if let Ok(lc) = std::process::Command::new("launchctl")\n'
lines[683] = ' .args(["getenv", "PATH"])\n'
lines[684] = ' .output()\n'
lines[685] = ' {\n'
lines[686] = ' if lc.status.success() {\n'
lines[687] = ' let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n'
lines[688] = ' if !raw.is_empty() {\n'
lines[689] = ' let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n'
lines[690] = ' if !dirs.is_empty() { return dirs; }\n'
lines[691] = ' }\n'
lines[692] = ' }\n'
lines[693] = ' }\n'
lines[694] = ' }\n'
# Line 697: let shell should be 12 spaces
lines[696] = ' let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());\n'

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
	f.writelines(lines)

print("Indentation fixed!")
