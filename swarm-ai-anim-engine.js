/**
 * Swarm AI — Premium Product Video Animation Engine
 *
 * Provides the timeline system, playback control, render-mode seeking,
 * audio trigger scaffolding, and orchestrates the particle canvas.
 *
 * Exposes: window.SwarmVideo
 */

// ──────────────────────────────────────────────
// TIMELINE DEFINITION
// ──────────────────────────────────────────────

const TIMELINE = {
 fps: 60,
 totalDuration: 104, // seconds — last scene (s8) ends at 94 + 10
 scenes: [
 { id: 's0', name: 'hook', start: 0, duration: 12 },
 { id: 's1', name: 'problem', start: 12, duration: 12 },
 { id: 's2', name: 'swarm-title', start: 24, duration: 12 },
 { id: 's3', name: 'pheromone', start: 36, duration: 14 },
 { id: 's4', name: 'orchestration',start: 50, duration: 13 },
 { id: 's5', name: 'worktrees', start: 63, duration: 13 },
 { id: 's6', name: 'features', start: 76, duration: 10 },
 { id: 's7', name: 'techstack', start: 86, duration: 8 },
 { id: 's8', name: 'cta', start: 94, duration: 10 },
 ],

 /**
 * Convenience: get the cumulative start time for each scene as a flat array.
 */
 get startTimes() {
 const arr = [];
 let t = 0;
 for (const s of this.scenes) { arr.push(t); t += s.duration; }
 return arr;
 },

 /** Total duration in milliseconds. */
 get totalMs() { return this.totalDuration * 1000; },
};

// ──────────────────────────────────────────────
// SCENE LOOKUP HELPERS
// ──────────────────────────────────────────────

/**
 * Return the scene index and progress [0-1] within that scene
 * for the given time in milliseconds.
 *
 * @param {number} ms — elapsed milliseconds
 * @returns {{ index: number, progress: number }}
 */
function getSceneAtTime(ms) {
 const t = Math.max(0, Math.min(ms, TIMELINE.totalMs));
 const seconds = t / 1000;

 for (let i = TIMELINE.scenes.length - 1; i >= 0; i--) {
 if (seconds >= TIMELINE.scenes[i].start) {
 const elapsedInScene = seconds - TIMELINE.scenes[i].start;
 const progress = Math.min(elapsedInScene / TIMELINE.scenes[i].duration, 1);
 return { index: i, progress };
 }
 }
 return { index: 0, progress: 0 };
}

/**
 * Overall playback progress [0-1].
 */
function getProgress(ms) {
 return Math.min(Math.max(ms / TIMELINE.totalMs, 0), 1);
}

// ──────────────────────────────────────────────
// SCENE DOM MANAGEMENT
// ──────────────────────────────────────────────

const sceneIds = TIMELINE.scenes.map(s => s.id);

/**
 * Toggle the `.active` class so exactly one scene div is visible.
 * @param {number} index
 */
function setActiveScene(index) {
 sceneIds.forEach((id, i) => {
 const el = document.getElementById(id);
 if (!el) return;
 if (i === index) {
 el.classList.add('active');
 } else {
 el.classList.remove('active');
 }
 });
}

/**
 * Remove `.active` from every scene (used by reset).
 */
function clearAllScenes() {
 sceneIds.forEach(id => {
 const el = document.getElementById(id);
 if (el) el.classList.remove('active');
 });
}

// ──────────────────────────────────────────────
// AUDIO EVENT SYSTEM (future use)
// ──────────────────────────────────────────────

/**
 * Audio triggers — fired automatically during playback.
 * Extend this array to add SFX / BGM changes at specific timestamps.
 *
 * Each entry:
 * time — milliseconds
 * type — 'bgm' | 'sfx'
 * action — 'play' | 'pause' | 'fade' | 'volume'
 * payload — optional data (e.g. { volume: 0.3 })
 */
