import re

path = "/Users/soumyachakraborty/Documents/Projects-939/AI-Agents/swarm-ai/swarm/src/app/HomePage.tsx"
with open(path) as f:
 content = f.read()

# Patch 1: Add state vars before gitStatus
old1 = " const [showTemplatesModal, setShowTemplatesModal] = useState(false);\n const [gitStatus, setGitStatus] = useState<{"
new1 = " const [showTemplatesModal, setShowTemplatesModal] = useState(false);\n const [showHistory, setShowHistory] = useState(false);\n const [showShortcuts, setShowShortcuts] = useState(false);\n const onboarding = useOnboarding();\n const [gitStatus, setGitStatus] = useState<{"
content = content.replace(old1, new1, 1)

# Patch 2: Add keyboard shortcuts after setShowPalette return
old2 = " setShowPalette((prev) => !prev);\n return;\n }\n if (e.ctrlKey && e.key === \"b\") {"
new2 = " setShowPalette((prev) => !prev);\n return;\n }\n if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === \"h\" && !e.shiftKey) {\n e.preventDefault();\n setShowHistory((prev) => !prev);\n return;\n }\n if (e.key === \"F1\" || ((e.metaKey || e.ctrlKey) && e.key === \"/\")) {\n e.preventDefault();\n setShowShortcuts((prev) => !prev);\n return;\n }\n if (e.ctrlKey && e.key === \"b\") {"
content = content.replace(old2, new2, 1)

# Patch 3: Add History icon import
old3 = " FolderGit2,\n} from \"lucide-react\";"
new3 = " FolderGit2,\n History,\n} from \"lucide-react\";"
content = content.replace(old3, new3, 1)

# Patch 4: Add history/shortcuts buttons to status bar
old4 = " <button\n onClick={() => toggleLeft()}\n className=\"rounded-md p-1 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text\"\n title=\"Collapse sidebar\"\n >\n <PanelLeft size={15} />\n </button>\n </div>"
new4 = " <button\n onClick={() => setShowHistory(true)}\n className=\"rounded-md p-1 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text\"\n title=\"Command History (Ctrl+H)\"\n >\n <History size={15} />\n </button>\n <button\n onClick={() => setShowShortcuts(true)}\n className=\"rounded-md p-1 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text\"\n title=\"Keyboard Shortcuts (F1)\"\n >\n <HelpCircle size={15} />\n </button>\n <button\n onClick={() => toggleLeft()}\n className=\"rounded-md p-1 text-swarm-textMuted transition-colors hover:bg-swarm-border/50 hover:text-swarm-text\"\n title=\"Collapse sidebar\"\n >\n <PanelLeft size={15} />\n </button>\n </div>"
content = content.replace(old4, new4, 1)

# Patch 5: Add modals before closing tags
old5 = " </div>\n </>\n );"
new5 = " <CommandHistoryPopup open={showHistory} onClose={() => setShowHistory(false)} />\n <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />\n <OnboardingModal />\n </div>\n </>\n );"
content = content.replace(old5, new5, 1)

# Patch 6: Add imports for new components
old6 = "import CommandPalette from \"@/shared/CommandPalette\";\nimport GitControlModal from \"@/features/git/GitControlModal\";"
new6 = "import CommandPalette from \"@/shared/CommandPalette\";\nimport ShortcutsModal from \"@/shared/ShortcutsModal\";\nimport OnboardingModal, { useOnboarding } from \"@/shared/OnboardingModal\";\nimport CommandHistoryPopup from \"@/shared/CommandHistoryPopup\";\nimport GitControlModal from \"@/features/git/GitControlModal\";"
content = content.replace(old6, new6, 1)

with open(path, "w") as f:
 f.write(content)

print("All patches applied successfully")
