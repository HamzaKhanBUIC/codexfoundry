import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenericImplementationReport } from "./generic-codex-agents.js";
import type { ApprovedGenericPlan, GenericExecutionPolicy, GenericHumanApproval, GenericPlanProposal, GenericTask } from "./generic-policy.js";
import type { GenericRegressionReplay, GenericVerificationReport } from "./generic-verifier.js";

export type GenericRunStatus = "intake" | "memory_compiled" | "plan_pending_approval" | "implementing" | "verifying" | "review_pending" | "memory_pending_approval" | "complete" | "stopped" | "failed";
export type GenericEvidenceAuthority = "system" | "codex_planner" | "codex_implementer" | "independent_verifier" | "human";

export interface GenericRunEvent { stage: string; status: GenericRunStatus; authority: GenericEvidenceAuthority; recordedAt: string; summary: string; }
export interface GenericMemoryPackReference { id: string; available: boolean; selectedIds: string[]; omittedIds: string[]; limitations: string[]; }
export interface GenericStagedMemory { artifactIds: string[]; stageDirectory: string; stagedAt: string; }
export interface GenericRunRecord {
  id: string; status: GenericRunStatus; repositoryRoot: string; baselineCommit: string; task: GenericTask; policy: GenericExecutionPolicy; memoryPack: GenericMemoryPackReference;
  proposedPlan?: GenericPlanProposal; approvedPlan?: ApprovedGenericPlan; implementation?: GenericImplementationReport; verification?: GenericVerificationReport; patchApproval?: GenericHumanApproval; vaultApproval?: GenericHumanApproval; regression?: GenericRegressionReplay; stagedMemory?: GenericStagedMemory;
  events: GenericRunEvent[]; createdAt: string; updatedAt: string; failureReason?: string;
}

function now(): string { return new Date().toISOString(); }
function requireStatus(run: GenericRunRecord, expected: GenericRunStatus): void { if (run.status !== expected) throw new Error("Run '" + run.id + "' must be " + expected + ", not " + run.status + "."); }
function approval(value: GenericHumanApproval, stage: string): GenericHumanApproval { if (!value.actor.trim() || !value.reason.trim() || Number.isNaN(Date.parse(value.approvedAt))) throw new Error(stage + " requires a human actor, ISO timestamp, and reason."); return { actor: value.actor.trim(), approvedAt: value.approvedAt, reason: value.reason.trim() }; }

/** Durable, human-readable local run state; target repositories are never used as its storage. */
export class GenericRunStore {
  constructor(private readonly directory: string) {}

  async create(input: { id: string; task: GenericTask; policy: GenericExecutionPolicy; memoryPack: GenericMemoryPackReference }): Promise<GenericRunRecord> {
    if (!/^[A-Z][A-Z0-9-]{2,80}$/.test(input.id)) throw new Error("Generic run id must be uppercase letters, digits, and hyphens.");
    const timestamp = now();
    const record: GenericRunRecord = { id: input.id, status: "intake", repositoryRoot: input.policy.repositoryRoot, baselineCommit: input.policy.baselineCommit, task: input.task, policy: input.policy, memoryPack: input.memoryPack, events: [{ stage: "intake", status: "intake", authority: "system", recordedAt: timestamp, summary: "Task intake recorded; task description remains untrusted." }], createdAt: timestamp, updatedAt: timestamp };
    await this.write(record, true);
    return record;
  }

  async get(runId: string): Promise<GenericRunRecord> { return JSON.parse(await readFile(this.file(runId), "utf8")) as GenericRunRecord; }

