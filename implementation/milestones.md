# Implementation Milestones

## Milestone completion rule

Each milestone closes only after its material architectural decisions are
appended to `ARCHITECTURE_DECISIONS.md`, including rationale, alternatives, and
trade-offs. Supersede prior decisions through a new ADR rather than rewriting
history.

## Milestone 0 — Design freeze

Acceptance: all Phase 3 documents reviewed; no implementation begins without an agreed demo repository, proof contract, and visual direction.

## Milestone 1 — Deterministic scenario

Create the small ecommerce fixture app, seed the duplicate-charge retry defect, and prove the baseline failure with tests plus browser automation.

## Milestone 2 — Engineering memory foundation

Implement the Obsidian Markdown vault schema, memory index and graph,
deterministic Memory Pack selection with provenance, freshness and confidence
scoring, and token-budget reporting. This milestone must not implement agents,
worktrees, verification, UI, or vault write-back.

## Milestone 3 — Foundry core

Implement run state, issue intake, worktree lifecycle, evidence storage, and the Planner → Implementer → Verifier loop. Integrate the already-built Memory Pack compiler without weakening its selection gates.

## Milestone 4 — Product experience

Implement the Foundry dashboard, timeline, proof graph, approval screens,
staged Incident/ADR/Proof/Evaluation writes, and regression-evaluation replay.

## Milestone 5 — Submission quality

Harden the deterministic demo, measure metrics, add tests/documentation, capture Codex evidence, and record the ≤3 minute video.
