import sys

filepath = 'swarm/src-tauri/src/lib.rs'

with open(filepath, 'rb') as f:
	content = f.read().decode('utf-8')

lines = content.split('\n')

# Fix launchctl block indentation (lines 679-697, 0-indexed 678-696)
# Each line in the block needs proper 12-space indentation
fixed_lines = lines[:678] # everything before the block

# The block lines with correct indentation
block = [
' #[cfg(not(windows))]',
' {',
' // On macOS, ask launchd for the GUI PATH first (no shell probe needed)',
' if cfg!(target_os = "macos") {',
' if let Ok(lc) = std::process::Command::new("launchctl")',
' .args(["getenv", "PATH"])',
' .output()',
' {',
' if lc.status.success() {',
' let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();',
' if !raw.is_empty() {',
' let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();',
' if !dirs.is_empty() { return dirs; }',
' }',
' }',
' }',
' }',
'',
' let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());'
]

fixed_lines.extend(block)

# Add the rest starting from line 698 (0-indexed 697)
fixed_lines.extend(lines[697:])

new_content = '\n'.join(fixed_lines)

with open(filepath, 'w') as f:
	f.write(new_content)

print("Fixed launchctl block indentation!")
