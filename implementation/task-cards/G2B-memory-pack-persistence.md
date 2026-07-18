# G2B — Trusted Memory Pack Integration

## Scope

Compile the G2A PAY-17 task against the read-only Obsidian vault, persist the
exact rendered Memory Pack and bodyless provenance metadata, and transition the
run from `intake` to `memory_compiled` atomically.

## Acceptance criteria

- Only the G2A trusted task handoff is adapted into the memory compiler input.
- The existing deterministic compiler remains the selection authority.
- SQLite stores the exact rendered payload, hash, token/confidence metrics, and
  bodyless selected/omitted source metadata.
- Persisting a pack and moving the run to `memory_compiled` is one transaction.
- A non-intake run or commit mismatch is rejected.
- The vault remains read-only; no planner, command execution, worktree, or
  vault proposal is introduced.

## Validation

```powershell
cd memory; npm test; npm run build
cd ../foundry; npm test; npm run build
```
