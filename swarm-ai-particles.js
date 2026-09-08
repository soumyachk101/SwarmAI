/**
 * Swarm AI — Particle System Module
 *
 * Three components:
 * ParticleNetwork — background particles with connection lines
 * GlyphParticles — floating code glyphs
 * ConnectionLines — thin tinted lines between nearby particles
 *
 * All rendering is on a single shared <canvas>.
 * No dependencies — vanilla JS.
 */

// ──────────────────────────────────────────────
// UTILITY HELPERS
// ──────────────────────────────────────────────

/** Seeded pseudo-random for deterministic render mode. */
function mulberry32(a) {
 return function () {
 a |= 0;
 a = a + 0x6D2B79F5 | 0;
 let t = Math.imul(a ^ a >>> 15, 1 | a);
 t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
 return ((t ^ t >>> 14) >>> 0) / 4294967296;
 };
}

/** Clamp value between min and max. */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ──────────────────────────────────────────────
// PARTICLE NETWORK
// ──────────────────────────────────────────────

/**
 * ParticleNetwork — manages a set of drifting particles on a canvas.
 *
 * Particles gently drift using sine-wave modulation and are subtly
 * attracted to the mouse cursor (parallax).
 * Thin connection lines are drawn between particles closer than
 * connectionDistance.
 *
 * @example
 * const net = new ParticleNetwork(canvas, {
 * count: 60,
 * colors: ['hsl(22,70%,60%)', 'hsl(255,60%,60%)'],
 * connectionDistance: 120,
 * mouseInfluence: 0.00004,
 * });
 * net.init();
 * // In your RAF loop: net.update(dt); net.draw();
 * window.addEventListener('resize', () => net.resize());
 */
class ParticleNetwork {
 /**
 @param {HTMLCanvasElement} canvas
 @param {object} cfg
 @param {number} [cfg.count=60]
 @param {string[]} [cfg.colors=['hsl(22,70%,60%)','hsl(255,60%,60%)']]
 @param {number} [cfg.connectionDistance=120]
 @param {number} [cfg.mouseInfluence=0.00004]
 @param {number} [cfg.lineColor='255,107,0']
 @param {number} [cfg.lineMaxOpacity=0.04]
 @param {number} [cfg.lineWidth=0.5]
 */
 constructor(canvas, cfg = {}) {
 this.canvas = canvas;
 this.ctx = canvas.getContext('2d');
 this.count = cfg.count || 60;
 this.colors = cfg.colors || ['hsl(22,70%,60%)', 'hsl(255,60%,60%)'];
 this.connectionDistance = cfg.connectionDistance || 120;
 this.mouseInfluence = cfg.mouseInfluence || 0.00004;
 this.lineColor = cfg.lineColor || '255,107,0';
 this.lineMaxOpacity = cfg.lineMaxOpacity || 0.04;
 this.lineWidth = cfg.lineWidth || 0.5;

 this.W = 0;
 this.H = 0;
 this.particles = [];
 this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
 this._running = false;
 this._rafId = null;
 }

 /**
 * Create particle array. Call once.
 * @param {boolean} [deterministic=false] — use seeded RNG for render frames
 */
 init(deterministic = false) {
 this.resize();
 const rand = deterministic ? mulberry32(42) : Math.random;
 this.particles = [];

 for (let i = 0; i < this.count; i++) {
 this.particles.push({
 x: rand() * this.W,
 y: rand() * this.H,
 vx: (rand() - 0.5) * 0.2,
 vy: (rand() - 0.5) * 0.2,
 radius: 0.5 + rand() * 1.0,
 opacity: 0.05 + rand() * 0.2,
 hueIdx: rand() < 0.5 ? 0 : 1, // index into this.colors
 drift: rand() * 0.0005 + 0.0002,
 phase: rand() * Math.PI * 2, // sine offset for variety
 });
 }

 // Center mouse initially
 this.mouse.x = this.mouse.tx = this.W / 2;
 this.mouse.y = this.mouse.ty = this.H / 2;
 }

 /**
 * Resize canvas to fill its container / viewport.
 */
 resize() {
 this.W = this.canvas.width = window.innerWidth;
 this.H = this.canvas.height = window.innerHeight;
 }

