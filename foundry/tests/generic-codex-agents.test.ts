import { describe, expect, it } from "vitest";
import { approveGenericPlan, type GenericExecutionPolicy, type GenericTask } from "../src/generic-policy.js";
import { parseGenericImplementationOutput, parseGenericPlanOutput } from "../src/generic-codex-agents.js";

const policy: GenericExecutionPolicy = { id: "POLICY-CODEX-001", repositoryRoot: "C:/fixture", baselineCommit: "abcdef1234567", allowedPaths: ["src/handler.ts"], allowedCommands: [{ id: "proof", executable: "node", args: ["tests/proof.mjs"], description: "deterministic proof", timeoutMs: 10_000 }] };
const task: GenericTask = { id: "TASK-CODEX-001", title: "Repair handler", description: "Untrusted details.", acceptanceCriteria: ["handler returns fixed value"], risk: "medium" };

describe("generic Codex output contracts", () => {
  it("accepts only a policy-bounded planner response", () => {
    const raw = JSON.stringify({ summary: "Repair the handler.", rootCauseHypothesis: "The value is stale.", affectedPaths: ["src/handler.ts"], commandIds: ["proof"], proofContract: [{ assertion: "handler returns fixed value", commandIds: ["proof"] }], risks: ["Static context may be incomplete."] });
    expect(parseGenericPlanOutput(raw, "RUN-CODEX-001", task, policy, "PLAN-CODEX-001")).toMatchObject({ taskId: task.id, affectedPaths: ["src/handler.ts"], commandIds: ["proof"] });
    expect(() => parseGenericPlanOutput(raw.replace("src/handler.ts", "src/other.ts"), "RUN-CODEX-001", task, policy, "PLAN-CODEX-001")).toThrow("outside the human-approved policy");
  });

  it("keeps implementation self-report within the approved plan without treating it as proof", () => {
    const proposal = parseGenericPlanOutput(JSON.stringify({ summary: "Repair the handler.", rootCauseHypothesis: "The value is stale.", affectedPaths: ["src/handler.ts"], commandIds: ["proof"], proofContract: [{ assertion: "handler returns fixed value", commandIds: ["proof"] }], risks: [] }), "RUN-CODEX-001", task, policy, "PLAN-CODEX-001");
    const plan = approveGenericPlan(proposal, policy, { actor: "human:reviewer", approvedAt: "2026-07-21T00:00:00.000Z", reason: "Narrow plan approved." });
    const report = parseGenericImplementationOutput(JSON.stringify({ changedPaths: ["src/handler.ts"], summary: "Updated the handler.", commandsClaimed: ["proof"], unresolvedRisks: [], confidence: "medium" }), plan);
    expect(report).toMatchObject({ runId: plan.runId, planId: plan.id, confidence: "medium" });
    expect(() => parseGenericImplementationOutput(JSON.stringify({ changedPaths: ["src/other.ts"], summary: "Bad scope.", commandsClaimed: [], unresolvedRisks: [], confidence: "high" }), plan)).toThrow("outside the approved plan");
  });
});
