import {
 type MouseEvent,
 useRef,
 useState,
 useCallback,
} from "react";
import { useAgentsStore } from "./agentsStore.js";
import { LeadCrown } from "@swarm/board";
import {
 ArrowRightLeft,
 MoreHorizontal,
 RefreshCw,
 Trash2,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface AgentControlsProps {
 paneId: string;
 agent: {
 id: string;
 cliName?: string;
 workspaceId?: string;
 };
 isLead: boolean;
 leadTaken: boolean;
 syncing: boolean;
 lastSync: number | null;
 otherAgents: Array<{
 id: string;
 customName?: string;
 cliName?: string;
 cli: string;
 }>;
 compactHeader: boolean;
 menuOpen: boolean;
 handoffMenuOpen: boolean;
 viewActions: Array<{
 key: string;
 icon: React.ReactNode;
 label: string;
 run: () => void;
 }>;
 onClose?: () => void;
 isMaximized?: boolean;
 promoteToLead: (workspaceId: string) => void;
 demoteLead: (workspaceId: string) => void;
 setMenuOpen: Dispatch<SetStateAction<boolean>>;
 setHandoffMenuOpen: Dispatch<SetStateAction<boolean>>;
 setHandoffSuccess: Dispatch<SetStateAction<string | null>>;
 handleHandoff: (target: { id: string; customName?: string; cliName?: string; cli: string }) => void;
 syncNowRef: React.RefObject<null | (() => Promise<void>)>;
}

function AgentControls({
 paneId,
 agent,
 isLead,
 leadTaken,
 syncing,
 lastSync,
 otherAgents,
 compactHeader,
 menuOpen,
 handoffMenuOpen,
 viewActions,
 onClose,
 isMaximized,
 promoteToLead,
 demoteLead,
 setMenuOpen,
 setHandoffMenuOpen,
 setHandoffSuccess,
 handleHandoff,
 syncNowRef,
}: AgentControlsProps) {
 const handoffMenuRef = useRef<HTMLDivElement>(null);
 const menuRef = useRef<HTMLDivElement>(null);

 const handleLeadToggle = useCallback(
 (e: MouseEvent) => {
 e.stopPropagation();
 if (isLead) demoteLead(agent.workspaceId ?? "");
 else promoteToLead(agent.id);
 },
 [isLead, agent.id, agent.workspaceId, promoteToLead, demoteLead],
 );

 const handleSyncClick = useCallback(
 (e: MouseEvent) => {
 e.stopPropagation();
 syncNowRef.current?.();
 },
 [syncNowRef],
 );

 const handleHandoffTarget = useCallback(
 (target: typeof otherAgents[0]) => {
 setHandoffMenuOpen(false);
 const name = target.customName || target.cliName || target.cli;
 setHandoffSuccess(name);
 setTimeout(() => setHandoffSuccess(null), 3000);
 handleHandoff(target);
 },
 [setHandoffMenuOpen, setHandoffSuccess, handleHandoff],
 );

 const handoffDisabled = otherAgents.length === 0;

 return (
 <>
 <button
 onClick={handleLeadToggle}
 disabled={leadTaken}
 className={`p-1.5 rounded-md transition-colors ${
 isLead
 ? "text-swarm-goldHi bg-swarm-gold/20"
 : leadTaken
 ? "text-swarm-textMuted/40 cursor-not-allowed"
 : "text-swarm-textDim hover:bg-swarm-border/60 hover:text-swarm-gold"
 }`}
 title={
 isLead
 ? "Demote from Lead — returns this agent to the grid"
 : leadTaken
 ? "This folder already has a Lead — demote it first"
 : "Make Lead — moves this agent to the Lead tab"
 }
 aria-pressed={isLead}
 aria-label={isLead ? "Demote from Lead" : "Make Lead"}
 >
 <LeadCrown size={14} />
 </button>

 <button
 onClick={handleSyncClick}
 disabled={syncing}
 className={`p-1.5 rounded-md transition-colors disabled:cursor-default ${
 syncing
 ? "text-swarm-gold shadow-[0_0_6px_rgb(var(--swarm-gold)/0.2)]"
 : "text-swarm-textDim hover:bg-swarm-border/50 hover:text-swarm-text"
 }`}
 title={
 syncing
 ? "Syncing to shared mind…"
 : lastSync
 ? `Sync to shared mind (last: ${new Date(lastSync).toLocaleTimeString()})`
 : "Sync to shared mind (auto every 10s)"
 }
 aria-label="Sync to shared mind"
 >
 <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
 </button>

 <div className="relative" ref={handoffMenuRef}>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setHandoffMenuOpen((v) => !v);
 }}
 disabled={handoffDisabled}
 className={`p-1.5 rounded-md transition-colors ${
 handoffMenuOpen
 ? "bg-swarm-gold/20 text-swarm-goldHi"
 : handoffDisabled
 ? "text-swarm-textMuted/30 cursor-not-allowed"
 : "text-swarm-textDim hover:bg-swarm-border/60 hover:text-swarm-gold"
 }`}
 title={
 handoffDisabled
 ? "No other running agents to handoff to"
 : "Instant Swarm Handoff — transfer context to another agent"
 }
 aria-label="Handoff to agent"
 >
 <ArrowRightLeft size={14} />
 </button>
 {handoffMenuOpen && (
 <div
 role="menu"
 onMouseDown={(e) => e.stopPropagation()}
 className="glass-hi absolute right-0 top-full z-40 mt-1 w-52 rounded-xl border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl"
 >
 <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-swarm-textMuted border-b border-white/[0.06] mb-1">
 Instant Swarm Handoff
 </div>
 {otherAgents.map((t) => (
 <button
 key={t.id}
 onClick={() => handleHandoffTarget(t)}
 className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-swarm-text hover:bg-swarm-gold/15 hover:text-swarm-goldHi transition-colors"
 >
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
 <span className="truncate font-medium flex-1">{t.customName || t.cliName || t.cli}</span>
 <span className="text-[10px] text-swarm-textMuted shrink-0 font-mono">{t.cli}</span>
 </button>
 ))}
 </div>
 )}
 </div>

 <span aria-hidden className="mx-1 h-4 w-px bg-swarm-border/40" />

 {compactHeader ? (
 <div className="relative" ref={menuRef}>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setMenuOpen((v) => !v);
 }}
 className={`p-1.5 rounded-md transition-colors ${
 menuOpen
 ? "bg-swarm-border/60 text-swarm-text"
 : "text-swarm-textDim hover:bg-swarm-border/60 hover:text-swarm-text"
 }`}
 title="More actions"
 aria-haspopup="menu"
 aria-expanded={menuOpen}
 >
 <MoreHorizontal size={12} />
 </button>
 {menuOpen && (
 <div
 role="menu"
 onMouseDown={(e) => e.stopPropagation()}
 className="glass-hi absolute right-0 top-full z-30 mt-1 min-w-[9.5rem] rounded-lg border border-swarm-border/60 p-1"
 >
 {viewActions.map((action) => (
 <button
 key={action.key}
 role="menuitem"
 onClick={(e) => {
 e.stopPropagation();
 setMenuOpen(false);
 action.run();
 }}
 className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-swarm-textDim hover:bg-swarm-border/60 hover:text-swarm-text transition-colors"
 >
 {action.icon}
 {action.label}
 </button>
 ))}
 </div>
 )}
 </div>
 ) : (
 viewActions.map((action) => (
 <button
 key={action.key}
 onClick={(e) => {
 e.stopPropagation();
 action.run();
 }}
 className="p-1.5 rounded-md hover:bg-swarm-border/60 text-swarm-textDim hover:text-swarm-text transition-colors"
 title={action.label}
 aria-label={action.label}
 >
 {action.icon}
 </button>
 ))
 )}

 {onClose && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 onClose();
 }}
 className="p-1.5 rounded-md text-swarm-textDim hover:bg-swarm-err/25 hover:text-swarm-err transition-colors"
 title={`Delete ${agent.cliName}`}
 aria-label={`Delete ${agent.cliName}`}
 >
 <Trash2 size={12} />
 </button>
 )}
 </>
 );
}

export default AgentControls;
