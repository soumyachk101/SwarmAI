#!/usr/bin/env python3
"""Quick test: capture 9 frames across scenes to verify pipeline."""
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT = Path(__file__).parent
HTML = PROJECT / "swarm-ai-premium-video.html"
OUT = PROJECT / "test-frames"
OUT.mkdir(exist_ok=True)

sample_times = [2000, 18000, 30000, 42000, 56000, 70000, 81000, 90000, 100000]

with sync_playwright() as p:
 browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-gpu"])
 ctx = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
 page = ctx.new_page()
 url = HTML.as_uri()

 for ms in sample_times:
 page.goto(f"{url}?time={ms}", wait_until="domcontentloaded")
 try:
 page.wait_for_function("document.body.classList.contains('render-mode')", timeout=3000)
 except Exception:
 pass
 page.wait_for_timeout(100)
 out = str(OUT / f"scene_{ms:06d}.png")
 page.screenshot(path=out, clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
 print(f" captured {Path(out).name}")

 browser.close()

print(f"Done: {len(sample_times)} test frames in {OUT}")
