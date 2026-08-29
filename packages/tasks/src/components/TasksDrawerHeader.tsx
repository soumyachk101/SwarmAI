import { useState } from 'react';
import { X, Plus, Sparkles, Send } from 'lucide-react';
import type { TaskCard } from '../board.js';

interface Props {
  selectedCount: number;
  onClose: () => void;
  onQuickAdd?: (task: { title: string; description?: string; role?: string; files?: string[] }) => void;
}

function detectRole(text: string): 'builder' | 'reviewer' | 'scout' | 'coordinator' {
  const lower = text.toLowerCase();
  if (/\b(review|audit|check|test|verify|inspect|lint)\b/.test(lower)) return 'reviewer';
  if (/\b(scout|search|find|investigate|explore|discover|analyze)\b/.test(lower)) return 'scout';
  if (/\b(plan|coordinate|orchestrate|split|manage)\b/.test(lower)) return 'coordinator';
  return 'builder';
}

function extractFiles(text: string): string[] {
  const fileRegex = /\b[\w./-]+\.(?:ts|tsx|js|jsx|json|md|rs|go|py|css|html)\b/gi;
  const matches = text.match(fileRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

export default function TasksDrawerHeader({ selectedCount, onClose, onQuickAdd }: Props) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const suggestedRole = input.trim() ? detectRole(input) : 'builder';
  const detectedFiles = input.trim() ? extractFiles(input) : [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !onQuickAdd) return;
    onQuickAdd({
      title: input.trim(),
      role: suggestedRole,
      files: detectedFiles,
    });
    setInput('');
    setIsExpanded(false);
  };

  return (
    <div className="flex flex-col border-b border-swarm-border/50 shrink-0 bg-swarm-surface/40 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-swarm-gold uppercase tracking-wider">Workspace Board</span>
          {selectedCount > 0 && (
            <span className="text-micro font-mono text-swarm-goldHi bg-swarm-gold/10 px-1.5 py-0.5 rounded-full border border-swarm-gold/20">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onQuickAdd && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="inline-flex items-center gap-1 text-micro font-medium px-2 py-1 rounded bg-swarm-gold/15 text-swarm-goldHi border border-swarm-gold/30 hover:bg-swarm-gold/25 transition-all shadow-sm"
              title="Quick Add Task with Natural Language"
            >
              <Plus className="size-3" />
              <span>Quick Task</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-swarm-border/60 text-swarm-textMuted hover:text-swarm-text transition-colors"
            title="Close Tasks"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {isExpanded && onQuickAdd && (
        <form onSubmit={handleAdd} className="px-4 pb-3 pt-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Fix login timeout bug in auth.service.ts or Review PR changes"
                autoFocus
                className="w-full bg-swarm-canvas/80 border border-swarm-gold/40 focus:border-swarm-gold rounded px-3 py-1.5 text-xs text-swarm-text placeholder:text-swarm-textMuted focus:outline-none focus:ring-1 focus:ring-swarm-gold/50 pr-8"
              />
              <Sparkles className="size-3.5 text-swarm-gold/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-swarm-gold text-swarm-canvas hover:bg-swarm-goldHi disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
            >
              <Send className="size-3" />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={() => { setIsExpanded(false); setInput(''); }}
              className="text-micro text-swarm-textMuted hover:text-swarm-text px-2 py-1.5"
            >
              Cancel
            </button>
          </div>

          {input.trim().length > 0 && (
            <div className="flex items-center gap-2 text-micro text-swarm-textMuted flex-wrap">
              <span className="flex items-center gap-1">
                Auto-role:
                <span className="font-semibold text-swarm-gold uppercase px-1.5 py-0.5 rounded bg-swarm-gold/10 border border-swarm-gold/20">
                  {suggestedRole}
                </span>
              </span>
              {detectedFiles.length > 0 && (
                <span className="flex items-center gap-1">
                  Files:
                  {detectedFiles.map((f) => (
                    <span key={f} className="font-mono text-swarm-gold/80 bg-swarm-border/30 px-1 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                </span>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
