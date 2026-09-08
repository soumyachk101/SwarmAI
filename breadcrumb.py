path = '/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/desktop/src/app/HomePage.tsx'
with open(path) as f: lines = f.readlines()

inserted = False
for i, line in enumerate(lines):
 if inserted:
 break
 if 'leading={' in line and i < len(lines) - 3:
 if 'leftOpen ? undefined' in lines[i+1]:
 for j in range(i, min(i+5, len(lines))):
 if 'shrink-0">' in lines[j] and 'flex items-center gap-1' in lines[j]:
 breadcrumb = ' {projectPath && (\n <span className="text-[11px] font-medium text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] truncate max-w-[140px] hidden sm:inline" title={projectPath}>\n {projectPath.split(\'/\').filter(Boolean).pop()}\n </span>\n )}\n'
 lines.insert(j+1, breadcrumb)
 print(f'Breadcrumb inserted at line {j+2}')
 inserted = True
 break

with open(path, 'w') as f: f.writelines(lines)
print('HomePage.tsx breadcrumb done')
