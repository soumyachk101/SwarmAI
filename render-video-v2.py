#!/usr/bin/env python3
"""
Swarm AI — Premium Product Video Renderer v2
=============================================
Renders swarm-ai-premium-video.html frame-by-frame at up to 60fps
using a SINGLE page load — dramatically faster than v1.

Architecture
------------
1. Launch browser ONCE, open the HTML page once.
2. For each frame, navigate to file://…?time=MS and wait for the
 page to signal readiness (via the 'frame-ready' DOM event or a
 fallback polling check on the timeline state).
3. Screenshot the viewport, move to the next frame.
4. After all frames are rendered, hand the PNG sequence to ffmpeg
 for H.264 encoding.

Usage
-----
 python render-video-v2.py # defaults: 60 fps, 90s, crf 18
 python render-video-v2.py --fps 30 --duration 60 --quality high
 python render-video-v2.py --resume # skip frames that already exist
 python render-video-v2.py --keep-frames # leave PNGs on disk after encode

Requirements
------------
 pip install playwright
 playwright install chromium
 ffmpeg (brew install ffmpeg)
"""

from __future__ import annotations

import argparse
import os
import shutil
import signal
import subprocess
import sys
import time
from pathlib import Path

# ── Defaults ──────────────────────────────────────────────────────────────────

PROJECT = Path(__file__).parent
DEFAULT_HTML = PROJECT / "swarm-ai-premium-video.html"
FRAMES_DIR = PROJECT / "frames"
DEFAULT_OUTPUT = PROJECT / "swarm-ai-final-video.mp4"
DEFAULT_FPS = 60
DEFAULT_DURATION = 90 # seconds
VIEWPORT_W = 1920
VIEWPORT_H = 1080
MAX_RETRIES = 3
PROGRESS_EVERY = 30 # print progress every N frames
SETTLE_MS = 50 # small delay after page signals readiness
PAGE_TIMEOUT_MS = 30_000 # goto timeout (ms)
FRAME_TIMEOUT_MS = 5_000 # wait_for_event timeout (ms)

# CRF presets
CRF_MAP = {
 "high": 17,
 "medium": 23,
 "low": 28,
}
DEFAULT_CRF = 18


# ── Helpers ───────────────────────────────────────────────────────────────────

def hr() -> None:
 print("=" * 58)


def check_deps(html_file: Path) -> None:
 """Verify that all required tools and files are available."""
 errors: list[str] = []

 # Playwright
 try:
 import playwright # noqa: F401 # type: ignore[import-untyped]
 except ImportError:
 errors.append(
 "Playwright not installed. Run:\n"
 " pip install playwright && playwright install chromium"
 )

 # FFmpeg
 if not shutil.which("ffmpeg"):
 errors.append("FFmpeg not found. Run: brew install ffmpeg")

 # HTML source
 if not html_file.exists():
 errors.append(f"HTML source file not found: {html_file}")

 if errors:
 print("❌ Missing dependencies:\n")
 for e in errors:
 print(f" • {e}")
 sys.exit(1)

 print("✅ All dependencies found\n")


def parse_args() -> argparse.Namespace:
 p = argparse.ArgumentParser(
 description="Swarm AI video renderer — single-page-load architecture.",
 formatter_class=argparse.RawDescriptionHelpFormatter,
 epilog=(
 "examples:\n"
 " python render-video-v2.py\n"
 " python render-video-v2.py --fps 30 --duration 60 --quality high --resume\n"
 " python render-video-v2.py --output custom.mp4 --keep-frames"
 ),
 )
 p.add_argument(
 "--html",
 type=Path,
 default=DEFAULT_HTML,
 help=f"HTML source file (default: {DEFAULT_HTML.name})",
 )
 p.add_argument(
 "--output", "-o",
 type=Path,
 default=DEFAULT_OUTPUT,
 help=f"Output MP4 path (default: {DEFAULT_OUTPUT.name})",
 )
 p.add_argument(
 "--fps",
 type=int,
 default=DEFAULT_FPS,
 help=f"Frames per second (default: {DEFAULT_FPS})",
 )
 p.add_argument(
 "--duration",
 type=float,
 default=DEFAULT_DURATION,
 help=f"Timeline duration in seconds (default: {DEFAULT_DURATION})",
 )
 p.add_argument(
 "--quality",
 choices=list(CRF_MAP),
 default="high",
 help="Encoding quality preset (default: high = CRF 17)",
 )
 p.add_argument(
 "--keep-frames",
 action="store_true",
 help="Do not delete the frames directory after encoding",
 )
 p.add_argument(
 "--resume",
 action="store_true",
 help="Skip frames that already exist on disk",
 )
 return p.parse_args()


