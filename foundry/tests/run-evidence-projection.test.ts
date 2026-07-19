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
    expect(view.review).toMatchObject({ vaultDecision: "APPROVE VAULT WRITE", vaultStatus: "completed" });
    expect(view.review.patchApprovalLimits.join(" ")).not.toContain("vault write was performed");
    expect(view.memory.included.map((note) => note.id)).toEqual(["PROOF-001"]);
    expect(view.memory).toMatchObject({ lifecycleLabel: "Post-repair reusable engineering memory", repositoryCommit: "2a5d01f", baselineCommit: "1169daf", estimatedTokens: 715, tokenBudget: 12000, confidenceScore: 1 });
    expect(view.memory.lifecycleExplanation).toContain("not sent to the baseline planner");
    expect(JSON.stringify(view.memory.omitted)).not.toContain("historical incident predates");
    expect(view.evidence.some((item) => item.authority === "independent_verifier")).toBe(true);
    expect(view.nodeInspectors).toBeDefined();
    expect(view.edgeInspectors).toBeDefined();
    for (const node of view.proofGraph.nodes) {
      expect(view.nodeInspectors?.[node.id]).toMatchObject({ nodeId: node.id, verificationStatus: node.status });
    }
    for (const edge of view.proofGraph.edges) {
      expect(view.edgeInspectors?.[`${edge.from}->${edge.to}`]).toMatchObject({ fromId: edge.from, toId: edge.to, relationship: edge.label });
    }
    expect(view.nodeInspectors?.verification.relatedEvidence).toContain("verifier:browser");
    expect(view.edgeInspectors?.["worktree->verification"].evidenceBasis).toBe("RUN-PAY-17-001-verifier.json");
  });
});
