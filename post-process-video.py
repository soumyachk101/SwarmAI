#!/usr/bin/env python3
"""
Swarm AI — Post-Process Video
================================
Applies premium color grading and effects to the rendered MP4.

Usage:
 python post-process-video.py [input.mp4] [output.mp4]

Defaults:
 input: swarm-ai-premium-final.mp4
 output: swarm-ai-premium-final.mp4 (overwrites)
"""

import shutil
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).parent


def main():
 input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else PROJECT / "swarm-ai-premium-final.mp4"
 output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else PROJECT / "swarm-ai-premium-final.mp4"

 if not input_path.exists():
 print(f"Input not found: {input_path}")
 sys.exit(1)

 input_size = input_path.stat().st_size / (1024 * 1024)
 print(f"Input: {input_path.name} ({input_size:.1f} MB)")

 # Premium color grading filter chain
 vf = (
 # Subtle sharpen
 "unsharp=5:5:0.7:5:5:0.0,"
 # Cinematic color grade
 "eq=contrast=1.06:brightness=0.015:saturation=1.08,"
 # Subtle vignette (darken edges)
 "vignette=PI/4:0.3"
 )

 cmd = [
 "ffmpeg", "-y",
 "-i", str(input_path),
 "-c:v", "libx264",
 "-preset", "slow",
 "-crf", "17",
 "-pix_fmt", "yuv420p",
 "-movflags", "+faststart",
 "-vf", vf,
 "-color_range", "tv",
 "-colorspace", "bt709",
 "-color_primaries", "bt709",
 "-color_trc", "bt709",
 "-metadata", "title=Swarm AI - Product Film",
 "-metadata", "comment=Premium color graded product film",
 str(output_path),
 ]

 print(f"\nApplying premium color grading...")
 result = subprocess.run(cmd, capture_output=True, text=True)

 if result.returncode != 0:
 print("FFmpeg failed:")
 for line in (result.stderr or "").splitlines()[-15:]:
 print(f" {line}")
 sys.exit(1)

 output_size = output_path.stat().st_size / (1024 * 1024)
 print(f"Output: {output_path.name} ({output_size:.1f} MB)")
 print(f"Size change: {output_size - input_size:+.1f} MB")
 print("\nDone!")


if __name__ == "__main__":
 main()
