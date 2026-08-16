#!/usr/bin/env ruby
# Fix login_shell_path_dirs

content = File.read('swarm/src-tauri/src/lib.rs')

# Replace simple strings
content = content.gsub('.arg("-ilc")', '.arg("-lc")')
content = content.gsub('.arg("echo -n $PATH")', '.arg("printf \'%s\' \\"$PATH\\"")')
content = content.gsub('let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();', 'let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();')
content = content.gsub('std::env::split_paths(&path_str).collect()', 'if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }')
content = content.gsub('Vec::new()', 'Vec::new()', content)
content = content.gsub('println!("[Rust] login shell PATH probe exited non-zero: {:?}", out.status);', 'println!("[Rust] login shell PATH probe exited non-zero");')
content = content.gsub('println!("[Rust] login shell PATH probe failed to run: {e:?}");', 'println!("[Rust] login shell PATH probe failed: {e:?}");')

File.write('swarm/src-tauri/src/lib.rs', content)
puts "Done!"
