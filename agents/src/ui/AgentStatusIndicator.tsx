import { memo } from "react";

interface AgentStatusIndicatorProps {
 spawnState: "connecting" | "running" | "error" | "notFound";
 cli: string;
 accentColor: string;
 title?: string;
 className?: string;
}

const STATUS_TITLES: Record<string, (cli: string) => string> = {
 notFound: (cli: string) => `CLI agent — ${cli} is not installed`,
 error: () => "CLI agent — failed to start",
 connecting: () => "CLI agent — starting…",
 running: () => "CLI agent — running",
};

function AgentStatusIndicator({
 spawnState,
 cli,
 accentColor,
 title,
 className = "",
}: AgentStatusIndicatorProps) {
 const isConnecting = spawnState === "connecting";
 const failed = spawnState === "error" || spawnState === "notFound";
 const defaultTitle = STATUS_TITLES[spawnState]?.(cli) || "CLI agent — running";

 return (
 <span
 className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConnecting ? "animate-pulse" : ""} ${className}`}
 style={{
 background: accentColor,
 boxShadow: failed ? "0 0 0 2px rgb(var(--swarm-err) / 0.85)" : undefined,
 }}
 title={title ?? defaultTitle}
 aria-label={title ?? defaultTitle}
 />
 );
}

export default memo(
 AgentStatusIndicator,
 function areEqual(
 prev: AgentStatusIndicatorProps,
 next: AgentStatusIndicatorProps,
 ) {
 return (
 prev.spawnState === next.spawnState &&
 prev.cli === next.cli &&
 prev.accentColor === next.accentColor &&
 prev.title === next.title &&
 prev.className === next.className
 );
 },
);
