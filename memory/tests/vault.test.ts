import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadVault } from "../src/vault.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const vaultPath = path.resolve(testDirectory, "../../vault");

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
  });
});
