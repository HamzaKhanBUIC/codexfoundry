# Codex Foundry Final QA Report

## Executive Summary

**Overall release readiness: 62/100 — NOT READY.**

The functional proof path is strong: Memory tests (18), Foundry tests (27),
strict builds, frozen baseline reproduction, approved candidate verification,
browser proof, API negative routes, and interactive dashboard navigation all
passed. The dashboard has no browser console errors in Chrome and works at a
390px viewport without page-level horizontal overflow.

Release confidence is blocked by two critical release-packaging facts: the
implementation is not integrated into `main`, and the frozen `demo-store`
fixture is absent from the current release worktree. A clean clone of the
current release branch cannot execute the complete live PAY-17 scenario. In
addition, Memory Pack transparency is rendered from hard-coded projection data
rather than a persisted run-specific Memory Pack artifact, so its visible
provenance cannot be independently rechecked from the dashboard evidence.

## Critical Issues

### QA-01 — Release branch is not a self-contained judge clone

- **Severity:** Critical
- **Reproduction:** Use the current release worktree. `demo-store/` is absent;
  `npm run demo` warns that live fixture replay is unavailable. Repository
  `main` remains at planning baseline rather than the current release chain.
- **Expected:** A judge clone contains Foundry, the frozen read-only fixture,
  and the release code required for the deterministic story.
- **Actual:** Dashboard/API evidence can run, but the live fixture is external
  to this worktree and the implementation is not on `main`.
- **Root cause:** Sequential disposable worktree development was never folded
  into an explicit release integration branch/main.
- **Suggested fix:** Integrate the accepted commit chain and package/reference
  the frozen fixture immutably in the release layout.

### QA-02 — One-command demo cannot prove the complete scenario from a clean clone

- **Severity:** Critical
- **Reproduction:** From `OpenAI Build Week-m4`, run `npm run demo` without
  `FOUNDRY_DEMO_STORE`. Bootstrap validates artifacts and can launch local UI,
  but warns live fixture replay is unavailable.
- **Expected:** The command can prepare and run every required judge-visible
  portion of PAY-17 from the clone.
- **Actual:** It launches the evidence product but cannot execute the frozen
  baseline/candidate/browser path.
- **Root cause:** QA-01 fixture packaging gap.
- **Suggested fix:** Resolve QA-01, then make bootstrap validate fixture commit,
  required scripts, and browser availability before declaring readiness.

## High Issues

### QA-03 — Memory Pack UI is not backed by a persisted run-specific pack artifact

- **Severity:** High
- **Reproduction:** Inspect `foundry/src/run-evidence-projection.ts`; included
  and omitted notes, selection reasons, freshness labels, and evidence strings
  are literal projection values rather than loaded from `StoredMemoryPack` or a
  recorded Memory Pack evidence file.
- **Expected:** Every displayed Memory Pack claim should derive from the exact
  persisted payload/source/omission data for this run.
- **Actual:** The dashboard displays plausible information, but a reviewer
  cannot establish it from run evidence alone.
- **Root cause:** Early dashboard projection was created before a durable
  UI-readable Memory Pack artifact existed.
- **Suggested fix:** Expose persisted Memory Pack fields through the evidence
  projection; do not duplicate retrieval facts in UI mapping code.

### QA-04 — Proof graph is visual but not interactive

- **Severity:** High
- **Reproduction:** Open Proof story and click graph nodes/edges. Nodes have no
  interaction, relationship inspection, originating artifact, confidence, or
  freshness detail.
- **Expected:** Tier 2 release requirement: selectable node/relationship with
  evidence and verification status.
- **Actual:** The graph is a horizontally rendered causal sequence only.
- **Root cause:** Milestone 4 graph implementation is display-only.
- **Suggested fix:** Add read-only evidence inspection interaction; preserve
  artifact-derived nodes and no action authority.

## Medium Issues

### QA-05 — Mobile proof graph clips later stages without scroll affordance

- **Severity:** Medium
- **Reproduction:** At 390×844, open Proof story. Only early nodes are visible;
  later graph stages are clipped to the right. The container can scroll but
  there is no visible cue or alternate compact representation.
- **Expected:** A first-time mobile judge can discover all eight proof stages.
- **Actual:** The causal ending is initially hidden.
- **Root cause:** Desktop horizontal graph retained at small width.
- **Suggested fix:** Add an obvious overflow affordance or responsive stacked
  graph presentation.

### QA-06 — Browser proof has no visual artifact

- **Severity:** Medium
- **Reproduction:** Open Evidence and inspect browser item. It contains command
  output only; no screenshot/video/trace artifact is recorded.
- **Expected:** Tier 2 requests screenshot when available, otherwise execution
  and logs should make the absence explicit.
- **Actual:** The browser proof is valid textual evidence, but weak for fast
  judge comprehension.
