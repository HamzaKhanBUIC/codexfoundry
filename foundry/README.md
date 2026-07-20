# Codex Foundry Core

`foundry/` owns the local, strict TypeScript implementation of the PAY-17
workflow policy and evidence projection. It is not a generic orchestration
service and has no production, merge, deploy, or arbitrary-file authority.

## Run and validate

```powershell
cd foundry
npm test
npm run build
npm run serve
```

The read-only server listens on `127.0.0.1:4174`.

## Responsibilities

- Node 24 SQLite run state, append-only transitions, and bounded correction
  loop.
- PAY-17 issue intake and frozen repository-map validation.
- Persisted, hashable baseline Memory Pack input.
- Exact-JSON planner proposal parsing, policy validation, and human plan
  approval before implementation.
- Disposable candidate worktree policy and bounded Codex implementer report.
- Recorded implementation, independent verifier, human patch approval, vault
  approval, and regression-replay evidence.
- One evidence projection consumed by the dashboard and local API.

## Current evidence contract

`RUN-PAY-17-001` requires run-linked intake, approved-plan, implementation,
verifier, patch-approval, vault-write, regression-replay, and post-repair
Memory Pack artifacts. The projection verifies run linkage, authority,
commands, candidate scope, approvals, replay consistency, Memory Pack bounds,
and interactive inspector coverage.

It fails closed:

- Missing or malformed required stage evidence: `Evidence incomplete` and API
  `503 {"error":"evidence_incomplete"}`.
- Contradictory same-run regression claims: `Evidence contradiction` and API
  `503 {"error":"evidence_contradiction"}`.

The fixed API exposes only:

- `GET /api/health`
- `GET /api/runs/RUN-PAY-17-001`

All other paths return `404`; non-GET requests return `405`.

See [intake/plan evidence](../architecture/intake-plan-evidence.md),
[projection contract](../architecture/run-evidence-projection.md), and
[manual QA](../release/MANUAL_QA_GUIDE.md).
