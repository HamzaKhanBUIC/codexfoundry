# Seeded PAY-17 Issue Intake

## Boundary

G2A accepts one known GitHub-style issue shape and turns it into the smallest
trusted task handoff. It is not a generic issue tracker, planner, or policy
engine.

The source issue is retained in the local run record as untrusted metadata for
review. The handoff deliberately excludes its body, commands, permissions, and
any model interpretation.

## Validation

The intake contract requires:

- `id: PAY-17`;
- title `Duplicate charge during checkout retry`;
- status `open` when a status is supplied;
- labels `bug`, `payments`, `checkout`, and `high-risk`; and
- the Gate 1 repository map's two fixed services, checkout source path, and
  validated baseline commit.

## Trusted handoff

```text
taskId: PAY-17
acceptanceCriteria: one logical checkout persists one payment
riskLevel: high
services: checkout-service, payment-gateway
paths: src/services/checkout-service.ts
repositoryCommit: validated frozen baseline commit
```

This handoff contains no command allowlist, approval decision, Memory Pack,
plan, source file body, or issue body. Those responsibilities belong to later
Gate 2 tasks and remain subject to Foundry policy.