  async recordMemoryCompiled(runId: string): Promise<GenericRunRecord> { return this.transition(runId, "intake", "memory_compiled", "system", "Memory Pack reference persisted for bounded planning."); }
  async recordProposedPlan(runId: string, proposedPlan: GenericPlanProposal): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "memory_compiled"); if (proposedPlan.runId !== runId) throw new Error("Proposed plan run id mismatch."); return this.save({ ...run, status: "plan_pending_approval", proposedPlan, events: [...run.events, event("plan", "plan_pending_approval", "codex_planner", "Non-authoritative bounded plan proposal recorded.")] }); }
  async approvePlan(runId: string, approvedPlan: ApprovedGenericPlan): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "plan_pending_approval"); if (approvedPlan.runId !== runId || approvedPlan.id !== run.proposedPlan?.id) throw new Error("Approved plan does not match the stored proposal."); return this.save({ ...run, status: "implementing", approvedPlan, events: [...run.events, event("plan_approval", "implementing", "human", "Human plan approval recorded.")] }); }
  async recordImplementation(runId: string, report: GenericImplementationReport): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "implementing"); if (report.runId !== runId || report.planId !== run.approvedPlan?.id) throw new Error("Implementation report linkage is invalid."); return this.save({ ...run, status: "verifying", implementation: report, events: [...run.events, event("implementation", "verifying", "codex_implementer", "Non-authoritative Codex implementation report recorded.")] }); }
  async recordVerification(runId: string, verification: GenericVerificationReport): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "verifying"); if (verification.runId !== runId || verification.baselineCommit !== run.baselineCommit) throw new Error("Verifier evidence linkage is invalid."); if (!verification.passed) return this.save({ ...run, status: "failed", verification, failureReason: verification.failureReason ?? "Independent verification failed.", events: [...run.events, event("verification", "failed", "independent_verifier", "Verifier did not prove the candidate.")] }); return this.save({ ...run, status: "review_pending", verification, events: [...run.events, event("verification", "review_pending", "independent_verifier", "Independent verifier proved the approved commands.")] }); }
  async approvePatch(runId: string, value: GenericHumanApproval): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "review_pending"); return this.save({ ...run, status: "memory_pending_approval", patchApproval: approval(value, "Patch approval"), events: [...run.events, event("patch_approval", "memory_pending_approval", "human", "Human patch approval recorded; no merge or deployment is authorized.")] }); }
  async stageMemory(runId: string, stagedMemory: GenericStagedMemory): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "memory_pending_approval"); if (stagedMemory.artifactIds.length === 0 || !stagedMemory.stageDirectory || Number.isNaN(Date.parse(stagedMemory.stagedAt))) throw new Error("Staged memory must reference non-empty artifacts and a timestamp."); return this.save({ ...run, stagedMemory, events: [...run.events, event("memory_staged", "memory_pending_approval", "system", "Markdown engineering memory staged; vault remains unchanged pending separate approval.")] }); }
  async approveVault(runId: string, value: GenericHumanApproval): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, "memory_pending_approval"); if (!run.stagedMemory) throw new Error("Vault approval requires staged Markdown memory."); return this.save({ ...run, status: "complete", vaultApproval: approval(value, "Vault approval"), events: [...run.events, event("vault_approval", "complete", "human", "Separate human vault approval recorded.")] }); }
  async recordRegression(runId: string, regression: GenericRegressionReplay): Promise<GenericRunRecord> { const run = await this.get(runId); if (!run.verification?.passed || regression.runId !== runId) throw new Error("Regression evidence requires a previously verified run."); return this.save({ ...run, regression, events: [...run.events, event("regression_replay", run.status, "independent_verifier", "Regression replay recorded: " + regression.status + ".")] }); }
  /** Preserve an operational failure as evidence instead of silently losing the run context. */
  async recordFailure(runId: string, stage: string, authority: GenericEvidenceAuthority, reason: string): Promise<GenericRunRecord> {
    const run = await this.get(runId);
    if (run.status === "complete") throw new Error("A completed run cannot be replaced with a failure record.");
    return this.save({ ...run, status: "failed", failureReason: reason, events: [...run.events, event(stage, "failed", authority, "Stage failed: " + reason)] });
  }

  private async transition(runId: string, expected: GenericRunStatus, next: GenericRunStatus, authority: GenericEvidenceAuthority, summary: string): Promise<GenericRunRecord> { const run = await this.get(runId); requireStatus(run, expected); return this.save({ ...run, status: next, events: [...run.events, event(next, next, authority, summary)] }); }
  private file(runId: string): string { if (!/^[A-Z][A-Z0-9-]{2,80}$/.test(runId)) throw new Error("Invalid generic run id."); return path.join(this.directory, runId + ".json"); }
  private async write(record: GenericRunRecord, exclusive = false): Promise<void> { await mkdir(this.directory, { recursive: true }); const file = this.file(record.id); const payload = JSON.stringify(record, null, 2) + "\n"; if (exclusive) { await writeFile(file, payload, { encoding: "utf8", flag: "wx" }); return; } const temporary = file + ".tmp"; await writeFile(temporary, payload, "utf8"); await rename(temporary, file); }
  private async save(record: GenericRunRecord): Promise<GenericRunRecord> { const next = { ...record, updatedAt: now() }; await this.write(next); return next; }
}

function event(stage: string, status: GenericRunStatus, authority: GenericEvidenceAuthority, summary: string): GenericRunEvent { return { stage, status, authority, recordedAt: now(), summary }; }
