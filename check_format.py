#!/usr/bin/env python3
import sys

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 content = f.read()

# Find the "let shell = std::env::var" line
lines = content.split('\n')
shell_line_idx = None
for i, line in enumerate(lines):
 if 'let shell = std::env::var("SHELL")' in line:
 shell_line_idx = i
 break

if shell_line_idx is None:
 print("ERROR: Could not find 'let shell = std::env::var' line")
 sys.exit(1)

print(f"Found shell line at index {shell_line_idx} (line {shell_line_idx + 1})")
print(f"Shell line indent: {repr(lines[shell_line_idx][:20])}")

# Check what indentation is used
shell_line = lines[shell_line_idx]
indent = shell_line[:len(shell_line) - len(shell_line.lstrip())]
print(f"Indent length: {len(indent)}, first char: {repr(indent[0]) if indent else 'empty'}")
print(f"Indent hex: {indent.encode('utf-8').hex()}")

# Check line before
print(f"Previous line: {repr(lines[shell_line_idx - 1][:50])}")
print(f"Previous line indent: {repr(lines[shell_line_idx - 1][:len(lines[shell_line_idx - 1]) - len(lines[shell_line_idx - 1].lstrip())][:20])}")
