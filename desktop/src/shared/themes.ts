export type ThemeId =
 | "charcoal"
 | "midnight"
 | "matrix"
 | "nordic"
 | "crimson"
 | "swarm"
 | "obsidian"
 | "graphite"
 | "amber"
 | "arctic-aurora"
 | "rosewood-luxe"
 | "onyx-silver"
 | "ai-minimal";

export interface ThemeTokens {
 /** Space-separated RGB channels, e.g. "224 168 58" — used with rgb(var(--x) / a). */
 canvas: string;
 canvasHi: string;
 surface: string;
 surfaceHi: string;
 border: string;
 borderHi: string;
 gold: string;
 goldHi: string;
 goldDim: string;
 honey: string;
 amber: string;
 text: string;
 textDim: string;
 textMuted: string;
 ok: string;
 warn: string;
 err: string;
}

export interface ThemeDef {
 id: ThemeId;
 label: string;
 description: string;
 /** Swatch colors shown in the picker (accent, surface, canvas). */
 swatch: [string, string, string];
 tokens: ThemeTokens;
}

const CHARCOAL_SMOKE: ThemeTokens = {
 canvas: "6 7 9", // Ultra Deep Velvet Charcoal (#060709)
 canvasHi: "12 14 18", // Obsidian Charcoal (#0c0e12)
 surface: "17 20 26", // Rich Frosted Surface (#11141a)
 surfaceHi: "25 29 38", // Luminous Charcoal Glass (#191d26)
 border: "38 43 56", // Micro Precision Hairline (#262b38)
 borderHi: "160 174 196", // Platinum Diamond (#a0aec4)
 gold: "250 252 255", // Diamond Smokie White (#fafcff)
 goldHi: "255 255 255", // Supernova Pure White (#ffffff)
 goldDim: "156 172 196", // Titanium Silver (#9cacb4)
 honey: "235 240 248", // Liquid Platinum (#ebf0f8)
 amber: "210 220 235", // Glacial Frost (#d2dceb)
 text: "255 255 255", // Ultra Crisp White (#ffffff)
 textDim: "175 188 206", // Silky Light Slate (#afbcce)
 textMuted: "105 118 138", // Refined Stealth (#69768a)
 ok: "52 211 153", // Emerald Spark (#34d399)
 warn: "250 252 255", // Luminescent White
 err: "244 63 94", // Rose Crimson (#f43f5e)
};

const SWARM_THEME: ThemeTokens = {
 canvas: "12 13 16",
 canvasHi: "18 19 24",
 surface: "24 26 33",
 surfaceHi: "32 35 44",
 border: "42 46 58",
 borderHi: "75 82 102",
 gold: "218 165 72",
 goldHi: "240 195 110",
 goldDim: "165 120 45",
 honey: "240 195 110",
 amber: "218 165 72",
 text: "240 242 245",
 textDim: "165 172 184",
 textMuted: "115 122 135",
 ok: "70 180 130",
 warn: "218 165 72",
 err: "220 80 80",
};

const GRAPHITE: ThemeTokens = {
 canvas: "14 16 19",
 canvasHi: "20 23 28",
 surface: "25 29 35",
 surfaceHi: "33 39 48",
 border: "44 51 61",
 borderHi: "97 105 114",
 gold: "224 168 58",
 goldHi: "240 195 104",
 goldDim: "169 122 37",
 honey: "240 195 104",
 amber: "208 146 47",
 text: "238 241 245",
 textDim: "179 189 201",
 textMuted: "125 136 150",
 ok: "79 178 134",
 warn: "216 161 60",
 err: "224 100 94",
};

const OBSIDIAN: ThemeTokens = {
 canvas: "8 9 12",
 canvasHi: "13 15 20",
 surface: "18 21 27",
 surfaceHi: "25 29 37",
 border: "36 41 51",
 borderHi: "93 99 108",
 gold: "218 165 72",
 goldHi: "240 195 110",
 goldDim: "165 120 45",
 honey: "240 195 110",
 amber: "218 165 72",
 text: "240 243 248",
 textDim: "182 192 207",
 textMuted: "124 135 152",
 ok: "72 185 138",
 warn: "219 163 65",
 err: "226 102 95",
};

