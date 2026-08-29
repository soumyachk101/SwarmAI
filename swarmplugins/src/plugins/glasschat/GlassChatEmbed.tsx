"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquareText, RefreshCw, KeyRound, ExternalLink, ShieldCheck, Zap, Maximize2, Minimize2, Sparkles, ArrowLeft, Bot } from "lucide-react";
import type { SwarmPluginProps } from "../../types";
import { GlassChatPlatformAPI } from "./platformApi";
import { DevChatStudio } from "./DevChatStudio";
import { secureGet, secureSet, secureDelete, migrateLocalStorageToSecure } from "./secureStorage";

declare global {
 interface Window {
 GlassChat?: {
 mount: (selector: string | HTMLElement, options: Record<string, any>) => any;
 unmount?: (selector: string | HTMLElement) => void;
 };
 }
}

export interface GlassChatEmbedProps extends SwarmPluginProps {
 appId?: string;
 token?: string;
 baseUrl?: string;
 layout?: "embedded" | "desktop" | "fullscreen";
 authMode?: "partner" | "user";
 themeName?: "glasschat";
 isExpanded?: boolean;
 onToggleExpand?: () => void;
 defaultMode?: "devchat" | "glasschat";
}

// Credentials come from the host app's Vite env (Swarm/.env), not source.
// `as any` keeps this compiling in SwarmPlugins' standalone tsc, which has no
// vite/client types. Both are still overridable at runtime via Partner Config.
const ENV = (((import.meta as any) ?? {}).env ?? {}) as Record<string, string | undefined>;
const DEFAULT_APP_ID = ENV.VITE_GLASSCHAT_APP_ID ?? "";
const DEFAULT_API_KEY = ENV.VITE_GLASSCHAT_API_KEY ?? "";
const DEFAULT_TEAM_ID = ENV.VITE_GLASSCHAT_TEAM_ID ?? "team_swarm_agent";
const DEFAULT_USER_ID = ENV.VITE_GLASSCHAT_USER_ID ?? "usr_swarm_owner";

const STORAGE_KEYS = {
 APP_ID: "swarm_glasschat_app_id",
 TOKEN: "swarm_glasschat_token",
 API_KEY: "swarm_glasschat_api_key",
 TEAM_ID: "swarm_glasschat_team_id",
 USER_ID: "swarm_glasschat_user_id",
 VIEW_MODE: "swarm_chat_active_mode",
};

