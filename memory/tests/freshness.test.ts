import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assessDocument, assessFreshness, calculateConfidence } from "../src/freshness.js";
import { loadVault } from "../src/vault.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const vaultPath = path.resolve(testDirectory, "../../vault");
const policy = {
  referenceTime: new Date("2026-07-18T12:00:00Z"),
  maxAgeDays: 90,
  agingThreshold: 0.75,
};

describe("freshness and confidence", () => {
  it("marks old or explicitly stale knowledge as stale", async () => {
    const index = await loadVault(vaultPath);
    const staleIncident = index.byId.get("INC-000");

    expect(staleIncident).toBeDefined();
    expect(assessFreshness(staleIncident!, policy)).toBe("stale");
    expect(calculateConfidence(staleIncident!, "stale")).toBe(0.26);
  });

  it("calculates evidence-backed confidence deterministically", async () => {
    const index = await loadVault(vaultPath);
    const architecture = index.byId.get("ARCH-001");

    expect(architecture).toBeDefined();
    const assessed = assessDocument(architecture!, policy);
    expect(assessed.freshness).toBe("fresh");
    expect(assessed.confidenceScore).toBe(0.96);
  });
});
