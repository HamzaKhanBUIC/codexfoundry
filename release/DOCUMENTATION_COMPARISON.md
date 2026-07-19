# Codex Foundry — Documentation State Comparison

**Compared on:** 2026-07-19  
**Current release branch:** `codex/m4-proof-experience` at `520de8a`  
**Purpose:** distinguish the historical release audit from the implemented,
evidence-backed state without rewriting audit history.

## Sources compared

| Document | What it represents | Status |
|---|---|---|
| `release/FINAL_QA_REPORT.md` | Point-in-time QA audit that assessed the release at 62/100 and not ready. | Historical; findings remain valid for the revision reviewed. |
| `release/PROJECT_MASTER_HANDOFF.md` | Current architecture, feature, evidence, and release inventory. | Current source of truth for project state. |
| `release/FINAL_RELEASE_PLAN.md` | Remaining release work and acceptance checklist. | Current plan, updated to `520de8a`. |
| `ARCHITECTURE_DECISIONS.md` | Durable rationale for accepted architectural choices. | Current through ADR-028. |

## What changed after the historical QA report

| Historical finding | Implemented comparison result | Current state |
|---|---|---|
| QA-01: release clone lacked the immutable fixture. | `520de8a` adds a baseline-only Git bundle and manifest. The bootstrap materializes an ignored clone and rejects a provenance mismatch. | Resolved. |
| QA-02: one command could not validate the whole scenario from a clean clone. | `npm run demo` now validates fixture files, baseline commit, required scripts, and browser availability before starting local services. | Resolved. |
| QA-03: Memory Pack display facts were hard-coded. | `f54bf84` adds a compiler-derived snapshot; the projection displays recorded token, budget, confidence, source, and omission facts. | Resolved. |
| QA-04: Proof Graph was display-only. | The graph remains intentionally read-only and display-only. No inspection interaction has yet been implemented. | Open; next work. |
| QA-05: mobile graph clipped. | Responsive CSS changes the graph into a vertical sequence on small screens. | Resolved. |
| QA-06: browser evidence could imply an absent visual artifact. | The UI now says explicitly when no screenshot or trace was recorded. | Partially resolved; capture is optional and must be real. |
| QA-07: no grounded memory metrics. | The recorded pack reports 715 estimated tokens, a 12,000 token budget, and confidence `1`; no naïve comparison is claimed because none was recorded. | Resolved honestly. |
| QA-08: direct API CORS was blocked. | The supported path is the dashboard's same-origin `/api` proxy; no broader CORS surface was added. | No fix required. |

## Development progress

The narrow MVP has progressed from a deterministic fixture and memory compiler
to a complete recorded workflow with isolated implementation, independent
verification, approval separation, durable memory, and a judge-facing read
surface. In scope terms:

| Scope area | Progress |
|---|---|
| Core PAY-17 workflow (Milestones 1–3) | Complete and recorded. |
| Proof dashboard (Milestone 4) | Functionally complete; one interaction-quality item remains. |
| Self-contained local release (Tier 1) | Complete on the release branch. |
| Final judge readiness (Tiers 2–3) | In progress; QA-04 and polish/documentation remain. |
| `main` integration | Deliberately pending explicit user authorization. |

## Claims that must remain precise

- The frozen fixture baseline is `1169dafdc3d1f18fed2adca11ce900a15a67cfd3`.
- The approved repair candidate is `2a5d01f47b1ebdbe0ed97633474d2e19adf4b10b`.
- The verifier, not Codex or the dashboard, is the sole proof authority.
- The dashboard and its API are read-only; there is no merge, deploy, GitHub,
  production, or vault-write control surface.
- PAY-17 remains intentional in the frozen baseline; the release bundle does
  not alter it.
- No token-savings percentage or browser screenshot/trace may be claimed
  unless it is a recorded artifact.

## Remaining documentation work

1. Complete QA-04 and document the final read-only graph inspection contract.
2. Add dedicated judge run instructions and a final release-readiness score.
3. If a real browser screenshot or trace is recorded, add it as a referenced
   evidence artifact; otherwise retain the explicit absence label.

For detailed implementation, validation, and release constraints, read
`release/PROJECT_MASTER_HANDOFF.md` before changing any code or release
documentation.
