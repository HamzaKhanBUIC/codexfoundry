# Dashboard Artifact Projection

The dashboard loads the recorded PAY-17 evidence from `foundry/evidence/` at
Vite build or development-server start. A small Vite virtual module delegates
all interpretation to the core projection and projects only the fields the
read-only UI needs. At runtime the dashboard also fetches the same projection
from the fixed loopback read API.

## Trust boundary

- The dashboard does not decide whether a repair is verified.
- Intake, plan, verifier, approval, vault-write, and regression-replay
  artifacts remain authoritative for their respective outcomes.
- Missing, malformed, or contradictory evidence blocks the API/dashboard
  projection rather than rendering a misleading completed run.

## Scope and follow-up

This is a local fixed-run projection for the frozen judge fixture. It has no
write capability, live polling, or approval endpoint. A page refresh is needed
to observe an artifact change through the runtime API.