const AMBER: ThemeTokens = {
 canvas: "18 16 12",
 canvasHi: "24 21 16",
 surface: "31 27 21",
 surfaceHi: "40 35 27",
 border: "55 47 35",
 borderHi: "110 102 90",
 gold: "232 176 74",
 goldHi: "246 205 124",
 goldDim: "172 127 44",
 honey: "242 192 99",
 amber: "213 154 53",
 text: "244 239 228",
 textDim: "200 189 168",
 textMuted: "142 132 113",
 ok: "99 171 116",
 warn: "223 174 76",
 err: "221 106 92",
};

const MIDNIGHT_CYBERPUNK: ThemeTokens = {
 canvas: "6 8 18", // Tokyo Midnight Sapphire (#060812)
 canvasHi: "11 15 30", // Deep Cyber Blue (#0b0f1e)
 surface: "16 22 42", // Frosted Sapphire Glass (#10162a)
 surfaceHi: "24 32 60", // Neon Glass Surface (#18203c)
 border: "38 48 85", // Electric Indigo Border (#263055)
 borderHi: "168 85 247", // Electric Violet Neon (#a855f7)
 gold: "6 182 212", // Neon Cyan Primary (#06b6d4)
 goldHi: "168 85 247", // Electric Violet (#a855f7)
 goldDim: "37 99 235", // Cobalt Blue (#2563eb)
 honey: "147 51 234", // Royal Purple (#9333ea)
 amber: "56 189 248", // Cyan Glow (#38bdf8)
 text: "248 250 252", // Crisp White (#f8fafc)
 textDim: "192 132 252", // Lilac Dim (#c084fc)
 textMuted: "100 116 139", // Muted Slate (#64748b)
 ok: "52 211 153", // Matrix Emerald (#34d399)
 warn: "250 204 21", // Cyber Yellow (#facc15)
 err: "244 63 94", // Neon Pink/Rose (#f43f5e)
};

const MATRIX_PHOSPHOR: ThemeTokens = {
 canvas: "4 8 6", // Pure Hacker Void (#040806)
 canvasHi: "8 16 12", // Deep Terminal Obsidian (#08100c)
 surface: "12 24 18", // Frosted Forest Black (#0c1812)
 surfaceHi: "18 36 28", // Phosphor Glass (#12241c)
 border: "28 58 44", // Matrix Hairline Border (#1c3a2c)
 borderHi: "16 185 129", // Phosphor Emerald Glow (#10b981)
 gold: "16 185 129", // Radiant Emerald Accent (#10b981)
 goldHi: "52 211 153", // Supernova Mint (#34d399)
 goldDim: "5 150 105", // Deep Jade (#059669)
 honey: "110 231 183", // Light Phosphor (#6ee7b7)
 amber: "52 211 153", // Bright Mint (#34d399)
 text: "236 253 245", // Phosphor White-Green (#ecfdf5)
 textDim: "110 231 183", // Phosphor Mint Dim (#6ee7b7)
 textMuted: "52 105 84", // Stealth Matrix Muted (#346954)
 ok: "16 185 129", // Terminal Green (#10b981)
 warn: "250 204 21", // Warning Gold (#facc15)
 err: "244 63 94", // Red Terminal Alarm (#f43f5e)
};

const NORDIC_FROST: ThemeTokens = {
 canvas: "7 13 20", // Arctic Polar Void (#070d14)
 canvasHi: "12 22 34", // Nordic Ice Slate (#0c1622)
 surface: "18 30 46", // Frosted Iceberg (#121e2e)
 surfaceHi: "26 42 64", // Luminous Glacier Glass (#1a2a40)
 border: "38 60 90", // Sub-zero Hairline (#263c5a)
 borderHi: "56 189 248", // Glacial Ice Blue Glow (#38bdf8)
 gold: "56 189 248", // Polar Ice Blue (#38bdf8)
 goldHi: "224 242 254", // Ice Cap White (#e0f2fe)
 goldDim: "14 165 233", // Deep Azure (#0ea5e9)
 honey: "125 211 252", // Crystalline Blue (#7dd3fc)
 amber: "186 230 253", // Polar Frost Glow (#bae6fd)
 text: "248 250 252", // Diamond Ice White (#f8fafc)
 textDim: "186 230 253", // Frost Subtext (#bae6fd)
 textMuted: "100 125 155", // Arctic Fog (#647d9b)
 ok: "52 211 153", // Emerald Aurora (#34d399)
 warn: "250 204 21", // Amber Sun (#facc15)
 err: "244 63 94", // Arctic Rose (#f43f5e)
};

