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

## Codex response boundary

The product does not place an API key or a generic model wrapper inside its
trust boundary. A GPT-5.6 Codex Ask/Plan response is accepted only as exact
JSON through `planner-response.ts`. Foundry supplies run, Memory Pack, and plan
identifiers itself; it rejects Markdown, free-form explanation, unknown fields,
and self-granted permissions before the normal plan policy validator runs.
