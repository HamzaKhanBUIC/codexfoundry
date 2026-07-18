# Dashboard Artifact Projection

The dashboard loads the recorded PAY-17 evidence from `foundry/evidence/` at
Vite build or development-server start. A small Vite virtual module validates
the expected artifact shapes through TypeScript and projects only the fields
the read-only UI needs.

## Trust boundary

- The dashboard does not decide whether a repair is verified.
- The verifier, approval, vault-write, and regression-replay artifacts remain
  the authoritative sources for their respective outcomes.
- Missing or malformed evidence makes the dashboard build fail rather than
  rendering a misleading completed run.

## Scope and follow-up

This is a local, build-time projection for the frozen judge fixture. It has no
write capability, live polling, or approval endpoint. A later API slice may
serve durable run records, but must preserve the same evidence ownership and
read-only default.
