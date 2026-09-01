import re

with open('packages/plugins/src/plugins/glasschat/DevChatStudio.tsx', 'r') as f:
 content = f.read()

# Remove the fake "Thought" thinking block (lines 1410-1430)
pattern = r' \{/\* Collapsible Claude/Gemini Thinking Process Box \*/\}\n \{!isUser && msg\.thought && \(\n.*?\n \}\)\}\n'

new_content = re.sub(pattern, '', content, flags=re.DOTALL)

if new_content != content:
 with open('packages/plugins/src/plugins/glasschat/DevChatStudio.tsx', 'w') as f:
 f.write(new_content)
 print('SUCCESS: Removed fake reasoning indicator block')
else:
 print('ERROR: Pattern not found, showing context...')
 lines = content.split('\n')
 for i, line in enumerate(lines[1408:1435], start=1409):
 print(f'{i}: {repr(line)}')
