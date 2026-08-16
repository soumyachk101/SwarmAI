with open('swarm/src-tauri/src/lib.rs', 'r') as f:
 lines = f.readlines()

# Delete line 328 (index 327) - the broken "/ GUI" line
# Lines 329-332 (indices 328-331) are the good ones but need 4-space indent
# After deleting line 328, indices shift

# Step 1: Delete the broken line at index 327
del lines[327]

# Step 2: Now lines 328-331 (old 329-332) need proper indentation
# They currently start with ' //' and ' cmd.' but should start with ' //' and ' cmd.'
for idx in range(328, 332):
 lines[idx] = ' ' + lines[idx].lstrip()

with open('swarm/src-tauri/src/lib.rs', 'w') as f:
 f.writelines(lines)
print("Fixed!")
