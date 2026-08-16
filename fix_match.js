const fs = require('fs');
const p = 'swarm/src-tauri/src/lib.rs';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Fix match block lines using line indices
// Line 706 (index 705): Ok(Ok(out)) if out.status.success() => {
// Line 707 (index 706): let path_str = String::from_utf8_lossy...
// Line 708 (index 707): std::env::split_paths(&path_str).collect()
lines[706] = ' let raw_str = String::from_utf8_lossy(&out.stdout).trim().to_string();';
lines[707] = ' if !raw_str.is_empty() { return std::env::split_paths(&raw_str).collect(); }';

// Line 710 (index 709): Ok(Ok(out)) => {
// Line 711 (index 710): println!(... exited non-zero: {:?}", out.status);
lines[710] = ' println!("[Rust] login shell PATH probe exited non-zero");';

// Line 713 (index 712): Ok(Err(e)) => {
// Line 714 (index 713): println!(... failed to run: {e:?}");
lines[713] = ' println!("[Rust] login shell PATH probe failed: {e:?}");';

fs.writeFileSync(p, lines.join('\n'));
console.log('Match block fixed');
console.log('L707:', lines[706]);
console.log('L708:', lines[707]);
console.log('L711:', lines[710]);
console.log('L714:', lines[713]);
