import pathlib
p = pathlib.Path("packages/workspace/src/ui/WorkspacesSidebar.tsx")
lines = p.read_text().splitlines()

# Find component end and popover
component_end_idx = None
popover_start_idx = None
for i, line in enumerate(lines):
 if line.strip() == "}" and i > 2350 and component_end_idx is None:
 component_end_idx = i
 if "Session Popover" in line and popover_start_idx is None:
 popover_start_idx = i

print(f"Component ends at line: {component_end_idx + 1}")
print(f"Popover starts at line: {popover_start_idx + 1}")

if popover_start_idx and component_end_idx:
 popover_end_idx = None
 for i in range(popover_start_idx, len(lines)):
 if lines[i].strip() == "}" and i > popover_start_idx + 5:
 popover_end_idx = i
 break
 print(f"Popover ends at line: {popover_end_idx + 1}")

 new_lines = lines[:component_end_idx + 1]
 new_lines.append("")
 new_lines.append("")
 new_lines.extend(lines[popover_end_idx + 1:])
 p.write_text("\n".join(new_lines))
 print(f"Done. Total lines: {len(new_lines)}")
else:
 print("Could not find indices")
