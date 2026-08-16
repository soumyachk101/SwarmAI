const fs = require('fs');
const p = 'swarm/src-tauri/src/lib.rs';
let lines = fs.readFileSync(p, 'utf8').split('\n');

const IND = Array(12).fill(' ').join('');

// Strategy: find lines by content, replace by index

// 1. Find "let shell = std::env::var" line and insert launchctl before it
let shellIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('let shell = std::env::var("SHELL")')) {
 shellIdx = j;
 break;
 }
}

if (shellIdx === null) { console.log('ERROR: shell line not found'); process.exit(1); }

const block = [
 IND + '// On macOS, ask launchd for the GUI PATH first (no shell probe needed)',
 IND + 'if cfg!(target_os = "macos") {',
 IND + 'if let Ok(lc) = std::process::Command::new("launchctl")',
 IND + '.args(["getenv", "PATH"])',
 IND + '.output()',
 IND + '{',
 IND + 'if lc.status.success() {',
 IND + 'let raw = String::from_utf8_lossy(&lc.stdout).trim().to_string();',
 IND + 'if !raw.is_empty() {',
 IND + 'let dirs: Vec<PathBuf> = std::env::split_paths(&raw).collect();',
 IND + 'if !dirs.is_empty() { return dirs; }',
 IND + '}',
 IND + '}',
 IND + '}',
 IND + '}',
 IND + '',
];

lines.splice(shellIdx, 0, ...block);
console.log('Inserted launchctl block at line', shellIdx + 1);

// 2. Now find and fix .arg("-ilc") and .arg("echo -n $PATH")
let ilcIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('"-ilc"')) {
 ilcIdx = j;
 break;
 }
}
if (ilcIdx !== null) {
 lines[ilcIdx] = IND + ' .arg("-lc")';
 console.log('Fixed -ilc at line', ilcIdx + 1);
}

let echoIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('echo -n $PATH')) {
 echoIdx = j;
 break;
 }
}
if (echoIdx !== null) {
 lines[echoIdx] = IND + ' .arg("printf \'%s\' \\"$PATH\\"")';
 console.log('Fixed echo-n at line', echoIdx + 1);
}

// 3. Find and fix match block lines
let pathStrIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('let path_str = String::from_utf8_lossy(&out.stdout)')) {
 pathStrIdx = j;
 break;
 }
}
if (pathStrIdx !== null) {
 lines[pathStrIdx] = IND + ' let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();';
 lines[pathStrIdx + 1] = IND + ' if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }';
 console.log('Fixed raw_str at line', pathStrIdx + 1);
}

let exitedIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('login shell PATH probe exited non-zero:') && lines[j].includes('{:?}')) {
 exitedIdx = j;
 break;
 }
}
if (exitedIdx !== null) {
 lines[exitedIdx] = IND + ' println!("[Rust] login shell PATH probe exited non-zero");';
 console.log('Fixed exited non-zero at line', exitedIdx + 1);
}

let failedIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('login shell PATH probe failed to run:') && lines[j].includes('{e:?}')) {
 failedIdx = j;
 break;
 }
}
if (failedIdx !== null) {
 lines[failedIdx] = IND + ' println!("[Rust] login shell PATH probe failed: {e:?}");';
 console.log('Fixed failed to run at line', failedIdx + 1);
}

// 4. Add extra bin dirs
let antigIdx = null;
for (let j = 0; j < lines.length; j++) {
 if (lines[j].includes('.antigravity-ide') && lines[j].includes('dirs.push')) {
 antigIdx = j;
 break;
 }
}

if (antigIdx !== null) {
 const extraDirs = [
 IND + 'dirs.push(PathBuf::from(&home).join(".claude").join("bin"));',
 IND + 'dirs.push(PathBuf::from(&home).join(".cursor").join("bin"));',
 IND + 'if let Ok(nvm) = std::env::var("NVM_DIR") {',
 IND + 'dirs.push(PathBuf::from(&nvm).join("versions").join("node").join("v").join("bin"));',
 IND + 'dirs.push(PathBuf::from(&nvm).join("versions").join("node").join(".bin"));',
 IND + '}',
 IND + 'if let Ok(volta) = std::env::var("VOLTA_HOME") {',
 IND + 'dirs.push(PathBuf::from(&volta).join("bin"));',
 IND + '}',
 IND + 'if let Ok(fnm) = std::env::var("FNM_DIR") {',
 IND + 'dirs.push(PathBuf::from(&fnm).join("bin"));',
 IND + '}',
 IND + 'dirs.push(PathBuf::from(&home).join(".asdf").join("shims"));',
 ];
 lines.splice(antigIdx + 1, 0, ...extraDirs);
 console.log('Inserted extra dirs at line', antigIdx + 2);
}

fs.writeFileSync(p, lines.join('\n'));
console.log('\nAll fixes applied!');
