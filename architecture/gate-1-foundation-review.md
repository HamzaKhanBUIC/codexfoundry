# Gate 1 — Run Foundation Review

**Status:** Approved by human review.

## Delivered boundary

- Local SQLite-backed `RunRepository` with append-only transition events.
- Explicit state machine with terminal states and one verifier-driven correction
  return (initial implementation plus one corrective attempt).
- Read-only repository map pinned to the frozen PAY-17 fixture commit.

## Evidence

Run in `foundry/`:

```powershell
npm test
npm run build
```

The Gate 1 suite proves persisted state reload, valid/invalid transitions, the
bounded correction loop, deterministic fixture mapping, and fail-closed
behavior for missing paths, commands, or baseline mismatch.

## Boundaries retained

- No HTTP API, issue intake, Memory Pack record, Planner, Codex execution,
  worktree lifecycle, verifier, UI, or vault write-back exists yet.
- `demo-store` remains frozen and is only read to map its baseline.
- The next task begins Gate 2 with a seeded PAY-17 issue intake contract.
