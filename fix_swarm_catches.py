import re, glob, sys

files = [
 "swarm/src/features/browser/BrowserPane.tsx",
 "swarm/src/features/browser/cdp.ts",
 "swarm/src/features/dock/RightDock.tsx",
 "swarm/src/features/emulator/android/AndroidEmulatorPane.tsx",
 "swarm/src/features/emulator/android/AvdBuildDialog.tsx",
 "swarm/src/features/emulator/emulatorStore.ts",
 "swarm/src/features/git/GitControlModal.tsx",
 "swarm/src/features/help/UserGuideModal.tsx",
 "swarm/src/features/settings/ProvidersSection.tsx",
 "swarm/src/features/settings/SettingsPage.tsx",
 "swarm/src/features/templates/TaskTemplatesModal.tsx",
 "swarm/src/features/updates/UpdateCheckerModal.tsx",
 "swarm/src/features/updates/useUpdateChecker.ts",
 "swarm/src/features/dashboard/SwarmDashboardModal.tsx",
 "swarm/src/features/diff/DiffPreviewModal.tsx",
 "swarm/src/app/HomePage.tsx",
]

for fpath in files:
 try:
 with open(fpath, "r") as f:
 content = f.read()
 original = content

 # Pattern: e?.message ?? e -> e instanceof Error ? e.message : String(e)
 content = content.replace("e?.message ?? e", "e instanceof Error ? e.message : String(e)")

 # Pattern: .message -> instanceof Error ? .message : ''
 # but only within catch(e: unknown) blocks - simpler approach:
 # Replace `e.message` with `e instanceof Error ? e.message : ''`
 content = content.replace("e.message", "e instanceof Error ? e.message : ''")

 if content != original:
 with open(fpath, "w") as f:
 f.write(content)
 print(f"Fixed: {fpath}")
 else:
 print(f"No change: {fpath}")
 except Exception as ex:
 print(f"ERROR {fpath}: {ex}")
