import { lazy, Suspense } from 'react';

const AgentPane = lazy(() => import('./AgentPane.js').then(m => ({ default: m.default })));

export interface AgentPaneLazyProps {
 paneId: string;
 workingDir?: string | null;
 agent: Record<string, unknown>;
 onClose?: () => void;
 onToggleMaximize?: () => void;
 isMaximized?: boolean;
 onRename?: () => void;
 isEditing?: boolean;
 editValue?: string;
 onEditChange?: (value: string) => void;
 onCancelRename?: () => void;
 headerExtra?: React.ReactNode;
 sharedMemoryDir?: string | null;
}

export function AgentPaneLazy(props: AgentPaneLazyProps) {
 return (
 <Suspense
 fallback={
 <div className="h-full w-full flex items-center justify-center bg-[#0d0f17] rounded-2xl">
 <div className="text-gray-600 text-xs">Loading agent…</div>
 </div>
 }
 >
 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
 <AgentPane {...(props as any)} />
 </Suspense>
 );
}
