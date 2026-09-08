import pathlib
p = pathlib.Path("packages/workspace/src/ui/WorkspacesSidebar.tsx")
content = p.read_text()
old = " );\n}\n\n\n"
new = " );\n }\n\n {/* Session Popover */}\n {sessionPopover && createPortal(\n <>\n <div className=\"fixed inset-0 z-[250]\" onClick={() => setSessionPopover(null)} />\n <div\n className=\"fixed z-[251] w-80 max-h-96 rounded-xl border border-white/10 bg-[#14161d] shadow-2xl shadow-black/60 flex flex-col overflow-hidden\"\n style={{\n top: Math.min(sessionPopover.rect.bottom + 6, window.innerHeight - 420),\n left: Math.min(sessionPopover.rect.left, window.innerWidth - 330),\n }}\n onClick={(e) => e.stopPropagation()}\n >\n <div className=\"flex items-center justify-between px-3 py-2 border-b border-white/[0.06]\">\n <span className=\"text-[11px] font-semibold text-zinc-200 truncate\">{sessionPopover.workspaceName}</span>\n <button onClick={() => setSessionPopover(null)} className=\"size-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer\">\n <X size={12} />\n </button>\n </div>\n <SessionPopoverList workspaceId={sessionPopover.workspaceId} projectPath={sessionPopover.projectPath} onClose={() => setSessionPopover(null)} />\n </div>\n </>,\n document.body\n )\n }\n</div>\n);\n"
if old in content:
 content = content.replace(old, new)
 p.write_text(content)
 print("SUCCESS")
else:
 print("NOT FOUND")
