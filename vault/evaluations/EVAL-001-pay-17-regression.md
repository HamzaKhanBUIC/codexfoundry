---
id: EVAL-001
type: evaluation
title: PAY-17 checkout retry regression evaluation
summary: Replays the one-payment assertion through unit and browser evidence after a candidate fix.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [evaluation, regression, checkout, payments]
links: [ADR-001, INC-001, PROOF-001]
evidence:
  - npm run test:pay-17
  - npm run test:browser
verified_commit: 1169daf
verified_at: 2026-07-18T00:00:00Z
confidence: reviewed
staleness: fresh
---

# PAY-17 checkout retry regression evaluation

## Evaluation contract

After Foundry repairs PAY-17, run the exact regression test and browser
scenario. A deliberate retry-key mutation must make the one-payment assertion
fail again.

This evaluation reuses [[PROOF-001]], is motivated by [[INC-001]], and enforces
[[ADR-001]]. It is an evaluation definition only; it does not execute commands
in the memory subsystem.
