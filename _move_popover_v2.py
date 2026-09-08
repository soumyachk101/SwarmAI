import pathlib

path = pathlib.Path("src/ui/WorkspacesSidebar.tsx")
lines = path.read_text().splitlines()

# Find popover start and end
popover_start = None
popover_end = None
for i, line in enumerate(lines):
 if "Session Popover" in line and popover_start is None:
 popover_start = i
 if popover_start and line.strip() == ");" and i > popover_start + 5:
 if "createPortal" not in lines[i]:
 popover_end = i + 1
 break

print(f"Popover: lines {popover_start + 1} to {popover_end}")

# Remove popover from current location
new_lines = lines[:popover_start] + lines[popover_end:]
print(f"After removing popover: {len(new_lines)} lines")

# Find component closing - look for pattern: </div> then ); then }
component_end_idx = None
for i in range(len(new_lines) - 1, max(0, len(new_lines) - 20), -1):
 if new_lines[i].strip() == "</div>":
 if i + 1 < len(new_lines) and new_lines[i + 1].strip() == ");":
 if i + 2 < len(new_lines) and new_lines[i + 2].strip() == "}":
 component_end_idx = i
 break

print(f"Component ends at line: {component_end_idx + 1}")

if component_end_idx:
 popover_lines = lines[popover_start:popover_end]
 final_lines = new_lines[:component_end_idx] + popover_lines + new_lines[component_end_idx:]
 path.write_text("\n".join(final_lines))
 print(f"SUCCESS! Popover inserted at line {component_end_idx + 1}")
 print(f"Total lines: {len(final_lines)}")
else:
 print("ERROR: Could not find component end")