 /**
 * Bind mouse-tracking listeners. Call once.
 */
 bindMouse() {
 document.addEventListener('mousemove', (e) => {
 this.mouse.tx = e.clientX;
 this.mouse.ty = e.clientY;
 });
 // Touch fallback
 document.addEventListener('touchmove', (e) => {
 if (e.touches.length) {
 this.mouse.tx = e.touches[0].clientX;
 this.mouse.ty = e.touches[0].clientY;
 }
 }, { passive: true });
 }

 /**
 * Update particle positions.
 * @param {number} t — current timestamp (performance.now() or ms)
 */
 update(t) {
 const { particles, W, H, mouse } = this;
 for (let i = 0; i < particles.length; i++) {
 const p = particles[i];

 // Sine-wave drift modulation
 p.vx += Math.sin(t * p.drift + p.phase) * 0.005;
 p.vy += Math.cos(t * p.drift + p.phase) * 0.005;

 // Mouse parallax — gentle attraction
 p.vx += (mouse.tx - p.x) * this.mouseInfluence;
 p.vy += (mouse.ty - p.y) * this.mouseInfluence;

 // Damping
 p.vx *= 0.999;
 p.vy *= 0.999;

 // Integrate
 p.x += p.vx;
 p.y += p.vy;

 // Wrap around edges with padding
 if (p.x < -20) p.x = W + 20;
 if (p.x > W + 20) p.x = -20;
 if (p.y < -20) p.y = H + 20;
 if (p.y > H + 20) p.y = -20;
 }

 // Smooth mouse interpolation
 mouse.x += (mouse.tx - mouse.x) * 0.08;
 mouse.y += (mouse.ty - mouse.y) * 0.08;
 }

 /**
 * Draw all particles.
 */
 draw() {
 const { ctx, particles, colors } = this;
 ctx.clearRect(0, 0, this.W, this.H);

 for (let i = 0; i < particles.length; i++) {
 const p = particles[i];
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
 ctx.fillStyle = `${colors[p.hueIdx].replace('60%)', '60%,' + p.opacity + ')')}`;
 // Build HSLA string from HSL template
 const base = colors[p.hueIdx];
 // Extract hue from "hsl(H,s%,L%)" pattern
 const m = base.match(/hsl\((\d+)/);
 const hue = m ? m[1] : '22';
 ctx.fillStyle = `hsla(${hue},70%,60%,${p.opacity})`;
 ctx.fill();
 }
 }

 /**
 * Draw connection lines between nearby particles.
 * @param {ConnectionLines|null} [lines] — optional external line manager
 */
 drawConnections(lines) {
 if (lines) {
 lines.draw(this.particles, this.W, this.H);
 return;
 }
 // Built-in connections (fallback when no ConnectionLines instance)
 this._drawBuiltinConnections();
 }

 _drawBuiltinConnections() {
 const { ctx, particles, connectionDistance, lineColor, lineMaxOpacity, lineWidth } = this;
 const len = particles.length;

 ctx.lineWidth = lineWidth;

 for (let i = 0; i < len; i++) {
 for (let j = i + 1; j < len; j++) {
 const dx = particles[i].x - particles[j].x;
 const dy = particles[i].y - particles[j].y;
 const dist = Math.sqrt(dx * dx + dy * dy);

 if (dist < connectionDistance) {
 const alpha = lineMaxOpacity * (1 - dist / connectionDistance);
 ctx.beginPath();
 ctx.moveTo(particles[i].x, particles[i].y);
 ctx.lineTo(particles[j].x, particles[j].y);
 ctx.strokeStyle = `rgba(${lineColor},${alpha})`;
 ctx.stroke();
 }
 }
 }
 }

 /**
 * Start the internal RAF loop (interactive mode).
 */
 start() {
 if (this._running) return;
 this._running = true;
 this.bindMouse();
 const loop = (t) => {
 if (!this._running) return;
 this.update(t);
 this.draw();
 this.drawConnections();
 this._rafId = requestAnimationFrame(loop);
 };
 this._rafId = requestAnimationFrame(loop);
 }

 /**
 * Stop the internal RAF loop.
 */
 stop() {
 this._running = false;
 if (this._rafId) {
 cancelAnimationFrame(this._rafId);
 this._rafId = null;
 }
 }

 /**
 * Perform a single update+draw without starting a loop.
 * Useful for render-mode single-frame captures.
 * @param {number} t — timestamp
 */
 frame(t) {
 this.update(t);
 this.draw();
 this.drawConnections();
 }
}

// ──────────────────────────────────────────────
// CONNECTION LINES (separate module)
// ──────────────────────────────────────────────

/**
 * ConnectionLines — draws orange-tinted connection lines
 * between particles within a given distance threshold.
 *
 * Designed as a separate class so it can be shared across
 * multiple particle groups if needed.
 *
 * @example
 * const lines = new ConnectionLines({
 * maxDistance: 120,
 * color: '255,107,0',
 * maxOpacity: 0.04,
 * width: 0.5,
 * });
 * // In draw pass: lines.draw(particleArray, canvasW, canvasH);
 */
class ConnectionLines {
 /**
 * @param {object} cfg
 * @param {number} [cfg.maxDistance=120] — max px distance to connect
 * @param {string} [cfg.color='255,107,0'] — RGB for line color
 * @param {number} [cfg.maxOpacity=0.04] — opacity at closest distance
 * @param {number} [cfg.width=0.5] — stroke line width
 */
 constructor(cfg = {}) {
 this.maxDistance = cfg.maxDistance || 120;
 this.color = cfg.color || '255,107,0';
 this.maxOpacity = cfg.maxOpacity || 0.04;
 this.width = cfg.width || 0.5;
 }

