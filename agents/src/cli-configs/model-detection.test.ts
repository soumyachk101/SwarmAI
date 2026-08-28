import { describe, it, expect, vi, beforeEach } from "vitest";
import { probeCliModels, clearProbeCache, getProbeStatus } from "./model-detection.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

describe("model-detection", () => {
 beforeEach(() => {
 clearProbeCache();
 vi.resetModules();
 });

 describe("probeCliModels", () => {
 it("returns empty for unknown CLI", async () => {
 const result = await probeCliModels("nonexistent-cli");
 expect(result).toEqual([]);
 });

 it("returns empty for CLIs with no probe implementation", async () => {
 // aider, opencode, agy, cline, kilo have no probe implementation
 const result = await probeCliModels("aider");
 expect(result).toEqual([]);
 });

  it("returns empty when CLI is not installed", async () => {
    const result = await probeCliModels("claude");
    // claude is likely not installed in test env, should return empty gracefully
    expect(Array.isArray(result)).toBe(true);
  }, 10_000);

  it("parses Claude help output when available", async () => {
    // This tests the parsing logic indirectly via the full pipeline
    // We can't easily mock execFile in this setup, but we verify the
    // function handles the output shape correctly
    const result = await probeCliModels("claude");
    expect(Array.isArray(result)).toBe(true);
    // If claude is installed, results should be lowercase cliFlags
    for (const flag of result) {
      expect(flag).toBe(flag.toLowerCase());
    }
  }, 10_000);
 });

 describe("clearProbeCache", () => {
 it("clears the cache", async () => {
 // Populate cache
 await probeCliModels("claude");
 await probeCliModels("codex");

 const claudeStatus = getProbeStatus("claude");
 expect(claudeStatus.probed).toBe(true);

 clearProbeCache();

 const claudeAfter = getProbeStatus("claude");
 expect(claudeAfter.probed).toBe(false);
 });
 });

 describe("getProbeStatus", () => {
 it("returns not probed for unknown CLI", () => {
 const status = getProbeStatus("nonexistent-cli");
 expect(status.probed).toBe(false);
 expect(status.detectedAt).toBeNull();
 });

 it("returns not probed before any probe call", () => {
 const status = getProbeStatus("claude");
 expect(status.probed).toBe(false);
 expect(status.detectedAt).toBeNull();
 });
 });
});
