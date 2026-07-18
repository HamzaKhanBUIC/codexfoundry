import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileMemoryPack } from "../src/compiler.js";
import { buildMemoryGraph } from "../src/graph.js";
import { estimateRenderedMemoryPackTokens, renderMemoryPackMarkdown } from "../src/markdown.js";
import type { MemoryDocument, VaultIndex } from "../src/models.js";
import { loadVault } from "../src/vault.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const vaultPath = path.resolve(testDirectory, "../../vault");
const policy = {
  referenceTime: new Date("2026-07-18T12:00:00Z"),
  maxAgeDays: 90,
  agingThreshold: 0.75,
};

function document(
  id: string,
  type: MemoryDocument["type"],
  options: Partial<Pick<MemoryDocument, "body" | "requirements" | "services" | "title" | "wikiLinks">> = {},
): MemoryDocument {
  return {
    id,
    type,
    title: options.title ?? id,
    services: options.services ?? [],
    requirements: options.requirements ?? [],
    tags: [],
    aliases: [],
    links: [],
    evidence: [],
    confidence: "verified",
    verifiedAt: new Date("2026-07-01T00:00:00Z"),
    sourcePath: `${id}.md`,
    body: options.body ?? "",
    wikiLinks: options.wikiLinks ?? [],
    estimatedTokens: 10,
  };
}

function index(documents: MemoryDocument[]): VaultIndex {
  return {
    rootPath: "/synthetic-vault",
    documents,
    byId: new Map(documents.map((item) => [item.id, item])),
    byService: new Map(),
    byRequirement: new Map(),
    byEvidence: new Map(),
    byTag: new Map(),
    graph: buildMemoryGraph(documents),
  };
}

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

    expect(pack.sources.map((source) => source.document.id)).toEqual(["ARCH-001", "PROOF-001"]);
    expect(pack.sources.map((source) => source.document.id)).not.toContain("INC-000");
    expect(pack.sources.every((source) => source.inclusionReason.includes("covers"))).toBe(true);
    expect(pack.omittedSources).toContainEqual(expect.objectContaining({
      id: "ADR-001",
      reason: "excluded because it does not add uncovered task coverage",
    }));
    expect(pack.omittedSources).toContainEqual(expect.objectContaining({
      id: "INC-000",
      reason: expect.stringContaining("stale"),
    }));
    expect(pack.estimatedTokens).toBeLessThanOrEqual(pack.tokenBudget);
    expect(pack.confidenceScore).toBeGreaterThanOrEqual(0.65);
  });

  it("uses one outbound explicit link to satisfy an unmet proof obligation without admitting redundant links", () => {
    const pack = compileMemoryPack(index([
      document("INC-099", "incident", {
        title: "Payment failure incident",
        requirements: ["PAY-99"],
        wikiLinks: ["PROOF-099", "ARCH-099"],
      }),
      document("PROOF-099", "proof", { title: "Executable assertion" }),
      document("ARCH-099", "architecture", { title: "Historical component map" }),
    ]), {
      id: "PAY-99",
      title: "Checkout acknowledgement failure",
      requirements: ["PAY-99"],
      tokenBudget: 12_000,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });

    expect(pack.sources.map((source) => source.document.id)).toEqual(["INC-099", "PROOF-099"]);
    expect(pack.sources.find((source) => source.document.id === "PROOF-099")).toMatchObject({
      graphDistance: 1,
      inclusionReason: expect.stringContaining("type:proof"),
    });
    expect(pack.sources.map((source) => source.document.id)).not.toContain("ARCH-099");
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
    expect(markdown).toContain("[[INC-000]] — Legacy checkout refactor notes.");
    expect(markdown).toContain("excluded because its verified knowledge is stale.");
    expect(markdown).toContain("estimated_tokens:");
  });

  it("serializes only selected note bodies and measures the exact planner payload", async () => {
    const index = await loadVault(vaultPath);
    const pack = compileMemoryPack(index, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      services: ["checkout-service"],
      tokenBudget: 12_000,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });
    const markdown = renderMemoryPackMarkdown(pack);
    const staleIncident = index.byId.get("INC-000")!;

    expect(pack.omittedSources.find((source) => source.id === "INC-000")).toEqual({
      id: "INC-000",
      title: staleIncident.title,
      freshness: "stale",
      confidenceScore: 0.25,
      reason: "excluded because its verified knowledge is stale",
    });
    expect(JSON.stringify(pack)).not.toContain(staleIncident.body);
    expect(markdown).not.toContain(staleIncident.body);
    expect(pack.estimatedTokens).toBe(estimateRenderedMemoryPackTokens(pack));
  });

  it("excludes commit-mismatched memory when the task identifies its repository baseline", async () => {
    const vault = await loadVault(vaultPath);
    const pack = compileMemoryPack(vault, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      services: ["checkout-service", "payment-gateway"],
      repositoryCommit: "different-commit",
      tokenBudget: 12_000,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });

    expect(pack.sources).toHaveLength(0);
    expect(pack.omittedSources).toContainEqual(expect.objectContaining({
      id: "ARCH-001",
      freshness: "stale",
      reason: expect.stringContaining("stale"),
    }));
  });

  it("keeps the pack within a constrained context budget and reports omissions", async () => {
    const index = await loadVault(vaultPath);
    const pack = compileMemoryPack(index, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      services: ["checkout-service", "payment-gateway"],
      tokenBudget: 500,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") });

    expect(pack.estimatedTokens).toBeLessThanOrEqual(500);
    expect(pack.sources).toHaveLength(0);
    expect(pack.omittedSources).toContainEqual(expect.objectContaining({
      reason: expect.stringContaining("pack budget"),
    }));
  });

  it("fails closed when safe pack metadata alone exceeds the requested budget", async () => {
    const index = await loadVault(vaultPath);

    expect(() => compileMemoryPack(index, {
      id: "PAY-17",
      title: "Duplicate charge after checkout retry",
      services: ["checkout-service", "payment-gateway"],
      tokenBudget: 300,
    }, { freshnessPolicy: policy, generatedAt: new Date("2026-07-18T12:00:00Z") }))
      .toThrow("Memory Pack minimum safe payload requires");
  });
});