const CRIMSON_ECLIPSE: ThemeTokens = {
 canvas: "12 6 8", // Dark Solar Eclipse Void (#0c0608)
 canvasHi: "20 10 14", // Deep Obsidian Ember (#140a0e)
 surface: "30 16 22", // Frosted Ruby Glass (#1e1016)
 surfaceHi: "44 24 32", // Solar Flare Glass (#2c1820)
 border: "65 32 44", // Crimson Hairline (#41202c)
 borderHi: "244 63 94", // Laser Ruby Glow (#f43f5e)
 gold: "244 63 94", // Crimson Laser Accent (#f43f5e)
 goldHi: "251 113 133", // Rose Supernova (#fb7185)
 goldDim: "225 29 72", // Deep Rose (#e11d48)
 honey: "253 164 175", // Light Sakura (#fda4af)
 amber: "244 63 94", // Bright Crimson (#f43f5e)
 text: "255 241 242", // Crisp Rose White (#fff1f2)
 textDim: "253 164 175", // Soft Rose Subtext (#fda4af)
 textMuted: "140 90 105", // Muted Ash (#8c5a69)
 ok: "52 211 153", // Emerald Spark (#34d399)
 warn: "251 146 60", // Solar Orange (#fb923c)
 err: "244 63 94", // Crimson Laser (#f43f5e)
};

const ARCTIC_AURORA: ThemeTokens = {
 canvas: "4 10 22", // Absolute Arctic Void (#040a16)
 canvasHi: "8 18 38", // Borealis Deep (#081226)
 surface: "14 28 52", // Frozen Aurora Glass (#0e1c34)
 surfaceHi: "22 40 70", // Luminous Ice Surface (#162846)
 border: "35 58 92", // Glacial Hairline (#233c5c)
 borderHi: "99 240 196", // Aurora Mint (#63f0c4)
 gold: "56 189 248", // Polar Ice Blue (#38bdf8)
 goldHi: "125 211 252", // Crystal Sky (#7dd3fc)
 goldDim: "14 165 233", // Deep Azure (#0ea5e9)
 honey: "186 230 253", // Polar Frost (#bae6fd)
 amber: "34 211 238", // Cyan Borealis (#22d3ee)
 text: "240 248 252", // Ice Diamond White (#f0f8fc)
 textDim: "186 230 253", // Frost Subtext (#bae6fd)
 textMuted: "80 125 160", // Arctic Fog (#507da0)
 ok: "52 211 153", // Emerald Aurora (#34d399)
 warn: "250 204 21", // Borealis Yellow (#facc15)
 err: "244 63 94", // Arctic Rose (#f43f5e)
};

const ROSEWOOD_LUXE: ThemeTokens = {
 canvas: "14 8 10", // Rosewood Void (#0e080a)
 canvasHi: "22 12 16", // Deep Cabernet (#160c10)
 surface: "32 18 24", // Frosted Rosewood (#121018)
 surfaceHi: "46 28 36", // Silk Garnet Glass (#2e1c24)
 border: "65 38 50", // Rose Hairline (#412632)
 borderHi: "251 113 133", // Blush Rose Neon (#fb7185)
 gold: "251 113 133", // Blush Rose Accent (#fb7185)
 goldHi: "253 164 175", // Soft Sakura (#fda4af)
 goldDim: "225 29 72", // Deep Rose (#e11d48)
 honey: "244 114 182", // Neon Pink (#f472b6)
 amber: "251 146 60", // Warm Ember (#fb923c)
 text: "255 245 247", // Blush White (#fff5f7)
 textDim: "251 206 213", // Pale Rose (#f1c8d6)
 textMuted: "155 100 120", // Dusty Mauve (#9b6478)
 ok: "52 211 153", // Emerald Spark (#34d399)
 warn: "251 146 60", // Solar Ember (#fb923c)
 err: "244 63 94", // Crimson Laser (#f43f5e)
};

