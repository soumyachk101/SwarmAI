with open('/Users/soumyachakraborty/Documents/Projects-939/AI-Agents/swarm-ai/agents/src/ui/AgentPane.tsx', 'r') as f:
 lines = f.readlines()

for i in range(1850, 1856):
 line = lines[i]
 content = line.lstrip()
 if content.strip():
 lines[i] = ' ' + content

with open('/Users/soumyachakraborty/Documents/Projects-939/AI-Agents/swarm-ai/agents/src/ui/AgentPane.tsx', 'w') as f:
 f.writelines(lines)
print('Done')
