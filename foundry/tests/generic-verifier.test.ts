import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { approveGenericPlan, type GenericExecutionPolicy, type GenericPlanProposal } from "../src/generic-policy.js";
import { GenericVerifier } from "../src/generic-verifier.js";
import { GenericWorktreeRunner } from "../src/generic-worktree-runner.js";

const temporaryDirectories: string[] = [];
afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

function git(repository: string, args: string[]): string { return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim(); }

async function fixture(): Promise<{ policy: GenericExecutionPolicy; plan: GenericPlanProposal }> {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-generic-verifier-"));
  temporaryDirectories.push(workspace);
  const root = path.join(workspace, "repository");
  await mkdir(path.join(root, "src"), { recursive: true });
  await mkdir(path.join(root, "tests"), { recursive: true });
  await writeFile(path.join(root, "src", "value.mjs"), "export const value = 'broken';\n", "utf8");
  await writeFile(path.join(root, "tests", "proof.mjs"), "import assert from 'node:assert/strict';\nimport { value } from '../src/value.mjs';\nassert.equal(value, 'fixed');\n", "utf8");
  execFileSync("git", ["init", root], { stdio: "ignore" }); git(root, ["add", "."]); git(root, ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@test.local", "commit", "-m", "baseline"]);
  return { policy: { id: "POLICY-VERIFY-001", repositoryRoot: root, baselineCommit: git(root, ["rev-parse", "HEAD"]), allowedPaths: ["src/value.mjs"], allowedCommands: [{ id: "proof", executable: "node", args: ["tests/proof.mjs"], description: "Independent deterministic proof", timeoutMs: 10_000 }] }, plan: { id: "PLAN-VERIFY-001", runId: "RUN-VERIFY-001", taskId: "TASK-VERIFY-001", summary: "Correct the fixture value.", rootCauseHypothesis: "The stored value is broken.", affectedPaths: ["src/value.mjs"], commandIds: ["proof"], proofContract: [{ assertion: "the value is fixed", commandIds: ["proof"] }], risks: ["Only the value module is in scope."] } };
}

describe("GenericVerifier", () => {
  it("owns command proof and blocks a deliberately replayed regression", async () => {
    const { policy, plan } = await fixture();
    const approved = approveGenericPlan(plan, policy, { actor: "human:reviewer", approvedAt: "2026-07-21T00:00:00.000Z", reason: "Exact scope and proof reviewed." });
    const runner = new GenericWorktreeRunner(policy);
    const candidate = await runner.create(approved.runId, approved);
    try {
      await writeFile(path.join(candidate.path, "src", "value.mjs"), "export const value = 'fixed';\n", "utf8");
      const verifier = new GenericVerifier(policy);
      const verified = await verifier.verify(approved.runId, approved, candidate, runner);
      expect(verified).toMatchObject({ authority: "independent_verifier", passed: true, changedPaths: ["src/value.mjs"] });
      expect(verified.commands).toHaveLength(1);
      expect(verified.commands[0]).toMatchObject({ commandId: "proof", exitCode: 0, timedOut: false });

      const replay = await verifier.replayRegression(approved.runId, approved, candidate, runner, { path: "src/value.mjs", expected: "'fixed'", replacement: "'broken'", approvedBy: "human:reviewer", approvedAt: "2026-07-21T00:02:00.000Z", reason: "Validate the saved proof against the original defect." });
      expect(replay.status).toBe("regression_blocked");
      expect(replay.verification.passed).toBe(false);
      expect(replay.verification.commands[0].exitCode).not.toBe(0);
    } finally {
      runner.dispose(candidate);
    }
  });
});
