# Primary User Journey

1. Maya opens Foundry and selects issue `PAY-17: duplicate charge after checkout retry`.
2. Foundry displays a Memory Pack: checkout architecture, prior payment idempotency decision, relevant service notes, and related tests.
3. Maya sees why each source was chosen and approves the plan.
4. The Planner produces a proof contract: reproduce timeout/retry and assert a single payment is persisted.
5. Codex creates a worktree, adds the failing test, implements the idempotency fix, and runs verification.
6. Foundry displays evidence in the proof graph and presents the diff for review.
7. Maya approves the memory update.
8. Foundry writes linked Incident, ADR, Proof, and Evaluation notes to the Obsidian vault.
9. A later bad change removes idempotency protection; Foundry runs the saved evaluation and clearly blocks it.
