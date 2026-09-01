import { type ReactNode, type ReactElement } from "react";
import { useAgentsStore } from "./agentsStore.js";
import { LeadCrown, PANE_HEADER_CLASS, PANE_TITLE_CLASS, themeForKind } from "@swarm/board";
import RoleBadge from "./RoleBadge.js";
import { AlertTriangle } from "lucide-react";
import AgentStatusIndicator from "./AgentStatusIndicator.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TerminalHeaderProps {
 paneId: string;
 displayName: string;
 spawnState: "connecting" | "running" | "error" | "notFound";
 isEditing: boolean;
 editValue: string;
 agent: {
 id: string;
 cli: string;
 cliName: string;
 role?: string;
 branchName?: string;
 };
 currentModel?: string;
 currentEffort?: string;
 paneWidth: number;
 autoModelDetectionError?: string;
 onEditChange: (value: string) => void;
 onRename?: () => void;
 onCancelRename?: () => void;
 headerExtra?: React.ReactNode;
 controls?: ReactNode;
 children?: ReactNode;
}

// ---------------------------------------------------------------------------
// TerminalHeader
// ---------------------------------------------------------------------------

function TerminalHeader({
 paneId,
 displayName,
 spawnState,
 isEditing,
 editValue,
 agent,
 currentModel,
 currentEffort,
 paneWidth,
 autoModelDetectionError,
 onEditChange,
 onRename,
 onCancelRename,
 headerExtra,
 controls,
}: TerminalHeaderProps) {
 const accentColor = themeForKind("agent").accent;
 const showModelWarning = Boolean(autoModelDetectionError && spawnState === "connecting");

 return (
 <div
 data-pane-drag
 data-pane-header="true"
 className={`${PANE_HEADER_CLASS} justify-between`}
 onMouseDown={() => useAgentsStore.getState().setActivePaneId(paneId)}
 onFocus={() => useAgentsStore.getState().setActivePaneId(paneId)}
 >
 <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
 {isEditing && onEditChange ? (
 <input
 type="text"
 value={editValue}
 onChange={(e) => onEditChange(e.target.value)}
 onBlur={onRename}
 onKeyDown={(e) => {
 if (e.key === "Enter") onRename?.();
 if (e.key === "Escape") onCancelRename?.();
 }}
 onClick={(e) => e.stopPropagation()}
 className="glass-inset text-swarm-text px-2 py-0.5 rounded-md text-xs w-32 focus:outline-none focus:ring-1 focus:ring-swarm-gold"
 autoFocus
 />
 ) : (
 <span
 onDoubleClick={onRename}
 title={displayName}
 className={`flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-swarm-goldHi transition-colors min-w-0 flex-1 ${PANE_TITLE_CLASS}`}
 >
 <AgentStatusIndicator
 spawnState={spawnState}
 cli={agent.cli}
 accentColor={accentColor}
 />
 {agent.role && (
 <RoleBadge role={agent.role} branchName={agent.branchName} />
 )}
 <span className="truncate shrink font-semibold min-w-0" title={displayName}>
 {displayName}
 </span>
 {showModelWarning && (
 <span
 title={`Model auto-detection failed: ${autoModelDetectionError}`}
 className="flex-shrink-0 text-swarm-warn"
 >
 <AlertTriangle size={12} />
 </span>
 )}
 </span>
 )}
 {headerExtra}
 </div>
 <div className="flex items-center gap-1 flex-shrink-0">
 {controls}
 </div>
 </div>
 );
}

export default TerminalHeader;