const ONYX_SILVER: ThemeTokens = {
 canvas: "7 8 10", // Onyx Moonstone (#07080a)
 canvasHi: "12 14 18", // Lunar Onyx (#0c0e12)
 surface: "20 23 29", // Platinum Onyx Glass (#14171d)
 surfaceHi: "30 35 44", // Silver Onyx Frost (#1e232c)
 border: "46 52 64", // Platinum Hairline (#2e3440)
 borderHi: "203 213 225", // Platinum Silver (#cbd5e1)
 gold: "203 213 225", // Platinum Silver (#cbd5e1)
 goldHi: "248 250 252", // Lunar White (#f8fafc)
 goldDim: "148 163 184", // Titanium Silver (#94a3b8)
 honey: "226 232 240", // Lunar Frost (#e2e8f0)
 amber: "100 116 139", // Slate Mist (#64748b)
 text: "248 250 252", // Lunar Pure White (#f8fafc)
 textDim: "203 213 225", // Platinum Dim (#cbd5e1)
 textMuted: "100 116 139", // Slate Mist (#64748b)
 ok: "74 222 128", // Mint Silver (#4ade80)
 warn: "250 204 21", // Platinum Gold (#facc15)
 err: "248 113 113", // Silver Rose (#f87171)
};

/* ─── AI Minimal — SwarmAI Signature Flat Sleek ───
 Brand signature: Swarm Amber (#E8A838) — warm honeycomb gold, unique to
 SwarmAI. Not generic indigo, not Linear's purple, not Cursor's violet.
 Cool near-black base + ONE warm amber accent = instantly recognizable.
 Flat solid surfaces, no gradients on primary UI. OLED-friendly, WCAG AAA. */
const AI_MINIMAL: ThemeTokens = {
 canvas: "8 8 12", // Cool Void (#08080c)
 canvasHi: "12 12 18", // Deep AI Glass (#0c0c12)
 surface: "16 16 24", // Flat AI Surface (#101018)
 surfaceHi: "22 22 34", // Elevated AI Panel (#161622)
 border: "30 30 44", // Subtle Hairline (#1e1e2c)
 borderHi: "45 45 66", // Active Hairline (#2d2d42)
 gold: "232 168 56", // Swarm Amber (#e8a838) — BRAND SIGNATURE
 goldHi: "240 192 96", // Honey Glow (#f0c060)
 goldDim: "192 120 32", // Deep Amber (#c07820)
 honey: "240 192 96", // Honey Glow (#f0c060)
 amber: "232 168 56", // Swarm Amber (#e8a838)
 text: "232 232 240", // Cool White (#e8e8f0)
 textDim: "160 160 180", // Cool Slate (#a0a0b4)
 textMuted: "110 110 142", // Cool AI Gray (#6e6e8e)
 ok: "52 211 153", // Emerald (#34d399)
 warn: "251 191 36", // Amber (#fbbf24)
 err: "248 113 113", // Rose (#f87171)
};

export const THEMES: ThemeDef[] = [
 {
 id: "charcoal",
 label: "Obsidian Charcoal & Smokie Platinum",
 description: "Ultra-luxury deep charcoal obsidian with diamond smokie white & titanium accents",
 swatch: ["#fafcff", "#11141a", "#060709"],
 tokens: CHARCOAL_SMOKE,
 },
 {
 id: "midnight",
 label: "Midnight Cyberpunk",
 description: "Deep Tokyo sapphire with electric violet & neon cyan neural wires",
 swatch: ["#06b6d4", "#10162a", "#060812"],
 tokens: MIDNIGHT_CYBERPUNK,
 },
 {
 id: "matrix",
 label: "Matrix Phosphor Emerald",
 description: "Hacker void obsidian with radiant phosphor terminal emerald",
 swatch: ["#10b981", "#0c1812", "#040806"],
 tokens: MATRIX_PHOSPHOR,
 },
 {
 id: "nordic",
 label: "Nordic Polar Frost",
 description: "Arctic titanium slate with crystal polar ice blue & iceberg glass",
 swatch: ["#38bdf8", "#121e2e", "#070d14"],
 tokens: NORDIC_FROST,
 },
 {
 id: "crimson",
 label: "Crimson Eclipse",
 description: "Solar flare obsidian with laser ruby crimson & sakura accents",
 swatch: ["#f43f5e", "#1e1016", "#0c0608"],
 tokens: CRIMSON_ECLIPSE,
 },
 {
 id: "swarm",
 label: "Swarm Dark",
 description: "Official SwarmAI luxury dark slate with champagne gold accents",
 swatch: ["#daa548", "#181a21", "#0c0d10"],
 tokens: SWARM_THEME,
 },
 {
 id: "obsidian",
 label: "Obsidian OLED",
 description: "Deep obsidian black with gold accents",
 swatch: ["#daa548", "#12151b", "#08090c"],
 tokens: OBSIDIAN,
 },
 {
 id: "graphite",
 label: "Graphite",
 description: "Neutral graphite with a warm signal",
 swatch: ["#e0a83a", "#191d23", "#0e1013"],
 tokens: GRAPHITE,
 },
 {
 id: "amber",
 label: "Honey Amber",
 description: "The warm swarm honeycomb theme",
 swatch: ["#e8b04a", "#1f1b15", "#12100c"],
 tokens: AMBER,
 },
 {
 id: "arctic-aurora",
 label: "Arctic Aurora",
 description: "Cool boreal glow with mint accents",
 swatch: ["#38bdf8", "#0e1c34", "#040a16"],
 tokens: ARCTIC_AURORA,
 },
 {
 id: "rosewood-luxe",
 label: "Rosewood Luxe",
 description: "Dark rose with blush and garnet accents",
 swatch: ["#fb7185", "#121018", "#0e080a"],
 tokens: ROSEWOOD_LUXE,
 },
 {
 id: "onyx-silver",
 label: "Onyx Silver",
 description: "Premium silver-on-onyx neutral palette",
 swatch: ["#cbd5e1", "#14171d", "#07080a"],
 tokens: ONYX_SILVER,
 },
 {
 id: "ai-minimal",
 label: "SwarmAI Signature",
 description: "Cool flat dark + Swarm Amber — the platform's own color",
 swatch: ["#e8a838", "#101018", "#08080c"],
 tokens: AI_MINIMAL,
 },
];

