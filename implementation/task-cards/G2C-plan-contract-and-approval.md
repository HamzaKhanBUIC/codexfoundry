# G2C — Planner Contract and Human Approval

## Scope

Create the bounded Planner prompt, persist a validated PAY-17 plan proposal,
and require an explicit human approval or rejection before implementation.

## Acceptance criteria

- The Planner prompt contains only task facts, repository map limits, and the
  exact saved Memory Pack; it excludes raw vault/index and original issue prose.
- A proposal may use only mapped PAY-17 paths and commands and must preserve
  the canonical one-payment proof assertion.
- Proposal persistence transitions `memory_compiled → plan_pending_approval`
  atomically.
- Human approval transitions to `implementing`; rejection transitions to
  `stopped`; both require a reason and are recorded as human events.
- No model call, code editing, worktree creation, command execution, verifier,
  UI/API, or vault write is introduced.
