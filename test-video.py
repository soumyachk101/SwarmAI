#!/usr/bin/env python3
"""Swarm AI - Video Pipeline Test"""

import shutil
import sys
from pathlib import Path

PROJECT = Path(__file__).parent
HTML_FILE = PROJECT / "swarm-ai-premium-v3.html"
TEST_FRAMES_DIR = PROJECT / "test_frames"
HTML_URL = HTML_FILE.as_uri()
TEST_TIMESTAMPS = [0, 12000, 24000, 36000, 50000, 63000, 76000, 86000, 94000]


def check_deps():
	errors = []
	try:
		import playwright
	except ImportError:
		errors.append("Playwright: pip install playwright && playwright install chromium")
	if not shutil.which("ffmpeg"):
		errors.append("FFmpeg: brew install ffmpeg")
	if not HTML_FILE.exists():
		errors.append(f"HTML not found: {HTML_FILE}")
	if errors:
		print("Missing dependencies:")
		for e in errors:
			print(f" - {e}")
		return False
	print("Dependencies OK")
	return True


def run_tests():
	from playwright.sync_api import sync_playwright

	passed = 0
	failed = 0
	results = []

	with sync_playwright() as pw:
		browser = pw.chromium.launch(
		headless=True,
		args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run"]
		)
		context = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
		page = context.new_page()

		print("\nTest 1: Load page in render mode (?time=0)...")
		try:
			page.goto(f"{HTML_URL}?time=0", wait_until="domcontentloaded", timeout=30000)
			page.wait_for_timeout(500)
			has_render_mode = page.evaluate("document.body.classList.contains('render-mode')")
			has_render_frame = page.evaluate("typeof renderFrame === 'function'")
			has_canvas = page.evaluate("!!document.getElementById('bg')")
			if has_render_mode and has_render_frame and has_canvas:
				print(" PASS: render-mode active, renderFrame exists, canvas present")
				passed += 1
				results.append("PASS: Render mode init")
			else:
				print(" FAIL: missing requirements")
				failed += 1
		except Exception as e:
			print(f" FAIL: {e}")
			failed += 1

		print("\nTest 2: renderFrame() function...")
		try:
			result = page.evaluate("return typeof renderFrame === 'function'")
			if result:
				print(" PASS: renderFrame function exists")
				passed += 1
			else:
				print(" FAIL: renderFrame not found")
				failed += 1
		except Exception as e:
			print(f" FAIL: {e}")
			failed += 1

		print("\nTest 3: Screenshots at key timestamps...")
		TEST_FRAMES_DIR.mkdir(exist_ok=True)
		scene_names = ["hook", "problem", "swarm", "pheromone", "orchestra", "worktrees", "features", "techstack", "cta"]
		screenshot_passed = 0
		for idx, ms in enumerate(TEST_TIMESTAMPS):
			scene_name = scene_names[idx]
			try:
				page.evaluate(f"renderFrame({ms})")
				page.wait_for_timeout(500)
				path = TEST_FRAMES_DIR / f"test_{ms:06d}.png"
				page.screenshot(path=str(path), full_page=False, clip={"x": 0, "y": 0, "width": 1920, "height": 1080})
				size = path.stat().st_size
				if size > 10000:
					print(f" {scene_name:12s} ({ms/1000:5.0f}s): PASS ({size/1024:.0f}KB)")
					screenshot_passed += 1
				else:
					print(f" {scene_name:12s}: FAIL (too small)")
			except Exception as e:
				print(f" {scene_name:12s}: FAIL ({e})")
		if screenshot_passed == len(TEST_TIMESTAMPS):
			print("All screenshots passed")
			passed += 1
			results.append("PASS: All screenshots")
		else:
			print(f"{screenshot_passed}/{len(TEST_TIMESTAMPS)} screenshots passed")
			failed += 1

		print("\nTest 4: Canvas particles...")
		try:
			has_particles = page.evaluate("""
const cv = document.getElementById('bg');
const ctx = cv.getContext('2d');
const data = ctx.getImageData(0, 0, cv.width, cv.height);
let colored = 0;
for (let i = 0; i < data.data.length; i += 4) {
 if (data.data[i] > 0 || data.data[i+1] > 0 || data.data[i+2] > 0) colored++;
}
return colored > 100;
""")
			if has_particles:
				print(" PASS: Canvas has particle content")
				passed += 1
				results.append("PASS: Canvas particles")
			else:
				print(" FAIL: Canvas appears empty")
				failed += 1
		except Exception as e:
			print(f" FAIL: {e}")
			failed += 1

		browser.close()

		print("\n" + "=" * 50)
		print(" TEST SUMMARY")
		print("=" * 50)
		for r in results:
			print(f" {r}")
		print(f"\nPassed: {passed}/{passed+failed}")
		if failed == 0:
			print("\nVideo pipeline is READY for full render!")
		else:
			print(f"\n{failed} test(s) failed")
		return failed == 0


if __name__ == "__main__":
	if not check_deps():
		sys.exit(1)
	success = run_tests()
	sys.exit(0 if success else 1)
