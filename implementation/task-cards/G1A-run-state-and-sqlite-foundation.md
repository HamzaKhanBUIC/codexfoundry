# G1A — Run State and SQLite Foundation

- **Gate:** Gate 1 — Foundry core foundation
- **Status:** Ready for review
- **Objective:** Create the local, durable state-machine foundation for one
  PAY-17 Foundry run without implementing intake UI, Memory Pack integration,
  planning, Codex execution, verification, or vault write-back.

## In scope

- New standalone `foundry/` TypeScript package
- Built-in Node `node:sqlite` database, migrations, run repository, and run
  transition policy
- Unit/integration tests for persistence and valid/invalid state transitions
- Documentation and this task card where the public contract changes

## State contract

`intake → memory_compiled → plan_pending_approval → implementing → verifying
→ review_pending → memory_pending_approval → complete`

- `plan_pending_approval → stopped` is a human rejection/clarification exit.
- `implementing → failed` and `verifying → failed` retain evidence for later
  review.
- `verifying → implementing` is permitted once for one bounded correction loop.
- `review_pending → complete_without_writeback` preserves verified work when a
  human declines durable memory.

## Explicit exclusions

- Repository map (G1B), issue intake API/UI, Memory Pack persistence,
  Planner/Codex/Verifier execution, worktrees, evidence collection, browser
  actions, vault write-back, and all `demo-store` files
- External databases, network services, credentials, production access, and
  automatic merge/deploy

## Acceptance criteria

1. SQLite migrations create durable `runs` and append-only transition-event
   records.
2. A persisted run reloads with its state and history intact.
3. Valid transitions succeed; invalid and terminal transitions fail safely.
4. The verifier-to-implementer correction loop is bounded to one return.
5. `npm run build` and `npm test` pass inside `foundry/`.
6. The frozen checkout fixture remains unchanged.
