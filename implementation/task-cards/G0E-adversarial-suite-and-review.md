# G0E — Adversarial Memory Suite and Gate 0 Review

- **Gate:** Gate 0 — Memory trust hardening
- **Status:** Ready for review
- **Objective:** Prove the Memory Pack fails safely under trust-boundary inputs
  and record the architecture review required before any Planner integration.

## In scope

- `memory/tests/adversarial.test.ts`
- Gate 0 review documentation and a material ADR
- Minimal test-only helpers; no production feature expansion

## Adversarial assertions

1. A stale note containing malicious-looking prose never appears in serialized
   pack content.
2. Malformed typed evidence is rejected at vault-load time.
3. Reverse-only and multi-hop links cannot introduce a proof into a pack.
4. Existing tests retain coverage for aliases, dangling links, exact payload
   accounting, constrained budgets, redundant context, commit mismatch, and
   blank draft fields.

## Exit criteria

- Full memory test suite and TypeScript build pass.
- Gate 0 review documents passed controls, measured evidence, and the bounded
  limitations deferred to later Foundry gates.
- No vault content or `demo-store` source is modified.
- Stop after Gate 0; do not begin Gate 1 or Milestone 3.
