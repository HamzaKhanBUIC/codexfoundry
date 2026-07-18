---
id: INC-001
type: incident
title: PAY-17 duplicate charge after retry acknowledgement timeout
summary: A retry-specific idempotency key created two payment captures; the approved candidate preserves one logical checkout key across retries.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [incident, payments, duplicate-charge, retry, resolved]
links: [ARCH-001, ADR-001, PROOF-001, EVAL-001]
evidence:
  - kind: test
    reference: demo-store/tests/payment-service.pay-17.test.ts
    verified: true
  - kind: browser
    reference: demo-store/tests/browser/pay-17.spec.ts
    verified: true
  - kind: commit
    reference: 2a5d01f47b1ebdbe0ed97633474d2e19adf4b10b
    verified: true
  - kind: other
    reference: foundry/evidence/RUN-PAY-17-001-verifier.json
    verified: true
verified_commit: 2a5d01f47b1ebdbe0ed97633474d2e19adf4b10b
verified_at: 2026-07-19T00:07:00+05:00
confidence: verified
staleness: fresh
---

# PAY-17 duplicate charge after retry acknowledgement timeout

## Impact

One logical checkout created two captures after an acknowledgement timeout,
creating a customer-trust and payment-reconciliation risk.

## Deterministic reproduction

At frozen baseline `1169daf`, `npm run test:pay-17` failed exactly as expected:
the proof asserted one payment and received two. The fixture captured the first
payment, simulated the acknowledgement timeout, and retried with a changed key.

## Root cause and resolution

`CheckoutService` derived a retry-specific key instead of retaining the
request's logical checkout key. Approved candidate `2a5d01f` passes the original
unit proof and repaired browser proof by sending `request.idempotencyKey` on
every retry. See [[ADR-001]] and [[PROOF-001]].

## Follow-up

[[EVAL-001]] must deliberately restore the retry-key mutation in a disposable
candidate and retain the resulting failing evidence before this incident is
considered protected from regression.
