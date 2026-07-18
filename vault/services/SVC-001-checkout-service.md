---
id: SVC-001
type: service
title: Checkout Service
summary: Owns a logical checkout attempt, order creation, and retry policy.
services: [checkout-service, order-service]
requirements: [PAY-17]
tags: [checkout, retry]
links: [ARCH-001, ADR-001, INC-001, PROOF-001]
evidence:
  - demo-store/src/services/checkout-service.ts
  - demo-store/src/services/order-service.ts
verified_commit: 1169daf
verified_at: 2026-07-18T00:00:00Z
confidence: verified
staleness: fresh
---

# Checkout Service

`CheckoutService` is the retry boundary. It owns the relationship between a
logical checkout request and its payment attempt; it does not own gateway-level
deduplication. A timeout after capture is retryable, but the retry must keep the
original idempotency identity.

The known baseline defect is described in [[INC-001]] and is protected by
[[PROOF-001]].
