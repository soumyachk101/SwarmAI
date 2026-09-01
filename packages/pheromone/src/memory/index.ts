import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { PheromoneDatabase } from '../db/index.js';
import { type FileSystemPort, NodeFileSystem } from '../ports.js';

// ── Path safety ──────────────────────────────────────────────────────

/**
 * Validate that a relative path stays inside `.pheromone/`.
 * Rejects absolute paths, `..` traversal, and any path that escapes the base directory.
 */
function validateRelativePath(projectPath: string, relativePath: string): string {
 if (!relativePath || relativePath.trim() === '') {
 throw new Error('Empty path not allowed');
 }
 if (relativePath.startsWith('/')) {
 throw new Error(`Absolute paths not allowed: ${relativePath}`);
 }
 if (relativePath.includes('..')) {
 throw new Error(`Path traversal detected (contains ..): ${relativePath}`);
 }
 const base = `${projectPath}/.pheromone`;
 const full = `${base}/${relativePath}`;
 // Verify the resolved path stays under the base directory.
 if (!full.startsWith(base + '/')) {
 throw new Error(`Path traversal detected: ${relativePath} resolves outside .pheromone`);
 }
 return relativePath;
}

export interface MemoryFile {
 path: string;
 type: 'memory' | 'agent_session' | 'agent_summary' | 'handoff' | 'task_state';
 content: string;
 frontmatter?: Record<string, any>;
}

export class MemoryManager {
 private db: PheromoneDatabase;
 private projectPath: string;
 private fs: FileSystemPort;

 constructor(db: PheromoneDatabase, projectPath: string, fs?: FileSystemPort) {
 this.db = db;
 this.projectPath = projectPath;
 this.fs = fs ?? new NodeFileSystem();
 }

 async ensureStructure(): Promise<void> {
 const pheromonePath = `${this.projectPath}/.pheromone`;
 const dirs = [
 `${pheromonePath}/memory`,
 `${pheromonePath}/agents/sessions`,
 `${pheromonePath}/agents/summaries`,
 `${pheromonePath}/tasks`,
 `${pheromonePath}/index`,
 ];

 for (const dir of dirs) {
 await this.fs.mkdir(dir, { recursive: true });
 }

 // Create default memory files if they don't exist
 const memoryFiles = [
 { name: 'project.md', title: 'Project Overview' },
 { name: 'architecture.md', title: 'Architecture' },
 { name: 'decisions.md', title: 'Architecture Decisions' },
 { name: 'conventions.md', title: 'Coding Conventions' },
 { name: 'patterns.md', title: 'Design Patterns' },
 { name: 'bugs.md', title: 'Known Bugs & Issues' },
 { name: 'knowledge.md', title: 'General Knowledge' },
 ];

 for (const file of memoryFiles) {
 const filePath = `${pheromonePath}/memory/${file.name}`;
 const exists = await this.fs.exists(filePath);
 if (!exists) {
 await this.fs.writeFile(filePath, `# ${file.title}\n\n<!-- Add content here -->\n`, 'utf-8');
 }
 }
 }

 async readMemoryFile(relativePath: string): Promise<MemoryFile | null> {
 const safePath = validateRelativePath(this.projectPath, relativePath);
 const fullPath = `${this.projectPath}/.pheromone/${safePath}`;
 try {
 await this.fs.access(fullPath);
 } catch {
 return null;
 }
 const content = await this.fs.readFile(fullPath, 'utf-8');
 const parsed = matter(content);

 let type: MemoryFile['type'] = 'memory';
 if (safePath.startsWith('agents/sessions/')) type = 'agent_session';
 else if (safePath.startsWith('agents/summaries/')) type = 'agent_summary';
 else if (safePath === 'agents/handoffs.md') type = 'handoff';
 else if (safePath.startsWith('tasks/')) type = 'task_state';

 return {
 path: safePath,
 type,
 content: parsed.content,
 frontmatter: parsed.data,
 };
 }