export const THEME_BY_ID: Record<ThemeId, ThemeDef> = Object.fromEntries(
 THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, ThemeDef>;

export const DEFAULT_THEME_ID: ThemeId = "ai-minimal";

const TOKEN_TO_CSS: Record<keyof ThemeTokens, string> = {
 canvas: "--swarm-canvas",
 canvasHi: "--swarm-canvas-hi",
 surface: "--swarm-surface",
 surfaceHi: "--swarm-surface-hi",
 border: "--swarm-border",
 borderHi: "--swarm-border-hi",
 gold: "--swarm-gold",
 goldHi: "--swarm-gold-hi",
 goldDim: "--swarm-gold-dim",
 honey: "--swarm-honey",
 amber: "--swarm-amber",
 text: "--swarm-text",
 textDim: "--swarm-text-dim",
 textMuted: "--swarm-text-muted",
 ok: "--swarm-ok",
 warn: "--swarm-warn",
 err: "--swarm-err",
};

/** Fired on `window` after CSS tokens are written so non-CSS surfaces (xterm) can refresh. */
export const THEME_CHANGE_EVENT = "swarm:themechange";

/** Convert `"201 162 39"` channel triplets to `#c9a227`. */
export function rgbChannelsToHex(channels: string): string {
 const parts = channels.trim().split(/\s+/).map(Number);
 if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return "#000000";
 const [r, g, b] = parts.map((n) => Math.max(0, Math.min(255, Math.round(n))));
 return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Accent hex for the active (or given) theme — agent chips, defaults, etc. */
export function themeAccentHex(id?: ThemeId): string {
 const theme = THEME_BY_ID[id ?? DEFAULT_THEME_ID] ?? THEME_BY_ID[DEFAULT_THEME_ID];
 return rgbChannelsToHex(theme.tokens.gold);
}

/** Apply theme CSS variables on :root / documentElement. */
export function applyTheme(id: ThemeId): void {
 const theme = THEME_BY_ID[id] ?? THEME_BY_ID[DEFAULT_THEME_ID];
 const root = document.documentElement;
 root.setAttribute("data-theme", theme.id);
 root.classList.add("theme-transition");
 for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS) as [keyof ThemeTokens, string][]) {
 const channels = theme.tokens[key];
 root.style.setProperty(cssVar, channels);
 // Hex mirrors for JS/SVG that can't use channel triplets (xterm, stroke, etc.)
 root.style.setProperty(`${cssVar}-hex`, rgbChannelsToHex(channels));
 }
 setTimeout(() => root.classList.remove("theme-transition"), 400);
 if (typeof window !== "undefined") {
 window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { id: theme.id } }));
 }
}
