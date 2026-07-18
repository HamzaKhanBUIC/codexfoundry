import { DatabaseSync } from "node:sqlite";

const schema = `
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  issue_json TEXT NOT NULL,
  repository_commit TEXT NOT NULL,
  status TEXT NOT NULL,
  correction_attempts INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS run_transition_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES runs(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS run_transition_events_run_id_idx
  ON run_transition_events(run_id, id);

CREATE TABLE IF NOT EXISTS memory_packs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE REFERENCES runs(id),
  task_id TEXT NOT NULL,
  repository_commit TEXT NOT NULL,
  rendered_payload TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  estimated_tokens INTEGER NOT NULL,
  token_budget INTEGER NOT NULL,
  confidence_score REAL NOT NULL,
  sources_json TEXT NOT NULL,
  omitted_sources_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS memory_packs_run_id_idx
  ON memory_packs(run_id);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE REFERENCES runs(id),
  memory_pack_id TEXT NOT NULL REFERENCES memory_packs(id),
  proposal_json TEXT NOT NULL,
  status TEXT NOT NULL,
  reviewer_reason TEXT,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  rejected_at TEXT
);

CREATE INDEX IF NOT EXISTS plans_run_id_idx ON plans(run_id);
`;

export function openFoundryDatabase(databasePath: string): DatabaseSync {
  const database = new DatabaseSync(databasePath);
  database.exec(schema);
  return database;
}