 /**
 * Draw all connections.
 * @param {Array<{x:number,y:number}>} particles
 * @param {number} W
 * @param {number} H
 */
 draw(particles, W, H) {
 const len = particles.length;
 if (len < 2) return;

 const md2 = this.maxDistance * this.maxDistance; // squared distance

 for (let i = 0; i < len; i++) {
 const pi = particles[i];
 for (let j = i + 1; j < len; j++) {
 const pj = particles[j];
 const dx = pi.x - pj.x;
 const dy = pi.y - pj.y;
 const d2 = dx * dx + dy * dy;

 if (d2 < md2) {
 const d = Math.sqrt(d2);
 const alpha = this.maxOpacity * (1 - d / this.maxDistance);

 // Use the particle's own opacity as a multiplier for depth
 const depthMul = (pi.opacity + pj.opacity) / 2;
 const finalAlpha = alpha * depthMul * 4;

 ctx.beginPath();
 ctx.moveTo(pi.x, pi.y);
 ctx.lineTo(pj.x, pj.y);
 ctx.strokeStyle = `rgba(${this.color},${finalAlpha})`;
 ctx.lineWidth = this.width;
 ctx.stroke();
 }
 }
 }
 }
}

// ──────────────────────────────────────────────
// GLYPH PARTICLES
// ──────────────────────────────────────────────

/**
 * GlyphParticles — floating code glyphs that drift upward and fade.
 *
 * Max 8 visible at once. Each glyph lives for a random lifetime,
 * fades in then out, and is drawn with JetBrains Mono at 10-16px.
 *
 * @example
 * const glyphs = new GlyphParticles(canvas);
 * glyphs.init();
 * glyphs.start();
 * // In RAF loop or manually: glyphs.update(t); glyphs.draw();
 */
class GlyphParticles {
 /**
 * @param {HTMLCanvasElement} canvas
 * @param {object} cfg
 * @param {string[]} [cfg.glyphs=['{','}','<','>','/','=','&&','||','fn','=>','()','[]']]
 * @param {number} [cfg.maxCount=8]
 * @param {number} [cfg.minSize=10]
 * @param {number} [cfg.maxSize=16]
 * @param {string} [cfg.color='148,163,184'] — RGB of muted slate
 * @param {number} [cfg.fontFamily='JetBrains Mono, monospace']
 */
 constructor(canvas, cfg = {}) {
 this.canvas = canvas;
 this.ctx = canvas.getContext('2d');
 this.W = 0;
 this.H = 0;
 this._glyphs = cfg.glyphs || [
 '{', '}', '<', '>', '/', '=',
 '&&', '||', 'fn', '=>', '()', '[]',
 ];
 this.maxCount = cfg.maxCount || 8;
 this.minSize = cfg.minSize || 10;
 this.maxSize = cfg.maxSize || 16;
 this.color = cfg.color || '148,163,184';
 this.fontFamily = cfg.fontFamily || "'JetBrains Mono', monospace";
 this.pool = []; // active glyphs
 this._running = false;
 this._rafId = null;
 this._spawnAccum = 0; // throttle spawns
 }

