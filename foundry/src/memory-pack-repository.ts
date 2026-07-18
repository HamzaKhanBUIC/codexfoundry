import type { DatabaseSync } from "node:sqlite";
import type {
  StoredMemoryPack,
  StoredMemoryPackOmission,
  StoredMemoryPackSource,
} from "./models.js";

interface MemoryPackRow {
  id: string;
  run_id: string;
  task_id: "PAY-17";
  repository_commit: string;
  rendered_payload: string;
  payload_sha256: string;
  estimated_tokens: number;
  token_budget: number;
  confidence_score: number;
  sources_json: string;
  omitted_sources_json: string;
  generated_at: string;
  created_at: string;
}

export interface CreateStoredMemoryPackInput extends Omit<StoredMemoryPack, "createdAt"> {}

function now(): string {
  return new Date().toISOString();
}

function fromRow(row: MemoryPackRow): StoredMemoryPack {
  return {
    id: row.id,
    runId: row.run_id,
    taskId: row.task_id,
    repositoryCommit: row.repository_commit,
    renderedPayload: row.rendered_payload,
    payloadSha256: row.payload_sha256,
    estimatedTokens: row.estimated_tokens,
    tokenBudget: row.token_budget,
    confidenceScore: row.confidence_score,
    sources: JSON.parse(row.sources_json) as StoredMemoryPackSource[],
    omittedSources: JSON.parse(row.omitted_sources_json) as StoredMemoryPackOmission[],
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}

/**
 * Persists one trusted context artifact and records its state transition in the
 * same SQLite transaction. It accepts only an intake-state run.
 */
export class MemoryPackRepository {
  constructor(private readonly database: DatabaseSync) {}

  saveForIntakeRun(input: CreateStoredMemoryPackInput): StoredMemoryPack {
    const run = this.database.prepare("SELECT status, repository_commit FROM runs WHERE id = ?")
      .get(input.runId) as { status: string; repository_commit: string } | undefined;
    if (!run) {
      throw new Error(`Run '${input.runId}' was not found.`);
    }
    if (run.status !== "intake") {
      throw new Error(`Run '${input.runId}' must be in intake before a Memory Pack can be persisted.`);
    }
    if (run.repository_commit !== input.repositoryCommit) {
      throw new Error(`Memory Pack commit must match run '${input.runId}' repository commit.`);
    }
    if (input.estimatedTokens > input.tokenBudget) {
      throw new Error("Memory Pack exceeds its declared token budget.");
    }

    const createdAt = now();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        INSERT INTO memory_packs (
          id, run_id, task_id, repository_commit, rendered_payload, payload_sha256,
          estimated_tokens, token_budget, confidence_score, sources_json,
          omitted_sources_json, generated_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.runId,
        input.taskId,
        input.repositoryCommit,
        input.renderedPayload,
        input.payloadSha256,
        input.estimatedTokens,
        input.tokenBudget,
        input.confidenceScore,
        JSON.stringify(input.sources),
        JSON.stringify(input.omittedSources),
        input.generatedAt,
        createdAt,
      );
      this.database.prepare(`
        UPDATE runs SET status = 'memory_compiled', updated_at = ? WHERE id = ?
      `).run(createdAt, input.runId);
      this.database.prepare(`
        INSERT INTO run_transition_events (run_id, from_status, to_status, actor, reason, created_at)
        VALUES (?, 'intake', 'memory_compiled', 'system', ?, ?)
      `).run(input.runId, "trusted Memory Pack persisted", createdAt);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.getForRun(input.runId);
  }

  getForRun(runId: string): StoredMemoryPack {
    const row = this.database.prepare("SELECT * FROM memory_packs WHERE run_id = ?").get(runId) as MemoryPackRow | undefined;
    if (!row) {
      throw new Error(`Memory Pack for run '${runId}' was not found.`);
    }
    return fromRow(row);
  }
}
