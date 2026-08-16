#!/usr/bin/env ruby
# Fix launchctl block indentation

file = 'swarm/src-tauri/src/lib.rs'
lines = File.readlines(file)

# Find launchctl comment line
comment_idx = lines.find_index { |l| l.include?('On macOS, ask launchd') }
puts "Found comment at line #{comment_idx + 1}" if comment_idx

if comment_idx
 # Get the indentation from the shell line (should be same as comment)
 shell_idx = lines.find_index { |l| l.include?('let shell = std::env::var("SHELL")') }
 shell_line = lines[shell_idx]
 base_indent = shell_line[/^\s*/] # 12 spaces

 # Fix indentation: base level should match shell line
 lines[comment_idx] = base_indent + '// On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n'
 lines[comment_idx + 1] = base_indent + 'if cfg!(target_os = "macos") {\n'
 lines[comment_idx + 2] = base_indent + 'if let Ok(lc) = std::process::Command::new("launchctl")\n'
 lines[comment_idx + 3] = base_indent + ' .args(["getenv", "PATH"])\n'
 lines[comment_idx + 4] = base_indent + ' .output()\n'
 lines[comment_idx + 5] = base_indent + '{\n'
 lines[comment_idx + 6] = base_indent + 'if lc.status.success() {\n'
 lines[comment_idx + 7] = base_indent + 'let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n'
 lines[comment_idx + 8] = base_indent + 'if !raw.is_empty() {\n'
 lines[comment_idx + 9] = base_indent + 'let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n'
 lines[comment_idx + 10] = base_indent + 'if !dirs.is_empty() { return dirs; }\n'
 lines[comment_idx + 11] = base_indent + '}\n'
 lines[comment_idx + 12] = base_indent + '}\n'
 lines[comment_idx + 13] = base_indent + '}\n'
 lines[comment_idx + 14] = base_indent + '}\n'

 File.write(file, lines.join)
 puts "Fixed indentation"
else
 puts "ERROR: comment not found"
end
