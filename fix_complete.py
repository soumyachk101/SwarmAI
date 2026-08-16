import sys

filepath = 'swarm/src-tauri/src/lib.rs'

with open(filepath, 'r') as f:
	content = f.read()

# Find and replace the launchctl block with correct indentation
# The block needs 12 spaces (3 indentation levels)
block_12 = ' ' # 12 spaces

old_block = ''' #[cfg(not(windows))]
 {
 // On macOS, ask launchd for the GUI PATH first (no shell probe needed)
 if cfg!(target_os = "macos") {
 if let Ok(lc) = std::process::Command::new("launchctl")
 .args(["getenv", "PATH"])
 .output()
 {
 if lc.status.success() {
 let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();
 if !raw.is_empty() {
 let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();
 if !dirs.is_empty() { return dirs; }
 }
 }
 }
 }

 let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());'''

new_block = block_12 + '#[cfg(not(windows))]\n' + \
 block_12 + '{\n' + \
 block_12 + '// On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n' + \
 block_12 + 'if cfg!(target_os = "macos") {\n' + \
 block_12 + 'if let Ok(lc) = std::process::Command::new("launchctl")\n' + \
 block_12 + ' .args(["getenv", "PATH"])\n' + \
 block_12 + ' .output()\n' + \
 block_12 + '{\n' + \
 block_12 + 'if lc.status.success() {\n' + \
 block_12 + 'let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n' + \
 block_12 + 'if !raw.is_empty() {\n' + \
 block_12 + 'let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n' + \
 block_12 + 'if !dirs.is_empty() { return dirs; }\n' + \
 block_12 + '}\n' + \
 block_12 + '}\n' + \
 block_12 + '}\n' + \
 block_12 + '}\n' + \
 '\n' + \
 block_12 + 'let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());'

if old_block in content:
	content = content.replace(old_block, new_block)
	with open(filepath, 'w') as f:
		f.write(content)
	print("Fixed launchctl block indentation!")
else:
	print("ERROR: Could not find block to replace")
	sys.exit(1)
