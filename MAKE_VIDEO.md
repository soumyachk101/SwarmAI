# Swarm AI — Video Rendering Pipeline

Complete guide to render the premium product video.

## Files

| File | Purpose |
|------|---------|
| `swarm-ai-premium-v3.html` | Source HTML with render mode support |
| `render-v3.py` | Python renderer (Playwright + FFmpeg) |
| `test-video.py` | Verification script |
| `post-process-video.py` | Color grading + effects |
| `swarm-ai-premium-final.mp4` | Final output |

## Quick Start

### Step 1: Verify pipeline

```bash
python test-video.py
```

This loads the HTML, tests render mode, and saves test screenshots to `test_frames/`.

### Step 2: Render full video

```bash
# Full quality render (60fps, ~30 min)
python render-v3.py --fps 60 --quality high

# Faster render (30fps, ~15 min)
python render-v3.py --fps 30 --quality high

# Resume interrupted render
python render-v3.py --resume
```

**Render time estimates:**
- 60fps @ 106s = 6360 frames | ~8-12 min on M-series Mac
- 30fps @ 106s = 3180 frames | ~4-6 min on M-series Mac

**Output size:**
- High quality (CRF 17): ~200-300 MB
- Medium quality (CRF 23): ~100-150 MB

### Step 3: Post-process

```bash
python post-process-video.py
```

Applies: color grading, subtle sharpen, vignette.

## Architecture

### v3 Improvements over v1/v2

1. **Single page load** — loads HTML once, then seeks via `page.evaluate()` instead of 5400 page reloads
2. **Deterministic JS rendering** — `renderFrame(ms)` computes all visual state from time parameter
3. **No CSS transitions** — all animations computed in JS for frame-accurate output
4. **Pre-computed particles** — canvas particles calculated deterministically per frame
5. **Crossfade scenes** — 1s crossfade between scenes instead of hard cuts

### How it works

```
Browser loads HTML (once)
 │
 ├─→ page.evaluate("renderFrame(0ms)") → screenshot
 ├─→ page.evaluate("renderFrame(16ms)") → screenshot
 ├─→ page.evaluate("renderFrame(32ms)") → screenshot
 │ ... (6360 times at 60fps)
 └─→ page.evaluate("renderFrame(106000ms)") → screenshot
 │
 ▼
 FFmpeg encodes PNG sequence → MP4
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Playwright not installed" | `pip install playwright && playwright install chromium` |
| "FFmpeg not found" | `brew install ffmpeg` |
| Frames fail at specific indices | Re-run with `--resume` flag |
| Video plays too fast/slow | Adjust `--duration` to match HTML timeline |
| Black frames | Check if `renderFrame` exists: `typeof renderFrame === 'function'` |
| Memory issues | Use `--fps 30` to halve frame count |

## Dependencies

- Python 3.9+
- Playwright + Chromium
- FFmpeg
- macOS (tested) / Linux (should work)

## Render Settings

| Setting | Default | Options |
|---------|---------|---------|
| FPS | 60 | 30, 60 |
| Duration | 106s | Any float |
| Quality | high | high (CRF 17), medium (CRF 23), low (CRF 28) |
| Resolution | 1920x1080 | Fixed |
| Color space | bt709 | Fixed |
