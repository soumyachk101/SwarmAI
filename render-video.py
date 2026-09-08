#!/usr/bin/env python3
"""
Swarm AI Premium Product Video Renderer
=========================================
Renders swarm-ai-premium-video.html frame-by-frame at 60fps and encodes to MP4.

Usage:
 python render-video.py

Requirements:
 pip install playwright
 playwright install chromium
 ffmpeg (brew install ffmpeg)
"""

import os
import sys
import time
import signal
import subprocess
import shutil
from pathlib import Path

# ── Config ──────────────────────────────────────────────
PROJECT = Path(__file__).parent
HTML_FILE = PROJECT / "swarm-ai-premium-video.html"
FRAMES_DIR = PROJECT / "frames"
OUTPUT_MP4 = PROJECT / "swarm-ai-premium-video.mp4"
FPS = 60
DURATION = 90 # seconds
TOTAL_FRAMES = FPS * DURATION # 5400
VIEWPORT_W = 1920
VIEWPORT_H = 1080
MAX_RETRIES = 3

# ── Dependency checks ───────────────────────────────────
def check_deps():
 errors = []

 # Playwright
 try:
 from playwright.sync_api import sync_playwright
 except ImportError:
 errors.append("Playwright not found. Run: pip install playwright && playwright install chromium")

 # FFmpeg
 if not shutil.which("ffmpeg"):
 errors.append("FFmpeg not found. Run: brew install ffmpeg")

 # HTML file
 if not HTML_FILE.exists():
 errors.append(f"HTML file not found: {HTML_FILE}")

 if errors:
 print("❌ Missing dependencies:\n")
 for e in errors:
 print(f" • {e}")
 sys.exit(1)

 print("✅ All dependencies found\n")

# ── Render frames ───────────────────────────────────────
def render_frames():
 from playwright.sync_api import sync_playwright

 FRAMES_DIR.mkdir(exist_ok=True)

 html_url = HTML_FILE.as_uri()
 frame_pattern = str(FRAMES_DIR / "frame_%05d.png")

 print(f"🎬 Rendering {TOTAL_FRAMES} frames at {FPS}fps ({DURATION}s)")
 print(f" Resolution: {VIEWPORT_W}x{VIEWPORT_H}")
 print(f" Source: {HTML_FILE.name}")
 print()

 start_time = time.time()
 failed_frames = []

 with sync_playwright() as p:
 browser = p.chromium.launch(headless=True, args=[
 "--no-sandbox",
 "--disable-setuid-sandbox",
 "--disable-dev-shm-usage",
 "--disable-gpu",
 "--disable-web-security",
 "--disable-features=TranslateUI",
 "--disable-extensions",
 "--no-first-run",
 ])
 context = browser.new_context(
 viewport={"width": VIEWPORT_W, "height": VIEWPORT_H},
 device_scale_factor=1,
 locale="en-US",
 )
 page = context.new_page()

 for i in range(TOTAL_FRAMES):
 elapsed_ms = int(i * (1000 / FPS))
 frame_path = FRAMES_DIR / f"frame_{i:05d}.png"

 # Retry loop
 for attempt in range(MAX_RETRIES):
 try:
 url = f"{html_url}?time={elapsed_ms}"
 page.goto(url, wait_until="domcontentloaded", timeout=15000)

 # Wait for frame-ready event or just a brief settle
 try:
 page.wait_for_function(
 "document.body.classList.contains('render-mode')",
 timeout=3000
 )
 except Exception:
 pass # fine, it may have already fired

 # Small settle delay for CSS transitions (they're disabled in render mode)
 page.wait_for_timeout(50)

 page.screenshot(
 type="png",
 path=str(frame_path),
 full_page=False,
 clip={"x": 0, "y": 0, "width": VIEWPORT_W, "height": VIEWPORT_H}
 )
 break # success

 except Exception as e:
 if attempt < MAX_RETRIES - 1:
 time.sleep(0.5)
 else:
 failed_frames.append(i)
 print(f"\n ⚠️ Frame {i} failed after {MAX_RETRIES} attempts: {e}")

 # Progress
 if (i + 1) % 60 == 0 or i == 0:
 elapsed = time.time() - start_time
 rate = (i + 1) / elapsed if elapsed > 0 else 0
 remaining = (TOTAL_FRAMES - i - 1) / rate if rate > 0 else 0
 pct = ((i + 1) / TOTAL_FRAMES) * 100
 bar_len = 30
 filled = int(bar_len * pct / 100)
 bar = "█" * filled + "░" * (bar_len - filled)
 print(f"\r [{bar}] {pct:5.1f}% | {i+1}/{TOTAL_FRAMES} frames | {remaining:.0f}s remaining", end="", flush=True)

 browser.close()

 total_time = time.time() - start_time
 print(f"\n\n✅ Rendered {TOTAL_FRAMES - len(failed_frames)}/{TOTAL_FRAMES} frames in {total_time:.1f}s")
 if failed_frames:
 print(f" ⚠️ {len(failed_frames)} frames failed: {failed_frames[:10]}{'...' if len(failed_frames) > 10 else ''}")
 print()

# ── Encode to MP4 ──────────────────────────────────────
def encode_mp4():
 print("🎞️ Encoding frames to MP4...")

 frame_input = str(FRAMES_DIR / "frame_%05d.png")
 cmd = [
 "ffmpeg", "-y",
 "-framerate", str(FPS),
 "-i", frame_input,
 "-c:v", "libx264",
 "-preset", "slow",
 "-crf", "18",
 "-pix_fmt", "yuv420p",
 "-movflags", "+faststart",
 "-vf", f"scale={VIEWPORT_W}:{VIEWPORT_H}:force_original_aspect_ratio=decrease,pad={VIEWPORT_W}:{VIEWPORT_H}:(ow-iw)/2:(oh-ih)/2",
 str(OUTPUT_MP4),
 ]

 print(f" Command: {' '.join(cmd)}\n")

 result = subprocess.run(cmd, capture_output=True, text=True)

 if result.returncode != 0:
 print("❌ FFmpeg encoding failed:")
 print(result.stderr[-1000:])
 return False

 file_size = OUTPUT_MP4.stat().st_size / (1024 * 1024)
 print(f"✅ Encoded: {OUTPUT_MP4.name} ({file_size:.1f} MB)")
 return True

# ── Cleanup ─────────────────────────────────────────────
def cleanup():
 if FRAMES_DIR.exists():
 shutil.rmtree(FRAMES_DIR)
 print("🧹 Cleaned up frames directory")

# ── Main ────────────────────────────────────────────────
def main():
 print("=" * 55)
 print(" Swarm AI — Premium Product Video Renderer")
 print("=" * 55)
 print()

 check_deps()

 # Handle Ctrl+C
 def handler(sig, frame):
 print("\n\n⚠️ Interrupted. Frames preserved in /frames/ for resume.")
 sys.exit(0)
 signal.signal(signal.SIGINT, handler)

 render_frames()

 if encode_mp4():
 cleanup()
 print(f"\n🎬 Done! Video saved to:\n {OUTPUT_MP4}")
 else:
 print("\n⚠️ Encoding failed. Frames preserved for manual encoding.")
 print(f" Run: ffmpeg -y -framerate {FPS} -i frames/frame_%05d.png -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart {OUTPUT_MP4}")

if __name__ == "__main__":
 main()
