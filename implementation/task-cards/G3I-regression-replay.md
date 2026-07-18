# G3I — PAY-17 Regression Replay

## Scope

Execute EVAL-001 by recreating the retry-key defect only in a new disposable
candidate and prove that the unchanged PAY-17 test catches it.

## Evidence

- Clean regression candidate at approved repair commit `2a5d01f` passed the
  PAY-17 unit and browser proofs.
- Only `src/services/checkout-service.ts` was mutated.
- `tests/payment-service.pay-17.test.ts` remained unchanged.
- After mutation, PAY-17 failed as expected: one payment expected, two received.

## Boundary

The regression candidate is deliberately broken and remains unmerged. This
task does not write its replay result into the vault.
