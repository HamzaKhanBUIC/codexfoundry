# G3I — PAY-17 Regression Replay

`EVAL-001` was executed from a new disposable candidate based on approved
repair commit `2a5d01f`. Before mutation, its PAY-17 unit and browser proofs
both passed. The replay then restored only the attempt-specific retry-key
mutation in `CheckoutService`; the unchanged PAY-17 unit proof failed with two
payments.

Foundry therefore blocked the regression. The full evidence is
`foundry/evidence/RUN-PAY-17-001-regression-replay.json`. The deliberately
broken candidate remains isolated and must not be merged. The vault has not
been updated with this new evidence; that would require a separate approval.
