# Codex Foundry Core

`foundry/` owns the local, strict TypeScript core for two deliberately separate
contracts:

1. the immutable, evidence-projected PAY-17 reference workflow; and
2. policy-bound generic local-run primitives for a caller that supplies a
   task, pinned baseline, approved paths, and direct commands.

It has no production, merge, deploy, arbitrary-file, or dashboard action
authority.

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
- Read-only Repository Intelligence: bounded filesystem/Git inspection,
  evidence-backed static findings, explicit unknowns, and optional advisory
  Codex semantic specialists.
- Generic-run policy, disposable worktree, verifier, run-store, staged memory,
  and exact Codex-receipt primitives. These are library-level workflow
  components; the local API exposes persisted generic-run evidence but no
  endpoint that starts or approves a run.

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

## Read-only API

Every API route accepts `GET` only. It has no action endpoint.

| Route | Purpose |
|---|---|
| `/api/health` | Loopback health check. |
| `/api/runs/RUN-PAY-17-001` | Validated PAY-17 projection. Fails closed if required evidence is incomplete or contradictory. |
| `/api/repository-analysis?path=<absolute-local-git-path>` | Bounded static repository report. The target repository is not executed. |
| `/api/engineering-pipeline?path=<absolute-local-git-path>&codex=true|false` | Repository Intelligence pipeline. `codex=true` opts into advisory, citation-checked read-only semantic specialists. |
| `/api/generic-runs/<run-id>` | Reads a previously persisted generic-run record; it cannot create or advance one. |

Unknown routes return `404`; non-GET requests return `405`.

See [intake/plan evidence](../architecture/intake-plan-evidence.md),
[projection contract](../architecture/run-evidence-projection.md), and
[manual QA](../release/MANUAL_QA_GUIDE.md).
