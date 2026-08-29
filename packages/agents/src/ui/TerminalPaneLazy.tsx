import { lazy, Suspense } from 'react';

const TerminalPane = lazy(() => import('./TerminalPane.js').then(m => ({ default: m.default })));

export interface TerminalPaneLazyProps {
 paneId?: string;
 workingDir?: string | null;
 tabName?: string;
 shellCommand?: string;
 shellLabel?: string;
 onClose?: () => void;
 onToggleMaximize?: () => void;
 isMaximized?: boolean;
 onRename?: () => void;
 isEditing?: boolean;
 editValue?: string;
 onEditChange?: (value: string) => void;
 onCancelRename?: () => void;
 closeIconType?: "trash" | "close";
 headerExtra?: React.ReactNode;
}

export function TerminalPaneLazy(props: TerminalPaneLazyProps) {
 return (
 <Suspense
 fallback={
 <div className="h-full w-full flex items-center justify-center bg-[#0d0f17] rounded-2xl">
 <div className="text-gray-600 text-xs">Loading terminal…</div>
 </div>
 }
 >
 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
 <TerminalPane {...(props as any)} />
 </Suspense>
 );
}
