#!/usr/bin/env python3
import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 lines = f.readlines()

# Find shell line
shell_idx = None
for i in range(len(lines)):
 if 'let shell = std::env::var("SHELL")' in lines[i]:
 shell_idx = i
 break

if shell_idx is None:
 print("ERROR: shell not found")
 sys.exit(1)

# Insert launchctl block
if 'launchctl' not in lines[shell_idx - 1]:
 T3 = '\t\t\t'
 block = [
 T3 + '// On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n',
 T3 + 'if cfg!(target_os = "macos") {\n',
 T3 + 'if let Ok(lc) = std::process::Command::new("launchctl")\n',
 T3 + '.args(["getenv", "PATH"])\n',
 T3 + '.output()\n',
 T3 + '{\n',
 T3 + 'if lc.status.success() {\n',
 T3 + 'let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n',
 T3 + 'if !raw.is_empty() {\n',
 T3 + 'let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n',
 T3 + 'if !dirs.is_empty() { return dirs; }\n',
 T3 + '}\n',
 T3 + '}\n',
 T3 + '}\n',
 T3 + '}\n',
 '\n',
 ]
 for idx in range(len(block)):
 lines.insert(shell_idx + idx, block[idx])
 print(f"Inserted {len(block)} lines")
else:
 print("Already inserted")

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
 f.writelines(lines)

print("Done!")
