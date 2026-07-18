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
  - kind: source
    reference: demo-store/src/services/checkout-service.ts
    verified: true
  - kind: test
    reference: demo-store/tests/payment-service.pay-17.test.ts
    verified: true
  - kind: browser
    reference: demo-store/tests/browser/pay-17.spec.ts
    verified: true
  - kind: commit
    reference: 2a5d01f47b1ebdbe0ed97633474d2e19adf4b10b
    verified: true
verified_commit: 2a5d01f47b1ebdbe0ed97633474d2e19adf4b10b
verified_at: 2026-07-19T00:07:00+05:00
confidence: verified
staleness: fresh
---

# Preserve a request idempotency key across payment retries

## Decision

All retries for one logical checkout send the same request idempotency key to
the payment gateway.

## Why

An acknowledgement timeout can occur after the gateway captures funds. Reusing
the key lets the gateway return the existing capture instead of creating a
second one. Candidate `2a5d01f` implements this decision.

## Alternatives considered

- Do not retry acknowledgement timeouts.
- Generate a new key for each retry.
- Deduplicate only after order creation.

## Why rejected

Stopping retries abandons uncertain valid checkouts; a new key defeats gateway
deduplication; order-level repair happens after the duplicate capture.

## Consequences

The original PAY-17 unit assertion remains unchanged and passes in the
approved candidate. [[PROOF-001]] records the executable evidence; [[EVAL-001]]
defines the deliberate regression replay still required.
