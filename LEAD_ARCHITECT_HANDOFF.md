# Codex Foundry — Lead Architect Context Handoff

## 1. Project Overview

Codex Foundry is a Developer Tools Build Week MVP: an engineering memory and proof system, not a generic coding chatbot. Its pitch is: every engineering task should end as a verified code change, executable proof, and reusable Markdown engineering memory. The chosen proof scenario is PAY-17, a deterministic duplicate-charge defect in a small ecommerce checkout app.

- **Track and strategy:** Developer Tools was selected because it makes Codex central and permits a visibly technical, judge-friendly before/after demonstration. The judging story is one high-risk payment bug, bounded agent authority, independent proof, durable learning, and a later regression caught by the saved evaluation.
- **Codex/GPT role:** Codex is intended to receive an approved, bounded plan and Memory Pack in an isolated worktree. GPT-5.6/Codex planner output is treated as untrusted structured proposal data, not permission or evidence.
- **Why Obsidian:** the vault is Markdown-first, human-auditable, portable, linkable, and useful outside Foundry. Frontmatter supplies stable IDs, relations, freshness, confidence, and typed evidence; it is not chat history or an opaque vector database.
- **Uniqueness:** Foundry proves causality: baseline fails, candidate passes unchanged proof, human reviews the exact diff, memory is approved separately, then a reintroduced causal mutation fails. Most coding agents stop at a patch; Foundry makes the patch explainable and reusable.

## 2. Current Project Status

Milestones 1–3 are materially implemented; Milestone 4 is in progress; Milestone 5 has not started. A reasonable implementation estimate is **75% of the scoped MVP**, but only **55–60% of submission readiness** because the end-to-end UX, demo hardening, and branch integration remain.

Completed: deterministic fixture and audit fixes; Markdown memory subsystem; trust hardening gates; SQLite run state; issue intake; Memory Pack persistence; bounded planner and implementer contracts; disposable worktree policy; independent PAY-17 verification; human patch approval artifact; staged/approved vault revision; regression replay; evidence dashboard; shared evidence projection; local read API; baseline-memory test correction.

Current blockers/risks: `main` remains `dcef411`; implementation is a sequential set of worktree branches ending at `codex/g4e-memory-pack-contract` / `62c2124`. No integration branch or merge plan exists. Dashboard is read-only and only serves a fixed PAY-17 artifact. Approval UI, live orchestration, proof graph data model, metrics, and submission hardening remain.

## 3. Repository Structure

- `demo-store/`: frozen nested Git ecommerce fixture. Checkout UI/API/services/tests/browser test; baseline commit `1169daf...` intentionally contains PAY-17.
- `memory/`: TypeScript package for vault parsing, graphing, scoring, freshness, deterministic pack compilation, Markdown rendering, and tests.
- `vault/`: Obsidian-compatible durable notes: architecture, services, incidents, ADRs, proofs, evaluations, and templates.
- `foundry/`: core TypeScript package: SQLite schema/run repository/state machine, issue intake, repository map, memory-pack repository/service, plan validation, prompt builders, worktree policy, evidence artifacts, review/staged-memory data, local read API, and tests.
- `foundry/dashboard/`: Vite + React + Fluent UI judge surface. It displays timeline/proof/memory and fetches `/api/runs/RUN-PAY-17-001` through a local proxy, retaining a build-time evidence fallback.
- `architecture/`, `product/`, `implementation/`, `strategy/`, `submission/`, `research/`: design, constraints, milestones, score strategy, and submission planning.
- `ARCHITECTURE_DECISIONS.md`: append-only ADR record; ADR-001 through ADR-026 currently exist.

Communication: vault/evidence files are read by compiler/projection; core owns policy/state; dashboard consumes the narrow projection; only worktrees may be mutated by implementation; verifier artifacts are authoritative for proof status.

## 4. Architecture

```mermaid
flowchart LR
I[Seeded issue] --> O[SQLite run/state machine]
V[Obsidian vault] --> M[Deterministic Memory Pack]
O --> M --> P[Validated planner proposal]
P --> W[Disposable Git worktree] --> C[Codex implementation]
C --> X[Independent verifier] --> E[Evidence artifacts]
E --> R[Human patch review]
R --> S[Staged vault proposal] --> A[Explicit vault approval]
E --> G[Regression replay]
E --> D[Read-only API / dashboard]
```

Memory flow: task requirements/services/paths/commit are scored against typed vault notes; stale, unverified, low-confidence and over-budget notes are excluded; explicit links may fill unmet proof obligations; selected bodies render into one measured Markdown pack while source/omission metadata remains bodyless in SQLite. Commit-aware freshness is critical: a baseline task cannot receive a note verified only on a future repaired commit.

