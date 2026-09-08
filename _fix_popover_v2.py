import pathlib

path = pathlib.Path("src/ui/WorkspacesSidebar.tsx")
lines = path.read_text().splitlines()

# Find popover block start and end
popover_start = None
popover_end = None
for i, line in enumerate(lines):
 if "Session Popover" in line and popover_start is None:
 popover_start = i
 if popover_start and line.strip() == "</div>" and i > popover_start + 5:
 # Check if next line is );
 if i + 1 < len(lines) and lines[i + 1].strip() == ");":
 popover_end = i + 2 # Include the closing </div> and );
 break

print(f"Popover starts at line {popover_start + 1}, ends at {popover_end + 1}")

# Find the component's closing </div>
# Looking for pattern: </div> followed by ); followed by }
component_end = None
for i in range(popover_end, len(lines)):
 if lines[i].strip() == "</div>" and i + 1 < len(lines) and lines[i + 1].strip() == ");":
 if i + 2 < len(lines) and lines[i + 2].strip() == "}":
 component_end = i
 break

print(f"Component ends at line {component_end + 1}")

if popover_start and popover_end and component_end:
 # Extract popover lines
 popover_lines = lines[popover_start:popover_end]
 print(f"Popover lines: {len(popover_lines)}")
 print(f"First line: {repr(popover_lines[0])}")
 print(f"Last line: {repr(popover_lines[-1])}")

 # Remove popover from current location
 new_lines = lines[:popover_start] + lines[popover_end:]

 # Find the new component end in the modified array
 new_component_end = None
 for i in range(component_end - (popover_end - popover_start), component_end + 5):
 if i < len(new_lines) and new_lines[i].strip() == "</div>":
 if i + 1 < len(new_lines) and new_lines[i + 1].strip() == ");":
 if i + 2 < len(new_lines) and new_lines[i + 2].strip() == "}":
 new_component_end = i
 break

 print(f"New component end at line {new_component_end + 1}")

 # Insert popover before the closing </div>
 final_lines = new_lines[:new_component_end] + popover_lines + new_lines[new_component_end:]

 path.write_text("\n".join(final_lines))
 print(f"SUCCESS! Total lines: {len(final_lines)}")
 print(f"Popover inserted at line {new_component_end + 1}")
else:
 print("ERROR: Could not find indices")
