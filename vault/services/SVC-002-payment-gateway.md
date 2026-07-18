---
id: SVC-002
type: service
title: Payment Gateway Adapter
summary: Records captures by idempotency key and can simulate a post-capture acknowledgement timeout.
services: [payment-gateway]
requirements: [PAY-17]
tags: [payments, idempotency, timeout]
links: [ARCH-001, ADR-001, PROOF-001]
evidence:
  - demo-store/src/services/payment-gateway.ts
  - demo-store/tests/payment-service.pay-17.test.ts
verified_commit: 1169daf
verified_at: 2026-07-18T00:00:00Z
confidence: verified
staleness: fresh
---

# Payment Gateway Adapter

The fixture records a successful capture before it raises a deterministic
acknowledgement timeout. This models the failure mode where a caller cannot
know whether the provider captured funds. The adapter deduplicates only equal
idempotency keys, so the caller must preserve that key across retries.

The contract is captured in [[ADR-001]] and mechanically exercised in
[[PROOF-001]].
