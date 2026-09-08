import pathlib
path = pathlib.Path("packages/workspace/src/ui/WorkspacesSidebar.tsx")
lines = path.read_text().splitlines()

# Fix indentation on lines 2007-2013
for i in range(2006, 2013):
 stripped = lines[i].lstrip()
 if stripped.startswith("className") or stripped.startswith("title") or stripped.startswith(">") or stripped.startswith("<MessageSquare"):
 lines[i] = " " + stripped

# Find insertion point
insert_idx = None
for i, line in enumerate(lines):
 if i > 2070 and line.strip() == "}" and i+1 < len(lines) and "Minimalist" in lines[i+1]:
 insert_idx = i + 1
 break

if insert_idx is None:
 print("ERROR: Could not find insertion point")
 raise SystemExit(1)

insert_lines = [
 "",
 " {/* Session Popover */}",
 " {sessionPopover && createPortal(",
 " <>",
 " <div className=\"fixed inset-0 z-[250]\" onClick={() => setSessionPopover(null)} />",
 " <div",
 " className=\"fixed z-[251] w-80 max-h-96 rounded-xl border border-white/10 bg-[#14161d] shadow-2xl shadow-black/60 flex flex-col overflow-hidden\"",
 " style={{",
 " top: Math.min(sessionPopover.rect.bottom + 6, window.innerHeight - 420),",
 " left: Math.min(sessionPopover.rect.left, window.innerWidth - 330),",
 " }}",
 " onClick={(e) => e.stopPropagation()}",
 " >",
 " <div className=\"flex items-center justify-between px-3 py-2 border-b border-white/[0.06]\">",
 " <span className=\"text-[11px] font-semibold text-zinc-200 truncate\">{sessionPopover.workspaceName}</span>",
 " <button onClick={() => setSessionPopover(null)} className=\"size-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer\">",
 " <X size={12} />",
 " </button>",
 " </div>",
 " <SessionPopoverList workspaceId={sessionPopover.workspaceId} projectPath={sessionPopover.projectPath} onClose={() => setSessionPopover(null)} />",
 " </div>",
 " </>,",
 " document.body",
 " )",
 " }",
 " </div>",
 " );",
]

for j, new_line in enumerate(insert_lines):
 lines.insert(insert_idx + j, new_line)

path.write_text("\n".join(lines))
print(f"SUCCESS! Inserted popover at line {insert_idx}")
print(f"Total lines: {len(lines)}")
