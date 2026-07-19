---
id: ARCH-001
type: architecture
title: Checkout retry and payment capture flow
summary: Checkout creates an order, captures payment, then records the result; retries must retain one logical idempotency key.
services: [checkout-service, payment-gateway, order-service]
requirements: [PAY-17]
tags: [checkout, retry, idempotency]
links: [ADR-001, SVC-001, SVC-002, PROOF-001]
evidence:
  - demo-store/src/services/checkout-service.ts
  - demo-store/tests/payment-service.pay-17.test.ts
verified_commit: 93ef28fa1737767a4a0c3b38fa8f9a6158980bb6
verified_at: 2026-07-19T14:30:00+05:00
confidence: verified
staleness: fresh
---

# Checkout retry and payment capture flow

The checkout boundary creates an order before asking the payment gateway to
capture it. A retry after an acknowledgement timeout is still the same logical
checkout and must preserve its idempotency key through every attempt.

The deterministic PAY-17 fixture deliberately violates that rule in
`CheckoutService` so that Foundry has a stable proof path. See [[ADR-001]] for
the invariant, [[SVC-001]] for checkout ownership, and [[PROOF-001]] for the
executable failure.
