import { describe, it, expect } from "vitest";
import {
 getModelsForCli,
 getDefaultModelForCli,
 getModelById,
 cliSupportsModels,
 getClisWithModels,
 groupModelsByProvider,
 MODEL_CATALOG,
} from "./model-catalog.js";

describe("model-catalog", () => {
 describe("getModelsForCli", () => {
 it("returns Claude Code models", () => {
 const models = getModelsForCli("claude");
 expect(models.length).toBeGreaterThan(0);
 expect(models[0].cliFlag).toBe("opus");
 expect(models[0].provider).toBe("anthropic");
 expect(models[0].is1M).toBe(true);
 });

 it("returns Codex models", () => {
 const models = getModelsForCli("codex");
 expect(models.length).toBeGreaterThan(0);
 expect(models.some(m => m.cliFlag === "5.6-sol")).toBe(true);
 });

 it("returns Antigravity models with Gemini variants", () => {
 const models = getModelsForCli("agy");
 expect(models.length).toBeGreaterThan(0);
 expect(models.some(m => m.cliFlag === "gemini-3.7-flash")).toBe(true);
 expect(models.some(m => m.cliFlag === "gemini-3.1-pro")).toBe(true);
 });

 it("returns OpenCode models with provider prefix", () => {
 const models = getModelsForCli("opencode");
 expect(models.some(m => m.cliFlag === "opencode/nemotron-3.5-lightning")).toBe(true);
 });

 it("returns Aider models with mixed providers", () => {
 const models = getModelsForCli("aider");
 expect(models.some(m => m.provider === "anthropic")).toBe(true);
 expect(models.some(m => m.provider === "openai")).toBe(true);
 expect(models.some(m => m.provider === "deepseek")).toBe(true);
 });

 it("returns empty for CLIs without model selection", () => {
 expect(getModelsForCli("kimi")).toEqual([]);
 expect(getModelsForCli("cursor")).toEqual([]);
 expect(getModelsForCli("kiro")).toEqual([]);
 });

 it("returns empty for unknown CLI", () => {
 expect(getModelsForCli("nonexistent-cli")).toEqual([]);
 });
 });

 describe("getDefaultModelForCli", () => {
 it("returns first model for Claude (Opus)", () => {
 const default_ = getDefaultModelForCli("claude");
 expect(default_).toBeDefined();
 expect(default_!.cliFlag).toBe("opus");
 expect(default_!.is1M).toBe(true);
 });

 it("returns first model for Codex", () => {
 const default_ = getDefaultModelForCli("codex");
 expect(default_).toBeDefined();
 expect(default_!.cliFlag).toBe("5.6-sol");
 });

 it("returns undefined for CLIs without models", () => {
 expect(getDefaultModelForCli("kimi")).toBeUndefined();
 });
 });

 describe("getModelById", () => {
 it("finds model by id", () => {
 const model = getModelById("claude", "claude-opus-5-1m");
 expect(model).toBeDefined();
 expect(model!.cliFlag).toBe("opus[1m]");
 expect(model!.contextWindow).toBe(1_000_000);
 });

 it("returns undefined for unknown model id", () => {
 expect(getModelById("claude", "nonexistent")).toBeUndefined();
 });

 it("returns undefined for model in different CLI", () => {
 expect(getModelById("claude", "5.6-sol")).toBeUndefined();
 });
 });

 describe("cliSupportsModels", () => {
 it("returns true for CLIs with models", () => {
 expect(cliSupportsModels("claude")).toBe(true);
 expect(cliSupportsModels("codex")).toBe(true);
 expect(cliSupportsModels("aider")).toBe(true);
 expect(cliSupportsModels("agy")).toBe(true);
 });

 it("returns false for CLIs without models", () => {
 expect(cliSupportsModels("kimi")).toBe(false);
 expect(cliSupportsModels("cursor")).toBe(false);
 expect(cliSupportsModels("kiro")).toBe(false);
 });
 });

 describe("getClisWithModels", () => {
 it("returns all CLIs that have model catalogs", () => {
 const clis = getClisWithModels();
 expect(clis).toContain("claude");
 expect(clis).toContain("codex");
 expect(clis).toContain("aider");
 expect(clis).toContain("agy");
 expect(clis).toContain("opencode");
 expect(clis).toContain("cline");
 expect(clis).toContain("kilo");
 expect(clis).not.toContain("kimi");
 expect(clis).not.toContain("cursor");
 });
 });

 describe("groupModelsByProvider", () => {
 it("groups models by provider", () => {
 const aiderModels = getModelsForCli("aider");
 const grouped = groupModelsByProvider(aiderModels);

 expect(grouped["anthropic"]).toBeDefined();
 expect(grouped["openai"]).toBeDefined();
 expect(grouped["deepseek"]).toBeDefined();
 expect(grouped["google"]).toBeDefined();
 });

 it("handles empty provider field", () => {
 const opencodeModels = getModelsForCli("opencode");
 const grouped = groupModelsByProvider(opencodeModels);
 expect(grouped["Other"]).toBeDefined();
 });
 });

 describe("MODEL_CATALOG integrity", () => {
 it("every model has a non-empty cliFlag", () => {
 for (const [cli, models] of Object.entries(MODEL_CATALOG)) {
 for (const m of models) {
 expect(m.cliFlag, `${cli}/${m.id} missing cliFlag`).toBeTruthy();
 expect(m.id, `${cli}/${m.label} missing id`).toBeTruthy();
 expect(m.label, `${cli}/${m.id} missing label`).toBeTruthy();
 expect(m.contextWindow, `${cli}/${m.id} missing contextWindow`).toBeGreaterThan(0);
 }
 }
 });

 it("no duplicate model ids within a CLI", () => {
 for (const [cli, models] of Object.entries(MODEL_CATALOG)) {
 const ids = models.map(m => m.id);
 expect(new Set(ids).size).toBe(ids.length);
 }
 });

 it("no duplicate cliFlags within a CLI", () => {
 for (const [cli, models] of Object.entries(MODEL_CATALOG)) {
 const flags = models.map(m => m.cliFlag.toLowerCase());
 expect(new Set(flags).size).toBe(flags.length);
 }
 });

 it("all cliFlags used by modelArgs are present in catalog", () => {
 // Verify that the static catalog covers the flag mappings in model-args.ts
 const claudeFlags = MODEL_CATALOG["claude"]?.map(m => m.cliFlag.toLowerCase()) ?? [];
 // These are the flags model-args normalizes to
 const requiredClaudeFlags = ["opus", "sonnet", "haiku", "fable", "opus[1m]", "sonnet[1m]", "fable[1m]"];
 for (const flag of requiredClaudeFlags) {
 expect(claudeFlags).toContain(flag);
 }
 });
 });
});