 async writeMemoryFile(relativePath: string, content: string, frontmatter?: Record<string, any>): Promise<void> {
 const safePath = validateRelativePath(this.projectPath, relativePath);
 const fullPath = `${this.projectPath}/.pheromone/${safePath}`;
 const dir = `${this.projectPath}/.pheromone/${safePath.split('/').slice(0, -1).join('/')}`;
 await this.fs.mkdir(dir, { recursive: true });

 const fileContent = matter.stringify(content, frontmatter || {});
 await this.fs.writeFile(fullPath, fileContent, 'utf-8');
 }

 async listMemoryFiles(): Promise<string[]> {
 const memoryPath = `${this.projectPath}/.pheromone/memory`;
 const files = await this.fs.readdir(memoryPath);
 return files.filter((f: string) => f.endsWith('.md')).map((f: string) => `memory/${f}`);
 }

 async parseMarkdownToChunks(content: string): Promise<Array<{ text: string; heading?: string }>> {
 const processor = unified().use(remarkParse);
 const tree = processor.parse(content);

 const chunks: Array<{ text: string; heading?: string }> = [];
 let currentHeading: string | undefined;

 function extractText(node: any): string {
 if (!node) return '';
 switch (node.type) {
 case 'text':
 return node.value || '';
 case 'inlineCode':
 return `\`${node.value || ''}\``;
 case 'strong':
 return `**${extractChildrenText(node)}**`;
 case 'emphasis':
 return `*${extractChildrenText(node)}*`;
 case 'link':
 return `[${extractChildrenText(node)}](${node.url || ''})`;
 case 'image':
 return `![${node.alt || ''}](${node.url || ''})`;
 case 'code':
 return `\`\`\`${node.lang || ''}\n${node.value || ''}\n\`\`\``;
 case 'heading':
 return node.children.map((c: any) => extractText(c)).join('');
 case 'paragraph':
 return extractChildrenText(node);
 case 'list':
 const items = (node.children || []).map((c: any) => `- ${extractChildrenText(c)}`).join('\n');
 return items;
 case 'listItem':
 return extractChildrenText(node);
 case 'blockquote':
 return `> ${extractChildrenText(node)}`;
 case 'table': {
 const rows = (node.children || []).map((row: any) => {
 const cells = (row.children || []).map((cell: any) => extractChildrenText(cell)).join(' | ');
 return `| ${cells} |`;
 });
 return rows.join('\n');
 }
 case 'tableRow':
 case 'tableCell':
 return extractChildrenText(node);
 case 'thematicBreak':
 return '---';
 case 'break':
 return '\n';
 case 'root':
 case 'parent':
 return extractChildrenText(node);
 default:
 return extractChildrenText(node);
 }
 }

 function extractChildrenText(node: any): string {
 if (!node || !node.children) return '';
 return node.children.map((c: any) => extractText(c)).join('');
 }

 function flushText(text: string) {
 if (text.trim()) {
 chunks.push({ text: text.trim(), heading: currentHeading });
 }
 }

 for (const node of tree.children as any[]) {
 switch (node.type) {
 case 'heading':
 flushText(currentText);
 currentText = '';
 currentHeading = node.children.map((c: any) => extractText(c)).join('');
 break;
 case 'paragraph':
 currentText += extractText(node) + '\n\n';
 break;
 case 'code':
 flushText(currentText);
 currentText = '';
 chunks.push({ text: extractText(node), heading: currentHeading });
 break;
 case 'list':
 flushText(currentText);
 currentText = '';
 chunks.push({ text: extractText(node), heading: currentHeading });
 break;
 case 'blockquote':
 flushText(currentText);
 currentText = '';
 chunks.push({ text: extractText(node), heading: currentHeading });
 break;
 case 'table':
 flushText(currentText);
 currentText = '';
 chunks.push({ text: extractText(node), heading: currentHeading });
 break;
 default:
 currentText += extractText(node) + '\n\n';
 }
 }

 flushText(currentText);
 return chunks;
 }
}
