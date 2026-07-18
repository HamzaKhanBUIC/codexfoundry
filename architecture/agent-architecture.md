# Agent Architecture

## State machine

`intake → memory_compiled → plan_pending_approval → implementing → verifying → review_pending → memory_pending_approval → complete`

Transitions are one-way except `implementing ↔ verifying`, which supports a bounded stop-and-fix loop of two attempts for the MVP.

## Failure behavior

- Missing memory: continue with a clearly labelled low-memory-confidence plan.
- Failed tests: return to Implementer with exact verifier output.
- Ambiguous requirement: halt for human clarification; never invent acceptance criteria.
- Unsafe command: deny and surface the policy reason.
- Failed vault write: preserve the proof run and leave the update staged.