export function GlassChatEmbed({
 appId = DEFAULT_APP_ID,
 token,
 baseUrl = "https://glasschat.app",
 layout = "embedded",
 authMode = "partner",
 themeName = "glasschat",
 isExpanded: propIsExpanded,
 onToggleExpand,
 defaultMode = "devchat",
 projectPath,
 ...restProps
}: GlassChatEmbedProps) {
 const [internalExpanded, setInternalExpanded] = useState(false);
 const isExpanded = propIsExpanded ?? internalExpanded;
 const handleToggleExpand = onToggleExpand ?? (() => setInternalExpanded((prev) => !prev));
 const effectiveLayout = isExpanded ? (layout === "embedded" ? "desktop" : layout) : layout;

 const [viewMode, setViewMode] = useState<"devchat" | "glasschat">(() => {
 return (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as "devchat" | "glasschat") || defaultMode;
 });

 const containerRef = useRef<HTMLDivElement>(null);
 const [scriptLoaded, setScriptLoaded] = useState(false);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // Credentials — initialize from props, migrate localStorage on mount
 const [configuredAppId, setConfiguredAppId] = useState<string>(() => appId);
 const [configuredToken, setConfiguredToken] = useState<string>(() => token || "");
 const [apiKey, setApiKey] = useState<string>(() => DEFAULT_API_KEY);
 const [teamId, setTeamId] = useState<string>(() => DEFAULT_TEAM_ID);
 const [userId, setUserId] = useState<string>(() => DEFAULT_USER_ID);

 // Migrate legacy localStorage secrets to secure storage on mount, then load
 useEffect(() => {
 (async () => {
 const { migrated } = await migrateLocalStorageToSecure([
 STORAGE_KEYS.TOKEN, STORAGE_KEYS.API_KEY, STORAGE_KEYS.APP_ID,
 STORAGE_KEYS.TEAM_ID, STORAGE_KEYS.USER_ID,
 ]);
 if (migrated.length > 0) {
 console.info("[GlassChat] migrated secrets from localStorage to secure storage:", migrated);
 }
 if (!configuredToken && !token) {
 const t = await secureGet(STORAGE_KEYS.TOKEN);
 if (t) setConfiguredToken(t);
 }
 if (!apiKey && !DEFAULT_API_KEY) {
 const k = await secureGet(STORAGE_KEYS.API_KEY);
 if (k) setApiKey(k);
 }
 if (!appId) {
 const a = await secureGet(STORAGE_KEYS.APP_ID);
 if (a) setConfiguredAppId(a);
 }
 })();
 }, []);

 const [isConfiguring, setIsConfiguring] = useState<boolean>(false);

 const switchMode = (mode: "devchat" | "glasschat") => {
 setViewMode(mode);
 try {
 localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
 } catch (_) {}
 };

 // Dynamic script loader for official GlassChat embed bundle (only if glasschat view active)
 useEffect(() => {
 if (viewMode !== "glasschat") return;
 const scriptId = "glasschat-embed-script";
 let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

 if (window.GlassChat) {
 setScriptLoaded(true);
 return;
 }

 if (!existingScript) {
 existingScript = document.createElement("script");
 existingScript.id = scriptId;
 existingScript.src = `${baseUrl}/embed/glasschat.embed.js`;
 existingScript.async = true;
 existingScript.onload = () => setScriptLoaded(true);
 existingScript.onerror = () => {
 setError("Failed to load hosted GlassChat embed script (https://glasschat.app/embed/glasschat.embed.js)");
 setLoading(false);
 };
 document.head.appendChild(existingScript);
 } else {
 existingScript.addEventListener("load", () => setScriptLoaded(true));
 }
 }, [baseUrl, viewMode]);

 // Provision & Mint Embed Session Token automatically for Partner Mode
 const initPartnerSession = useCallback(async () => {
 if (!apiKey) {
 setLoading(false);
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const client = new GlassChatPlatformAPI({ baseUrl, platformApiKey: apiKey });

 let activeTeamId = teamId;
 try {
 const teamRes = await client.provisionTeam({
 externalTeamId: teamId,
 tenantId: "swarm_tenant",
 name: "Swarm Workspace",
 });
 if (teamRes?.id) activeTeamId = teamRes.id;
 } catch (e) {
 console.warn("Provision team warning:", e);
 }

 try {
 await client.ensureMember(activeTeamId, userId, "Swarm Owner");
 } catch (e) {
 console.warn("Ensure member warning:", e);
 }

 let session: any = null;
 try {
 session = await client.issueEmbedSession(activeTeamId, userId, configuredAppId);
 } catch (e) {
 if (activeTeamId !== teamId) {
 await client.ensureMember(teamId, userId, "Swarm Owner").catch(() => {});
 session = await client.issueEmbedSession(teamId, userId, configuredAppId);
 } else {
 throw e;
 }
 }

 if (session?.token) {
 setConfiguredToken(session.token);
 secureSet(STORAGE_KEYS.TOKEN, session.token);
 secureSet(STORAGE_KEYS.APP_ID, configuredAppId);
 secureSet(STORAGE_KEYS.API_KEY, apiKey);
 secureSet(STORAGE_KEYS.TEAM_ID, teamId);
 secureSet(STORAGE_KEYS.USER_ID, userId);
 } else {
 throw new Error("Failed to obtain embed session token");
 }
 } catch (e: any) {
 console.error("GlassChat Partner Mode Initialization Error:", e);
 setError(String(e instanceof Error ? e.message : String(e)));
 } finally {
 setLoading(false);
 }
 }, [apiKey, baseUrl, configuredAppId, teamId, userId]);

 // Initial auto-mint if token is missing
 useEffect(() => {
 if (viewMode !== "glasschat") return;
 if (!configuredToken && apiKey) {
 initPartnerSession();
 } else {
 setLoading(false);
 }
 }, [configuredToken, apiKey, initPartnerSession, viewMode]);

 // Mount GlassChat instance into container in Partner Mode
 useEffect(() => {
 if (viewMode !== "glasschat" || loading || isConfiguring || !scriptLoaded || !containerRef.current || !window.GlassChat) return;

 try {
 const targetEl = containerRef.current;
 targetEl.innerHTML = ""; // Clear container

 window.GlassChat.mount(targetEl, {
 appId: configuredAppId,
 ...(configuredToken ? { token: configuredToken } : {}),
 baseUrl,
 layout: effectiveLayout,
 themeSource: "host",
 themeName,
 authMode: "partner",
 });

 return () => {
 if (window.GlassChat?.unmount && targetEl) {
 try {
 window.GlassChat.unmount(targetEl);
 } catch (e) {
 // Ignore unmount error
 }
 }
 };
 } catch (e: any) {
 console.error("GlassChat Partner Mount Error:", e);
 setError(String(e instanceof Error ? e.message : String(e)));
 }
 }, [scriptLoaded, configuredAppId, configuredToken, baseUrl, effectiveLayout, themeName, isConfiguring, loading, viewMode]);

 // Render DevChat Studio by default
 if (viewMode === "devchat") {
 return (
 <DevChatStudio
 isExpanded={isExpanded}
 onToggleExpand={handleToggleExpand}
 onSwitchToGlassChat={() => switchMode("glasschat")}
 projectPath={projectPath}
 {...restProps}
 />
 );
 }

 if (isConfiguring) {
 return (
 <div className="flex h-full flex-col items-center justify-center p-5 text-center text-swarm-text overflow-y-auto scrollbar-sleek glass-body">
 <div className="flex size-11 items-center justify-center rounded-2xl border border-swarm-gold/40 bg-swarm-gold/10 text-swarm-gold">
 <ShieldCheck size={24} />
 </div>
 <h3 className="font-display mt-3 text-sm font-semibold text-swarm-text">
 GlassChat Partner Mode Configuration
 </h3>
 <p className="mt-1 max-w-[36ch] text-mini text-swarm-textMuted leading-relaxed">
 Zero sign-in screens. Configured with your App ID and Platform API Key.
 </p>

 <div className="mt-4 w-full max-w-xs space-y-3 text-left">
 <div>
 <label className="block text-mini font-medium text-swarm-gold mb-1">
 App ID
 </label>
 <input
 type="text"
 value={configuredAppId}
 onChange={(e) => setConfiguredAppId(e.target.value)}
 placeholder="app_..."
 className="w-full rounded-md border border-swarm-border/60 glass-inset px-2.5 py-1.5 text-xs text-swarm-text font-mono outline-none focus:border-swarm-gold/60"
 />
 </div>

 <div>
 <label className="block text-mini font-medium text-swarm-textDim mb-1">
 Platform API Key (gcp_...)
 </label>
 <input
 type="password"
 value={apiKey}
 onChange={(e) => setApiKey(e.target.value)}
 placeholder="gcp_..."
 className="w-full rounded-md border border-swarm-border/60 glass-inset px-2.5 py-1.5 text-xs text-swarm-text font-mono outline-none focus:border-swarm-gold/60"
 />
 </div>

 <div>
 <label className="block text-mini font-medium text-swarm-textDim mb-1">
 Embed Session Token (Optional Override)
 </label>
 <input
 type="password"
 value={configuredToken}
 onChange={(e) => setConfiguredToken(e.target.value)}
 placeholder="emb_..."
 className="w-full rounded-md border border-swarm-border/60 glass-inset px-2.5 py-1.5 text-xs text-swarm-text font-mono outline-none focus:border-swarm-gold/60"
 />
 </div>

 {error && <p className="text-micro text-swarm-err mt-1 text-center">{error}</p>}

 <div className="flex gap-2 pt-1">
 <button
 onClick={initPartnerSession}
 disabled={loading}
 className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-swarm-gold/20 border border-swarm-gold/40 px-3 py-1.5 text-xs font-semibold text-swarm-goldHi hover:bg-swarm-gold/30 transition-colors disabled:opacity-50"
 >
 <Zap size={13} /> Auto-Mint
 </button>
 <button
 onClick={() => setIsConfiguring(false)}
 className="flex-1 rounded-lg bg-swarm-gold px-3 py-1.5 text-xs font-semibold text-swarm-ink transition-opacity hover:opacity-90"
 >
 Done
 </button>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="relative flex h-full w-full flex-col overflow-hidden glass-body">
 {/* Top Banner Header */}
 <div className="flex items-center justify-between border-b border-swarm-border/40 glass-hi px-3 py-1.5 text-mini">
 <div className="flex items-center gap-2">
 <button
 onClick={() => switchMode("devchat")}
 className="flex items-center gap-1 rounded px-1.5 py-0.5 text-micro font-medium text-swarm-gold hover:bg-swarm-gold/15 transition-colors border border-swarm-gold/30"
 title="Switch back to Native DevChat Copilot"
 >
 <ArrowLeft size={11} />
 <span>DevChat Studio</span>
 </button>
 <span className="flex items-center gap-1 font-medium text-swarm-textDim">
 <ShieldCheck size={13} className="text-swarm-gold" />
 GlassChat Cloud
 </span>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={handleToggleExpand}
 className="flex items-center gap-1 text-swarm-textMuted hover:text-swarm-gold text-micro p-1 rounded hover:bg-swarm-border/30 transition-colors"
 title={isExpanded ? "Exit full screen" : "Expand to full screen"}
 >
 {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
 </button>
 <button
 onClick={() => setIsConfiguring(true)}
 className="flex items-center gap-1 text-swarm-textMuted hover:text-swarm-text text-micro"
 title="Configure Partner Keys"
 >
 <KeyRound size={11} /> Partner Config
 </button>
 <a
 href="https://glasschat.app"
 target="_blank"
 rel="noreferrer"
 className="flex items-center gap-1 text-swarm-textMuted hover:text-swarm-text text-micro"
 >
 <ExternalLink size={11} />
 </a>
 </div>
 </div>

 {/* Main Container */}
 <div className="relative flex-1 overflow-hidden">
 {loading ? (
 <div className="absolute inset-0 flex flex-col items-center justify-center glass-hi backdrop-blur-sm z-10 text-swarm-textMuted">
 <RefreshCw className="size-5 animate-spin text-swarm-gold mb-2" />
 <span className="text-xs font-semibold text-swarm-text">Connecting GlassChat Workspace…</span>
 <span className="text-micro text-swarm-textMuted mt-0.5">Provisioning Partner Session</span>
 </div>
 ) : error ? (
 <div className="flex h-full flex-col items-center justify-center p-4 text-center">
 <p className="text-xs text-swarm-err font-medium mb-1">Partner Session Error</p>
 <p className="text-mini text-swarm-textMuted max-w-[32ch]">{error}</p>
 <div className="mt-3 flex items-center gap-2">
 <button
 onClick={initPartnerSession}
 className="flex items-center gap-1.5 rounded-md bg-swarm-gold/15 border border-swarm-gold/30 px-3 py-1 text-xs text-swarm-goldHi hover:bg-swarm-gold/25 transition-colors"
 >
 <RefreshCw size={12} /> Retry
 </button>
 <button
 onClick={() => switchMode("devchat")}
 className="flex items-center gap-1.5 rounded-md bg-swarm-gold px-3 py-1 text-xs font-medium text-swarm-ink hover:opacity-90 transition-opacity"
 >
 <Sparkles size={12} /> Open DevChat Studio
 </button>
 </div>
 </div>
 ) : (
 <div ref={containerRef} id="glasschat-container" className="h-full w-full" />
 )}
 </div>
 </div>
 );
}

export { DevChatStudio };
