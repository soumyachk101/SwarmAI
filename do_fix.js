const fs = require('fs');
const path = '/Users/soumyachakraborty/Documents/Projects-939/AI-Agents/swarm-ai/swarm/src-tauri/src/lib.rs';
let code = fs.readFileSync(path, 'utf8');

// ── Fix 1: shell args (only replace if original strings still present) ──────
if (code.includes('-ilc')) {
 code = code.replace(/-ilc/g, '-lc');
}
if (code.includes('echo -n $PATH')) {
 code = code.replace(/echo -n \$PATH/g, "printf '%s' \"$PATH\"");
}

// ── Fix 2: insert macOS launchctl block before `let shell = ...` ────────────
const macosBlock = ` // On macOS, ask launchd for the GUI PATH first (no shell probe needed)
 if cfg!(target_os = "macos") {
 if let Ok(raw) = std::process::Command::new("launchctl")
 .args(["getenv", "PATH"])
 .output()
 {
 if raw.status.success() {
 if let Ok(launchctl_path) = String::from_utf8(raw.stdout) {
 let trimmed = launchctl_path.trim();
 if !trimmed.is_empty() {
 let dirs: Vec<PathBuf> = std::env::split_paths(trimmed).collect();
 if !dirs.is_empty() { return dirs; }
 }
 }
 }
 }
 }

`;

const shellLine = ' let shell = std::env::var("SHELL")';
if (code.includes(shellLine) && !code.includes('ask launchd for the GUI PATH')) {
 code = code.replace(shellLine, macosBlock + shellLine);
}

// ── Fix 3: match block ──────────────────────────────────────────────────────
const oldSuccessBranch = ` Ok(Ok(out)) if out.status.success() => {
 let path_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
 std::env::split_paths(&path_str).collect()
 }`;

const newSuccessBranch = ` Ok(Ok(out)) if out.status.success() => {
 let raw_str = String::from_utf8_lossy(&out.stdout);
 let trimmed = raw_str.trim();
 if trimmed.is_empty() {
 println!("[Rust] login shell PATH probe returned empty string");
 Vec::new()
 } else {
 return std::env::split_paths(trimmed).collect::<Vec<PathBuf>>();
 }
 }`;

if (code.includes('let path_str = String::from_utf8_lossy')) {
 code = code.replace(oldSuccessBranch, newSuccessBranch);
}

const oldErrMsg = 'println!("[Rust] login shell PATH probe failed to run: {e:?}")';
const newErrMsg = 'println!("[Rust] login shell PATH probe I/O error: {e:?}")';
if (code.includes(oldErrMsg)) {
 code = code.replace(oldErrMsg, newErrMsg);
}

// ── Fix 4: extra dirs after .antigravity-ide bin ────────────────────────────
const antigravityLine = ' dirs.push(PathBuf::from(&home).join(".antigravity-ide").join("bin"));';
const extraDirsBlock = ` dirs.push(PathBuf::from(&home).join(".antigravity-ide").join("bin"));
 dirs.push(PathBuf::from(&home).join(".claude").join("bin"));
 dirs.push(PathBuf::from(&home).join(".cursor").join("bin"));
 if let Ok(nvm) = std::env::var("NVM_DIR") {
 dirs.push(PathBuf::from(&nvm).join("versions").join("node").join("v").join("bin"));
 dirs.push(PathBuf::from(&nvm).join("versions").join("node").join(".bin"));
 }
 if let Ok(volta) = std::env::var("VOLTA_HOME") {
 dirs.push(PathBuf::from(&volta).join("bin"));
 }
 if let Ok(fnm) = std::env::var("FNM_DIR") {
 dirs.push(PathBuf::from(&fnm).join("bin"));
 }
 dirs.push(PathBuf::from(&home).join(".asdf").join("shims"));
`;

if (code.includes(antigravityLine) && !code.includes('join(".claude").join("bin")')) {
 code = code.replace(antigravityLine, extraDirsBlock);
}

fs.writeFileSync(path, code);
console.log('All 4 fixes applied successfully.');
