import pathlib

path = pathlib.Path("packages/workspace/src/ui/WorkspacesSidebar.tsx")
content = path.read_text()

# Find the exact lines to replace - the closing of the WorkspacesSidebar return
old = """ ))}
 </div>
 )}
 </div>
 );
}"""

new = """ ))}
 </div>
 )}

 {/* Session Popover */}
 {sessionPopover && createPortal(
 <>
 <div className="fixed inset-0 z-[250]" onClick={() => setSessionPopover(null)} />
 <div
 className="fixed z-[251] w-80 max-h-96 rounded-xl border border-white/10 bg-[#14161d] shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
 style={{
 top: Math.min(sessionPopover.rect.bottom + 6, window.innerHeight - 420),
 left: Math.min(sessionPopover.rect.left, window.innerWidth - 330),
 }}
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
 <span className="text-[11px] font-semibold text-zinc-200 truncate">{sessionPopover.workspaceName}</span>
 <button onClick={() => setSessionPopover(null)} className="size-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer">
 <X size={12} />
 </button>
 </div>
 <SessionPopoverList workspaceId={sessionPopover.workspaceId} projectPath={sessionPopover.projectPath} onClose={() => setSessionPopover(null)} />
 </div>
 </>,
 document.body
 )}
 </div>
 );
}"""

if old in content:
 content = content.replace(old, new)
 path.write_text(content)
 print("SUCCESS: Session popover added!")
else:
 print("ERROR: Could not find the target block")
 # Show surrounding context for debugging
 for i, line in enumerate(content.splitlines()):
 if "Sub-tree branches" in line:
 for j in range(i, min(i+25, len(content.splitlines()))):
 print(f"{j+1}: {content.splitlines()[j]}")
 break
