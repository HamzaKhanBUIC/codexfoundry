import type { DatabaseSync } from "node:sqlite";
import type { PlanProposal, PlanStatus, RepositoryMap, StoredPlan } from "./models.js";

interface PlanRow {
  id: string;
  run_id: string;
  memory_pack_id: string;
  proposal_json: string;
  status: PlanStatus;
  reviewer_reason: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

const requiredAssertion = "one logical checkout persists one payment";

function now(): string {
  return new Date().toISOString();
}

function fromRow(row: PlanRow): StoredPlan {
  const proposal = JSON.parse(row.proposal_json) as PlanProposal;
  return {
    ...proposal,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    reviewerReason: row.reviewer_reason ?? undefined,
  };
}

function validateProposal(proposal: PlanProposal, repository: RepositoryMap): void {
  if (!proposal.id.trim() || !proposal.summary.trim() || !proposal.rootCauseHypothesis.trim()) {
    throw new Error("Plan requires non-empty id, summary, and root-cause hypothesis.");
  }
  const allowedPaths = new Set([repository.services[0].sourcePath, repository.pay17TestPath, repository.browserTestPath]);
  const allowedCommands = new Set(Object.values(repository.commands));
  if (proposal.affectedPaths.length === 0 || proposal.affectedPaths.some((item) => !allowedPaths.has(item))) {
    throw new Error("Plan contains a path outside the PAY-17 policy boundary.");
  }
  if (proposal.allowedCommands.length === 0 || proposal.allowedCommands.some((item) => !allowedCommands.has(item))) {
    throw new Error("Plan contains a command outside the PAY-17 policy boundary.");
  }
  if (proposal.proofContract.length === 0 || proposal.proofContract.some((proof) =>
    proof.requirementId !== "PAY-17"
    || proof.assertion !== requiredAssertion
    || proof.commands.length === 0
    || proof.commands.some((command) => !allowedCommands.has(command)))) {
    throw new Error("Plan proof contract does not satisfy the PAY-17 policy assertion.");
  }
}

export class PlanRepository {
  constructor(private readonly database: DatabaseSync) {}

  proposeForMemoryCompiledRun(proposal: PlanProposal, repository: RepositoryMap): StoredPlan {
    validateProposal(proposal, repository);
    const run = this.database.prepare("SELECT status, repository_commit FROM runs WHERE id = ?").get(proposal.runId) as { status: string; repository_commit: string } | undefined;
    const pack = this.database.prepare("SELECT id, repository_commit FROM memory_packs WHERE id = ? AND run_id = ?")
      .get(proposal.memoryPackId, proposal.runId) as { id: string; repository_commit: string } | undefined;
    if (!run || !pack) throw new Error("Plan requires its run and persisted Memory Pack.");
    if (run.status !== "memory_compiled") throw new Error(`Run '${proposal.runId}' must be memory_compiled before a plan can be proposed.`);
    if (run.repository_commit !== repository.commit || pack.repository_commit !== repository.commit) {
      throw new Error("Plan repository map must match the run and Memory Pack commit.");
    }

    const createdAt = now();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`INSERT INTO plans (id, run_id, memory_pack_id, proposal_json, status, created_at)
        VALUES (?, ?, ?, ?, 'proposed', ?)`).run(proposal.id, proposal.runId, proposal.memoryPackId, JSON.stringify(proposal), createdAt);
      this.database.prepare("UPDATE runs SET status = 'plan_pending_approval', updated_at = ? WHERE id = ?").run(createdAt, proposal.runId);
      this.database.prepare(`INSERT INTO run_transition_events (run_id, from_status, to_status, actor, reason, created_at)
        VALUES (?, 'memory_compiled', 'plan_pending_approval', 'planner', ?, ?)`)
        .run(proposal.runId, "plan proposal persisted for human approval", createdAt);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.get(proposal.id);
  }

  approve(planId: string, reason: string): StoredPlan {
    return this.review(planId, "approved", reason);
  }

  reject(planId: string, reason: string): StoredPlan {
    return this.review(planId, "rejected", reason);
  }

  get(planId: string): StoredPlan {
    const row = this.database.prepare("SELECT * FROM plans WHERE id = ?").get(planId) as PlanRow | undefined;
    if (!row) throw new Error(`Plan '${planId}' was not found.`);
    return fromRow(row);
  }

  private review(planId: string, status: "approved" | "rejected", reason: string): StoredPlan {
    if (!reason.trim()) throw new Error("Human review requires a non-empty reason.");
    const plan = this.get(planId);
    const run = this.database.prepare("SELECT status FROM runs WHERE id = ?").get(plan.runId) as { status: string } | undefined;
    if (plan.status !== "proposed" || run?.status !== "plan_pending_approval") {
      throw new Error(`Plan '${planId}' is not pending human approval.`);
    }
    const reviewedAt = now();
    const nextRunStatus = status === "approved" ? "implementing" : "stopped";
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`UPDATE plans SET status = ?, reviewer_reason = ?, approved_at = ?, rejected_at = ? WHERE id = ?`)
        .run(status, reason, status === "approved" ? reviewedAt : null, status === "rejected" ? reviewedAt : null, planId);
      this.database.prepare("UPDATE runs SET status = ?, updated_at = ? WHERE id = ?").run(nextRunStatus, reviewedAt, plan.runId);
      this.database.prepare(`INSERT INTO run_transition_events (run_id, from_status, to_status, actor, reason, created_at)
        VALUES (?, 'plan_pending_approval', ?, 'human', ?, ?)`)
        .run(plan.runId, nextRunStatus, reason, reviewedAt);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.get(planId);
  }
}
