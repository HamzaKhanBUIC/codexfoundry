# Data Model

Use SQLite for the Build Week application state. The Obsidian vault remains the source of truth for durable engineering memory.

## Tables

- `runs`: task state, issue payload, timestamps.
- `memory_packs`: source selection, token estimates, approval state.
- `plans`: structured plan and risk review.
- `evidence`: command outputs, test status, screenshots, commit references.
- `vault_proposals`: staged Markdown content and approval state.
- `evaluations`: saved regression command, fixture, expected result.

Never store API keys, raw secrets, or unrestricted repository contents in the database.

## Gate 1 foundation

The local `foundry/` package uses Node's built-in `node:sqlite` driver. Its
first migration creates `runs` and append-only `run_transition_events`; later
tables must be added through explicit migrations. The database stores a
repository commit, structured issue metadata, state transitions, timestamps,
and failure reason only. It does not store vault bodies, credentials, or raw
repository contents.

Repository-map output is derived from the frozen fixture at run time and is
not persisted as raw source content. Later run records may store its baseline
commit and selected path identifiers only.
