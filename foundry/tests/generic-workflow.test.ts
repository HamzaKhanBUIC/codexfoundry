import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { GenericImplementationReport, GenericPlanningContext } from "../src/generic-codex-agents.js";
import type { GenericCodexInvocationReceipt, GenericExecutionPolicy, GenericPlanProposal, GenericTask } from "../src/generic-policy.js";
import { GenericRunStore } from "../src/generic-run-store.js";
import { GenericFoundryWorkflow, type GenericImplementer, type GenericPlanner } from "../src/generic-workflow.js";

const temporaryDirectories: string[] = [];
afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });
function git(repository: string, args: string[]): string { return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim(); }

describe("GenericFoundryWorkflow", () => {
  it("persists intake through separate approvals, proof, regression, and Markdown vault write", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-generic-workflow-")); temporaryDirectories.push(workspace);
    const root = path.join(workspace, "repository"); await mkdir(path.join(root, "src"), { recursive: true }); await mkdir(path.join(root, "tests"), { recursive: true });
    await writeFile(path.join(root, "src", "value.mjs"), "export const value = 'broken';\n", "utf8");
    await writeFile(path.join(root, "tests", "proof.mjs"), "import assert from 'node:assert/strict';\nimport { value } from '../src/value.mjs';\nassert.equal(value, 'fixed');\n", "utf8");
    execFileSync("git", ["init", root], { stdio: "ignore" }); git(root, ["add", "."]); git(root, ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@test.local", "commit", "-m", "baseline"]);
    const policy: GenericExecutionPolicy = { id: "POLICY-FLOW-001", repositoryRoot: root, baselineCommit: git(root, ["rev-parse", "HEAD"]), allowedPaths: ["src/value.mjs"], allowedCommands: [{ id: "proof", executable: "node", args: ["tests/proof.mjs"], description: "Deterministic proof", timeoutMs: 10_000 }] };
    const task: GenericTask = { id: "TASK-FLOW-001", title: "Fix stale value", description: "The value must become fixed.", acceptanceCriteria: ["value is fixed"], risk: "low" };
    const plannerReceipt: GenericCodexInvocationReceipt = { stage: "planner", sandbox: "read-only", repositoryPath: root, prompt: "bounded planner prompt", responseSchema: { type: "object" }, rawOutput: "{\"summary\":\"Set the value to fixed.\"}", promptSha256: "planner-prompt-sha", responseSha256: "planner-output-sha", replayNote: "A controlled re-invocation may differ." };
    const implementerReceipt: GenericCodexInvocationReceipt = { stage: "implementer", sandbox: "workspace-write", repositoryPath: root, prompt: "bounded implementation prompt", responseSchema: { type: "object" }, rawOutput: "{\"summary\":\"Set the value.\"}", promptSha256: "implementer-prompt-sha", responseSha256: "implementer-output-sha", replayNote: "A controlled re-invocation may differ." };
    const planner: GenericPlanner = { async propose(runId): Promise<GenericPlanProposal> { return { id: "PLAN-FLOW-001", runId, taskId: task.id, summary: "Set the value to fixed.", rootCauseHypothesis: "The fixture stores broken instead of fixed.", affectedPaths: ["src/value.mjs"], commandIds: ["proof"], proofContract: [{ assertion: "value is fixed", commandIds: ["proof"] }], risks: ["Do not alter proof code."], codexReceipt: plannerReceipt }; } };
    const implementer: GenericImplementer = { async implement(plan, _, worktree): Promise<GenericImplementationReport> { await writeFile(path.join(worktree.path, "src", "value.mjs"), "export const value = 'fixed';\n", "utf8"); return { runId: plan.runId, planId: plan.id, changedPaths: ["src/value.mjs"], summary: "Set the value.", commandsClaimed: [], unresolvedRisks: [], confidence: "medium", codexReceipt: implementerReceipt }; } };
    const store = new GenericRunStore(path.join(workspace, "state"));
    const workflow = new GenericFoundryWorkflow({ store, stageRoot: path.join(workspace, "staged"), planner, implementer });
    const context: GenericPlanningContext = { repositorySummary: "deterministic fixture", readiness: "SAFE FOR BOUNDED AI PLANNING", memoryPack: { id: "PACK-FLOW-001", available: false, selectedIds: [], omittedIds: [], limitations: ["No reusable memory."] }, evidence: [] };
    await workflow.begin({ runId: "RUN-FLOW-001", task, policy, memoryPack: context.memoryPack });
    await workflow.proposePlan("RUN-FLOW-001", "PLAN-FLOW-001", context);
    await workflow.approvePlanAndCreateCandidate("RUN-FLOW-001", { actor: "human:planner", approvedAt: "2026-07-21T00:00:00.000Z", reason: "Scope is exact." });
    expect((await workflow.implementAndVerify("RUN-FLOW-001")).status).toBe("review_pending");
    await workflow.approvePatchAndStageMemory("RUN-FLOW-001", { actor: "human:reviewer", approvedAt: "2026-07-21T00:02:00.000Z", reason: "Verifier evidence passed." });
    const completed = await workflow.approveVaultAndWriteMemory("RUN-FLOW-001", { actor: "human:vault", approvedAt: "2026-07-21T00:03:00.000Z", reason: "Markdown memory approved." }, path.join(workspace, "vault"));
    expect(completed.run.status).toBe("complete"); expect(completed.writtenPaths).toHaveLength(4);
    const replay = await workflow.replayRegression("RUN-FLOW-001", { path: "src/value.mjs", expected: "'fixed'", replacement: "'broken'", approvedBy: "human:reviewer", approvedAt: "2026-07-21T00:04:00.000Z", reason: "Prove the evaluator rejects the defect." });
    expect(replay.regression?.status).toBe("regression_blocked");
    const persisted = await store.get("RUN-FLOW-001");
    expect(persisted.proposedPlan?.codexReceipt).toMatchObject({ stage: "planner", prompt: plannerReceipt.prompt, rawOutput: plannerReceipt.rawOutput, promptSha256: plannerReceipt.promptSha256 });
    expect(persisted.implementation?.codexReceipt).toMatchObject({ stage: "implementer", prompt: implementerReceipt.prompt, rawOutput: implementerReceipt.rawOutput, responseSha256: implementerReceipt.responseSha256 });
    expect(await readdir(path.join(workspace, "vault"))).toEqual(expect.arrayContaining(["adrs", "evaluations", "incidents", "proofs"]));
    workflow.disposeCandidate("RUN-FLOW-001");
  });

  it("records a planner failure as a durable failed stage instead of losing the run", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-generic-workflow-failure-")); temporaryDirectories.push(workspace);
    const root = path.join(workspace, "repository"); await mkdir(root, { recursive: true });
    await writeFile(path.join(root, "value.mjs"), "export const value = 1;\n", "utf8");
    execFileSync("git", ["init", root], { stdio: "ignore" }); git(root, ["add", "."]); git(root, ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@test.local", "commit", "-m", "baseline"]);
    const policy: GenericExecutionPolicy = { id: "POLICY-FAIL-001", repositoryRoot: root, baselineCommit: git(root, ["rev-parse", "HEAD"]), allowedPaths: ["value.mjs"], allowedCommands: [{ id: "proof", executable: "node", args: ["--version"], description: "Node availability", timeoutMs: 10_000 }] };
    const task: GenericTask = { id: "TASK-FAIL-001", title: "Fail safely", description: "Fixture", acceptanceCriteria: ["failure is recorded"], risk: "low" };
    const planner: GenericPlanner = { async propose(): Promise<GenericPlanProposal> { throw new Error("planner transport unavailable"); } };
    const workflow = new GenericFoundryWorkflow({ store: new GenericRunStore(path.join(workspace, "state")), stageRoot: path.join(workspace, "staged"), planner });
    await workflow.begin({ runId: "RUN-FAIL-001", task, policy, memoryPack: { id: "PACK-FAIL-001", available: false, selectedIds: [], omittedIds: [], limitations: [] } });
    const result = await workflow.proposePlan("RUN-FAIL-001", "PLAN-FAIL-001", { repositorySummary: "fixture", readiness: "unknown", memoryPack: { id: "PACK-FAIL-001", available: false, selectedIds: [], omittedIds: [], limitations: [] }, evidence: [] });
    expect(result).toMatchObject({ status: "failed", failureReason: "planner transport unavailable" });
    expect(result.events.at(-1)).toMatchObject({ stage: "plan", status: "failed", authority: "codex_planner" });
  });
});
