# UI Wireframes

## 1. Run overview

```text
┌ Codex Foundry ─ PAY-17: Duplicate charge on checkout retry ───────────┐
│ Status: Verification passed     Trust score: 92      Context: 8.1k    │
├───────────────────────────────────────────────────────────────────────┤
│ Timeline                         │ Proof graph                        │
│ ✓ Issue understood               │ [PAY-17] → [ADR-014]              │
│ ✓ Memory Pack approved           │     ↓          ↘                   │
│ ✓ Plan approved                  │ [checkout] → [retry test]          │
│ ✓ Patch applied                  │                    ↓               │
│ ✓ Browser verification           │               [evidence]           │
│ ○ Approve memory update          │                    ↓               │
│                                  │              [EVAL-042]            │
└───────────────────────────────────────────────────────────────────────┘
```

## 2. Memory Pack approval

```text
Memory Pack: 8,140 estimated tokens (naïve baseline: 18,600)

✓ checkout-flow.md        Linked to PAY-17 and changed service
✓ ADR-014-idempotency.md  Prior verified decision for payment retry
✓ payment-retry.spec.ts   Existing adjacent test behavior
! INC-013.md              Excluded: stale; last verified before refactor

[Approve plan] [Inspect source] [Adjust context]
```

## 3. Memory write-back approval

```text
Proposed Engineering Memory Updates

  + INC-042-duplicate-charge.md
  + ADR-018-retry-idempotency.md
  + PROOF-042-single-payment.md
  + EVAL-042-checkout-retry.md

[Review diff] [Approve & write to Obsidian] [Reject]
```

## Visual principles

- Evidence is green only when mechanically verified.
- Agent activity is a concise timeline, never simulated chain-of-thought.
- Every memory source is inspectable and explainable.
- High-risk decisions require an explicit human approval control.
