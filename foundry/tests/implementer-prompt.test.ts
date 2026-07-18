import { describe, expect, it } from "vitest";
import type { StoredMemoryPack, StoredPlan } from "../src/models.js";
import type { ImplementationWorktree } from "../src/worktree-runner.js";
import { renderPay17ImplementerPrompt } from "../src/implementer-prompt.js";

const plan: StoredPlan = {
  id: "PLAN-PAY-17-001", runId: "RUN-PAY-17-001", memoryPackId: "PACK-PAY-17",
  summary: "Preserve retry identity.", rootCauseHypothesis: "Hypothesis: retry mutation causes the duplicate.",
  affectedPaths: ["src/services/checkout-service.ts"], allowedCommands: ["npm run test:pay-17"],
  proofContract: [{ requirementId: "PAY-17", assertion: "one logical checkout persists one payment", commands: ["npm run test:pay-17"] }],
  risks: ["Baseline is intentionally defective."], status: "approved", createdAt: "2026-07-18T00:00:00.000Z", approvedAt: "2026-07-18T00:01:00.000Z",
};

const pack: StoredMemoryPack = {
  id: "PACK-PAY-17", runId: "RUN-PAY-17-001", taskId: "PAY-17", repositoryCommit: "1169daf",
  renderedPayload: "# Selected evidence", payloadSha256: "a".repeat(64), estimatedTokens: 12, tokenBudget: 100,
  confidenceScore: 0.9, sources: [], omittedSources: [], generatedAt: "2026-07-18T00:00:00.000Z", createdAt: "2026-07-18T00:00:00.000Z",
};

const worktree: ImplementationWorktree = {
  runId: "RUN-PAY-17-001", path: "C:/fixture/.foundry-worktrees/RUN-PAY-17-001", repositoryCommit: "1169daf",
  allowedPaths: ["src/services/checkout-service.ts"], allowedCommands: ["npm run test:pay-17"],
};

describe("Codex implementation prompt", () => {
  it("binds the approved plan, exact pack, and candidate-only policy", () => {
    const prompt = renderPay17ImplementerPrompt(plan, pack, worktree);
    expect(prompt).toContain("approved_plan_id: PLAN-PAY-17-001");
    expect(prompt).toContain("# Selected evidence");
    expect(prompt).toContain("Do not access files outside the worktree");
    expect(prompt).toContain("No self-reported output can mark PAY-17 verified");
  });

  it("refuses an unapproved plan or cross-run input", () => {
    expect(() => renderPay17ImplementerPrompt({ ...plan, status: "proposed" }, pack, worktree)).toThrow("human-approved");
    expect(() => renderPay17ImplementerPrompt(plan, { ...pack, runId: "RUN-OTHER" }, worktree)).toThrow("same approved run");
  });
});
