# Codex Foundry Final Release Plan

## 1. Current architecture summary

Codex Foundry is a local engineering-memory and proof system for one
deterministic PAY-17 checkout repair. Its workflow is issue intake →
commit-aware Memory Pack → validated plan → disposable worktree → bounded Codex
implementation → independent verifier → human patch approval → staged and
explicitly approved vault write → deliberate regression replay. The dashboard
is read-only and consumes a versioned evidence projection. The verifier alone
may mark proof verified.

## 2. Current implementation status

- Milestones 1–4 are functionally complete on the `codex/m4-proof-experience`
  release branch at `520de8a`.
- Core validation: 11 test files / 27 tests pass; strict TypeScript build
  passes. Dashboard production build passes.
- The release branch is intentionally unmerged from `main`. It packages the
  frozen nested fixture as a Git bundle and materializes a verified local clone
  for `npm run demo`; `main` remains untouched until explicit user approval.

## 3. Remaining work

1. Tier 2: interactive evidence-derived graph inspection (QA-04) and recorded
   browser-proof artifact presentation only when an artifact exists.
2. Tier 3: judge documentation, startup errors, loading/empty states,
   responsive and visual polish, release-readiness report.

## 4. Risks

| Risk | Severity | Mitigation |
|---|---:|---|
| Current implementation is not on `main` | Medium | The self-contained release branch is validated; merge remains an explicit user decision and must not mutate the frozen baseline. |
| Fixture provenance drifts | Critical | Bootstrap only a local clone from the bundled baseline and reject a commit mismatch. |
| Browser proof depends on Chrome fallback | High | Detect/document browser availability and present only recorded evidence. |
| Metrics could become fabricated | High | Render only persisted/compiler-derived values; label unavailable comparisons. |
| Dashboard could imply authority | High | Keep all screens and API routes read-only. |

## 5. Estimated implementation effort

| Tier | Effort | Risk |
|---|---:|---:|
| Tier 2 | Medium | Low–Medium |
| Tier 3 | Medium | Low |

## 6. Priority ranking

P0: interactive proof navigation. P1: browser artifact presentation only if
captured. P2: documentation and visual hardening.

## 7. Expected demo impact

Tier 1 made the claim runnable and measurable. Tier 2 makes causal evidence
inspectable in seconds. Tier 3 removes remaining setup friction and makes the
product feel deliberate rather than assembled.

## 8. Expected judge impact

The release should demonstrate Codex as a bounded engineering actor and
Foundry as the layer that explains, proves, stores, and replays the outcome.
The most judge-visible differentiators are independent verification, separate
human approvals, memory provenance/freshness, and regression replay.

## 9. Validation required

- `memory`: test and build.
- `foundry`: test and build.
- `foundry/dashboard`: production build.
- Release bootstrap: fixture/data/API preflight, API health, dashboard URL.
- Baseline/candidate/regression evidence remains unchanged and readable.
- No dashboard/API write route or approval action is introduced.

## 10. Release checklist

- [x] Tier 1 complete: release bundle, fixture provenance preflight, browser preflight, and grounded metrics/freshness are included.
- [ ] Tier 2 complete and validated (QA-04 remains).
- [ ] Tier 3 complete and validated.
- [x] Release integration branch contains the current packaged workflow.
- [x] Frozen PAY-17 fixture remains unchanged.
- [x] One command reports actionable prerequisite failures.
- [x] Displayed Memory Pack metrics have recorded sources or an explicit unavailable label.
- [ ] README and judge instructions are current (README updated; dedicated judge instructions remain Tier 3).
- [ ] `release/RELEASE_READINESS.md` completed with honest score.
