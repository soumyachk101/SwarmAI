"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "./ToastProvider";

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, info: { componentStack: string }) {
 console.error("ErrorBoundary caught:", error, info.componentStack);
 }

 handleReset = () => {
 this.setState({ hasError: false, error: null });
 };

 render() {
 if (this.state.hasError) {
 if (this.props.fallback) return this.props.fallback;
 return (
 <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
 <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
 <AlertTriangle size={24} className="text-red-400" />
 </div>
 <h2 className="text-sm font-semibold text-zinc-200 mb-1 font-sans">Something went wrong</h2>
 <p className="text-xs text-zinc-400 max-w-[320px] mb-4 font-sans leading-relaxed">
 {this.state.error?.message || "An unexpected error occurred in this component."}
 </p>
 <button
 onClick={this.handleReset}
 className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors font-mono"
 >
 <RefreshCw size={12} />
 Try again
 </button>
 </div>
 );
 }

 return this.props.children;
 }
}
