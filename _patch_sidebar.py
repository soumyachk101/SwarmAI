import pathlib

path = "packages/workspace/src/ui/WorkspacesSidebar.tsx"
with open(path) as f:
 content = f.read()

old = """ <button
 onClick={(e) => { e.stopPropagation(); if (noRepo) { bindRepo(); return; } setAdding(!adding); setError(null); }}
 className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
 title={noRepo ? "Bind folder" : "New worktree branch"}
 >
 {noRepo ? <FolderPlus size={12} /> : <Plus size={12} />}
 </button>"""

new = """ <button
 onClick={(e) => { e.stopPropagation(); setSessionPopover({ workspaceId: ws.id, workspaceName: ws.name, projectPath: ws.boundProjectPath ?? null, rect: e.currentTarget.getBoundingClientRect() }); }}
 className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
 title="Sessions"
 >
 <MessageSquare size={12} />
 </button>
 <button
 onClick={(e) => { e.stopPropagation(); if (noRepo) { bindRepo(); return; } setAdding(!adding); setError(null); }}
 className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
 title={noRepo ? "Bind folder" : "New worktree branch"}
 >
 {noRepo ? <FolderPlus size={12} /> : <Plus size={12} />}
 </button>"""

count = content.count(old)
print(f"Found {count} matches")
if count > 0:
 content = content.replace(old, new)
 with open(path, "w") as f:
 f.write(content)
 print("Done!")
else:
 print("No match found")
 for i, line in enumerate(content.splitlines()):
 if "Card Actions" in line:
 for j in range(i, min(i+20, len(content.splitlines()))):
 print(f"{j+1}: {content.splitlines()[j]}")
