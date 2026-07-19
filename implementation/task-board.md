# Build Board

> Current status: the P0 workflow below is implemented on
> `codex/m4-proof-experience` at `520de8a`. This board preserves the original
> scope as a record; `release/PROJECT_MASTER_HANDOFF.md` and
> `release/DOCUMENTATION_COMPARISON.md` are the current release-status sources.

## P0 — must complete

- [x] Build the intentionally defective checkout demo repository (`demo-store/`).
- [x] Add baseline failing duplicate-charge retry test (`demo-store/tests/payment-service.pay-17.test.ts`).
- [x] Define command allowlist and isolated-worktree lifecycle.
- [x] Implement task-run state machine.
- [x] Implement Memory Pack Compiler against structured Markdown vault.
- [x] Implement plan approval and proof-contract display.
- [x] Implement Codex worktree patch loop.
- [x] Implement verifier: test, browser check, evidence persistence.
- [x] Implement Proof Graph UI with evidence-derived, keyboard-accessible, read-only node and edge inspection.
- [x] Implement staged/approved vault write-back.
- [x] Implement saved regression evaluation and deliberate failure demo.
- [x] Measure and display context-efficiency methodology/results (recorded pack size, budget, confidence, and honest unavailable naïve baseline).

## P1 — only after P0 is reliable

- [ ] Obsidian plugin panel.
- [ ] Real GitHub issue/PR integration.
- [ ] Stale-memory visual warnings.
- [ ] Additional task scenarios.
