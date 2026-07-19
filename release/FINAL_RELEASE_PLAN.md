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
  branch at `5c19ffe`.
- Core validation: 11 test files / 27 tests pass; strict TypeScript build
  passes. Dashboard production build passes.
- The release branch has not yet been integrated into `main`; the frozen nested
  demo fixture is not present in this worktree. These are release blockers.

## 3. Remaining work

1. Tier 1: single-command demo, measured Memory Pack efficiency panel, proof
   freshness display.
2. Tier 2: interactive evidence-derived graph and recorded browser-proof
   artifact presentation when artifacts exist.
3. Tier 3: judge documentation, startup errors, loading/empty states,
   responsive and visual polish, release-readiness report.

## 4. Risks

| Risk | Severity | Mitigation |
|---|---:|---|
| Current implementation is not on `main` | Critical | Create an explicit release integration branch; do not mutate frozen baseline. |
| Fixture is absent from implementation worktree | Critical | Resolve a read-only fixture location in the release bootstrap; fail clearly when absent. |
| Browser proof depends on Chrome fallback | High | Detect/document browser availability and present only recorded evidence. |
| Metrics could become fabricated | High | Render only persisted/compiler-derived values; label unavailable comparisons. |
| Dashboard could imply authority | High | Keep all screens and API routes read-only. |

## 5. Estimated implementation effort

| Tier | Effort | Risk |
|---|---:|---:|
| Tier 1 | Medium | Medium |
| Tier 2 | Medium | Low–Medium |
| Tier 3 | Medium | Low |

## 6. Priority ranking

P0: release integration and one-command judge run. P1: measured context and
freshness evidence. P2: interactive proof navigation and browser artifact.
P3: documentation and visual hardening.

## 7. Expected demo impact

Tier 1 makes the claim runnable and measurable. Tier 2 makes causal evidence
understandable in seconds. Tier 3 removes setup friction and makes the product
feel deliberate rather than assembled.

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

- [ ] Tier 1 complete and validated.
- [ ] Tier 2 complete and validated.
- [ ] Tier 3 complete and validated.
- [ ] Release integration branch contains all current work.
- [ ] Frozen PAY-17 fixture remains unchanged.
- [ ] One command reports actionable prerequisite failures.
- [ ] All displayed metrics have recorded sources.
- [ ] README and judge instructions are current.
- [ ] `release/RELEASE_READINESS.md` completed with honest score.
