#!/usr/bin/env python3
"""
Swarm AI — Final Video Renderer
=================================
Loads the premium HTML page ONCE, seeks to each frame via URL params,
captures screenshots, then encodes to MP4.

Usage:
 python render-final.py [--fps 60] [--quality high|medium|low] [--resume] [--keep-frames]

Dependencies:
 pip install playwright
 playwright install chromium
 ffmpeg (brew install ffmpeg)
"""

import os, sys, time, signal, subprocess, shutil, argparse, re
from pathlib import Path

# ── Config ──
PROJECT = Path(__file__).parent
HTML_FILE = PROJECT / "swarm-ai-premium-video.html"
FRAMES_DIR = PROJECT / "frames"
OUTPUT_MP4 = PROJECT / "swarm-ai-final-video.mp4"

QUALITY_MAP = {
 "high": {"crf": 17, "preset": "slow", "bitrate": None},
 "medium": {"crf": 23, "preset": "medium", "bitrate": None},
 "low": {"crf": 28, "preset": "fast", "bitrate": "5000k"},
}

# ── Dependency checks ──
def check_deps():
 errors = []
 try:
 from playwright.sync_api import sync_playwright
 except ImportError:
 errors.append("Playwright: pip install playwright && playwright install chromium")
 if not shutil.which("ffmpeg"):
 errors.append("FFmpeg: brew install ffmpeg")
 if not HTML_FILE.exists():
 errors.append(f"HTML not found: {HTML_FILE}")
 if errors:
 print("❌ Missing dependencies:")
 for e in errors: print(f" • {e}")
 sys.exit(1)
 print("✅ Dependencies OK\n")

# ── Render frames ──
def render_frames(args):
 from playwright.sync_api import sync_playwright
 from urllib.parse import urlencode

 FRAMES_DIR.mkdir(exist_ok=True)
 fps = args.fps
 total_duration = 106 # seconds (matches HTML timeline)
 total_frames = fps * total_duration
 html_url = HTML_FILE.as_uri()

 # Count existing frames for resume
 existing = set()
 if args.resume:
 for f in FRAMES_DIR.glob("frame_*.png"):
 m = re.search(r'frame_(\d+)\.png$', f.name)
 if m: existing.add(int(m.group(1)))
 if existing:
 print(f"🔄 Resume mode: skipping {len(existing)} existing frames")

 start_time = time.time()
 failed = []

 with sync_playwright() as p:
 browser = p.chromium.launch(headless=True, args=[
 "--no-sandbox","--disable-setuid-sandbox",
 "--disable-dev-shm-usage","--disable-gpu",
 "--disable-web-security","--disable-features=TranslateUI",
 "--disable-extensions","--no-first-run",
 ])
 context = browser.new_context(
 viewport={"width": 1920, "height": 1080},
 device_scale_factor=1, locale="en-US",
 )
 page = context.new_page()

 # Load the page ONCE — we'll just navigate to ?time=X for each frame
 base_url = f"{html_url}"
 page.goto(base_url, wait_until="domcontentloaded", timeout=30000)
 page.wait_for_timeout # let fonts load

 print(f"🎬 Rendering {total_frames} frames at {fps}fps ({total_duration}s) | 1920x1080\n")

 for i in range(total_frames):
 if i in existing:
 continue

 elapsed_ms = int(i * (1000 / fps))
 frame_path = FRAMES_DIR / f"frame_{i:05d}.png"

 for attempt in range(3):
 try:
 url = f"{base_url}?time={elapsed_ms}"
 page.goto(url, wait_until="domcontentloaded", timeout=15000)

 # Wait for render-mode to activate
 try:
 page.wait_for_function("document.body.classList.contains('render-mode')", timeout=3000)
 except Exception:
 pass

 page.wait_for_timeout(60) # settle
 page.screenshot(path=str(frame_path), full_page=False,
 clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
 break

 except Exception as e:
 if attempt < 2:
 time.sleep(0.3)
 else:
 failed.append(i)

 # Progress
 done = i + 1 - len(existing) if args.resume else i + 1
 if done % (fps * 2) == 0 or i == 0:
 elapsed = time.time() - start_time
 rate = done / elapsed if elapsed > 0 else 0
 remaining = (total_frames - done) / rate if rate > 0 else 0
 pct = done / total_frames * 100
 bar_len = 30
 filled = int(bar_len * pct / 100)
 bar = "█" * filled + "░" * (bar_len - filled)
 print(f"\r [{bar}] {pct:5.1f}% | {done}/{total_frames} frames | {remaining:.0f}s remaining", end="", flush=True)

 browser.close()

 total_time = time.time() - start_time
 rendered = total_frames - len(failed) - (len(existing) if args.resume else 0)
 print(f"\n\n✅ Rendered {rendered}/{total_frames} frames in {total_time:.1f}s ({rendered/total_time:.1f} fps)")
 if failed:
 short = failed[:20]
 print(f" ⚠️ {len(failed)} failed: {short}{'...' if len(failed) > 20 else ''}")
 print()

# ── Encode MP4 ──
def encode_mp4(args):
 quality = QUALITY_MAP.get(args.quality, QUALITY_MAP["high"])
 crf = quality["crf"]
 preset = quality["preset"]
 bitrate = quality.get("bitrate")

 print("🎞️ Encoding to MP4...")
 frame_input = str(FRAMES_DIR / "frame_%05d.png")

 cmd = [
 "ffmpeg", "-y",
 "-framerate", str(args.fps),
 "-i", frame_input,
 "-c:v", "libx264",
 "-preset", preset,
 "-crf", str(crf),
 "-pix_fmt", "yuv420p",
 "-movflags", "+faststart",
 "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1",
 str(OUTPUT_MP4),
 ]

 if bitrate:
 cmd = [c for c in cmd if c != str(crf)]
 idx = cmd.index("-crf")
 cmd[idx] = "-b:v"
 cmd.insert(idx + 1, bitrate)

 print(f" Quality: {args.quality} (crf={crf})\n")

 result = subprocess.run(cmd, capture_output=True, text=True)
 if result.returncode != 0:
 print("❌ FFmpeg failed:")
 print(result.stderr[-1500:])
 return False

 size_mb = OUTPUT_MP4.stat().st_size / (1024 * 1024)
 print(f"✅ Encoded: {OUTPUT_MP4.name} ({size_mb:.1f} MB)")
 return True

# ── Main ──
def main():
 parser = argparse.ArgumentParser(description="Swarm AI Video Renderer")
 parser.add_argument("--fps", type=int, default=60, help="Frames per second (default: 60)")
 parser.add_argument("--quality", choices=["high", "medium", "low"], default="high")
 parser.add_argument("--resume", action="store_true", help="Skip existing frames")
 parser.add_argument("--keep-frames", action="store_true", help="Don't delete frames after encoding")
 args = parser.parse_args()

 print("=" * 55)
 print(" Swarm AI — Premium Product Video Renderer")
 print("=" * 55)
 print()
 check_deps()

 def handler(sig, frame):
 print("\n\n⚠️ Interrupted. Frames preserved.")
 sys.exit(0)
 signal.signal(signal.SIGINT, handler)

 render_frames(args)

 if encode_mp4(args):
 if not args.keep_frames and FRAMES_DIR.exists():
 shutil.rmtree(FRAMES_DIR)
 print("🧹 Cleaned up frames")
 print(f"\n🎬 Video ready: {OUTPUT_MP4}")
 print(f" Size: {OUTPUT_MP4.stat().st_size / (1024*1024):.1f} MB")
 else:
 print("\n⚠️ Encoding failed. Frames kept for retry.")

if __name__ == "__main__":
 main()
