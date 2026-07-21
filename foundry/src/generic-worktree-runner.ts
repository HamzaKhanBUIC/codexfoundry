import { execFileSync } from "node:child_process";
import { access, mkdir, realpath } from "node:fs/promises";
import path from "node:path";
import type { ApprovedGenericPlan, GenericExecutionPolicy } from "./generic-policy.js";
import { validateGenericPolicy } from "./generic-policy.js";

export interface GenericImplementationWorktree {
  runId: string;
  path: string;
  repositoryRoot: string;
  baselineCommit: string;
  allowedPaths: string[];
  commandIds: string[];
}

function git(repositoryPath: string, args: string[]): string {
  return execFileSync("git", ["-C", repositoryPath, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function assertRunId(runId: string): void {
  if (!/^[A-Z][A-Z0-9-]{2,80}$/.test(runId)) throw new Error("Generic worktree run id must be uppercase letters, digits, and hyphens.");
}

/**
 * Owns only a candidate worktree rooted beside the source repository. It
 * never changes the baseline, merges, pushes, or executes project commands.
 */
export class GenericWorktreeRunner {
  private readonly ownedPaths = new Set<string>();
  private readonly ownedWorktrees = new Map<string, GenericImplementationWorktree>();
  private readonly policy: GenericExecutionPolicy;

  constructor(policy: GenericExecutionPolicy) {
    this.policy = validateGenericPolicy(policy);
  }

  async create(runId: string, plan: ApprovedGenericPlan): Promise<GenericImplementationWorktree> {
    assertRunId(runId);
    const policy = this.policy;
    if (plan.runId !== runId) throw new Error("Approved plan run id does not match the requested worktree.");
    const root = await realpath(policy.repositoryRoot);
    if (git(root, ["rev-parse", "HEAD"]) !== policy.baselineCommit) throw new Error("Repository HEAD does not match the policy baseline commit.");
    if (git(root, ["status", "--porcelain"]) !== "") throw new Error("Repository baseline must be clean before Foundry creates a candidate worktree.");
    const parent = path.join(path.dirname(root), policy.worktreeDirectoryName ?? ".foundry-worktrees");
    const target = path.join(parent, runId);
    await mkdir(parent, { recursive: true });
    try { await access(target); throw new Error("Candidate worktree target already exists."); } catch (error) {
      if (!(error instanceof Error) || !/ENOENT/.test(error.message)) throw error;
    }
    git(root, ["worktree", "add", "--detach", target, policy.baselineCommit]);
    const worktree = { runId, path: target, repositoryRoot: root, baselineCommit: policy.baselineCommit, allowedPaths: [...plan.affectedPaths], commandIds: [...plan.commandIds] };
    this.ownedPaths.add(path.resolve(target));
    this.ownedWorktrees.set(path.resolve(target), worktree);
    return worktree;
  }

  changedPaths(worktree: GenericImplementationWorktree): string[] {
    this.assertOwned(worktree);
    const output = git(worktree.path, ["diff", "--name-only", "--no-renames", worktree.baselineCommit]);
    return output ? output.split(/\r?\n/).filter(Boolean).map((item) => item.replace(/\\/g, "/")) : [];
  }

  inspect(worktree: GenericImplementationWorktree): { status: string; diff: string; changedPaths: string[] } {
    this.assertOwned(worktree);
    return { status: git(worktree.path, ["status", "--short"]), diff: git(worktree.path, ["diff", "--stat", worktree.baselineCommit]), changedPaths: this.changedPaths(worktree) };
  }

  dispose(worktree: GenericImplementationWorktree): void {
    this.assertOwned(worktree);
    git(worktree.repositoryRoot, ["worktree", "remove", "--force", worktree.path]);
    this.ownedPaths.delete(path.resolve(worktree.path));
    this.ownedWorktrees.delete(path.resolve(worktree.path));
  }

  private assertOwned(worktree: GenericImplementationWorktree): void {
    const target = path.resolve(worktree.path);
    const owned = this.ownedWorktrees.get(target);
    if (!this.ownedPaths.has(target) || !owned || path.dirname(target) !== path.resolve(path.dirname(owned.repositoryRoot), this.policy.worktreeDirectoryName ?? ".foundry-worktrees")) {
      throw new Error("Refusing to operate on a worktree outside the Foundry-owned directory.");
    }
    if (worktree.baselineCommit !== owned.baselineCommit || worktree.repositoryRoot !== owned.repositoryRoot || worktree.runId !== owned.runId) {
      throw new Error("Worktree does not match the approved repository policy.");
    }
  }
}
