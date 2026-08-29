import { Clock, Cpu, UserCheck } from 'lucide-react';
import type { TaskCard } from '../board.js';

interface Props {
  task: TaskCard;
  isSelected: boolean;
  onPointerDownCapture?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  builder: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  reviewer: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    border: 'border-cyan-500/25',
    dot: 'bg-cyan-400',
  },
  scout: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-500/25',
    dot: 'bg-amber-400',
  },
  coordinator: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
    border: 'border-purple-500/25',
    dot: 'bg-purple-400',
  },
};

export default function TasksCard({ task, isSelected, onPointerDownCapture, onClick }: Props) {
  const roleStyle = task.assignedRole ? ROLE_STYLES[task.assignedRole.toLowerCase()] : undefined;

  return (
    <div
      data-agent-board-card-id={task.id}
      data-agent-board-card-selected={isSelected ? 'true' : undefined}
      data-agent-board-pointer-draggable="true"
      onPointerDownCapture={onPointerDownCapture}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={task.title}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent);
        }
      }}
      className={`glass-hi rounded-lg p-2.5 space-y-2 cursor-grab active:cursor-grabbing transition-all duration-150 relative ${
        isSelected
          ? 'ring-1 ring-swarm-gold/60 shadow-[0_0_12px_rgb(var(--swarm-gold)/0.25)] border-swarm-gold/50'
          : 'hover:shadow-glass-lg hover:border-swarm-border/80'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-mini font-medium text-swarm-text leading-snug block flex-1">{task.title}</span>
        {task.agentId && (
          <span className="shrink-0 flex items-center gap-0.5 text-micro font-mono text-swarm-goldHi bg-swarm-gold/10 px-1 py-0.5 rounded border border-swarm-gold/20" title={`Agent: ${task.agentId}`}>
            <Cpu className="size-2.5" />
          </span>
        )}
      </div>

      {task.description && (
        <p className="text-micro text-swarm-textMuted leading-relaxed line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        {task.assignedRole && (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-micro font-medium border ${
              roleStyle
                ? `${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`
                : 'bg-swarm-gold/10 text-swarm-goldHi border-swarm-gold/20'
            }`}
          >
            <span className={`w-1 h-1 rounded-full ${roleStyle?.dot || 'bg-swarm-gold'}`} />
            {task.assignedRole}
          </span>
        )}
        {task.assignedCli && (
          <span className="text-micro font-mono text-swarm-textMuted bg-swarm-border/20 px-1 py-0.5 rounded">
            {task.assignedCli}
          </span>
        )}
        {task.worktreeBranch && (
          <span className="text-micro font-mono text-swarm-gold/70 truncate max-w-[120px]" title={task.worktreeBranch}>
            {task.worktreeBranch.replace('agent/', '')}
          </span>
        )}
      </div>

      {task.blockingReason && (
        <div className="flex items-center gap-1 text-micro text-swarm-warn bg-swarm-warn/10 px-1.5 py-0.5 rounded">
          <Clock size={8} />
          waiting on: {task.blockingReason}
        </div>
      )}
    </div>
  );
}
