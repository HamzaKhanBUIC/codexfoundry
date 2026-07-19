import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPay17RunProjection } from "../src/run-evidence-projection.js";

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../evidence");

describe("PAY-17 proof view projection", () => {
  it("derives versioned graph, review, memory metadata, and evidence without omitted bodies", () => {
    const view = loadPay17RunProjection(directory);
    expect(view.schemaVersion).toBe("1.0");
    expect(view.proofGraph.nodes).toHaveLength(8);
    expect(view.proofGraph.edges).toHaveLength(7);
    expect(view.review.changedPaths).toEqual(["src/services/checkout-service.ts", "tests/browser/pay-17.spec.ts"]);
    expect(view.memory.included.map((note) => note.id)).toEqual(["PROOF-001"]);
    expect(view.memory).toMatchObject({ estimatedTokens: 715, tokenBudget: 12000, confidenceScore: 1 });
    expect(JSON.stringify(view.memory.omitted)).not.toContain("historical incident predates");
    expect(view.evidence.some((item) => item.authority === "independent_verifier")).toBe(true);
  });
});
