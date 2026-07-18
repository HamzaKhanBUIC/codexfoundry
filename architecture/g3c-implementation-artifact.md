# G3C — PAY-17 Candidate Implementation Artifact

The disposable candidate for `RUN-PAY-17-001` is detached at the frozen
`1169dafdc3d1f18fed2adca11ce900a15a67cfd3` baseline. It changes only:

- `src/services/checkout-service.ts`: keep the original logical checkout
  idempotency key across retry attempts.
- `tests/browser/pay-17.spec.ts`: express the repaired visible behavior of one
  payment per checkout after the retry acknowledgement timeout.

The implementer ran `build`, health, PAY-17, and browser commands with exit
code zero. Their captured results are recorded in
`foundry/evidence/RUN-PAY-17-001-implementation.json`.

This artifact is explicitly **not verification**. G3D must independently
inspect the dirty candidate and rerun the proof contract before any state may
be marked verified, reviewed, merged, or written to the vault.