const AUDIO_TRIGGERS = [
 // Example entries (uncomment and wire up when AudioContext is ready):
 // { time: 0, type: 'bgm', action: 'play', payload: { volume: 0.15, fade: 2 } },
 // { time: 12000, type: 'sfx', action: 'play', payload: { name: 'whoosh' } },
 // { time: 24000, type: 'sfx', action: 'play', payload: { name: 'chime' } },
 // { time: 36000, type: 'bgm', action: 'volume', payload: { volume: 0.25 } },
 // { time: 50000, type: 'sfx', action: 'play', payload: { name: 'pop' } },
 // { time: 63000, type: 'sfx', action: 'play', payload: { name: 'click' } },
 // { time: 76000, type: 'bgm', action: 'fade', payload: { to: 0.3, dur: 3 } },
 // { time: 94000, type: 'sfx', action: 'play', payload: { name: 'chime' } },
];

/**
 * Scene-level BGM volume map.
 * Applied when entering a scene during playback.
 */
const SCENE_BGM = [
 { scene: 'hook', volume: 0.12 },
 { scene: 'problem', volume: 0.10 },
 { scene: 'swarm-title', volume: 0.18 },
 { scene: 'pheromone', volume: 0.20 },
 { scene: 'orchestration',volume: 0.22 },
 { scene: 'worktrees', volume: 0.18 },
 { scene: 'features', volume: 0.20 },
 { scene: 'techstack', volume: 0.22 },
 { scene: 'cta', volume: 0.25 },
];

/** Audio context stub — replace with real AudioContext wiring. */
let audioCtx = null;
let bgmGain = null;

function initAudio() {
 if (audioCtx) return;
 try {
 audioCtx = new (window.AudioContext || window.webkitAudioContext)();
 bgmGain = audioCtx.createGain();
 bgmGain.connect(audioCtx.destination);
 bgmGain.gain.value = 0;
 } catch (_) {
 // Audio not supported — silent fallback
 }
}

function setBgmVolume(vol) {
 if (bgmGain && audioCtx) {
 bgmGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.3);
 }
}

function checkAudioTriggers(ms) {
 if (!audioCtx) return;
 for (const trig of AUDIO_TRIGGERS) {
 if (Math.abs(ms - trig.time) < 40) {
 // Within one frame of the trigger time
 if (trig.type === 'bgm') {
 if (trig.action === 'volume') setBgmVolume(trig.payload.volume);
 if (trig.action === 'fade') {
 bgmGain.gain.setTargetAtTime(
 trig.payload.to,
 audioCtx.currentTime,
 trig.payload.dur || 1
 );
 }
 }
 // SFX triggers would be dispatched here once sound assets are loaded.
 }
 }
}

// ──────────────────────────────────────────────
// PROGRESS BAR & DOTS (delegated from HTML)
// ──────────────────────────────────────────────

const progressBar = () => document.getElementById('progress');
const dotEls = () => document.querySelectorAll('#dots .dot');

function updateProgressUI(ms) {
 const p = getProgress(ms);
 const bar = progressBar();
 if (bar) bar.style.width = (p * 100) + '%';
}

function updateDotsUI(sceneIndex) {
 const dots = dotEls();
 dots.forEach((d, i) => d.classList.toggle('on', i === sceneIndex));
}

// ──────────────────────────────────────────────
// PLAYBACK STATE
// ──────────────────────────────────────────────

let _rafId = null; // requestAnimationFrame handle
let _startTime = null; // performance.now() at play start
let _pausedAt = 0; // ms elapsed when paused
let _isPlaying = false;
let _currentScene = -1;

// Exposed for particle system to read elapsed time
let currentTimeMs = 0;

// ──────────────────────────────────────────────
// CORE: startPlayback
// ──────────────────────────────────────────────

/**
 * Start (or restart) the playback loop.
 * Call initAudio() on first user interaction if audio is desired.
 */
