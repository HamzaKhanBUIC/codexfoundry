---
id: ADR-001
type: adr
title: Preserve a request idempotency key across payment retries
summary: A timeout after payment capture must retry with the original logical checkout key.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [decision, payments, retry, idempotency]
links: [ARCH-001, SVC-001, SVC-002, INC-001, PROOF-001, EVAL-001]
evidence:
  - demo-store/tests/payment-service.pay-17.test.ts
  - demo-store/tests/browser/pay-17.spec.ts
verified_commit: 1169daf
verified_at: 2026-07-18T00:00:00Z
confidence: verified
staleness: fresh
---

# Preserve a request idempotency key across payment retries

## Decision

Treat all retries of one logical checkout as one payment request and pass the
same idempotency key to the payment gateway on every retry.

## Rationale

A gateway acknowledgement timeout can happen after the provider has captured
funds. A retry with a different key creates a second authorized capture.

## Alternatives considered

- Do not retry acknowledgement timeouts: rejected because it abandons a valid
  checkout without knowing its final state.
- Generate a new key per retry: rejected because it defeats gateway
  deduplication.
- Deduplicate only after order creation: rejected because the gateway capture
  already occurred.

This ADR links the code boundary in [[ARCH-001]], the observed failure in
[[INC-001]], and the executable contract in [[PROOF-001]].
