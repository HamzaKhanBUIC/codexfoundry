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
