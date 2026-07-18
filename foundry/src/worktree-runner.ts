import { execFileSync } from "node:child_process";
import { access, mkdir, realpath } from "node:fs/promises";
import path from "node:path";
import type { PlanProposal, RepositoryMap } from "./models.js";

const worktreeDirectoryName = ".foundry-worktrees";

export interface ImplementationWorktree {
  runId: string;
  path: string;
  repositoryCommit: string;
  allowedPaths: string[];
  allowedCommands: string[];
}

function git(repositoryPath: string, args: string[]): string {
  return execFileSync("git", ["-C", repositoryPath, ...args], { encoding: "utf8" }).trim();
}

function validateRunId(runId: string): void {
  if (!/^[A-Z0-9-]+$/.test(runId)) {
    throw new Error("Worktree run id must contain only uppercase letters, digits, and hyphens.");
  }
}

function allowedPaths(repository: RepositoryMap): string[] {
  return [repository.services[0].sourcePath, repository.pay17TestPath, repository.browserTestPath];
}

export function assertPlanCommandAllowed(command: string, plan: PlanProposal, repository: RepositoryMap): void {
  const policyCommands = new Set(Object.values(repository.commands));
  if (!plan.allowedCommands.includes(command) || !policyCommands.has(command)) {
    throw new Error(`Command '${command}' is not allowed by the approved PAY-17 plan and policy.`);
  }
}

/**
 * Owns only disposable Git worktrees under a fixed sibling directory. It never
 * executes a plan command, edits a candidate, merges, pushes, or deletes the
 * frozen repository.
 */
export class WorktreeRunner {
  private readonly ownedPaths = new Set<string>();

  constructor(private readonly repository: RepositoryMap) {}

  async create(runId: string, plan: PlanProposal): Promise<ImplementationWorktree> {
    validateRunId(runId);
    if (plan.runId !== runId) throw new Error("Approved plan run id does not match the requested worktree.");
    const root = await realpath(this.repository.rootPath);
    const parent = path.join(path.dirname(root), worktreeDirectoryName);
    const target = path.join(parent, runId);
    await mkdir(parent, { recursive: true });
    try {
      await access(target);
      throw new Error(`Worktree target '${target}' already exists.`);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("ENOENT")) throw error;
    }
    git(root, ["worktree", "add", "--detach", target, this.repository.commit]);
    this.ownedPaths.add(path.resolve(target));
    return {
      runId,
      path: target,
      repositoryCommit: this.repository.commit,
      allowedPaths: allowedPaths(this.repository),
      allowedCommands: [...plan.allowedCommands],
    };
  }

  inspect(worktree: ImplementationWorktree): { status: string; diff: string } {
    this.assertOwned(worktree);
    return {
      status: git(worktree.path, ["status", "--short"]),
      diff: git(worktree.path, ["diff", "--stat"]),
    };
  }

  dispose(worktree: ImplementationWorktree): void {
    this.assertOwned(worktree);
    git(this.repository.rootPath, ["worktree", "remove", "--force", worktree.path]);
  }

  private assertOwned(worktree: ImplementationWorktree): void {
    const target = path.resolve(worktree.path);
    if (!this.ownedPaths.has(target) || path.basename(target) !== worktree.runId) {
      throw new Error("Refusing to operate on a worktree outside the Foundry-owned directory.");
    }
    if (worktree.repositoryCommit !== this.repository.commit) {
      throw new Error("Worktree commit does not match the validated repository baseline.");
    }
  }
}
