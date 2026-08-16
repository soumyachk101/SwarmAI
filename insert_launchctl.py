import sys

filepath = 'swarm/src-tauri/src/lib.rs'

with open(filepath, 'r') as f:
	lines = f.readlines()

# Find the "let shell" line
shell_idx = None
for i, line in enumerate(lines):
	if 'let shell = std::env::var("SHELL")' in line:
		shell_idx = i
		break

if shell_idx is None:
	print("ERROR: shell line not found")
	sys.exit(1)

print(f"Found shell at line {shell_idx + 1}")

# Get the indentation from the shell line
shell_line = lines[shell_idx]
base_indent = shell_line[:len(shell_line) - len(shell_line.lstrip())]

# Create the launchctl block with proper indentation
block = []
block.append(base_indent + '// On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n')
block.append(base_indent + 'if cfg!(target_os = "macos") {\n')
block.append(base_indent + 'if let Ok(lc) = std::process::Command::new("launchctl")\n')
block.append(base_indent + ' .args(["getenv", "PATH"])\n')
block.append(base_indent + ' .output()\n')
block.append(base_indent + '{\n')
block.append(base_indent + 'if lc.status.success() {\n')
block.append(base_indent + 'let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n')
block.append(base_indent + 'if !raw.is_empty() {\n')
block.append(base_indent + 'let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n')
block.append(base_indent + 'if !dirs.is_empty() { return dirs; }\n')
block.append(base_indent + '}\n')
block.append(base_indent + '}\n')
block.append(base_indent + '}\n')
block.append(base_indent + '}\n')
block.append('\n')

# Insert the block before the shell line
for idx, line in enumerate(block):
	lines.insert(shell_idx + idx, line)

with open(filepath, 'w') as f:
	f.writelines(lines)

print(f"Inserted {len(block)} lines for launchctl block")