function startPlayback() {
 // Lazy-init audio context (needs user gesture in most browsers)
 initAudio();

 reset();
 _startTime = null;
 _currentScene = -1;
 _isPlaying = true;
 _pausedAt = 0;

 // Kick off the RAF loop — first tick sets _startTime
 _rafId = requestAnimationFrame(_tick);
}

// ──────────────────────────────────────────────
// CORE: _tick (internal RAF loop)
// ──────────────────────────────────────────────

function _tick(now) {
 if (!_isPlaying) return;

 if (_startTime === null) _startTime = now;

 const elapsed = now - _startTime + _pausedAt;
 currentTimeMs = elapsed;

 // Check scene transition
 const { index, progress } = getSceneAtTime(elapsed);
 if (index !== _currentScene) {
 _currentScene = index;
 setActiveScene(index);
 updateDotsUI(index);

 // Scene-enter audio
 const bgmEntry = SCENE_BGM[index];
 if (bgmEntry) setBgmVolume(bgmEntry.volume);
 }

 // Per-frame updates
 updateProgressUI(elapsed);
 checkAudioTriggers(elapsed);

 // Dispatch a custom event so external code (particles, etc.) can react
 window.dispatchEvent(new CustomEvent('swarm:frame', {
 detail: { time: elapsed, scene: _currentScene, progress },
 }));

 // End of timeline — stop loop
 if (elapsed >= TIMELINE.totalMs) {
 _isPlaying = false;
 return;
 }

 _rafId = requestAnimationFrame(_tick);
}

// ──────────────────────────────────────────────
// CORE: seekTo (render mode)
// ──────────────────────────────────────────────

/**
 * Seek to an exact timestamp. Used by render mode for frame-accurate capture.
 * No RAF loop is started.
 *
 * @param {number} ms — target time in milliseconds
 * @fires CustomEvent 'frame-ready' — emitted once the frame is set
 */
function seekTo(ms) {
 currentTimeMs = ms;

 const { index, progress } = getSceneAtTime(ms);
 _currentScene = index;

 setActiveScene(index);
 updateProgressUI(ms);
 updateDotsUI(index);

 window.dispatchEvent(new CustomEvent('frame-ready', {
 detail: { time: ms, scene: index, progress },
 }));
}

// ──────────────────────────────────────────────
// CORE: reset
// ──────────────────────────────────────────────

/**
 * Reset all state: clear active scenes, stop playback, zero progress.
 */
function reset() {
 if (_rafId) {
 cancelAnimationFrame(_rafId);
 _rafId = null;
 }
 _isPlaying = false;
 _startTime = null;
 _pausedAt = 0;
 _currentScene = -1;
 currentTimeMs = 0;

 clearAllScenes();

 const bar = progressBar();
 if (bar) bar.style.width = '0%';

 const dots = dotEls();
 dots.forEach((d, i) => d.classList.toggle('on', i === 0));
}

// ──────────────────────────────────────────────
// RENDER-MODE AUTO-INIT
// ──────────────────────────────────────────────

/**
 * If the URL contains ?time=MS, enter render mode.
 * Sets body class, seeks to the exact frame, and fires 'frame-ready'.
 */
function initRenderMode() {
 const params = new URLSearchParams(window.location.search);
 const timeParam = params.get('time');

 if (timeParam !== null) {
 document.body.classList.add('render-mode');
 const ms = parseInt(timeParam, 10);
 if (!isNaN(ms)) {
 // Small delay so the DOM settles before seeking
 requestAnimationFrame(() => seekTo(ms));
 }
 return true; // render mode is active
 }
 return false;
}

// ──────────────────────────────────────────────
// BOOT
// ──────────────────────────────────────────────

(function boot() {
 const isRender = initRenderMode();

 if (!isRender) {
 // Auto-start interactive playback
 startPlayback();
 }
})();

// ──────────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────────

window.SwarmVideo = Object.freeze({
 TIMELINE,
 startPlayback,
 seekTo,
 reset,
 getSceneAtTime,
 getProgress,
 setActiveScene,
 get currentTimeMs() { return currentTimeMs; },
});
