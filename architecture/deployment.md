# Deployment Design

## Build Week topology

- One local developer machine or disposable cloud environment.
- Web UI and orchestration service run locally.
- Demo repository is cloned into a parent workspace; each task creates a disposable Git worktree.
- Obsidian vault is a sibling directory mounted read-only until memory approval.
- SQLite and filesystem artifacts persist only locally for the demo.

## Judge experience

Provide a one-command local setup, seeded scenario, and a recorded demo. If a hosted demo is added, it must use fixture data only and never expose credentials or unrestricted shell execution.