- **Root cause:** Existing browser runner records console output only.
- **Suggested fix:** Capture and display a real browser artifact when the
  runner produces one; never synthesize screenshots.

### QA-07 — Context-efficiency claim cannot yet be judged numerically

- **Severity:** Medium
- **Reproduction:** Inspect dashboard metrics and Memory Pack view. It shows
  verification counts, paths, vault revisions, and regression state, but not
  measured pack tokens, budget, naïve baseline, reduction, or proof coverage.
- **Expected:** Tier 1 release requirement calls for measured values or an
  explicit reason a comparison is unavailable.
- **Actual:** No visible efficiency measurement or unavailability explanation.
- **Root cause:** Metrics were not persisted in the proof-view artifacts.
- **Suggested fix:** Surface compiler-recorded values and clearly label any
  unavailable naïve comparison.

## Low Issues

### QA-08 — Direct cross-origin API fetch is blocked by CORS

- **Severity:** Low
- **Reproduction:** From dashboard browser context, fetch
  `http://127.0.0.1:4174/api/health` directly; browser rejects it. Fetching
  `/api/health` through Vite proxy succeeds.
- **Expected:** Same-origin dashboard access works.
- **Actual:** Expected proxy path works; direct API access is unavailable from
  the dashboard origin.
- **Root cause:** No CORS headers on intentionally loopback-only API.
- **Suggested fix:** None required for current architecture; document proxy as
  the supported browser route.

## UI/UX Findings

- Desktop proof story is clear and visually professional. In five seconds it
  communicates duplicate charge, independent verification, and regression
  block.
- Review, Memory Pack, and Evidence tabs load successfully; expandable evidence
  works (8 records); no console or page errors observed.
- Mobile page-level layout does not overflow. Proof graph discoverability is
  the main responsive issue (QA-05).
- Evidence presentation accurately labels `implementer` versus
  `independent_verifier`; this is a major trust-positive.
- `regression_blocked` is technically exact but raw system terminology; a
  first-time judge may need the surrounding explanatory sentence to interpret
  it.

## Performance Findings

- Dashboard production bundle: 393.08 kB JavaScript / 118.20 kB gzip.
- Vite production build passed in approximately 4.4 seconds.
- Dashboard loaded via system Chrome and reached network idle without console
  errors.
- No explicit performance budget, loading skeleton, network-error state, or
  API retry behavior was observed. Current local artifact size is small, so
  this is not a blocking performance defect.

## Architecture Findings

- Frozen baseline integrity validated: `demo-store` is clean at
  `1169dafdc3d1f18fed2adca11ce900a15a67cfd3`.
- Baseline build and health suite passed; PAY-17 failed deterministically with
  expected one / actual two payments; browser scenario reproduced two payments.
- Approved detached candidate at `2a5d01f` passed build, health, PAY-17 unit,
  and browser proof.
- Major release architecture violation is packaging/integration, not internal
  workflow policy: fixture and product are split across worktrees.

## Trust Boundary Findings

**Passes:**

- UI states verifier-owned evidence and no production authority.
- Implementer evidence is visibly labeled and not presented as independent
  proof.
- API rejects invalid run routes with `404` and POST to the fixed run route
  with `405`.
- Review screen states patch approval does not grant merge, deployment, or
  implied vault permission.
- No approval, vault-write, merge, or command-execution control was found in
  the dashboard.

**Concern:** Memory Pack claims need direct persisted-artifact provenance
(QA-03), otherwise the trust boundary is conceptually correct but less
auditable than the verifier path.

## Evidence Validation

| Check | Result |
|---|---|
| Memory tests | 18/18 passed |
| Memory strict build | Passed |
| Foundry tests | 27/27 passed across 11 files |
| Foundry strict build | Passed |
| Dashboard strict/Vite build | Passed |
| API health via proxy | 200 |
| Invalid route | 404 |
| POST fixed run route | 405 |
| Baseline PAY-17 | Expected failure: 2 payments |
| Baseline browser proof | Passed: visibly captures 2 payments |
| Candidate PAY-17 | Passed |
| Candidate browser proof | Passed: captures 1 payment |
| Dashboard console/page errors | None observed |

## Demo Risks

1. A judge cloning `main` will not obtain the release product.
2. A judge cloning the current release worktree cannot replay PAY-17 without
   separately locating the frozen fixture.
3. The product may look like a polished recorded case study rather than a
   runnable end-to-end system if setup fails.
4. Memory efficiency is a core differentiator but has no visible measured
   demonstration.
5. The strongest causal graph conclusion is offscreen on mobile.

## Release Recommendation

**NOT READY.**

The product is technically credible and the deterministic proof chain is
excellent. Release should be blocked until QA-01 and QA-02 are resolved. QA-03
is the next trust-critical item because Foundry's central differentiation is
evidence-backed engineering memory. QA-04 through QA-07 materially affect
judge impact but do not invalidate the proven PAY-17 repair.
