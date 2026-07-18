import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { PlanProposal, RepositoryMap } from "../src/models.js";
import { assertPlanCommandAllowed, WorktreeRunner } from "../src/worktree-runner.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function git(repository: string, args: string[]): string {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
}

async function fixture(): Promise<RepositoryMap> {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-worktree-"));
  temporaryDirectories.push(workspace);
  const directory = path.join(workspace, "fixture");
  await mkdir(directory);
  execFileSync("git", ["init", directory], { stdio: "ignore" });
  await writeFile(path.join(directory, "checkout.txt"), "baseline", "utf8");
  git(directory, ["add", "."]);
  git(directory, ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@test.local", "commit", "-m", "baseline"]);
  return {
    rootPath: directory,
    commit: git(directory, ["rev-parse", "HEAD"]),
    services: [
      { id: "checkout-service", sourcePath: "src/services/checkout-service.ts" },
      { id: "payment-gateway", sourcePath: "src/services/payment-gateway.ts" },
    ],
    pay17TestPath: "tests/payment-service.pay-17.test.ts",
    browserTestPath: "tests/browser/pay-17.spec.ts",
    commands: { build: "npm run build", health: "npm run test:health", pay17: "npm run test:pay-17", browser: "npm run test:browser" },
  };
}

function plan(): PlanProposal {
  return {
    id: "PLAN-PAY-17-001", runId: "RUN-PAY-17-001", memoryPackId: "PACK-PAY-17",
    summary: "Fix retry identity.", rootCauseHypothesis: "Hypothesis.",
    affectedPaths: ["src/services/checkout-service.ts"],
    allowedCommands: ["npm run build", "npm run test:pay-17"],
    proofContract: [{ requirementId: "PAY-17", assertion: "one logical checkout persists one payment", commands: ["npm run test:pay-17"] }],
    risks: ["Baseline is intentionally defective."],
  };
}

describe("disposable WorktreeRunner", () => {
  it("creates, inspects, and disposes only a detached candidate at the pinned baseline", async () => {
    const repository = await fixture();
    const runner = new WorktreeRunner(repository);
    const candidate = await runner.create("RUN-PAY-17-001", plan());
    try {
      expect(path.basename(candidate.path)).toBe("RUN-PAY-17-001");
      expect(path.basename(path.dirname(candidate.path))).toBe(".foundry-worktrees");
      expect(git(candidate.path, ["rev-parse", "HEAD"])).toBe(repository.commit);
      expect(runner.inspect(candidate)).toEqual({ status: "", diff: "" });
    } finally {
      runner.dispose(candidate);
    }
    await expect(access(candidate.path)).rejects.toThrow();
    expect(git(repository.rootPath, ["rev-parse", "HEAD"])).toBe(repository.commit);
  });

  it("requires an exact command in both the approved plan and policy", async () => {
    const repository = await fixture();
    const approvedPlan = plan();

    expect(() => assertPlanCommandAllowed("npm run test:pay-17", approvedPlan, repository)).not.toThrow();
    expect(() => assertPlanCommandAllowed("npm run test:pay-17; rm -rf /", approvedPlan, repository)).toThrow("not allowed");
    expect(() => assertPlanCommandAllowed("npm run test:browser", approvedPlan, repository)).toThrow("not allowed");
  });

  it("refuses to dispose a path outside the Foundry-owned directory", async () => {
    const repository = await fixture();
    const runner = new WorktreeRunner(repository);
    expect(() => runner.dispose({
      runId: "RUN-PAY-17-001", path: repository.rootPath, repositoryCommit: repository.commit,
      allowedPaths: [], allowedCommands: [],
    })).toThrow("outside the Foundry-owned directory");
  });
});
