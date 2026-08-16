#!/usr/bin/env python3
import re

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 content = f.read()

# Find the login_shell_path_dirs function
pattern = r'(fn login_shell_path_dirs\(\) -> &\'static \[PathBuf\] \{[^}]+#[cfg\(not\(windows\)\)\]\s*\{)[^}]+(#[cfg\(w?indows\)\]\s*\{\s*Vec::new\(\)\s+\}\s+#\[cfg\(not\(windows\)\)\]\s*\{[^}]+?\})\s+std::thread::spawn\(move \|\|[^}]+\}\s*\);\s+match rx\.recv_timeout\([^}]+\}\s*\}\s*\}\s+\))'

# Try simpler approach: replace specific sections
# 1. Replace -ilc with -lc
content = content.replace('.arg("-ilc")', '.arg("-lc")')

# 2. Replace echo -n $PATH with printf
content = content.replace('.arg("echo -n $PATH")', '.arg("printf \'%s\' \\"$PATH\\"")')

# 3. Replace path_str with raw_str in the match block
content = content.replace(
 'let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();',
 'let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();'
)
content = content.replace(
 'std::env::split_paths(&path_str).collect()',
 'if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }\n Vec::new()'
)

# 4. Fix error messages
content = content.replace(
 'println!("[Rust] login shell PATH probe exited non-zero: {:?}", out.status);',
 'println!("[Rust] login shell PATH probe exited non-zero");'
)
content = content.replace(
 'println!("[Rust] login shell PATH probe failed to run: {e:?}");',
 'println!("[Rust] login shell PATH probe failed: {e:?}");'
)

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
 f.write(content)

print("Applied all content fixes!")