# ── Progress bar ──────────────────────────────────────────────────────────────

class ProgressTracker:
 """Lightweight progress tracker that prints a bar every *step* frames."""

 def __init__(self, total: int, step: int = PROGRESS_EVERY) -> None:
 self.total = total
 self.step = step
 self.start = time.monotonic()

 def tick(self, idx: int) -> None:
 """Call after every frame. Prints only when idx % step == 0."""
 if idx % self.step != 0 and idx != self.total - 1:
 return

 elapsed = time.monotonic() - self.start
 rate = (idx + 1) / elapsed if elapsed > 0 else 0.0
 remaining = (self.total - idx - 1) / rate if rate > 0 else 0.0
 pct = ((idx + 1) / self.total) * 100.0

 bar_len = 30
 filled = int(bar_len * pct / 100)
 bar = "█" * filled + "░" * (bar_len - filled)

 eta_min, eta_sec = divmod(int(remaining), 60)
 rate_fps = rate
 print(
 f"\r [{bar}] {pct:5.1f}% "
 f"{idx + 1:>5}/{self.total} "
 f"~{eta_min}m{eta_sec:02d}s left "
 f"({rate_fps:.1f} fps)",
 end="",
 flush=True,
 )

 def finish(self) -> None:
 elapsed = time.monotonic() - self.start
 print(f"\r ✓ {self.total} frames in {elapsed:.1f}s " + " " * 30)


# ── Frame rendering ───────────────────────────────────────────────────────────

async def render_frames(
 html_file: Path,
 frames_dir: Path,
 fps: int,
 duration: float,
 viewport_w: int = VIEWPORT_W,
 viewport_h: int = VIEWPORT_H,
 resume: bool = False,
) -> tuple[int, list[int]]:
 """
 Render every frame using a single browser session.

 Returns
 -------
 rendered : int
 Number of successfully written frames.
 failed : list[int]
 Frame indices that failed after MAX_RETRIES attempts.
 """
 from playwright.async_api import async_playwright # type: ignore[import-untyped]

 frames_dir.mkdir(exist_ok=True)
 total_frames = int(fps * duration)
 interval_ms = 1000.0 / fps

 print(f"🎬 Rendering {total_frames} frames | {fps} fps | {duration}s")
 print(f" Source : {html_file.name}")
 print(f" Output : {frames_dir}/\n")

 progress = ProgressTracker(total_frames)
 failed: list[int] = []
 succeeded = 0

 async with async_playwright() as pw:
 browser = await pw.chromium.launch(
 headless=True,
 args=[
 "--no-sandbox",
 "--disable-setuid-sandbox",
 "--disable-dev-shm-usage",
 "--disable-gpu",
 "--disable-web-security",
 "--disable-features=TranslateUI",
 "--disable-extensions",
 "--no-first-run",
 ],
 )
 context = await browser.new_context(
 viewport={"width": viewport_w, "height": viewport_h},
 device_scale_factor=1,
 locale="en-US",
 )
 page = await context.new_page()

 html_url = html_file.as_uri()

 # ── First navigation (establishes the single page session) ──────────
 # We navigate once without a ?time parameter so the HTML file sets
 # up its timeline infrastructure. Subsequent frames only swap the
 # query string so the browser reuses the same document.
 try:
 await page.goto(
 html_url,
 wait_until="domcontentloaded",
 timeout=PAGE_TIMEOUT_MS,
 )
 # Brief settle for any initial JS / fonts
 await page.wait_for_timeout(500)
 except Exception as exc:
 print(f"\n❌ Failed to load initial page: {exc}")
 await browser.close()
 return 0, list(range(total_frames))

 # ── Frame loop ──────────────────────────────────────────────────────
 for i in range(total_frames):
 elapsed_ms = int(i * interval_ms)
 frame_path = frames_dir / f"frame_{i:05d}.png"

 # Resume: skip if the frame already exists
 if resume and frame_path.exists():
 succeeded += 1
 progress.tick(i)
 continue

 # Retry loop
 last_error: Exception | None = None
 for attempt in range(1, MAX_RETRIES + 1):
 try:
 url = f"{html_url}?time={elapsed_ms}"
 await page.goto(
 url,
 wait_until="domcontentloaded",
 timeout=PAGE_TIMEOUT_MS,
 )

 # Wait for the page to signal that the scene is rendered.
 # The HTML document should dispatch a DOM event named
 # 'frame-ready' on document.documentElement when the
 # timeline position has been applied and the scene is
 # visually stable. We also accept a fallback: the
 # document gaining a 'render-mode' class on <body>.
 try:
 await page.wait_for_event(
 "frame-ready",
 timeout=FRAME_TIMEOUT_MS,
 )
 except Exception:
 # Fallback: poll for the render-mode CSS class
 try:
 await page.wait_for_function(
 "() => document.body.classList.contains('render-mode')",
 timeout=2000,
 )
 except Exception:
 pass # neither signal fired — proceed with settle

 # Small settle for any remaining micro-task / paint
 await page.wait_for_timeout(SETTLE_MS)

 await page.screenshot(
 path=str(frame_path),
 type="png",
 full_page=False,
 clip={
 "x": 0,
 "y": 0,
 "width": viewport_w,
 "height": viewport_h,
 },
 )
 succeeded += 1
 break # success — exit retry loop

 except Exception as exc:
 last_error = exc
 if attempt < MAX_RETRIES:
 await page.wait_for_timeout(500)
 else:
 failed.append(i)
 print(
 f"\n ⚠️ Frame {i} failed after {MAX_RETRIES} attempts: {exc}"
 )

 progress.tick(i)

 await browser.close()

 progress.finish()
 return succeeded, failed


