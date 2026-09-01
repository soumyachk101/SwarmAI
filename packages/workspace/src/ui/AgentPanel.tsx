import { useState, useCallback } from "react";
import { Trash2, Search } from "lucide-react";

interface AgentPanelProps {
	projectPath?: string | null;
}

export default function AgentPanel({ projectPath }: AgentPanelProps) {
	const [agents, setAgents] = useState<AgentInfo[]>([]);
	const [search, setSearch] = useState("");

	const filteredAgents = agents.filter((a) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return (
			a.name.toLowerCase().includes(q) ||
			(a.workingDir || projectPath || "~/").toLowerCase().includes(q)
		);
	});

	const handleClose = useCallback((id: string) => {
		setAgents((prev) => prev.filter((a) => a.id !== id));
	}, []);

	return (
		<div className="flex h-full flex-col min-h-0">
			{/* Header */}
			<div className="flex h-9 shrink-0 items-center justify-between px-3 border-b border-white/[0.06] bg-[#0c0e18]/80 backdrop-blur-md select-none">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
						Agents
					</span>
					<span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.04]">
						{filteredAgents.length}/{agents.length}
					</span>
				</div>
			</div>

			{/* Search */}
			<div className="shrink-0 px-2 pt-2">
				<div className="relative">
					<Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Filter agents..."
						className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-md pl-7 pr-2 py-1.5 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
					/>
				</div>
			</div>

			{/* Agent list */}
			<div className="flex-1 overflow-y-auto p-2 space-y-2">
				{filteredAgents.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs gap-2 py-8">
						<span>No active agents</span>
						<span className="text-[10px]">Launch an agent from the terminal</span>
					</div>
				) : (
					filteredAgents.map((agent) => (
						<div
							key={agent.id}
							className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-medium text-zinc-200">{agent.name}</span>
								<button
									onClick={() => handleClose(agent.id)}
									className="text-zinc-500 hover:text-zinc-300 transition-colors"
								>
									<Trash2 className="w-3 h-3" />
								</button>
							</div>
							<div className="text-[10px] text-zinc-500 font-mono truncate">
								{agent.workingDir || projectPath || "~/"}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
