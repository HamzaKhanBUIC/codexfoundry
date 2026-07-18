# API Design

## Core endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/runs` | Create a Foundry task run from an issue |
| GET | `/runs/:id` | Read run state, timeline, and evidence |
| POST | `/runs/:id/approve-plan` | Permit implementation after human review |
| POST | `/runs/:id/verify` | Start or repeat verification |
| POST | `/runs/:id/approve-memory` | Commit staged vault changes |
| GET | `/runs/:id/proof-graph` | Return graph nodes/edges for UI |
| POST | `/evaluations/:id/run` | Run saved regression evaluation |

## Key contracts

`MemoryPack` includes `sources`, `inclusionReason`, `estimatedTokens`, `confidence`, and `staleness`.

`Proof` includes `requirementId`, `assertion`, `testCommand`, `beforeResult`, `afterResult`, and artifact references.
