import { describe, expect, it } from "vitest";
import type { RepositoryMap, StoredPlan } from "../src/models.js";
import { parseImplementationResponse } from "../src/implementation-response.js";

const repository: RepositoryMap = {
  rootPath: "C:/fixture", commit: "1169daf", services: [
    { id: "checkout-service", sourcePath: "src/services/checkout-service.ts" },
    { id: "payment-gateway", sourcePath: "src/services/payment-gateway.ts" },
  ],
  pay17TestPath: "tests/payment-service.pay-17.test.ts",
  browserTestPath: "tests/browser/pay-17.spec.ts",
  commands: { build: "npm run build", health: "npm run test:health", pay17: "npm run test:pay-17", browser: "npm run test:browser" },
};

const plan: StoredPlan = {
  id: "PLAN-PAY-17-001", runId: "RUN-PAY-17-001", memoryPackId: "PACK-PAY-17",
  summary: "Preserve retry identity.", rootCauseHypothesis: "Hypothesis: retry mutation causes the duplicate.",
  affectedPaths: ["src/services/checkout-service.ts", "tests/payment-service.pay-17.test.ts"],
  allowedCommands: ["npm run build", "npm run test:pay-17"],
  proofContract: [{ requirementId: "PAY-17", assertion: "one logical checkout persists one payment", commands: ["npm run test:pay-17"] }],
  risks: ["Baseline is intentionally defective."], status: "approved", createdAt: "2026-07-18T00:00:00.000Z", approvedAt: "2026-07-18T00:01:00.000Z",
};

const validReport = JSON.stringify({
  changedPaths: ["src/services/checkout-service.ts", "tests/payment-service.pay-17.test.ts"],
  changeSummary: "Preserved the logical checkout idempotency key during retries and updated the regression assertion.",
  commandsRun: ["npm run build", "npm run test:pay-17"],
  unresolvedRisks: ["Browser proof still requires independent verification."],
  confidence: "medium",
});

describe("Codex implementation response parser", () => {
  it("accepts a bounded non-authoritative implementation report", () => {
    expect(parseImplementationResponse(validReport, plan, repository)).toMatchObject({
      runId: "RUN-PAY-17-001", planId: "PLAN-PAY-17-001", confidence: "medium",
    });
  });

  it("rejects unapproved actions, verification claims, and malformed output", () => {
    expect(() => parseImplementationResponse("```json\n{}\n```", plan, repository)).toThrow("exact JSON");
    expect(() => parseImplementationResponse(JSON.stringify({ ...JSON.parse(validReport), verified: true }), plan, repository))
      .toThrow("exactly the required report fields");
    expect(() => parseImplementationResponse(JSON.stringify({ ...JSON.parse(validReport), changedPaths: ["package.json"] }), plan, repository))
      .toThrow("changed path outside");
    expect(() => parseImplementationResponse(JSON.stringify({ ...JSON.parse(validReport), commandsRun: ["npm publish"] }), plan, repository))
      .toThrow("command outside");
    expect(() => parseImplementationResponse(validReport, { ...plan, status: "proposed" }, repository))
      .toThrow("human-approved");
  });
});
