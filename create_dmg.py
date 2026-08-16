import subprocess
import os

# Create DMG using hdiutil
result = subprocess.run([
 'hdiutil', 'create',
 '-srcfolder', 'SwarmAI.app',
 '-volname', 'SwarmAI Installer',
 '-format', 'UDZO',
 '-imagekey', 'zlib-level=9',
 'SwarmAI_0.1.0_aarch64.dmg'
], capture_output=True, text=True)

print("stdout:", result.stdout)
print("stderr:", result.stderr)
print("return code:", result.returncode)

if result.returncode == 0:
	print("DMG created successfully!")
else:
	print("DMG creation failed")