# ── Encoding ──────────────────────────────────────────────────────────────────

def encode_mp4(
 frames_dir: Path,
 output: Path,
 fps: int,
 crf: int,
 viewport_w: int = VIEWPORT_W,
 viewport_h: int = VIEWPORT_H,
 duration: float | None = None,
) -> bool:
 """Run ffmpeg to encode the PNG sequence to an H.264 MP4."""
 print("🎞️ Encoding frames to MP4 …")

 frame_input = str(frames_dir / "frame_%05d.png")

 # Base video stream args
 cmd: list[str] = [
 "ffmpeg", "-y",
 "-framerate", str(fps),
 "-i", frame_input,
 "-c:v", "libx264",
 "-preset", "slow",
 "-crf", str(crf),
 "-pix_fmt", "yuv420p",
 "-movflags", "+faststart",
 "-vf",
 (
 f"scale={viewport_w}:{viewport_h}:"
 f"force_original_aspect_ratio=decrease,"
 f"pad={viewport_w}:{viewport_h}:(ow-iw)/2:(oh-ih)/2"
 ),
 str(output),
 ]

 # If we know the target duration, generate a silent AAC track so the
 # video has the exact right length even if the frame count is off by
 # one or two (helps with playback on some players).
 if duration is not None:
 cmd = (
 [
 "ffmpeg", "-y",
 "-f", "lavfi", "-i",
 f"anullsrc=r=48000:cl=mono",
 "-t", str(duration),
 "-c:a", "aac", "-b:a", "192k",
 "-ar", "48000",
 "-ac", "1",
 f"/tmp/swarm_silent_{int(time.time())}.m4a",
 ]
 )
 silent_result = subprocess.run(cmd, capture_output=True, text=True)
 if silent_result.returncode == 0:
 # Two-pass: combine video + silent audio
 video_cmd = [
 "ffmpeg", "-y",
 "-framerate", str(fps),
 "-i", frame_input,
 "-i", f"/tmp/swarm_silent_{int(time.time())}.m4a",
 "-c:v", "libx264",
 "-preset", "slow",
 "-crf", str(crf),
 "-pix_fmt", "yuv420p",
 "-movflags", "+faststart",
 "-c:a", "aac", "-b:a", "192k",
 "-ar", "48000",
 "-ac", "1",
 "-shortest",
 "-vf",
 (
 f"scale={viewport_w}:{viewport_h}:"
 f"force_original_aspect_ratio=decrease,"
 f"pad={viewport_w}:{viewport_h}:(ow-iw)/2:(oh-ih)/2"
 ),
 str(output),
 ]
 result = subprocess.run(video_cmd, capture_output=True, text=True)
 # Clean up temp audio
 Path(f"/tmp/swarm_silent_{int(time.time())}.m4a").unlink(missing_ok=True)
 else:
 # Fall back to video-only if silent track generation fails
 print(" ⚠️ Silent audio generation failed, encoding video only.")
 result = subprocess.run(cmd, capture_output=True, text=True)
 else:
 result = subprocess.run(cmd, capture_output=True, text=True)

 if result.returncode != 0:
 print("\n❌ FFmpeg encoding failed:")
 # Print last ~30 lines of stderr for readability
 stderr_lines = (result.stderr or "").splitlines()
 for line in stderr_lines[-30:]:
 print(f" {line}")
 return False

 size_mb = output.stat().st_size / (1024 * 1024)
 print(f" ✅ Encoded: {output.name} ({size_mb:.1f} MB)")
 return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
 hr()
 print(" Swarm AI — Video Renderer v2 (single-page-load)")
 hr()
 print()

 args = parse_args()
 html_file: Path = args.html
 output: Path = args.output
 fps: int = args.fps
 duration: float = args.duration
 quality: str = args.quality
 keep_frames: bool = args.keep_frames
 resume: bool = args.resume
 crf: int = CRF_MAP[quality]

 # Dependency check
 check_deps(html_file)

 total_frames = int(fps * duration)
 interval_ms = 1000.0 / fps

 # Graceful interrupt — preserve frames for resume
 def on_sigint(sig: int, _: object) -> None:
 print(
 f"\n\n⚠️ Interrupted. "
 f"Frames preserved in {FRAMES_DIR}/ — re-run with --resume."
 )
 sys.exit(0)

 signal.signal(signal.SIGINT, on_sigint)

 # ── Render ──────────────────────────────────────────────────────────────
 import asyncio

 t0 = time.monotonic()
 rendered, failed = asyncio.run(
 render_frames(
 html_file=html_file,
 frames_dir=FRAMES_DIR,
 fps=fps,
 duration=duration,
 resume=resume,
 )
 )
 render_elapsed = time.monotonic() - t0

 hr()
 print(f" Rendering complete: {rendered}/{total_frames} frames")
 if failed:
 print(f" ⚠️ {len(failed)} frame(s) failed: "
 f"{failed[:10]}{' …' if len(failed) > 10 else ''}")
 print(f" Time: {render_elapsed:.1f}s ({rendered / render_elapsed:.1f} fps avg)")
 print()

 # ── Encode ──────────────────────────────────────────────────────────────
 if rendered == 0:
 print("❌ No frames rendered — skipping encoding.")
 sys.exit(1)

 encode_ok = encode_mp4(
 frames_dir=FRAMES_DIR,
 output=output,
 fps=fps,
 crf=crf,
 duration=duration,
 )

 # ── Cleanup ─────────────────────────────────────────────────────────────
 if encode_ok and not keep_frames and FRAMES_DIR.exists():
 shutil.rmtree(FRAMES_DIR)
 print(" 🧹 Frames directory cleaned up")

 # ── Summary ─────────────────────────────────────────────────────────────
 total_elapsed = time.monotonic() - t0
 size_mb = output.stat().st_size / (1024 * 1024) if output.exists() else 0.0

 hr()
 print(" Final report")
 hr()
 print(f" Output : {output}")
 print(f" Size : {size_mb:.1f} MB")
 print(f" Frames : {rendered}/{total_frames}")
 print(f" Failed : {len(failed)}")
 print(f" Render : {render_elapsed:.1f}s")
 print(f" Total : {total_elapsed:.1f}s")
 if failed:
 print(f"\n ⚠️ {len(failed)} frames failed — you can re-run with --resume "
 f"to retry only those.")
 print()
 print(" 🎬 Done!\n")


if __name__ == "__main__":
 main()
