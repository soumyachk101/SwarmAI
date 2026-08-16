import sys

filepath = 'swarm/src-tauri/src/lib.rs'

with open(filepath, 'rb') as f:
	raw = f.read()

# Convert to string
text = raw.decode('utf-8')
lines = text.split('\n')

# Print lines 678-697 with their exact content to debug
print("Lines 679-697:")
for i in range(678, 697):
	print(f"{i+1}: {repr(lines[i])}")
