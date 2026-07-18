import { describe, expect, it } from "vitest";
import { parsePlannerResponse } from "../src/planner-response.js";

const validResponse = JSON.stringify({
  summary: "Preserve the checkout idempotency key across retry.",
  rootCauseHypothesis: "Hypothesis: the retry path mutates the idempotency key after acknowledgement timeout.",
  affectedPaths: ["src/services/checkout-service.ts", "tests/payment-service.pay-17.test.ts"],
  allowedCommands: ["npm run build", "npm run test:pay-17"],
  proofContract: [{
    requirementId: "PAY-17",
    assertion: "one logical checkout persists one payment",
    commands: ["npm run test:pay-17"],
  }],
  risks: ["The known baseline is intentionally red before a future repair."],
});

describe("Codex Planner response parser", () => {
  it("creates a typed proposal from the exact JSON contract", () => {
    expect(parsePlannerResponse(validResponse, "RUN-PAY-17-001", "PACK-PAY-17", "PLAN-PAY-17-001")).toMatchObject({
      id: "PLAN-PAY-17-001",
      runId: "RUN-PAY-17-001",
      memoryPackId: "PACK-PAY-17",
      proofContract: [{ requirementId: "PAY-17" }],
    });
  });

  it("rejects free-form text, Markdown fences, and unknown model-supplied fields", () => {
    expect(() => parsePlannerResponse("```json\n{}\n```", "RUN", "PACK", "PLAN")).toThrow("exact JSON");
    expect(() => parsePlannerResponse(JSON.stringify({ ...JSON.parse(validResponse), grantApproval: true }), "RUN", "PACK", "PLAN"))
      .toThrow("exactly the required proposal fields");
    expect(() => parsePlannerResponse(JSON.stringify({ ...JSON.parse(validResponse), proofContract: [{
      requirementId: "PAY-17", assertion: "one logical checkout persists one payment", commands: ["npm run test:pay-17"], executeNow: true,
    }] }), "RUN", "PACK", "PLAN")).toThrow("unknown field");
  });
});