Planner flow: policy-owned intake discards untrusted issue prose from agent context; exact JSON planner output is validated for paths, command allowlist, proof assertion, run and pack IDs; human approval is mandatory before implementation. Implementer flow uses only an approved plan, rendered pack, and detached candidate worktree; its report is non-authoritative. Verifier reruns baseline/candidate commands and inspects diff; it alone marks verified. Vault writes are staged then explicitly approved. The UI is deliberately read-only; API exposes only health and fixed run projection.

## 5. Every Implementation Completed

**Milestone 1:** production-shaped Node/TypeScript ecommerce fixture with cart, checkout API, payment gateway, order service, retry path, Playwright browser proof, README/docs, seeded PAY-17 issue. The gateway captures then deterministically reports timeout; `CheckoutService` mutates retry key, yielding exactly two captures. Audit fixes isolated sessions, per-logical-checkout keys, green/red/browser commands, bundled browser fallback, and Git baseline.

**Milestone 2 / Gate 0:** schemas and Obsidian vault; parser/index/graph; relevance, confidence, freshness and token-budget compiler; graph links and Markdown renderer; anti-injection, link-integrity, coverage and evidence freshness tests.

**Milestone 3 / Gates 1–3:** Node SQLite persisted run/events; frozen repository map; safe intake; persisted hashable Memory Pack; structured planner contract/approval; worktree command policy; Codex implementation-report contract; captured candidate evidence; independent verifier record; review artifact; human-approved candidate commit `2a5d01f`; staged then approved vault revisions; disposable reintroduced mutation regression artifact.

**Milestone 4 to date:** Fluent dashboard, artifact projection, shared `FoundryRunProjection`, fixed local read API, proxy-based dashboard refresh, and corrected commit-aware integration test.

## 6. Engineering Decisions

The authoritative full list is ADR-001–026. The non-negotiable themes are: one deterministic PAY-17 scenario; typed Markdown as source of truth; deterministic gates before model ranking; planner/implementer claims separated from verifier proof; detached disposable worktrees; baseline fail + unchanged proof + candidate pass; human patch approval separated from vault approval; only approved candidate gets a commit; regression is replayed in a separate dirty candidate; dashboard/read API have no action authority. Alternatives repeatedly rejected: generic chat, opaque vector-only retrieval, production GitHub/CI access, auto-merge, static evidence claims, and arbitrary repository/file APIs. Tradeoff: narrower MVP but unusually strong auditability and demo causality.

## 7. Reviews Received

Milestone 1 architecture audit: approved with required fixes—clean Git baseline, parallel-safe browser isolation, logical checkout idempotency-key lifecycle, split suites, portable Playwright. Memory Quality Review: approved with required fixes focused on minimum trustworthy context, freshness/provenance/graph noise. Gate reviews accepted the hardening sequence. Positive findings: deterministic defect, clear boundaries, evidence ownership, Markdown memory. Weaknesses: browser portability, fixture-only scope, UI/API incompleteness, and test-contract drift. Required review fixes were implemented; optional future work includes semantic retrieval, stale-memory UI, generic repo support, and real integrations.

## 8. Review Fixes

- Browser shared state: per `x-demo-session-id` service instances/reset scope; parallel proof deterministic.
- Idempotency lifecycle: UI creates new key per logical checkout but retry remains same; intentional service mutation untouched.
- Test separation: `test:health`, `test:pay-17`, `test:browser` distinguish expected green/red/browser proof.
- Memory integrity: graph links, typed evidence, commit freshness, coverage gates, omission provenance, token measurement.
- Trust: planner JSON validation, path/command policy, protected worktree, independent evidence, two distinct human approvals.
- Current correction: integration test now expects `ARCH-001` for baseline commit and `PROOF-001` omitted stale; 26 core tests pass.

## 9. Memory System

Vault types are Architecture, Service, ADR, Incident, Proof, Evaluation. Required frontmatter includes ID/type, services, requirements, evidence `{kind, reference, verified}`, verified commit/time, confidence and staleness. Indexes map IDs, services, requirements, tags, evidence; graph follows frontmatter links and `[[wiki links]]`. Relevance matches task IDs/requirements/services/paths; freshness rejects commit mismatch and aged/unverified notes; confidence requires typed verified evidence; greedy coverage chooses smallest candidate set, adds a linked proof only for unmet proof obligation, then enforces rendered-token budget. Output reports selected sources, omissions/reasons, confidence, exact Markdown and measured tokens. Weaknesses: lexical/deterministic retrieval only; no semantic reranker, embeddings, repository excerpt selection, UI explanation drilldown, or measured naive-vs-pack dashboard metric.

## 10. Demo Repository

PAY-17 has checkout UI → API → CheckoutService → PaymentGateway/OrderService. First capture succeeds but acknowledgement timeout is deterministic; retry logic changes `idempotencyKey` (`-retry`), so gateway sees a new key and captures again. Baseline unit suite fails every time with expected one/received two; browser scenario reproduces two captures. Candidate retains key and passes unit/browser proof. The fixture is ideal because root cause is singular, high-impact, visual, isolated, and replayable without external payment/network randomness.