 /**
 * Resize internal dimensions.
 */
 resize() {
 this.W = this.canvas.width;
 this.H = this.canvas.height;
 }

 /**
 * Spawn one glyph instance.
 * @param {boolean} [deterministic=false]
 * @returns {object}
 */
 _spawn(deterministic = false) {
 const rand = deterministic ? mulberry32(Date.now() + Math.random() * 1000) : Math.random;
 const size = this.minSize + rand() * (this.maxSize - this.minSize);
 const lifetime = 3000 + rand() * 5000; // ms
 return {
 text: this._glyphs[Math.floor(rand() * this._glyphs.length)],
 x: rand() * this.W,
 y: this.H + size, // start below viewport
 vy: -(0.15 + rand() * 0.45), // upward drift px/ms
 opacity: 0,
 targetOpacity: 0.06 + rand() * 0.12,
 size,
 lifetime,
 age: 0,
 fadeIn: 600 + rand() * 800, // ms to reach peak opacity
 fadeOutStart: lifetime - (400 + rand() * 600),
 };
 }

 /**
 * Rebuild pool. Call once after init or resize.
 * @param {boolean} [deterministic=false]
 */
 init(deterministic = false) {
 this.resize();
 this.pool = [];
 for (let i = 0; i < this.maxCount; i++) {
 const g = this._spawn(deterministic);
 g.age = Math.floor(Math.random() * g.lifetime); // stagger
 this.pool.push(g);
 }
 }

 /**
 * Update all glyph lifetimes and positions.
 * @param {number} dt — delta time in ms
 * @param {number} t — current absolute timestamp
 */
 update(dt, t) {
 this._spawnAccum += dt;

 // Throttle: try to spawn a new glyph every 1-2 seconds
 if (this.pool.length < this.maxCount && this._spawnAccum > 1200 + Math.random() * 800) {
 this._spawnAccum = 0;
 this.pool.push(this._spawn());
 }

 for (let i = this.pool.length - 1; i >= 0; i--) {
 const g = this.pool[i];
 g.age += dt;
 g.y += g.vy * dt;

 // Opacity curve: fade in, sustain, fade out
 if (g.age < g.fadeIn) {
 g.opacity = (g.age / g.fadeIn) * g.targetOpacity;
 } else if (g.age > g.fadeOutStart) {
 const fadeAge = g.age - g.fadeOutStart;
 const fadeDur = g.lifetime - g.fadeOutStart;
 g.opacity = Math.max(0, (1 - fadeAge / fadeDur) * g.targetOpacity);
 } else {
 g.opacity = g.targetOpacity;
 }

 // Remove dead glyphs
 if (g.age >= g.lifetime || g.y < -g.size * 2) {
 this.pool.splice(i, 1);
 }
 }
 }

 /**
 * Draw all active glyphs.
 */
 draw() {
 const { ctx, W, H } = this;
 ctx.font = `${this.minSize}px ${this.fontFamily}`;
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';

 for (const g of this.pool) {
 if (g.opacity <= 0.002) continue;
 ctx.globalAlpha = g.opacity;
 ctx.fillStyle = `rgb(${this.color})`;
 ctx.fillText(g.text, g.x, g.y);
 }
 ctx.globalAlpha = 1;
 }

 /**
 * Start internal RAF loop.
 */
 start() {
 if (this._running) return;
 this._running = true;
 let last = performance.now();
 const loop = (t) => {
 if (!this._running) return;
 const dt = t - last;
 last = t;
 this.update(dt, t);
 this.draw();
 this._rafId = requestAnimationFrame(loop);
 };
 this._rafId = requestAnimationFrame(loop);
 }

 /**
 * Stop internal RAF loop.
 */
 stop() {
 this._running = false;
 if (this._rafId) {
 cancelAnimationFrame(this._rafId);
 this._rafId = null;
 }
 }

