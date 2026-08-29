"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

interface Toast {
 id: string;
 variant: ToastVariant;
 title: string;
 description?: string;
 duration?: number;
}

interface ToastContextValue {
 toasts: Toast[];
 toast: (variant: ToastVariant, title: string, description?: string, duration?: number) => void;
 dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
 const ctx = useContext(ToastContext);
 if (!ctx) throw new Error("useToast must be used within ToastProvider");
 return ctx;
}

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
 const [toasts, setToasts] = useState<Toast[]>([]);
 const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

 const dismiss = useCallback((id: string) => {
 setToasts((prev) => prev.filter((t) => t.id !== id));
 timersRef.current.delete(id);
 }, []);

 const toast = useCallback((variant: ToastVariant, title: string, description?: string, duration = 4000) => {
 const id = `toast-${++idCounter}-${Date.now()}`;
 const entry: Toast = { id, variant, title, description, duration };
 setToasts((prev) => [...prev, entry]);

 if (duration > 0) {
 const timer = setTimeout(() => dismiss(id), duration);
 timersRef.current.set(id, timer);
 }
 }, [dismiss]);

 // Cleanup timers on unmount
 useEffect(() => {
 return () => {
 timersRef.current.forEach((t) => clearTimeout(t));
 timersRef.current.clear();
 };
 }, []);

 const variantIcons: Record<ToastVariant, string> = {
 info: "💡",
 success: "✅",
 warning: "⚠️",
 error: "❌",
 };

 const variantBorder: Record<ToastVariant, string> = {
 info: "border-blue-500/40",
 success: "border-emerald-500/40",
 warning: "border-amber-500/40",
 error: "border-red-500/40",
 };

 const variantBg: Record<ToastVariant, string> = {
 info: "bg-blue-500/10",
 success: "bg-emerald-500/10",
 warning: "bg-amber-500/10",
 error: "bg-red-500/10",
 };

 return (
 <ToastContext.Provider value={{ toasts, toast, dismiss }}>
 {children}
 {/* Toast Container */}
 <div className="fixed bottom-4 right-4 z-[900] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
 {toasts.map((t, idx) => (
 <div
 key={t.id}
 className={`pointer-events-auto glass-hi rounded-xl border ${variantBorder[t.variant]} ${variantBg[t.variant]} p-3 shadow-lg animate-slide-up flex items-start gap-3 group`}
 style={{ animationDelay: `${idx * 50}ms` }}
 >
 <span className="text-base leading-none mt-0.5">{variantIcons[t.variant]}</span>
 <div className="flex-1 min-w-0">
 <div className="text-xs font-semibold text-swarm-text">{t.title}</div>
 {t.description && (
 <div className="text-[11px] text-swarm-textMuted mt-0.5 leading-relaxed">{t.description}</div>
 )}
 </div>
 <button
 onClick={() => dismiss(t.id)}
 className="text-swarm-textMuted hover:text-swarm-text transition-colors shrink-0 opacity-0 group-hover:opacity-100"
 >
 ✕
 </button>
 </div>
 ))}
 </div>
 </ToastContext.Provider>
 );
}
