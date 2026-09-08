#!/usr/bin/env python3
path = "packages/workspace/src/ui/WorkspacesSidebar.tsx"
with open(path) as f:
 lines = f.readlines()

# Find the Card Actions section
for i, line in enumerate(lines):
 if "Card Actions" in line:
 print(f"Card Actions at line {i+1}")
 for j in range(i, i+18):
 print(f"{j+1}: {repr(lines[j])}")
 break
