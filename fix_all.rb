#!/usr/bin/env ruby
file = 'swarm/src-tauri/src/lib.rs'
content = File.read(file)

# Fix 1: -ilc -> -lc
content = content.gsub('.arg("-ilc")', '.arg("-lc")')

# Fix 2: echo -n $PATH -> printf '%s' "$PATH"
content = content.gsub('.arg("echo -n $PATH")', '.arg("printf \'%s\' \\"$PATH\\"")')

# Fix 3: path_str -> raw_str
content = content.gsub('let path_str = String::from_utf8_lossy(&out.stdout)', 'let raw_str = String::from_utf8_lossy(&out.stdout)')

# Fix 4: raw_str guard with proper indentation
content = content.gsub(
 /std::env::split_paths\(&path_str\)\.collect\(\)/,
 'if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }\n Vec::new()'
)

# Fix 5: Error messages
content = content.gsub(
 'println!("[Rust] login shell PATH probe exited non-zero: {:?}", out.status);',
 'println!("[Rust] login shell PATH probe exited non-zero");'
)
content = content.gsub(
 'println!("[Rust] login shell PATH probe failed to run: {e:?}");',
 'println!("[Rust] login shell PATH probe failed: {e:?}");'
)

# Fix 6: Insert launchctl block before "let shell"
launchctl_block = <<~BLOCK
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

BLOCK

content = content.sub(
 /(\s+)let shell = std::env::var\("SHELL"\)/,
 launchctl_block + '\1let shell = std::env::var("SHELL")'
)

File.write(file, content)
puts "All fixes applied!"
