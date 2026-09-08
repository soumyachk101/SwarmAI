#!/usr/bin/env python3
"""
Swarm AI — Premium Video Renderer v3
======================================
Single page load architecture with evaluate()-based frame seeking.

Usage:
 python render-v3.py # 60fps, 108s, high quality
 python render-v3.py --fps 30 # 30fps render (faster)
 python render-v3.py --resume # skip existing frames
 python render-v3.py --keep-frames # don't cleanup frames after encode

Dependencies:
 pip install playwright && playwright install chromium
 brew install ffmpeg
"""

import argparse
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

# ── Config ──
PROJECT = Path(__file__).parent
HTML_FILE = PROJECT / "swarm-ai-premium-v3.html"
FRAMES_DIR = PROJECT / "frames_v3"
OUTPUT = PROJECT / "swarm-ai-premium-final.mp4"

CRF_MAP = {"high": 17, "medium": 23, "low": 28}
FPS_DEFAULT = 60
DURATION_DEFAULT = 106 # matches HTML timeline
VIEWPORT_W, VIEWPORT_H = 1920, 1080
MAX_RETRIES = 3
SETTLE_MS = 50
PAGE_TIMEOUT_MS = 60_000


# ── Dependency checks ──
def check_deps(html_file):
 errors = []
 try:
 from playwright.sync_api import sync_playwright # noqa: F401
 except ImportError:
 errors.append("Playwright not installed. Run: pip install playwright && playwright install chromium")
 if not shutil.which("ffmpeg"):
 errors.append("FFmpeg not found. Run: brew install ffmpeg")
 if not html_file.exists():
 errors.append(f"HTML not found: {html_file}")
 if errors:
 print("Missing dependencies:")
 for e in errors:
 print(f" - {e}")
 sys.exit(1)
 print("All dependencies found\n")


# ── CLI args ──
def parse_args():
 p = argparse.ArgumentParser(description="Swarm AI Video Renderer v3")
 p.add_argument("--fps", type=int, default=FPS_DEFAULT, help=f"FPS (default: {FPS_DEFAULT})")
 p.add_argument("--duration", type=float, default=DURATION_DEFAULT, help=f"Duration in seconds (default: {DURATION_DEFAULT})")
 p.add_argument("--quality", choices=list(CRF_MAP), default="high", help="Encoding quality (default: high)")
 p.add_argument("--resume", action="store_true", help="Skip existing frames")
 p.add_argument("--keep-frames", action="store_true", help="Don't delete frames after encoding")
 p.add_argument("--output", "-o", type=Path, default=OUTPUT)
 return p.parse_args()


# ── Progress tracker ──
class ProgressTracker:
 def __init__(self, total, step=30):
 self.total = total
 self.step = step
 self.start = time.monotonic()

 def tick(self, idx):
 if idx % self.step != 0 and idx != self.total - 1:
 return
 elapsed = time.monotonic() - self.start
 rate = (idx + 1) / elapsed if elapsed > 0 else 0
 remaining = (self.total - idx - 1) / rate if rate > 0 else 0
 pct = ((idx + 1) / self.total) * 100
 bar = "█" * int(30 * pct / 100) + "░" * (30 - int(30 * pct / 100))
 m, s = divmod(int(remaining), 60)
 print(
 f"\r [{bar}] {pct:5.1f}% {idx+1:>5}/{self.total} ~{m}m{s:02d}s ({rate:.1f} fps)",
 end="", flush=True
 )

 def finish(self):
 elapsed = time.monotonic() - self.start
 print(f"\r Done: {self.total} frames in {elapsed:.1f}s ({self.total / elapsed:.1f} fps)" + " " * 40)


# ── Frame rendering (single page load) ──
def render_frames(args):
 from playwright.sync_api import sync_playwright

 FRAMES_DIR.mkdir(exist_ok=True)
 html_url = HTML_FILE.as_uri()
 fps = args.fps
 duration = args.duration
 total_frames = int(fps * duration)
 interval_ms = 1000.0 / fps

 # Resume: count existing frames
 existing = set()
 if args.resume:
 import re
 for f in FRAMES_DIR.glob("frame_*.png"):
 m = re.search(r"frame_(\d+)\.png$", f.name)
 if m:
 existing.add(int(m.group(1)))
 if existing:
 print(f"Resume mode: skipping {len(existing)} existing frames\n")

 print(f"Rendering {total_frames} frames | {fps}fps | {duration}s | 1920x1080")
 print(f"Source: {HTML_FILE.name}\n")

 progress = ProgressTracker(total_frames)
 failed = []
 succeeded = 0

 with sync_playwright() as pw:
 browser = pw.chromium.launch(
 headless=True,
 args=[
 "--no-sandbox", "--disable-setuid-sandbox",
 "--disable-dev-shm-usage", "--disable-gpu",
 "--disable-web-security", "--disable-features=TranslateUI",
 "--disable-extensions", "--no-first-run",
 "--disable-background-timer-throttling",
 "--disable-backgrounding-occluded-windows",
 ],
 )
 context = browser.new_context(
 viewport={"width": VIEWPORT_W, "height": VIEWPORT_H},
 device_scale_factor=1,
 locale="en-US",
 )
 page = context.new_page()

 # Load page ONCE
 print("Loading page...")
 page.goto(html_url, wait_until="domcontentloaded", timeout=PAGE_TIMEOUT_MS)
 page.wait_for_timeout # let fonts, canvas, particles init
 print("Page loaded. Starting frame capture...\n")

 for i in range(total_frames):
 frame_path = FRAMES_DIR / f"frame_{i:05d}.png"

 # Resume skip
 if i in existing:
 succeeded += 1
 progress.tick(i)
 continue

 elapsed_ms = int(i * interval_ms)

 for attempt in range(MAX_RETRIES):
 try:
 # Seek via evaluate — NO page reload!
 page.evaluate(
 f"if (typeof renderFrame === 'function') {{ renderFrame({elapsed_ms}); }}",
 timeout=10_000,
 )

 # Wait for frame-ready event dispatched by renderFrame
 try:
 page.wait_for_event("frame-ready", timeout=3000)
 except Exception:
 pass # settle fallback if event doesn't fire

 page.wait_for_timeout(SETTLE_MS)

 page.screenshot(
 path=str(frame_path),
 type="png",
 full_page=False,
 clip={"x": 0, "y": 0, "width": VIEWPORT_W, "height": VIEWPORT_H},
 )
 succeeded += 1
 break

 except Exception as e:
 if attempt < MAX_RETRIES - 1:
 time.sleep(0.3)
 else:
 failed.append(i)
 print(f"\n Frame {i} failed after {MAX_RETRIES} attempts: {e}")

 progress.tick(i)

 browser.close()

 progress.finish()
 print(f"Rendered {succeeded}/{total_frames} frames ({len(failed)} failed)")
 if failed:
 print(f"Failed frames: {failed[:20]}{'...' if len(failed) > 20 else ''}")
 print()
 return succeeded, failed, total_frames


