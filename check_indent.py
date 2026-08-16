#!/usr/bin/env python3
"""Check if tabs or spaces are used"""

with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 lines = f.readlines()

for idx in [680, 684, 685, 692]:
 line = lines[idx]
 indent = line[:len(line) - len(line.lstrip())]
 first_char = repr(indent[0]) if indent else 'empty'
 print(f"L{idx+1}: len={len(indent)}, first_char={first_char}")
 if indent:
 print(f" bytes: {indent[:3].encode('utf-8')}")
