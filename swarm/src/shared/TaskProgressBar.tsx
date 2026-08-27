"use client";

import { useMemo } from "react";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

export interface TaskProgressItem {
 id: string;
 title: string;
 status: "pending" | "in-progress" | "completed" | "blocked";
 assignee?: string;
 priority?: "low" | "medium" | "high" | "critical";
}

export default function TaskProgressBar({
 tasks,
 workspaceId,
}: {
 tasks: TaskProgressItem[];
 workspaceId: string;
}) {
 const stats = useMemo(() => {
 const total = tasks.length;
 const completed = tasks.filter((t) => t.status === "completed").length;
 const inProgress = tasks.filter((t) => t.status === "in-progress").length;
 const blocked = tasks.filter((t) => t.status === "blocked").length;
 const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
 return { total, completed, inProgress, blocked, pct };
 }, [tasks]);

 const barColor =
 stats.pct >= 80 ? "bg-emerald-500"
 : stats.pct >= 40
 ? "bg-amber-500"
 : stats.pct > 0
 ? "bg-blue-500"
 : "bg-zinc-700";

 const statusIcon: Record<string, React.ReactNode> = {
 completed: <CheckCircle2 size={11} className="text-emerald-400" />,
 "in-progress": <Clock size={11} className="text-blue-400 animate-pulse" />,
 blocked: <AlertCircle size={11} className="text-red-400" />,
 pending: <Circle size={11} className="text-zinc-500" />,
 };

 return (
 <div className="space-y-2">
 {/* Overall bar */}
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-500 ${barColor}`}
 style={{ width: `${stats.pct}%` }}
 />
 </div>
 <span className="text-[10px] font-mono text-zinc-400 shrink-0">{stats.pct}%</span>
 </div>

 {/* Item list (collapsed) */}
 {tasks.length > 0 && (
 <div className="space-y-1">
 {tasks.slice(0, 5).map((task) => (
 <div key={task.id} className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-white/[0.03] transition-colors">
 <div className="shrink-0">{statusIcon[task.status]}</div>
 <span className="text-[11px] text-zinc-300 truncate flex-1 font-sans">{task.title}</span>
 {task.priority && (
 <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
 task.priority === "critical" ? "bg-red-500/15 text-red-300"
 : task.priority === "high" ? "bg-amber-500/15 text-amber-300"
 : task.priority === "medium" ? "bg-blue-500/15 text-blue-300"
 : "bg-zinc-800 text-zinc-400"
 }`}>
 {task.priority}
 </span>
 )}
 </div>
 ))}
 {tasks.length > 5 && (
 <span className="text-[10px] text-zinc-500 font-mono pl-3.5">+{tasks.length - 5} more</span>
 )}
 </div>
 )}
 </div>
 );
}
