#!/usr/bin/env python3
import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 content = f.read()

# Fix 1: raw_str indentation
content = content.replace(
 'if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }\n Vec::new()',
 'if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }\n\t\t\t\t\tVec::new()'
)

# Fix 2: Insert launchctl block
lines = content.split('\n')
shell_idx = None
for i, line in enumerate(lines):
 if 'let shell = std::env::var("SHELL")' in line:
 shell_idx = i
 break

if shell_idx is None:
 print("ERROR: shell not found")
 sys.exit(1)

if 'launchctl' not in lines[shell_idx - 1]:
 T3 = '\t\t\t'
 new_lines = lines[:shell_idx] + [
 T3 + '// On macOS, ask launchd for the GUI PATH first (no shell probe needed)',
 T3 + 'if cfg!(target_os = "macos") {',
 T3 + 'if let Ok(lc) = std::process::Command::new("launchctl")',
 T3 + '.args(["getenv", "PATH"])',
 T3 + '.output()',
 T3 + '{',
 T3 + 'if lc.status.success() {',
 T3 + 'let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();',
 T3 + 'if !raw.is_empty() {',
 T3 + 'let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();',
 T3 + 'if !dirs.is_empty() { return dirs; }',
 T3 + '}',
 T3 + '}',
 T3 + '}',
 T3 + '}',
 '',
 ] + lines[shell_idx:]
 content = '\n'.join(new_lines)
 print("Inserted launchctl block")

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
 f.write(content)

print("Done!")
