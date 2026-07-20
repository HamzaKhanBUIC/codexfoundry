# Primary User Journey

1. Maya opens Foundry and selects issue `PAY-17: duplicate charge after checkout retry`.
2. Foundry displays a Memory Pack: checkout architecture, prior payment idempotency decision, relevant service notes, and related tests.
3. The Planner produces a constrained proposal and proof contract from that pack.
4. Maya reviews and approves the bounded plan; this alone permits a disposable worktree.
5. Codex creates the candidate worktree, implements the idempotency fix, and submits a non-authoritative report.
6. The independent verifier reruns the baseline/candidate proof commands and browser scenario.
7. Foundry displays the evidence-derived graph and review artifact; Maya approves only the candidate commit.
8. Maya separately approves the staged vault write; Foundry writes linked Architecture, Incident, ADR, Proof, and Evaluation notes.
9. A later bad change restores the retry-key mutation; the saved evaluation clearly blocks it.
