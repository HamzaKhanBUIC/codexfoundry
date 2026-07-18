import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildMemoryGraph } from "../src/graph.js";
import type { MemoryDocument } from "../src/models.js";
import { loadVault } from "../src/vault.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const vaultPath = path.resolve(testDirectory, "../../vault");

function document(
  id: string,
  sourcePath: string,
  wikiLinks: string[] = [],
  aliases: string[] = [],
): MemoryDocument {
  return {
    id,
    type: "architecture",
    title: id,
    services: [],
    requirements: [],
    tags: [],
    aliases,
    links: [],
    evidence: [],
    confidence: "verified",
    sourcePath,
    body: "",
    wikiLinks,
    estimatedTokens: 1,
  };
}

describe("Obsidian Engineering Vault", () => {
  it("loads the seeded Markdown documents and frontmatter", async () => {
    const index = await loadVault(vaultPath);

    expect(index.documents).toHaveLength(8);
    expect(index.byId.get("ADR-001")).toMatchObject({
      type: "adr",
      services: ["checkout-service", "payment-gateway"],
      requirements: ["PAY-17"],
      confidence: "verified",
    });
    expect(index.byId.get("ADR-001")?.sourcePath).toBe("adrs/ADR-001-payment-retry-idempotency.md");
    expect(index.byId.get("ADR-001")?.aliases).toEqual([]);
    expect(index.byService.get("payment-gateway")?.map((document) => document.id)).toEqual(
      expect.arrayContaining(["ADR-001", "ARCH-001", "INC-001", "PROOF-001", "SVC-002"]),
    );
    expect(index.byRequirement.get("pay-17")?.map((document) => document.id)).toContain("EVAL-001");
  });

  it("resolves explicit frontmatter and Obsidian-link graph relationships", async () => {
    const index = await loadVault(vaultPath);

    expect(index.graph.adjacentDocumentIds("ADR-001")).toEqual(
      expect.arrayContaining(["ARCH-001", "EVAL-001", "INC-001", "PROOF-001", "SVC-001", "SVC-002"]),
    );
    expect(index.graph.edges).toContainEqual({
      from: "PROOF-001",
      to: "requirement:PAY-17",
      relation: "addresses",
    });
    expect(index.graph.danglingLinks).toEqual([]);
  });

  it("canonicalizes IDs, filenames, and aliases while reporting unresolved links", () => {
    const graph = buildMemoryGraph([
      document("ADR-001", "adrs/ADR-001-payment-retry-idempotency.md", [], ["payment-retry-policy"]),
      document("PROOF-001", "proofs/PROOF-001-pay-17.md", [
        "ADR-001",
        "ADR-001-payment-retry-idempotency",
        "adrs/ADR-001-payment-retry-idempotency",
        "payment-retry-policy",
        "missing-note",
      ]),
    ]);

    expect(graph.edges.filter((edge) => edge.from === "PROOF-001" && edge.relation === "links-to")).toEqual([
      { from: "PROOF-001", to: "ADR-001", relation: "links-to" },
    ]);
    expect(graph.danglingLinks).toEqual([
      { fromDocumentId: "PROOF-001", target: "missing-note" },
    ]);
  });

  it("loads frontmatter aliases and rejects ambiguous link targets", async () => {
    const temporaryVault = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-vault-"));
    try {
      await writeFile(path.join(temporaryVault, "ADR-010.md"), `---
id: ADR-010
type: adr
title: Retry policy
aliases: [retry-policy]
confidence: verified
---
\n# Retry policy\n`, "utf8");
      await writeFile(path.join(temporaryVault, "PROOF-010.md"), `---
id: PROOF-010
type: proof
title: Retry proof
confidence: verified
---
\nSee [[retry-policy]].\n`, "utf8");

      const index = await loadVault(temporaryVault);
      expect(index.graph.edges).toContainEqual({ from: "PROOF-010", to: "ADR-010", relation: "links-to" });

      await writeFile(path.join(temporaryVault, "ADR-011.md"), `---
id: ADR-011
type: adr
title: First shared alias
aliases: [shared-alias]
confidence: verified
---
`, "utf8");
      await writeFile(path.join(temporaryVault, "ADR-012.md"), `---
id: ADR-012
type: adr
title: Second shared alias
aliases: [shared-alias]
confidence: verified
---
`, "utf8");
      await expect(loadVault(temporaryVault)).rejects.toThrow("Ambiguous Obsidian link target");
    } finally {
      await rm(temporaryVault, { recursive: true, force: true });
    }
  });
});
