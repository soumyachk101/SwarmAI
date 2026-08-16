import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 lines = f.readlines()

# 1. Find "let shell = std::env::var" and insert launchctl block BEFORE it
shell_idx = None
for i, line in enumerate(lines):
 if 'let shell = std::env::var("SHELL")' in line:
 shell_idx = i
 break

if shell_idx is None:
 print("ERROR: shell line not found")
 sys.exit(1)

print(f"Found shell at line {shell_idx + 1}")
print(f"Previous line: {repr(lines[shell_idx - 1][:50])}")

# Check if launchctl already present
if 'launchctl' in lines[shell_idx - 1]:
 print("launchctl already present")
else:
 # Insert block before shell line
 block = []
 block.append('\t\t\t// On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n')
 block.append('\t\t\tif cfg!(target_os = "macos") {\n')
 block.append('\t\t\tif let Ok(lc) = std::process::Command::new("launchctl")\n')
 block.append('\t\t\t.args(["getenv", "PATH"])\n')
 block.append('\t\t\t.output()\n')
 block.append('\t\t\t{\n')
 block.append('\t\t\tif lc.status.success() {\n')
 block.append('\t\t\tlet raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n')
 block.append('\t\t\tif !raw.is_empty() {\n')
 block.append('\t\t\tlet dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n')
 block.append('\t\t\tif !dirs.is_empty() { return dirs; }\n')
 block.append('\t\t\t}\n')
 block.append('\t\t\t}\n')
 block.append('\t\t\t}\n')
 block.append('\t\t\t}\n')
 block.append('\n')

 for idx, bline in enumerate(block):
 lines.insert(shell_idx + idx, bline)

 print(f"Inserted {len(block)} lines")

# 2. Add extra bin dirs after .antigravity-ide
antig_idx = None
for i, line in enumerate(lines):
 if '.antigravity-ide' in line and 'dirs.push' in line:
 antig_idx = i
 break

if antig_idx is not None:
 print(f"Found antigravity at line {antig_idx + 1}")
 extras = []
 extras.append('\t\tdirs.push(PathBuf::from(&home).join(".claude").join("bin"));\n')
 extras.append('\t\tdirs.push(PathBuf::from(&home).join(".cursor").join("bin"));\n')
 extras.append('\t\tif let Ok(nvm) = std::env::var("NVM_DIR") {\n')
 extras.append('\t\tdirs.push(PathBuf::from(&nvm).join("versions").join("node").join("v").join("bin"));\n')
 extras.append('\t\tdirs.push(PathBuf::from(&nvm).join("versions").join("node").join(".bin"));\n')
 extras.append('\t\t}\n')
 extras.append('\t\tif let Ok(volta) = std::env::var("VOLTA_HOME") {\n')
 extras.append('\t\tdirs.push(PathBuf::from(&volta).join("bin"));\n')
 extras.append('\t\t}\n')
 extras.append('\t\tif let Ok(fnm) = std::env::var("FNM_DIR") {\n')
 extras.append('\t\tdirs.push(PathBuf::from(&fnm).join("bin"));\n')
 extras.append('\t\t}\n')
 extras.append('\t\tdirs.push(PathBuf::from(&home).join(".asdf").join("shims"));\n')

 for idx, eline in enumerate(extras):
 lines.insert(antig_idx + 1 + idx, eline)

 print(f"Inserted {len(extras)} extra dir lines")
else:
 print("WARNING: antigravity line not found")

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
 f.writelines(lines)

print("All fixes complete!")
