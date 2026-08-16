import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
	lines = f.readlines()

# Fix Vec::new() indentation on line 694 (0-indexed: 693)
# It should have 20 spaces (same level as the let/if above it)
if 'Vec::new()' in lines[693]:
	lines[693] = ' Vec::new()\n'
	print("Fixed Vec::new() indentation")

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
	f.writelines(lines)

print("Done!")
