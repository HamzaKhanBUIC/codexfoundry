import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileMemoryPack } from "../src/compiler.js";
import { renderMemoryPackMarkdown } from "../src/markdown.js";
import { loadVault } from "../src/vault.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const vaultPath = path.resolve(testDirectory, "../../vault");
const policy = {
  referenceTime: new Date("2026-07-18T12:00:00Z"),
  maxAgeDays: 90,
  agingThreshold: 0.75,
};

describe("Memory Pack compiler", () => {
  it("selects small, fresh, evidence-backed PAY-17 context and excludes stale memory", async () => {
    const index = await loadVault(vaultPath);
    const pack = compileMemoryPack(index, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      description: "A timeout after capture must not create a second payment.",
      services: ["checkout-service", "payment-gateway"],
      requirements: ["PAY-17"],
      labels: ["payments", "idempotency"],
      paths: ["demo-store/src/services/checkout-service.ts"],
      tokenBudget: 12_000,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });

    expect(pack.sources.map((source) => source.document.id)).toEqual(expect.arrayContaining([
      "ADR-001",
      "ARCH-001",
      "PROOF-001",
    ]));
    expect(pack.sources.map((source) => source.document.id)).not.toContain("INC-000");
    expect(pack.omittedSources).toContainEqual(expect.objectContaining({
      document: expect.objectContaining({ id: "INC-000" }),
      reason: expect.stringContaining("stale"),
    }));
    expect(pack.estimatedTokens).toBeLessThanOrEqual(pack.tokenBudget);
    expect(pack.confidenceScore).toBeGreaterThanOrEqual(0.65);
  });

  it("renders pack provenance and exclusion reasons as Obsidian-compatible Markdown", async () => {
    const index = await loadVault(vaultPath);
    const pack = compileMemoryPack(index, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      services: ["checkout-service"],
      tokenBudget: 12_000,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });
    const markdown = renderMemoryPackMarkdown(pack);

    expect(markdown).toContain("# Memory Pack — PAY-17");
    expect(markdown).toContain("[[ADR-001]]");
    expect(markdown).toContain("[[INC-000]] — excluded because its verified knowledge is stale.");
    expect(markdown).toContain("estimated_tokens:");
  });

  it("keeps the pack within a constrained context budget and reports omissions", async () => {
    const index = await loadVault(vaultPath);
    const pack = compileMemoryPack(index, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      services: ["checkout-service", "payment-gateway"],
      tokenBudget: 300,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });

    expect(pack.sources.length).toBeGreaterThan(0);
    expect(pack.estimatedTokens).toBeLessThanOrEqual(300);
    expect(pack.omittedSources).toContainEqual(expect.objectContaining({
      reason: expect.stringContaining("pack budget"),
    }));
  });
});
