import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
	content = f.read()

start_marker = 'fn login_shell_path_dirs()'
end_marker = '\nfn augmented_path_env()'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
	print("ERROR: markers not found")
	sys.exit(1)

new_func = '''fn login_shell_path_dirs() -> &'static [PathBuf] {
	static DIRS: OnceLock<Vec<PathBuf>> = OnceLock::new();
	DIRS.get_or_init(|| {
		#[cfg(windows)]
		{
			Vec::new()
		}
		#[cfg(not(windows))]
		{
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

			let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
			let (tx, rx) = mpsc::channel();
			std::thread::spawn(move || {
				let result = std::process::Command::new(&shell)
					.arg("-lc")
					.arg("printf '%s' \\"$PATH\\"")
					.output();
				let _ = tx.send(result);
			});
			match rx.recv_timeout(std::time::Duration::from_secs(3)) {
				Ok(Ok(out)) if out.status.success() => {
					let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
					if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }
					Vec::new()
				}
				Ok(Ok(out)) => {
					println!("[Rust] login shell PATH probe exited non-zero");
					Vec::new()
				}
				Ok(Err(e)) => {
					println!("[Rust] login shell PATH probe failed: {e:?}");
					Vec::new()
				}
				Err(_) => {
					println!("[Rust] login shell PATH probe timed out after 3s");
					Vec::new()
				}
			}
		}
	})
}
'''

new_content = content[:start_idx] + new_func + content[end_idx:]

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
	f.write(new_content)

print("Function replaced successfully!")
