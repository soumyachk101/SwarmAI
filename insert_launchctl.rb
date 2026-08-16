#!/usr/bin/env ruby
# Insert launchctl block before "let shell" line

file = 'swarm/src-tauri/src/lib.rs'
lines = File.readlines(file)

# Find shell line
shell_idx = lines.find_index { |l| l.include?('let shell = std::env::var("SHELL")') }
puts "Found shell at line #{shell_idx + 1}" if shell_idx

if shell_idx
 # Get the indentation from the shell line
 shell_line = lines[shell_idx]
 indent = shell_line[/^\s*/]
 t1 = indent # same as shell line
 t2 = indent + ' ' # one more space

 block = [
 "#{t1}// On macOS, ask launchd for the GUI PATH first (no shell probe needed)\n",
 "#{t1}if cfg!(target_os = \"macos\") {\n",
 "#{t1}if let Ok(lc) = std::process::Command::new(\"launchctl\")\n",
 "#{t2}.args([\"getenv\", \"PATH\"])\n",
 "#{t2}.output()\n",
 "#{t1}{\n",
 "#{t1}if lc.status.success() {\n",
 "#{t1}let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();\n",
 "#{t1}if !raw.is_empty() {\n",
 "#{t1}let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();\n",
 "#{t1}if !dirs.is_empty() { return dirs; }\n",
 "#{t1}}\n",
 "#{t1}}\n",
 "#{t1}}\n",
 "#{t1}}\n",
 "\n",
 ]

 lines[shell_idx, 0] = block
 File.write(file, lines.join)
 puts "Inserted launchctl block"
else
 puts "ERROR: shell line not found"
end
