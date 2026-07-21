import path from "node:path";
import { CodexGenericImplementer, CodexGenericPlanner, type GenericImplementationReport, type GenericPlanningContext } from "./generic-codex-agents.js";
import { stageGenericMemory, writeApprovedGenericMemory } from "./generic-memory.js";
import { approveGenericPlan, type ApprovedGenericPlan, type GenericExecutionPolicy, type GenericHumanApproval, type GenericPlanProposal, type GenericTask } from "./generic-policy.js";
import { GenericRunStore, type GenericMemoryPackReference, type GenericRunRecord } from "./generic-run-store.js";
import { GenericVerifier, type GenericRegressionReplay, type RegressionMutation } from "./generic-verifier.js";
import { GenericWorktreeRunner, type GenericImplementationWorktree } from "./generic-worktree-runner.js";

export interface GenericPlanner { propose(runId: string, planId: string, task: GenericTask, policy: GenericExecutionPolicy, context: GenericPlanningContext): Promise<GenericPlanProposal>; }
export interface GenericImplementer { implement(plan: ApprovedGenericPlan, policy: GenericExecutionPolicy, worktree: GenericImplementationWorktree): Promise<GenericImplementationReport>; }

export interface GenericWorkflowOptions { store: GenericRunStore; stageRoot: string; planner?: GenericPlanner; implementer?: GenericImplementer; }

/**
 * Coordinates a generic run but deliberately pauses at both human gates. It
 * owns no merge, deployment, or production capability; candidates stay local
 * and disposable until the caller disposes them.
 */
export class GenericFoundryWorkflow {
  private readonly planner: GenericPlanner;
  private readonly implementer: GenericImplementer;
  private readonly candidates = new Map<string, { runner: GenericWorktreeRunner; worktree: GenericImplementationWorktree }>();

  constructor(private readonly options: GenericWorkflowOptions) {
    this.planner = options.planner ?? new CodexGenericPlanner();
    this.implementer = options.implementer ?? new CodexGenericImplementer();
  }

  async begin(input: { runId: string; task: GenericTask; policy: GenericExecutionPolicy; memoryPack: GenericMemoryPackReference }): Promise<GenericRunRecord> {
    await this.options.store.create({ id: input.runId, task: input.task, policy: input.policy, memoryPack: input.memoryPack });
    return this.options.store.recordMemoryCompiled(input.runId);
  }

  async proposePlan(runId: string, planId: string, context: GenericPlanningContext): Promise<GenericRunRecord> {
    const run = await this.options.store.get(runId);
    if (run.status !== "memory_compiled") throw new Error("Planning requires a run with a recorded Memory Pack.");
    try {
      const proposal = await this.planner.propose(runId, planId, run.task, run.policy, context);
      return this.options.store.recordProposedPlan(runId, proposal);
    } catch (error) {
      return this.options.store.recordFailure(runId, "plan", "codex_planner", error instanceof Error ? error.message : "Codex planner failed without a readable error.");
    }
  }

  async approvePlanAndCreateCandidate(runId: string, approval: GenericHumanApproval): Promise<{ run: GenericRunRecord; worktree?: GenericImplementationWorktree }> {
    const run = await this.options.store.get(runId);
    if (!run.proposedPlan) throw new Error("Human approval requires a stored plan proposal.");
    const approved = approveGenericPlan(run.proposedPlan, run.policy, approval);
    const updated = await this.options.store.approvePlan(runId, approved);
    const runner = new GenericWorktreeRunner(updated.policy);
    try {
      const worktree = await runner.create(runId, approved);
      this.candidates.set(runId, { runner, worktree });
      return { run: updated, worktree };
    } catch (error) {
      return { run: await this.options.store.recordFailure(runId, "worktree", "system", error instanceof Error ? error.message : "Candidate worktree creation failed.") };
    }
  }

  async implementAndVerify(runId: string): Promise<GenericRunRecord> {
    const run = await this.options.store.get(runId);
    const candidate = this.candidates.get(runId);
    if (!run.approvedPlan || !candidate) throw new Error("Implementation requires this process to own an approved disposable candidate worktree.");
    try {
      const report = await this.implementer.implement(run.approvedPlan, run.policy, candidate.worktree);
      await this.options.store.recordImplementation(runId, report);
      const verification = await new GenericVerifier(run.policy).verify(runId, run.approvedPlan, candidate.worktree, candidate.runner);
      return this.options.store.recordVerification(runId, verification);
    } catch (error) {
      return this.options.store.recordFailure(runId, "implementation", "codex_implementer", error instanceof Error ? error.message : "Codex implementation stage failed without a readable error.");
    }
  }

  async approvePatchAndStageMemory(runId: string, approval: GenericHumanApproval): Promise<GenericRunRecord> {
    const reviewed = await this.options.store.approvePatch(runId, approval);
    const staged = await stageGenericMemory(reviewed, path.join(this.options.stageRoot, runId));
    return this.options.store.stageMemory(runId, staged);
  }

  async approveVaultAndWriteMemory(runId: string, approval: GenericHumanApproval, vaultDirectory: string): Promise<{ run: GenericRunRecord; writtenPaths: string[] }> {
    const run = await this.options.store.get(runId);
    const writtenPaths = await writeApprovedGenericMemory(run, vaultDirectory, approval);
    const complete = await this.options.store.approveVault(runId, approval);
    return { run: complete, writtenPaths };
  }

  async replayRegression(runId: string, mutation: RegressionMutation): Promise<GenericRunRecord> {
    const run = await this.options.store.get(runId);
    const candidate = this.candidates.get(runId);
    if (!run.approvedPlan || !candidate) throw new Error("Regression replay requires the owned approved candidate worktree.");
    const replay: GenericRegressionReplay = await new GenericVerifier(run.policy).replayRegression(runId, run.approvedPlan, candidate.worktree, candidate.runner, mutation);
    return this.options.store.recordRegression(runId, replay);
  }

  disposeCandidate(runId: string): void { const candidate = this.candidates.get(runId); if (!candidate) return; candidate.runner.dispose(candidate.worktree); this.candidates.delete(runId); }
}
