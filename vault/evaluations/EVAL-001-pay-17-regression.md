---
id: EVAL-001
type: evaluation
title: PAY-17 checkout retry regression evaluation
summary: Replays the preserved-key unit and browser contract, then deliberately restores retry-key mutation in a disposable candidate to prove the regression is caught.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [evaluation, regression, checkout, payments]
links: [ADR-001, INC-001, PROOF-001]
evidence:
  - kind: test
    reference: "npm run test:pay-17 (candidate: exit 0)"
    verified: true
  - kind: browser
    reference: "npm run test:browser (candidate: exit 0)"
    verified: true
  - kind: other
    reference: foundry/evidence/RUN-PAY-17-001-verifier.json
    verified: true
  - kind: commit
    reference: 63417cadd2ed28ec0a0dd7832be900285119c885
    verified: true
verified_commit: 63417cadd2ed28ec0a0dd7832be900285119c885
verified_at: 2026-07-19T14:30:00+05:00
confidence: verified
staleness: fresh
---

# PAY-17 checkout retry regression evaluation

## Evaluation contract

Starting from the approved candidate, run `npm run test:pay-17` and
`npm run test:browser`; both must pass. In a new disposable regression
candidate only, restore the attempt-specific retry-key mutation, rerun the
unit proof, and require it to fail with two payments.

## Expected outcome

The repaired candidate passes the one-payment unit and browser assertions.
The deliberate mutation fails the unchanged unit assertion. The verifier must
retain both command artifacts and link them to [[PROOF-001]].

## Failure signal

Fail this evaluation if the repaired candidate does not pass both proofs, the
mutation does not recreate the duplicate-charge failure, the proof itself was
changed, or any operation modifies the frozen baseline.
