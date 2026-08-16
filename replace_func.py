import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 lines = f.readlines()

# Find function boundaries
start_idx = None
end_idx = None
i = 0
while i < len(lines):
 if 'fn login_shell_path_dirs()' in lines[i] and start_idx is None:
 start_idx = i
 elif 'fn augmented_path_env()' in lines[i] and start_idx is not None:
 end_idx = i
 break
 i += 1

if start_idx is None or end_idx is None:
 print("ERROR: function boundaries not found")
 sys.exit(1)

# New function lines
new_lines = []
new_lines.append('fn login_shell_path_dirs() -> &\'static [PathBuf] {\n')
new_lines.append(' static DIRS: OnceLock<Vec<PathBuf>> = OnceLock::new();\n')
new_lines.append(' DIRS.get_or_init(|| {\n')
new_lines.append(' #[cfg(windows)]\n')
new_lines.append(' {\n')
new_lines.append(' Vec::new()\n')
new_lines.append(' }\n')
new_lines.append(' #[cfg(not(windows))]\n')
new_lines.append(' {\n')
new_lines.append(' // On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n')
new_lines.append(' if cfg!(target_os = "macos") {\n')
new_lines.append(' if let Ok(lc) = std::process::Command::new("launchctl")\n')
new_lines.append(' .args(["getenv", "PATH"])\n')
new_lines.append(' .output()\n')
new_lines.append(' {\n')
new_lines.append(' if lc.status.success() {\n')
new_lines.append(' let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n')
new_lines.append(' if !raw.is_empty() {\n')
new_lines.append(' let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n')
new_lines.append(' if !dirs.is_empty() { return dirs; }\n')
new_lines.append(' }\n')
new_lines.append(' }\n')
new_lines.append(' }\n')
new_lines.append(' }\n')
new_lines.append('\n')
new_lines.append(' let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());\n')
new_lines.append(' let (tx, rx) = mpsc::channel();\n')
new_lines.append(' std::thread::spawn(move || {\n')
new_lines.append(' let result = std::process::Command::new(&shell)\n')
new_lines.append(' .arg("-lc")\n')
new_lines.append(' .arg("printf \'%s\' \\"$PATH\\"")\n')
new_lines.append(' .output();\n')
new_lines.append(' let _ = tx.send(result);\n')
new_lines.append(' });\n')
new_lines.append(' match rx.recv_timeout(std::time::Duration::from_secs(3)) {\n')
new_lines.append(' Ok(Ok(out)) if out.status.success() => {\n')
new_lines.append(' let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();\n')
new_lines.append(' if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }\n')
new_lines.append(' Vec::new()\n')
new_lines.append(' }\n')
new_lines.append(' Ok(Ok(out)) => {\n')
new_lines.append(' println!("[Rust] login shell PATH probe exited non-zero");\n')
new_lines.append(' Vec::new()\n')
new_lines.append(' }\n')
new_lines.append(' Ok(Err(e)) => {\n')
new_lines.append(' println!("[Rust] login shell PATH probe failed: {e:?}");\n')
new_lines.append(' Vec::new()\n')
new_lines.append(' }\n')
new_lines.append(' Err(_) => {\n')
new_lines.append(' println!("[Rust] login shell PATH probe timed out after 3s");\n')
new_lines.append(' Vec::new()\n')
new_lines.append(' }\n')
new_lines.append(' }\n')
new_lines.append(' }\n')
new_lines.append(' }\n')
new_lines.append('}\n')
new_lines.append('\n')

# Replace
lines[start_idx:end_idx] = new_lines

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
 f.writelines(lines)

print(f"Replaced function: lines {start_idx+1} to {end_idx}")
print("Done!")
