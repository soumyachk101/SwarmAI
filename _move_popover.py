import pathlib

path = pathlib.Path("packages/workspace/src/ui/WorkspacesSidebar.tsx")
lines = path.read_text().splitlines()

# Find popover block
popover_start = None
popover_end = None
for i, line in enumerate(lines):
 if "Session Popover" in line and popover_start is None:
 popover_start = i
 if popover_start and line.strip() == "}" and i > popover_start + 10:
 popover_end = i
 break

print(f"Popover starts at line {popover_start + 1}, ends at {popover_end + 1}")

# Find component closing
component_close = None
for i in range(popover_start - 10, popover_start):
 if lines[i].strip() == "</div>" and lines[i+1].strip() == ");" and lines[i+2].strip() == "}":
 component_close = i
 break

print(f"Component closes at line {component_close + 1}")

if popover_start and popover_end and component_close:
 popover_lines = lines[popover_start:popover_end]
 new_lines = lines[:popover_start] + lines[popover_end:]

 insert_idx = None
 for i in range(component_close, component_close + 5):
 if new_lines[i].strip() == "</div>":
 insert_idx = i
 break

 print(f"Inserting popover at line {insert_idx + 1}")
 final_lines = new_lines[:insert_idx] + popover_lines + new_lines[insert_idx:]
 path.write_text("\n".join(final_lines))
 print(f"SUCCESS! Total lines: {len(final_lines)}")
else:
 print("ERROR: Could not find indices")
