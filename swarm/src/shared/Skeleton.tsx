import React from "react";

export function SkeletonLine({ width = "100%", height = 14, className = "" }: { width?: string | number; height?: number; className?: string }) {
 return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCircle({ size = 40, className = "" }: { size?: number; className?: string }) {
 return <div className={`skeleton ${className}`} style={{ width: size, height: size, borderRadius: "50%" }} />;
}

export function AgentCardSkeleton() {
 return (
 <div className="glass-hi rounded-xl border border-white/[0.06] p-3 space-y-2.5">
 <div className="flex items-center gap-2.5">
 <SkeletonCircle size={30} />
 <div className="flex-1 space-y-1.5">
 <SkeletonLine width="55%" height={12} />
 <SkeletonLine width="30%" height={10} />
 </div>
 </div>
 <SkeletonLine height={10} width="90%" />
 <SkeletonLine height={10} width="70%" />
 </div>
 );
}

export function TerminalSkeleton() {
 return (
 <div className="h-full w-full p-3 space-y-2">
 {Array.from({ length: 8 }).map((_, i) => (
 <SkeletonLine key={i} width={40 + Math.random() * 50 + "%"} height={12} />
 ))}
 </div>
 );
}

export function SidebarSkeleton() {
 return (
 <div className="w-64 h-full p-3 space-y-3 border-r border-white/[0.06]">
 <SkeletonLine width="60%" height={14} />
 <div className="space-y-2">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="flex items-center gap-2">
 <SkeletonCircle size={20} />
 <SkeletonLine width={60 + Math.random() * 30 + "%"} height={12} />
 </div>
 ))}
 </div>
 </div>
 );
}

export function DashboardSkeleton() {
 return (
 <div className="p-4 space-y-4">
 <div className="grid grid-cols-4 gap-3">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="glass-hi rounded-xl border border-white/[0.06] p-4 space-y-2">
 <SkeletonLine width="40%" height={10} />
 <SkeletonLine width="70%" height={20} />
 <SkeletonLine width="50%" height={10} />
 </div>
 ))}
 </div>
 <SkeletonLine height={200} />
 </div>
 );
}
