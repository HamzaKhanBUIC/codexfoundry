# Planner and Approval Boundary

G2C treats GPT-5.6 output as an untrusted plan proposal, not a command or proof.
The prompt renderer accepts only the trusted intake task, validated repository
map, and exact persisted Memory Pack. Foundry validates the proposal against a
fixed PAY-17 path/command allowlist and the invariant that one logical checkout
persists one payment.

Plan persistence and `memory_compiled → plan_pending_approval` occur in one
SQLite transaction. Only a human review with a non-empty rationale can advance
the run to `implementing`; rejection stops it. Neither outcome executes a
command or creates a worktree.
