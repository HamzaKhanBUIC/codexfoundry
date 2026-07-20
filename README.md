# Codex Foundry

Codex Foundry is a bounded engineering workflow for trustworthy AI-assisted
software changes. It turns one task into a reviewed plan, an isolated Codex
candidate, independent executable proof, explicit human approvals, and durable
Markdown engineering memory.

The MVP intentionally supports one complete scenario: **PAY-17**, a checkout
retry defect that deterministically creates two payments at the frozen
baseline.

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
credential, or generic repository-write authority.

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
2. [Documentation comparison and archival policy](release/DOCUMENTATION_COMPARISON.md)
3. [Manual QA guide](release/MANUAL_QA_GUIDE.md)
4. [MVP scope](product/mvp.md)
5. [System design](architecture/system-design.md)
6. [Engineering memory](architecture/memory.md)
7. [Architecture decisions](ARCHITECTURE_DECISIONS.md)

Historical reports are retained for auditability but are not current operating
instructions; the documentation comparison identifies them explicitly.
