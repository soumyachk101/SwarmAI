import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 content = f.read()

# Simple string replacements
content = content.replace('.arg("-ilc")', '.arg("-lc")')
content = content.replace('.arg("echo -n $PATH")', '.arg("printf \'%s\' \\"$PATH\\"")')
content = content.replace(
 'let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();',
 'let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();'
)
content = content.replace(
 'std::env::split_paths(&path_str).collect()',
 'if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }\n\t\t\t\tVec::new()'
)
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

print("Simple fixes applied!")
