# Documentation Status

**Verified on:** 2026-07-21

**Repository branch inspected:** `codex/phase-1-repository-analysis`
**Purpose:** compare public documentation with the implementation currently in
this checkout. This is a status record, not a claim that every workflow can be
replayed from every clone.

## Verification performed

From the repository root, the following completed successfully:

```text
npm run build
  @codex-foundry/memory: tsc --noEmit
  @codex-foundry/core: tsc --noEmit
  @codex-foundry/dashboard: tsc -b && vite build

npm test
  Memory: 4 test files, 18 tests passed
  Foundry core: 18 test files, 61 tests passed
```

The dashboard has no independent test script. No claim in this document treats
the root test command as browser-proof execution.

## Implementation-to-documentation comparison

| Area | Implementation evidence | Documentation result |
|---|---|---|
| PAY-17 Reference Sandbox | `release/demo.mjs`, `foundry/src/run-evidence-projection.ts`, root build/test | README and QA guide describe it as the one bundled executable reference workflow, with the intentionally failing frozen baseline. |
| Engineering Memory | `memory/src/`, 18 passing Memory tests | README, `architecture/memory.md`, and `memory/README.md` describe Markdown-first indexing, graph, freshness, confidence, provenance, and token budgets. |
| Repository Intelligence | `foundry/src/repository-analysis.ts`, `engineering-orchestrator.ts`, `codex-cli-reasoner.ts`, 10 repository-analysis tests | README, core/dashboard READMEs, API design, and repository-intelligence architecture describe it as bounded static analysis—not runtime verification or an execution grant. |
| Generic policy-bound workflow | `generic-policy.ts`, `generic-workflow.ts`, `generic-verifier.ts`, related core tests | Documentation now calls it tested core workflow primitives that require a caller-supplied task and human-reviewed policy; it is not presented as a second bundled demo or a dashboard control. |
| Read-only API | `foundry/src/read-api.ts`, 9 read-API tests | Core README and `architecture/local-read-api.md` list the actual GET routes, including repository analysis, engineering pipeline, and persisted generic-run reads. |
| Dashboard | `foundry/dashboard/src/App.tsx`, production build | Dashboard README now covers Reference Sandbox, Repository Intelligence, and persisted generic-run handoff views. |
| Trust boundaries | `generic-policy.ts`, `generic-worktree-runner.ts`, `generic-verifier.ts`, projection tests | Root README and architecture docs preserve separate human gates, verifier authority, fail-closed PAY-17 evidence, and lack of merge/deploy authority. |

## Corrections made in this documentation refresh

- Replaced PAY-17-only descriptions in the core and dashboard READMEs.
- Replaced the stale local API contract with the routes implemented in
  `foundry/src/read-api.ts`.
- Removed a link to a deleted historical comparison report.
- Replaced obsolete Foundry test count **33** with the verified **61**.
- Removed machine-specific branch and worktree assumptions from manual QA.
- Explicitly separated the bundled PAY-17 demonstration from generic workflow
  primitives and Repository Intelligence.
- Updated `AGENTS.md` required reading to reference an existing quality-gates
  document instead of the removed task board.

## Intentional limitations and non-claims

- PAY-17 is the only bundled end-to-end executable scenario.
- The release bundle contains the frozen baseline, not a checkout-able approved
  candidate or regression worktree. Candidate and replay success are recorded
  independent-verifier evidence unless an engineering workspace preserves those
  disposable worktrees separately.
- Repository Intelligence never executes target repository code. It cannot
  prove runtime behavior, test status, coverage, reachability, or confirmed
  vulnerabilities.
- Generic local-run components are not an action-capable API or dashboard
  workflow. A caller must provide the task and an explicit, human-reviewed
  policy before any candidate worktree exists.
- Codex planner/implementer output is not proof; only independent verifier
  evidence can mark a proof as verified.
- The dashboard is read-only. It has no merge, deployment, production-access,
  approval, or vault-write control.