# ── FFmpeg encoding ──
def encode_mp4(args, total_frames):
 print("Encoding to MP4...")

 frame_input = str(FRAMES_DIR / "frame_%05d.png")
 crf = CRF_MAP[args.quality]
 fps = args.fps

 # Step 1: Generate silent audio for exact duration
 silent_audio = f"/tmp/swarm_silent_{int(time.time())}.m4a"
 audio_cmd = [
 "ffmpeg", "-y", "-f", "lavfi", "-i",
 f"anullsrc=r=48000:cl=stereo",
 "-t", str(args.duration),
 "-c:a", "aac", "-b:a", "192k",
 "-ar", "48000", "-ac", "2",
 silent_audio,
 ]
 audio_result = subprocess.run(audio_cmd, capture_output=True, text=True)
 has_audio = audio_result.returncode == 0

 # Step 2: Encode video (+ audio if available)
 video_cmd = [
 "ffmpeg", "-y",
 "-framerate", str(fps),
 "-i", frame_input,
 ]

 if has_audio:
 video_cmd.extend(["-i", silent_audio])

 # Premium color grading filter chain
 vf = (
 f"scale={VIEWPORT_W}:{VIEWPORT_H}:"
 f"force_original_aspect_ratio=decrease,"
 f"pad={VIEWPORT_W}:{VIEWPORT_H}:(ow-iw)/2:(oh-ih)/2,"
 f"setsar=1,"
 f"eq=contrast=1.06:brightness=0.015:saturation=1.08,"
 f"unsharp=5:5:0.8:5:5:0.0"
 )

 video_cmd.extend([
 "-c:v", "libx264",
 "-preset", "slow",
 "-crf", str(crf),
 "-pix_fmt", "yuv420p",
 "-movflags", "+faststart",
 "-vf", vf,
 "-color_range", "tv",
 "-colorspace", "bt709",
 "-color_primaries", "bt709",
 "-color_trc", "bt709",
 "-metadata", "title=Swarm AI - Product Film",
 "-metadata", "comment=Rendered with Playwright + FFmpeg",
 str(args.output),
 ])

 if has_audio:
 video_cmd.extend(["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-shortest"])

 print(f"Quality: {args.quality} (CRF {crf})\n")
 result = subprocess.run(video_cmd, capture_output=True, text=True)

 # Cleanup temp audio
 try:
 Path(silent_audio).unlink(missing_ok=True)
 except Exception:
 pass

 if result.returncode != 0:
 print("FFmpeg encoding failed:")
 for line in (result.stderr or "").splitlines()[-20:]:
 print(f" {line}")
 return False

 size_mb = args.output.stat().st_size / (1024 * 1024)
 print(f"Encoded: {args.output.name} ({size_mb:.1f} MB)")
 return True


# ── Main ──
def main():
 args = parse_args()

 print("=" * 58)
 print(" Swarm AI — Premium Video Renderer v3")
 print(" Single-page-load | Frame-accurate | 60fps")
 print("=" * 58)
 print()

 check_deps(HTML_FILE)

 def on_sigint(sig, frame):
 print(f"\n\nInterrupted. Frames preserved in {FRAMES_DIR}/")
 sys.exit(0)
 signal.signal(signal.SIGINT, on_sigint)

 t0 = time.monotonic()
 rendered, failed, total = render_frames(args)

 if rendered == 0:
 print("No frames rendered. Aborting.")
 sys.exit(1)

 if encode_mp4(args, total):
 if not args.keep_frames and FRAMES_DIR.exists():
 shutil.rmtree(FRAMES_DIR)
 print("Cleaned up frames")

 total_time = time.monotonic() - t0
 size_mb = args.output.stat().st_size / (1024 * 1024) if args.output.exists() else 0

 print()
 print("=" * 58)
 print(" Final Report")
 print("=" * 58)
 print(f" Output : {args.output}")
 print(f" Size : {size_mb:.1f} MB")
 print(f" Frames : {rendered}/{total}")
 print(f" Failed : {len(failed)}")
 print(f" Total : {total_time:.1f}s")
 if failed:
 print(f"\n Re-run with --resume to retry {len(failed)} failed frames")
 print()
 print(" Done!\n")


if __name__ == "__main__":
 main()