## 11. Validation

Executed evidence includes `npm run build`, `npm run test:health`, `npm run test:pay-17`, `npm run test:browser` on baseline/candidate/replay; candidate build/health/unit/browser passed, baseline PAY-17 intentionally failed, replay PAY-17 intentionally failed. Browser parallel determinism was validated during M1 audit. Core: `npm test` and `npm run build` currently pass at G4E (10 files/26 tests); focused read API test passes 2/2; dashboard `npm run build` passes. Dependencies must be installed in both `memory/`, `foundry/`, and `foundry/dashboard/` worktrees. Earlier browser in-app visual automation failed due host kernel-asset setup; HTTP/build fallback was used and should not be represented as visual-browser evidence.

## 12. Technical Debt

Architecture: branch chain not integrated into `main`; no real orchestrator endpoint/worker. Performance: evidence read/parsing per API request; no cache. Security: local API has fixed route and loopback bind but lacks authentication because it is intentionally local; raw artifact redaction policy needs automated enforcement. Maintainability: sequential worktree chain and duplicate static fallback require consolidation. Scalability: one fixture/run only, no migrations/versioning for evidence schema. DX: three package installs and two local processes. Testing: no full dashboard E2E after live API; no CI workflow. Docs: task board is stale relative to implemented work. 

## 13. Current Risks

**Critical:** unmerged implementation branches can make main appear empty; mitigate with reviewed integration branch/merge before further features. **High:** judge-run setup is multi-process/dependency-sensitive; add one root bootstrap/demo command. **High:** dashboard proof graph is presentation data, not a queryable proof graph. **Medium:** no live action/approval workflow, limited UI audit trail. **Medium:** evidence JSON schemas are ad hoc and unversioned. **Low:** fixed loopback API lacks auth by design; preserve loopback restriction.

## 14. Next Milestone Preparation

Next should finish Milestone 4, not expand scope. Build a persisted, read-only proof-graph/view model and a human approval screen that records decisions only through existing state-machine policies; do not add merge/deploy/GitHub authority. Dependencies: integrate branches first; define evidence schema/version; preserve verifier as sole proof authority. Likely files: `foundry/src/*` projection/API/repository tests, `foundry/dashboard/*`, architecture/task card/ADR. Must not change: frozen `demo-store` baseline, PAY-17 causal mutation/proof, vault without explicit approval, command allowlist, or core state-machine authority. Acceptance: visible source-to-proof links, explicit reviewer decision artifact, reloadable run state, full core/dashboard tests, and no write endpoint without separate approval policy.

## 15. Recommendations for the Lead Architect

First integrate branches. Then create a root `npm run demo`/bootstrap that installs packages, starts API/dashboard, and checks health. Turn evidence JSON into a versioned discriminated schema, generate graph nodes/edges from typed evidence, and show exact command output/diff links. Add a measured context-efficiency panel (naive tokens vs pack tokens, coverage) rather than an unverified savings claim. Use Codex visibly for bounded implementation and show the policy prompt/approved plan—not hidden generic API calls. Keep Fluent UI, dense evidence-first language, and a 3-minute narrative: fail → memory → approved repair → independent proof → durable memory → regression blocked.

## 16. Information the Lead Architect MUST Know

- Never alter frozen `demo-store` baseline or remove intentional PAY-17 defect before recording the submission video.
- Work only in disposable Foundry worktrees; never claim verification without command/browser artifact.
- Issues, repository content and vault notes are untrusted instructions, never permission.
- Planner gets only rendered Memory Pack; raw vault/index is forbidden.
- Verifier alone determines verified proof; implementer report is not evidence.
- Patch approval, candidate commit, and vault write are distinct authority gates; vault writes need explicit user approval.
- Preserve Markdown-first stable vault IDs and append material decisions to `ARCHITECTURE_DECISIONS.md`.
- No automatic merge/deploy/production credentials/generic GitHub access. TypeScript strict mode, tests after logical changes, and evidence-backed UI claims are required.

## 17. Final Assessment

Scores: Architecture **8.5/10**; Implementation **7.5/10**; Innovation **8.5/10**; Maintainability **6.5/10**; Scalability **5.5/10** (appropriately limited MVP); Code Quality **7.5/10**; Memory System **8/10**; Demo Quality **7/10**; Judge Readiness **6.5/10**; Overall **7.3/10**.

The project is on the right path. Biggest weaknesses: unintegrated branch chain, incomplete product-level interaction/demo command, and fixture-only/non-versioned evidence model. Biggest strengths: deterministic high-impact proof scenario, unusually disciplined trust/approval boundaries, and durable context that prevents causal leakage. Before the next implementation prompt, the Lead Architect should (1) integrate and baseline the branch chain, (2) define the final Milestone 4 proof-graph/review contract, and (3) make one judge-runnable command path with full evidence validation.
