---
id: PROOF-001
type: proof
title: One logical checkout must produce one payment capture
summary: The PAY-17 assertion fails in the seeded baseline because the retry creates a second payment.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [proof, test, browser, idempotency]
links: [ARCH-001, ADR-001, INC-001, EVAL-001]
evidence:
  - demo-store/tests/payment-service.pay-17.test.ts
  - demo-store/tests/browser/pay-17.spec.ts
  - npm run test:pay-17
verified_commit: 1169daf
verified_at: 2026-07-18T00:00:00Z
confidence: verified
staleness: fresh
---

# One logical checkout must produce one payment capture

## Assertion

When the gateway acknowledgement times out after capture, retrying a checkout
must persist exactly one payment for the created order.

## Baseline evidence

`npm run test:pay-17` intentionally fails with two payments, and the browser
scenario visibly reports two captured payments. The future repair must turn
this proof green without weakening its assertion.

See [[INC-001]] for impact and [[ADR-001]] for the decision behind the proof.
