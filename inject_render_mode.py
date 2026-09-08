#!/usr/bin/env python3
"""Inject the render-mode scene engine into the HTML file."""

import os

filepath = '/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/swarm-ai-motion-video.html'

with open(filepath, 'r') as f:
 content = f.read()

# ── 1. CSS additions ──────────────────────────────────────────────────────
old_css_end = """ .render-mode .scene { transition: none !important; }
 .render-mode * { animation: none !important; }
 .render-mode canvas#bg { opacity: 1; }"""

new_css_end = """ .render-mode .scene { transition: none !important; }
 .render-mode * { animation: none !important; }
 .render-mode canvas#bg { opacity: 1; }"""

# The CSS render-mode block is already there from the earlier CSS edit.
# We'll leave it as-is (it has the extra canvas#bg rule which is harmless).

# ── 2. Particle loop ──────────────────────────────────────────────────────
# We already added `let bgLoopActive = true;` and `let bgLoopId = null;` above.
# And the animBg loop already checks `if (!bgLoopActive) return;`
# So particle control is done.

# ── 3. Scene engine replacement ──────────────────────────────────────────
# Find the scene engine section by locating the comment marker
marker_start = '// SCENE ENGINE'
marker_end = '// ═══════════════════════════════════════════════\n// BUILT-IN SCREEN RECORDER'

idx_start = content.find(marker_start)
idx_end = content.find(marker_end)

print(f"Scene engine found at char {idx_start}")
print(f"Screen recorder found at char {idx_end}")

if idx_start < 0:
 print("ERROR: Could not find scene engine marker")
 exit(1)

if idx_end < 0:
 print("ERROR: Could not find screen recorder marker")
 exit(1)

# Extract everything before and after
before = content[:idx_start]
after = content[idx_end:]

new_scene = """// SCENE ENGINE + RENDER MODE
// ═══════════════════════════════════════════════
const SCENE_TIMES = [0, 10, 20, 32, 46, 56, 65, 75, 84]; // cumulative end times (seconds)
const SCENE_DURATIONS = [10, 10, 12, 14, 10, 9, 10, 8, 9];
const TOTAL_DURATION = 90; // seconds
const TOTAL = TOTAL_DURATION;

const ids = ['s0','s1','s2','s3','s4','s5','s6','s7','s8'];
const times = SCENE_TIMES;
let cur = -1;

const prog = document.getElementById('progress');
const dots = document.querySelectorAll('.dot');
let isRenderMode = false;

function go(i) {
 ids.forEach((id, j) => document.getElementById(id).classList.toggle('active', j === i));
 dots.forEach((d, j) => d.classList.toggle('on', j === i));
}

function reset() {
 cur = -1;
 ids.forEach(id => document.getElementById(id).classList.remove('active'));
 dots.forEach(d => d.classList.remove('on'));
 dots[0].classList.add('on');
 prog.style.width = '0%';
}

function seek(t) {
 t = Math.max(0, Math.min(t, TOTAL_DURATION));
 prog.style.width = (t / TOTAL_DURATION * 100) + '%';
 for (let i = times.length - 1; i >= 0; i--) {
 if (t >= times[i]) {
 if (cur !== i) { cur = i; go(i); }
 break;
 }
 }
}

let renderId = null;
function startRender() {
 cancelAnimationFrame(renderId);
 cancelAnimationFrame(bgLoopId);
 bgLoopActive = false;

 document.body.classList.add('render-mode');
 isRenderMode = true;

 document.removeEventListener('click', handleClick);

 const renderTime = parseInt(new URLSearchParams(window.location.search).get('time'), 10);
 if (!isNaN(renderTime)) {
 seek(renderTime);
 }

 document.dispatchEvent(new CustomEvent('frame-ready', { detail: { time: renderTime || 0 } }));
}

function startNormal() {
 document.body.classList.remove('render-mode');
 isRenderMode = false;
 reset();
 t0 = null;
 requestAnimationFrame(tick);
}

function handleClick() {
 if (t0 && cur === ids.length - 1) { reset(); requestAnimationFrame(tick); }
}

function tick(now) {
 if (!t0) t0 = now;
 const s = (now - t0) / 1000;
 seek(s);
 if (s < TOTAL_DURATION) {
 renderId = requestAnimationFrame(tick);
 }
}

let t0 = null;

// ─── MODE DETECTION ───
const urlParams = new URLSearchParams(window.location.search);
const renderTimeParam = urlParams.get('time');

if (renderTimeParam !== null) {
 startRender();
} else {
 document.addEventListener('click', handleClick);
 document.getElementById('replayBtn').addEventListener('click', e => {
 e.stopPropagation(); reset(); requestAnimationFrame(tick);
 });
 reset();
 requestAnimationFrame(tick);
}

"""

new_content = before + new_scene + after

with open(filepath, 'w') as f:
 f.write(new_content)

print("Done! Scene engine replaced with render-mode version.")

# Verify
with open(filepath, 'r') as f:
 verify = f.read()

print(f"File size: {len(verify)} chars")
print(f"Contains 'SCENE_TIMES': {'SCENE_TIMES' in verify}")
print(f"Contains 'startRender': {'startRender' in verify}")
print(f"Contains 'render-mode': {'render-mode' in verify}")
print(f"Contains 'frame-ready': {'frame-ready' in verify}")
print(f"Contains 'bgLoopActive': {'bgLoopActive' in verify}")
