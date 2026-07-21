# Codex Foundry

Codex Foundry is a bounded engineering workflow for trustworthy AI-assisted
software changes. It offers a deterministic proof sandbox, evidence-backed
repository preparation, and a policy-bound generic local-run core, so teams
can distinguish demonstrated trust from useful real-world context.

## Two product modes

- **Reference Sandbox** keeps PAY-17 immutable: a fully recorded checkout
  repair with independent verification, separate approvals, durable memory,
  and regression replay.
- **Analyze Repository** accepts a local Git repository path and derives
  evidence-cited Git history, languages, framework/package/build/test markers,
  entrypoints, static module/dependency relationships, architecture/domain
  signals, security/debt/complexity review signals, an Engineering Intelligence
  Dashboard (Repository DNA, a planning-readiness assessment, executive
  briefing, and repository story), an interactive Architecture Explorer with
  static change-impact chains, an explainable engineering report card, a
  bounded Memory Pack, and Principal Engineer recommendations. It is read-only:
  it may query Git metadata but does not run project
  scripts, builds, tests, package-manager commands, create a worktree, verify
  a patch, approve a plan, or write the vault. An explicit opt-in can add two
  citation-checked, read-only Codex semantic advisors; they cannot change the
  repository or grant authority.

**PAY-17** remains the bundled canonical scenario: a checkout retry defect
that deterministically creates two payments at the frozen baseline. The core
also provides a policy-bound generic local-run workflow for arbitrary Git
repositories: human-approved baseline, paths and direct commands → disposable
Codex worktree → independent verification → separate approvals → staged
Markdown memory and optional regression replay.

## What is implemented

```text
Issue intake → baseline Memory Pack → human-approved plan → disposable Codex worktree
→ independent verification → patch approval → separate vault approval
→ reusable engineering memory → regression replay
```

- Deterministic Node/TypeScript ecommerce fixture with checkout, cart, API,
  payment/order services, retry behavior, unit tests, and browser proof.
- Commit-aware Obsidian Markdown memory: typed frontmatter, graph, freshness,
  confidence, provenance, minimum-context selection, and token budget.
- Bounded plan and implementation contracts. Codex may only work in a
  disposable candidate within approved paths and commands.
- Persisted generic-run evidence shows the policy ceiling, Memory Pack,
  acceptance criteria, proposed scope, proof contract, risks, human gates,
  exact Codex input/output receipts, and independent verifier results in one
  read-only handoff view.
- Verifier-owned evidence. Implementer claims are never proof.
- Read-only local dashboard, interactive proof graph, review, Memory Pack, and
  evidence views backed by one validated projection.
- Explicit persisted records for intake, plan approval, implementation,
  verification, patch approval, and vault approval. Missing or contradictory
  evidence fails closed.

## Proven PAY-17 state

| Artifact | Current recorded value |
|---|---|
| Frozen baseline | `93ef28fa1737767a4a0c3b38fa8f9a6158980bb6` |
| Approved candidate | `63417cadd2ed28ec0a0dd7832be900285119c885` |
| Baseline proof | `npm run test:pay-17` exits `1`; it receives two payments |
| Candidate proof | Build, health, PAY-17, and browser proof exit `0` |
| Regression replay | Reintroducing only the retry-key mutation makes PAY-17 fail again |

The frozen fixture is never repaired or merged. The approved candidate remains
an isolated disposable worktree; Foundry has no merge, deployment, production
credential, or authority to write the frozen baseline.

## Quick start

Requires Node 24.x and npm 11.x or compatible. From the repository root:

```powershell
npm install
npm run build
npm test
npm run demo
```

`npm install` also installs the nested dashboard dependencies. `npm run build`
builds Memory, Foundry core, then dashboard. `npm test` runs Memory and Foundry
core tests; the dashboard currently has no separate test script.

`npm run demo` validates the evidence set, materializes the immutable fixture
bundle under ignored `.foundry-runtime/demo-store`, checks the exact baseline
commit and required fixture commands, probes browser availability, then starts:

- Dashboard: `http://127.0.0.1:4173`
- Read-only API health: `http://127.0.0.1:4174/api/health`
- Fixed run projection: `http://127.0.0.1:4174/api/runs/RUN-PAY-17-001`

Playwright Chromium is preferred. An installed stable Google Chrome is a
tested fallback. If neither is available, the browser runner prints a clear
installation prerequisite instead of hanging.

## Trust model

- Issue text, repository content, and vault notes are untrusted data.
- Planner output is a validated proposal; only a human-approved plan permits a
  candidate worktree.
- The independent verifier is the only component that may mark proof
  `verified`.
- Patch approval and vault-write approval are separate human decisions.
- The API and dashboard are read-only and cannot alter Git, vault, run, or
  production state.
- A missing intake/plan record returns `503 evidence_incomplete`; contradictory
  replay evidence returns `503 evidence_contradiction`.

## Read next

1. [Current project handoff](release/PROJECT_MASTER_HANDOFF.md)
2. [Manual QA guide](release/MANUAL_QA_GUIDE.md)
3. [MVP scope](product/mvp.md)
4. [System design](architecture/system-design.md)
5. [Repository Intelligence](architecture/repository-intelligence.md)
6. [Engineering memory](architecture/memory.md)
7. [Architecture decisions](ARCHITECTURE_DECISIONS.md)

The dashboard landing page makes the sandbox and repository-analysis roles
explicit before any detail is shown.
