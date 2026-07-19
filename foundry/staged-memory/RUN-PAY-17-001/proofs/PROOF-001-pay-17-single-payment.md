---
id: PROOF-001
type: proof
title: One logical checkout must produce one payment capture
summary: The original PAY-17 assertion fails at baseline and passes in approved candidate 63417ca without changing the unit proof.
services: [checkout-service, payment-gateway]
requirements: [PAY-17]
tags: [proof, test, browser, idempotency]
links: [ARCH-001, ADR-001, INC-001, EVAL-001]
evidence:
  - kind: test
    reference: "npm run test:pay-17 (baseline: exit 1; candidate: exit 0)"
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

# One logical checkout must produce one payment capture

## Assertion

When a gateway acknowledgement times out after capture, retrying the same
checkout persists exactly one payment for the created order.

## Before and after evidence

Frozen baseline `93ef28f` failed `npm run test:pay-17`: expected one payment,
received two. The independent verifier reran the unchanged unit proof against
approved candidate `63417ca`, where it passed. The independent browser proof
also passed and visibly reported one payment after retry.

## Command and artifacts

The verifier also passed `npm run build` and `npm run test:health`. Exact
results and the inspected diff are preserved in
`foundry/evidence/RUN-PAY-17-001-verifier.json`. See [[INC-001]] for impact and
[[ADR-001]] for the governing decision.
