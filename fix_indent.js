const fs = require('fs');
const p = 'swarm/src-tauri/src/lib.rs';
let content = fs.readFileSync(p, 'utf8');

// Replace the broken launchctl block with a properly indented one
// The block currently has wrong indentation (1 space instead of 12)
const brokenBlock = ` // On macOS, ask launchd for the GUI PATH first (no shell probe needed)
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

 let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());`;

const fixedBlock = ` // On macOS, ask launchd for the GUI PATH first (no shell probe needed)
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

 let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());`;

if (content.includes(brokenBlock)) {
 content = content.replace(brokenBlock, fixedBlock);
 fs.writeFileSync(p, content);
 console.log('Fixed launchctl block indentation!');
} else {
 console.log('ERROR: broken block not found');
 // Debug: show what's actually there
 const lines = content.split('\n');
 for (let i = 680; i < 700; i++) {
 console.log(`L${i+1}: ${JSON.stringify(lines[i].substring(0, 60))}`);
 }
}
