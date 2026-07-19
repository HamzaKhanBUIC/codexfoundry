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

## Current completion status — release branch `520de8a`

| Stage | Status | Evidence-backed outcome |
|---|---|---|
| Milestone 1 | Complete and frozen | Deterministic PAY-17 fixture, isolated browser sessions, split green/red/browser suites, and portable browser fallback. |
| Milestone 2 | Complete | Typed Obsidian Markdown vault, deterministic Memory Pack, provenance, freshness, confidence, graph, and budget gates. |
| Milestone 3 | Complete | Persisted task state, bounded plan and Codex contracts, disposable candidate, independent verifier, separate approvals, vault revisions, and regression replay. |
| Milestone 4 | Functionally complete | Read-only dashboard, versioned evidence projection, local read API, grounded Memory Pack metrics, and responsive proof graph. |
| Release Tier 1 | Complete | One-command bootstrap with immutable baseline bundle, commit/script/browser preflight, and Windows cleanup. |
| Release Tier 2 | Complete | QA-04: interactive, evidence-derived, keyboard-accessible, read-only graph inspection. |
| Release Tier 3 | Pending | Judge instructions, final visual/error-state hardening, real browser artifact only if recorded, and readiness report. |

The historical QA report is intentionally retained as a point-in-time audit.
See `release/DOCUMENTATION_COMPARISON.md` for resolved versus open findings.