 /**
 * Single-frame update+draw for render mode.
 * @param {number} dt — delta time
 * @param {number} t — timestamp
 */
 frame(dt, t) {
 this.update(dt, t);
 this.draw();
 }
}

// ──────────────────────────────────────────────
// COMPOSITE RENDERER (convenience)
// ──────────────────────────────────────────────

/**
 * SwarmCanvas — wires ParticleNetwork, ConnectionLines, and
 * GlyphParticles together on a single canvas.
 *
 * @example
 * const sc = new SwarmCanvas(document.getElementById('bg'));
 * sc.init();
 * sc.start();
 */
class SwarmCanvas {
 /**
 * @param {HTMLCanvasElement} canvas
 * @param {object} cfg
 */
 constructor(canvas, cfg = {}) {
 this.canvas = canvas;

 // Sub-components
 this.particles = new ParticleNetwork(canvas, {
 count: cfg.particleCount || 60,
 colors: cfg.particleColors || ['hsl(22,70%,60%)', 'hsl(255,60%,60%)'],
 connectionDistance: cfg.connectionDistance || 120,
 mouseInfluence: cfg.mouseInfluence || 0.00004,
 lineColor: cfg.lineColor || '255,107,0',
 lineMaxOpacity: cfg.lineMaxOpacity || 0.04,
 lineWidth: cfg.lineWidth || 0.5,
 });

 this.connections = new ConnectionLines({
 maxDistance: cfg.connectionDistance || 120,
 color: cfg.lineColor || '255,107,0',
 maxOpacity: cfg.lineMaxOpacity || 0.04,
 width: cfg.lineWidth || 0.5,
 });

 this.glyphs = new GlyphParticles(canvas, {
 maxCount: cfg.glyphCount || 8,
 minSize: cfg.glyphMinSize || 10,
 maxSize: cfg.glyphMaxSize || 16,
 color: cfg.glyphColor || '148,163,184',
 });

 this._lastTime = 0;
 }

 /**
 * Initialize all sub-components.
 * @param {boolean} [deterministic=false]
 */
 init(deterministic = false) {
 this.particles.init(deterministic);
 this.glyphs.init(deterministic);
 this._lastTime = performance.now();
 }

 /**
 * Resize canvas and sub-components.
 */
 resize() {
 this.particles.resize();
 this.glyphs.resize();
 }

 /**
 * Single frame update+draw. Call from an external RAF loop
 * (recommended — gives the caller full control).
 *
 * @param {number} t — current timestamp (performance.now())
 */
 frame(t) {
 const dt = Math.min(t - this._lastTime, 50); // cap dt to avoid jumps
 this._lastTime = t;

 this.particles.update(t);
 this.particles.draw();
 this.particles.drawConnections(this.connections);
 this.glyphs.frame(dt, t);
 }

 /**
 * Start an internal RAF loop (simpler, self-contained).
 */
 start() {
 if (this.particles._running) return;
 this.particles.start();
 this.glyphs.start();
 this._lastTime = performance.now();

 // Override glyph loop to also tick particles
 this.particles.stop(); // stop the particle's own loop
 const loop = (t) => {
 if (!this.particles._running && !this.glyphs._running) return;
 const dt = Math.min(t - this._lastTime, 50);
 this._lastTime = t;
 this.particles.update(t);
 this.particles.draw();
 this.particles.drawConnections(this.connections);
 this.glyphs.update(dt, t);
 this.glyphs.draw();
 this._rafId = requestAnimationFrame(loop);
 };
 this._rafId = requestAnimationFrame(loop);
 }

 /**
 * Stop all loops.
 */
 stop() {
 this.particles.stop();
 this.glyphs.stop();
 if (this._rafId) {
 cancelAnimationFrame(this._rafId);
 this._rafId = null;
 }
 }
}

// ──────────────────────────────────────────────
// PUBLIC API
// ──────────────────────────────────────────────

window.SwarmParticles = Object.freeze({
 ParticleNetwork,
 GlyphParticles,
 ConnectionLines,
 SwarmCanvas,
 mulberry32, // expose for deterministic seeding
});
