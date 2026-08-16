#!/usr/bin/env python3
"""Build the SwarmAI app and create a DMG installer."""
import subprocess
import os
import shutil

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SWARM_DIR = os.path.join(PROJECT_ROOT, 'swarm')

print("Building SwarmAI with Tauri...")
result = subprocess.run(
 ['cargo', 'tauri', 'build'],
 cwd=SWARM_DIR,
 capture_output=True,
 text=True
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)

if result.returncode != 0:
 print("Build failed!")
 exit(1)

# Find the built app
bundle_dir = os.path.join(SWARM_DIR, 'src-tauri', 'target', 'release', 'bundle', 'dmg')
if os.path.exists(bundle_dir):
    for f in os.listdir(bundle_dir):
        if f.endswith('.app') or f.endswith('.dmg'):
            print(f"Found: {f}")

print("\nBuild complete!")
