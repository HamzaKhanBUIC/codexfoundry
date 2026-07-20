# Intake and Plan Evidence Boundary

The persisted PAY-17 evidence chain begins before implementation. Each completed
run must provide these two read-only JSON artifacts alongside implementation,
verifier, and approval records:

- `RUN-<id>-intake.json` records the original untrusted issue payload, the
  validated policy-owned task, the frozen repository commit, and intake checks.
- `RUN-<id>-plan.json` records the exact baseline Memory Pack summary supplied
  to planning, the policy-valid plan, proof contract, allowed paths/commands,
  and a distinct human plan-approval marker, rationale, and timestamp.

The plan's Memory Pack is pinned to the intake repository commit. It is not the
post-repair reusable pack shown in the Memory Pack tab. That prevents repaired
knowledge from appearing as input to baseline planning.

`loadPay17RunProjection()` treats both artifacts as required gates. If either is
missing or malformed while later-stage evidence is present, projection fails
closed with `Evidence incomplete`; the local read API returns HTTP 503 with
`evidence_incomplete`, and the dashboard refuses to render a guessed workflow.

The current PAY-17 release records are an explicitly labelled
`historical-contract-replay`: they materialize the deterministic intake and
validated-plan contracts from the completed run's recorded artifacts and source
contracts. They do not claim a new issue submission or a new Codex Planner
invocation. A historical plan record marks its approval timestamp as a
confirmation-recorded-at-materialization timestamp when the original legacy
wall-clock timestamp was not retained.
