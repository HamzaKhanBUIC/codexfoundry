import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { approveGenericPlan, type GenericExecutionPolicy, type GenericPlanProposal, validateGenericPolicy } from "../src/generic-policy.js";
import { GenericWorktreeRunner } from "../src/generic-worktree-runner.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function git(repository: string, args: string[]): string {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
}

async function fixture(): Promise<{ root: string; policy: GenericExecutionPolicy }> {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-generic-worktree-"));
  temporaryDirectories.push(workspace);
  const root = path.join(workspace, "repository");
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src", "handler.ts"), "export const value = 'baseline';\n", "utf8");
  execFileSync("git", ["init", root], { stdio: "ignore" });
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@test.local", "commit", "-m", "baseline"]);
  return { root, policy: { id: "POLICY-GENERIC-001", repositoryRoot: root, baselineCommit: git(root, ["rev-parse", "HEAD"]), allowedPaths: ["src/handler.ts"], allowedCommands: [{ id: "unit", executable: "node", args: ["--version"], description: "Node availability proof", timeoutMs: 10_000 }] } };
}

function proposal(): GenericPlanProposal {
  return { id: "PLAN-GENERIC-001", runId: "RUN-GENERIC-001", taskId: "TASK-001", summary: "Constrain the handler repair.", rootCauseHypothesis: "The deterministic fixture has an incorrect handler value.", affectedPaths: ["src/handler.ts"], commandIds: ["unit"], proofContract: [{ assertion: "handler value satisfies the approved contract", commandIds: ["unit"] }], risks: ["Only the approved handler path may change."] };
}

describe("generic repository execution policy", () => {
  it("requires direct commands and approved paths before creating an isolated candidate", async () => {
    const { root, policy } = await fixture();
    const approved = approveGenericPlan(proposal(), policy, { actor: "human:reviewer", approvedAt: "2026-07-21T00:00:00.000Z", reason: "The scope and proof are acceptable." });
    const runner = new GenericWorktreeRunner(policy);
    const candidate = await runner.create(approved.runId, approved);
    try {
      expect(git(candidate.path, ["rev-parse", "HEAD"])).toBe(policy.baselineCommit);
      await writeFile(path.join(candidate.path, "src", "handler.ts"), "export const value = 'candidate';\n", "utf8");
      expect(runner.changedPaths(candidate)).toEqual(["src/handler.ts"]);
      expect(runner.inspect(candidate).status).toContain("src/handler.ts");
    } finally {
      runner.dispose(candidate);
    }
    await expect(access(candidate.path)).rejects.toThrow();
    expect(git(root, ["status", "--porcelain"])).toBe("");
  });

  it("rejects a shell command and paths outside the approved policy", async () => {
    const { policy } = await fixture();
    expect(() => validateGenericPolicy({ ...policy, allowedCommands: [{ ...policy.allowedCommands[0], executable: "powershell.exe" }] })).toThrow("never a shell");
    expect(() => approveGenericPlan({ ...proposal(), affectedPaths: ["../outside.ts"] }, policy, { actor: "human:reviewer", approvedAt: "2026-07-21T00:00:00.000Z", reason: "No." })).toThrow("relative paths");
  });
});
