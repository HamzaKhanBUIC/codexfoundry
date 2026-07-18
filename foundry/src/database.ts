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
`;

export function openFoundryDatabase(databasePath: string): DatabaseSync {
  const database = new DatabaseSync(databasePath);
  database.exec(schema);
  return database;
}
