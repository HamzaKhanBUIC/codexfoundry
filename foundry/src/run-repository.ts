import type { DatabaseSync } from "node:sqlite";
import type {
  CreateRunInput,
  FoundryRun,
  RunActor,
  RunRecord,
  RunStatus,
  RunTransitionEvent,
} from "./models.js";
import { assertTransition } from "./state-machine.js";

const MAX_CORRECTION_ATTEMPTS = 1;

interface RunRow {
  id: string;
  issue_json: string;
  repository_commit: string;
  status: RunStatus;
  correction_attempts: number;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  id: number;
  run_id: string;
  from_status: RunStatus | null;
  to_status: RunStatus;
  actor: RunActor;
  reason: string | null;
  created_at: string;
}

function now(): string {
  return new Date().toISOString();
}

function runFromRow(row: RunRow): FoundryRun {
  return {
    id: row.id,
    issue: JSON.parse(row.issue_json) as CreateRunInput["issue"],
    repositoryCommit: row.repository_commit,
    status: row.status,
    correctionAttempts: row.correction_attempts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    failureReason: row.failure_reason ?? undefined,
  };
}

function eventFromRow(row: EventRow): RunTransitionEvent {
  return {
    id: row.id,
    runId: row.run_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actor: row.actor,
    reason: row.reason ?? undefined,
    createdAt: row.created_at,
  };
}

function validateCreateRun(input: CreateRunInput): void {
  if (!input.id.trim()) {
    throw new Error("Run id must be non-empty.");
  }
  if (!input.issue.title.trim()) {
    throw new Error("Issue title must be non-empty.");
  }
  if (!input.repositoryCommit.trim()) {
    throw new Error("Repository commit must be non-empty.");
  }
}

export class RunRepository {
  constructor(private readonly database: DatabaseSync) {}

  create(input: CreateRunInput): RunRecord {
    validateCreateRun(input);
    const createdAt = now();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        INSERT INTO runs (id, issue_json, repository_commit, status, correction_attempts, created_at, updated_at)
        VALUES (?, ?, ?, 'intake', 0, ?, ?)
      `).run(input.id, JSON.stringify(input.issue), input.repositoryCommit, createdAt, createdAt);
      this.database.prepare(`
        INSERT INTO run_transition_events (run_id, from_status, to_status, actor, created_at)
        VALUES (?, NULL, 'intake', 'system', ?)
      `).run(input.id, createdAt);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.get(input.id);
  }

  get(runId: string): RunRecord {
    const row = this.database.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as RunRow | undefined;
    if (!row) {
      throw new Error(`Run '${runId}' was not found.`);
    }
    const rawEvents: unknown = this.database.prepare("SELECT * FROM run_transition_events WHERE run_id = ? ORDER BY id").all(runId);
    const events = rawEvents as EventRow[];
    return { ...runFromRow(row), events: events.map(eventFromRow) };
  }

  transition(runId: string, toStatus: RunStatus, actor: RunActor, reason?: string): RunRecord {
    const run = this.get(runId);
    assertTransition(run.status, toStatus);
    if (run.status === "verifying" && toStatus === "implementing" && run.correctionAttempts >= MAX_CORRECTION_ATTEMPTS) {
      throw new Error(`Run '${runId}' has exhausted its ${MAX_CORRECTION_ATTEMPTS} corrective implementation loop.`);
    }

    const updatedAt = now();
    const correctionAttempts = run.correctionAttempts + (run.status === "verifying" && toStatus === "implementing" ? 1 : 0);
    const failureReason = toStatus === "failed" ? reason ?? "Verification or implementation failed." : undefined;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        UPDATE runs
        SET status = ?, correction_attempts = ?, failure_reason = ?, updated_at = ?
        WHERE id = ?
      `).run(toStatus, correctionAttempts, failureReason ?? null, updatedAt, runId);
      this.database.prepare(`
        INSERT INTO run_transition_events (run_id, from_status, to_status, actor, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(runId, run.status, toStatus, actor, reason ?? null, updatedAt);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.get(runId);
  }
}
