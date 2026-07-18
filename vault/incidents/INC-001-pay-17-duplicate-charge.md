---
id: INC-001
type: incident
title: PAY-17 duplicate charge after retry acknowledgement timeout
summary: Checkout retries with a mutated key after a post-capture timeout and creates two captures for one order.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [incident, payments, duplicate-charge, retry]
links: [ARCH-001, ADR-001, PROOF-001, EVAL-001]
evidence:
  - demo-store/tests/payment-service.pay-17.test.ts
  - demo-store/tests/browser/pay-17.spec.ts
verified_commit: 1169daf
verified_at: 2026-07-18T00:00:00Z
confidence: verified
staleness: fresh
---

# PAY-17 duplicate charge after retry acknowledgement timeout

## Impact

One logical checkout can create two payment captures after an acknowledgement
timeout. This is a checkout reliability and customer-trust failure.

## Deterministic reproduction

The fixture captures the first payment, simulates a retryable timeout, then
retries with a mutated idempotency key. The PAY-17 proof observes two captures.

## Root cause

`CheckoutService` derives a retry-specific payment key instead of passing the
original request key. [[ADR-001]] defines the required invariant; [[EVAL-001]]
will preserve it after repair.
