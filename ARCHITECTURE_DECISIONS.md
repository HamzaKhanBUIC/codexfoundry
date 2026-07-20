# Codex Foundry Architecture Decisions

This is the living Architecture Decision Record (ADR) for Codex Foundry. At
the end of every milestone, append any material architectural decision made
during that milestone. A decision is not complete until its rationale and
trade-offs are recorded here.

## Entry format

### ADR-XXX — Short decision title

- **Status:** Accepted | Superseded | Rejected
- **Milestone:** N
- **Decision:** What we chose.
- **Why:** The constraints and intended outcome.
- **Alternatives considered:** The credible options considered.
- **Why rejected:** Why each alternative was not selected.
- **Consequences:** Important benefits, limits, or follow-up work.

---

## ADR-001 — Build one deterministic checkout defect as the Foundry proof scenario

- **Status:** Accepted
- **Milestone:** 0–1
- **Decision:** Use a small ecommerce checkout application with the PAY-17
  duplicate-charge defect as the sole end-to-end MVP scenario.
- **Why:** A duplicate charge is concrete, high impact, easy to understand in
  a three-minute demo, and supports planning, implementation, testing, browser
  verification, proof generation, memory write-back, and regression replay.
- **Alternatives considered:** A generic code-review assistant; multiple
  unrelated bugs; a purely synthetic repository with no UI.
- **Why rejected:** Generic and multi-scenario demonstrations dilute the proof
  of a complete Foundry workflow. A UI-free fixture weakens the visible
  verification story for judges.
- **Consequences:** Scope remains intentionally narrow until the recorded demo
  is complete; PAY-17 must be preserved until Foundry repairs it in a later
  milestone.

## ADR-002 — Preserve PAY-17 as a deterministic retry/idempotency failure

- **Status:** Accepted
- **Milestone:** 1
- **Decision:** The payment gateway captures the first charge and deterministically
  reports a retryable acknowledgement timeout. `CheckoutService` mutates the
  idempotency key on retry, causing a second capture.
- **Why:** The failure has one clear root cause, reproduces on every run without
  timing or randomness, and has an unambiguous repair contract: one logical
  checkout must produce exactly one payment.
- **Alternatives considered:** A random gateway timeout; a frontend double-click
  defect; a database race condition.
- **Why rejected:** Those alternatives are flaky, introduce multiple plausible
  causes, or make reliable browser proof harder.
- **Consequences:** The intentionally mutated retry key is protected demo
  behavior and must not be changed before the Foundry repair milestone.

## ADR-003 — Isolate checkout state by browser session

- **Status:** Accepted
- **Milestone:** 1 audit fixes
- **Decision:** Create payment, order, and checkout service instances per
  explicit `x-demo-session-id`; the reset endpoint resets only that session.
- **Why:** Browser workers and repeat runs need deterministic, independent
  state. A reset from one proof must never erase another active proof.
- **Alternatives considered:** One process-global in-memory store with a global
  reset; serial-only browser execution; a separate server process per test.
- **Why rejected:** Global state races under parallel runs; serial execution
  conceals the defect; process-per-test adds unnecessary fixture complexity.
- **Consequences:** Browser clients must supply a session identifier, and test
  sessions must be unique. This is fixture isolation, not production tenancy.

## ADR-004 — Create idempotency keys per logical checkout, not per page load

- **Status:** Accepted
- **Milestone:** 1 audit fixes
- **Decision:** The UI generates a fresh idempotency key for each new checkout
  after a prior checkout completes, while retaining the same key during a
  single request's retry sequence.
- **Why:** Two user-initiated checkouts must be distinct operations, whereas
  retries of one operation must be deduplicable. This keeps the fixture's
  intended PAY-17 mutation isolated to `CheckoutService`.
- **Alternatives considered:** One hard-coded key; a new key for every retry;
  server-generated keys only.
- **Why rejected:** A hard-coded key merges independent checkouts; per-retry
  generation changes the intentional defect; server-only generation obscures
  the client request identity demonstrated by the scenario.
- **Consequences:** PAY-17 still produces two captures because the service
  intentionally mutates the retry key, not because the UI reuses a key.

## ADR-005 — Separate green health, red proof, and browser proof commands

- **Status:** Accepted
- **Milestone:** 1 audit fixes
- **Decision:** Expose independent `test:health`, `test:pay-17`, and
  `test:browser` commands.
- **Why:** The known defect must remain visibly red without making the normal
  health signal ambiguous. Browser proof is a distinct acceptance layer.
- **Alternatives considered:** One all-tests command; skipping the defect test;
  making the defect test pass through an inverted assertion.
- **Why rejected:** One command conflates expected and unexpected failures;
  skipping removes the proof contract; inverted assertions hide the actual
  regression condition.
- **Consequences:** CI and judges can intentionally expect `test:pay-17` to
  fail until Foundry has implemented and verified the repair.

## ADR-006 — Prefer bundled Playwright Chromium with a documented Chrome fallback

- **Status:** Accepted
- **Milestone:** 1 audit fixes
- **Decision:** The browser runner first probes bundled Playwright Chromium and
  falls back to an installed Chrome channel with clear output; it fails
  gracefully when neither is usable.
- **Why:** Bundled browsers are most portable for judges, but the fixture must
  remain runnable in environments where browser installation is incomplete.
- **Alternatives considered:** Require a system browser; require only bundled
  Chromium; omit browser verification.
- **Why rejected:** A system-only dependency reduces portability; bundled-only
  creates avoidable setup failure; omitting browser proof weakens the demo.
- **Consequences:** Setup documentation instructs `npx playwright install
  chromium`; the current development environment uses the Chrome fallback.

## ADR-007 — Keep durable engineering memory in typed Obsidian Markdown

- **Status:** Accepted
- **Milestone:** 2
- **Decision:** Store Architecture, Service, ADR, Incident, Proof, and
  Evaluation memory as Markdown documents with validated YAML frontmatter,
  stable IDs, evidence references, and explicit Obsidian links.
- **Why:** The vault must remain inspectable, portable, reviewable, and useful
  without Foundry. Typed frontmatter makes relations deterministic while
  preserving ordinary Markdown authoring.
- **Alternatives considered:** A SQLite-only memory store; an opaque vector
  database; free-form notes without a schema.
- **Why rejected:** A database-only design hides durable knowledge from humans;
  a vector store neither provides authoritative evidence nor portable review;
  unstructured notes cannot support reliable selection or graph traversal.
- **Consequences:** The in-memory index and graph are derived from vault files;
  later SQLite state may reference a pack but cannot replace the vault as the
  durable source of truth.

## ADR-008 — Gate deterministic Memory Pack selection before model assistance

- **Status:** Accepted
- **Milestone:** 2
- **Decision:** Rank Memory Pack candidates from task relationships, explicit
  links, freshness, confidence, and token budget first. Exclude stale,
  unverified, low-confidence, and over-budget sources by default. Any future
  GPT-5.6 ranking is bounded to eligible candidates and cannot bypass the
  gates.
- **Why:** Foundry must explain why a source was included and must not let a
  model reintroduce stale or unverifiable context into an engineering task.
- **Alternatives considered:** Model-only retrieval; embedding/vector search as
  a required dependency; sending the full vault to the model.
- **Why rejected:** These approaches are opaque, introduce an unnecessary MVP
  service, undermine deterministic tests, and violate the minimum-context
  principle.
- **Consequences:** The first implementation uses no model or vector database.
  Later semantic ranking augments but does not replace provenance-based
  selection.

## ADR-009 — Sequence the memory foundation before autonomous workflow services

- **Status:** Accepted
- **Milestone:** 2
- **Decision:** Implement the engineering memory foundation before planner,
  Codex execution, worktree orchestration, verifier, PR, or UI services.
- **Why:** The workflow must have a trustworthy, testable context boundary
  before later agents consume it. This preserves the demo repository while
  creating a stable integration contract for the remaining milestones.
- **Alternatives considered:** Build the entire agent loop first; build a UI
  over mock memory; combine memory write-back with the initial reader.
- **Why rejected:** Those options expand scope, obscure memory correctness, or
  violate the two-step human approval rule for persistent vault changes.
- **Consequences:** Milestone 3 integrates the existing compiler; direct vault
  writes remain deferred until a staged approval flow exists.

## ADR-010 — Gate all Planner context through the deterministic Memory Pack

- **Status:** Accepted
- **Milestone:** Gate 0 trust hardening
- **Decision:** A future Planner may receive only the rendered, measured
  Memory Pack and its bodyless omission metadata; it must not receive raw vault
  documents or the in-memory vault index.
- **Why:** The compiler can enforce freshness, repository-commit matching,
  confidence, evidence shape, minimum coverage, directional links, and token
  accounting only at this boundary.
- **Alternatives considered:** Send the full vault to the Planner; let the
  Planner query the vault/index directly; rely on a model to ignore stale or
  malicious notes.
- **Why rejected:** Each alternative bypasses deterministic provenance and
  makes stale or untrusted context difficult to prove absent.
- **Consequences:** Gate 1 must persist the rendered payload and its source /
  omission records as the planner input artifact. Independent evidence
  execution and vault write approval remain later gates.

## ADR-011 — Use built-in Node SQLite for local Foundry run state

- **Status:** Accepted
- **Milestone:** Gate 1 foundation
- **Decision:** Persist local Foundry run state and append-only transition
  events through Node 24's built-in `node:sqlite` driver.
- **Why:** SQLite is the accepted application-state store, while the built-in
  driver avoids a hosted service or native dependency for a judge-runnable MVP.
- **Alternatives considered:** JSON files; a third-party SQLite driver; hosted
  Postgres or a cloud workflow service.
- **Why rejected:** JSON lacks transactional queryable state; third-party or
  hosted services add installation, credential, or network risk without demo
  value.
- **Consequences:** The core package requires Node 24. Later tables are added
  through explicit migrations; the vault remains the durable memory source.

## ADR-012 — Pin orchestration to a validated frozen fixture map

- **Status:** Accepted
- **Milestone:** Gate 1 foundation
- **Decision:** Derive a small read-only map from the frozen PAY-17 fixture
  only after its Git commit, required service/proof paths, and judge-facing
  commands validate.
- **Why:** Planner and verifier inputs need deterministic source locations and
  commands without storing unrestricted repository content or relying on a
  generic search system.
- **Alternatives considered:** Scan arbitrary repositories; persist all source
  files; rely on a model to discover paths and commands.
- **Why rejected:** Those options weaken determinism, increase context and
  security risk, or exceed the single-fixture MVP scope.
- **Consequences:** Any baseline mismatch or missing map element fails closed.
  Generic repository support remains explicitly out of scope.

## ADR-013 — Treat Codex planning output as an untrusted, human-approved proposal

- **Status:** Accepted
- **Milestone:** Gate 2 issue → memory → plan integration
- **Decision:** Render a bounded GPT-5.6/Codex planning prompt from the trusted
  task, validated repository map, and exact persisted Memory Pack. Accept only
  exact JSON, validate paths/commands/proof assertions against policy, and
  require a human approval or rejection before implementation may begin.
- **Why:** A plan can be useful without granting a model execution authority.
  This preserves the visible Codex planning role while keeping the proof
  contract, command policy, and state transition enforceable and reviewable.
- **Alternatives considered:** Allow free-form Planner text; let the Planner
  create its own worktree or run commands; embed a credentialed generic model
  API wrapper in the MVP.
- **Why rejected:** Free-form text is not a reliable handoff; planner execution
  bypasses the human gate and worktree boundary; a generic API wrapper adds
  credential/operational risk and weakens the Codex-first product story.
- **Consequences:** The product records only a validated structured proposal,
  not private reasoning. Gate 3 must receive an already approved plan and may
  not reinterpret it as permission beyond its fixed paths and commands.

## ADR-014 — Separate Codex implementation reporting from proof evidence

- **Status:** Accepted
- **Milestone:** Gate 3 implementation boundary
- **Decision:** Hand Codex an already approved plan, the exact persisted Memory
  Pack, and a created candidate worktree. Accept only a narrow JSON report for
  its claimed paths, commands, summary, risks, and non-authoritative confidence;
  capture the actual diff and command output separately for the Verifier.
- **Why:** A model report is useful to review the handoff but must never become
  proof that a high-risk payment repair succeeded.
- **Alternatives considered:** Treat Codex prose as evidence; allow free-form
  final responses; ask Codex to certify verification.
- **Why rejected:** Each alternative mixes agent claims with independent
  evidence, permits authority leakage, and weakens a judge-visible trust story.
- **Consequences:** The next execution task must persist raw command/diff
  artifacts and the later Verifier alone may determine PAY-17 proof status.

## ADR-015 — Preserve the repair as a dirty candidate until independent verification

- **Status:** Accepted
- **Milestone:** Gate 3 candidate implementation
- **Decision:** Keep the PAY-17 repair as an uncommitted diff in a detached,
  Foundry-owned candidate worktree and record the implementer's command results
  as an explicitly unverified artifact.
- **Why:** The frozen baseline must remain reproducible, and an implementation
  result must not look like verified evidence or an approved merge merely
  because its own commands passed.
- **Alternatives considered:** Modify the frozen fixture; commit and treat the
  candidate as approved; discard all execution output until the verifier runs.
- **Why rejected:** The first destroys the demo baseline; the second conflates
  implementation with approval; the third loses useful auditability for the
  verifier and judge timeline.
- **Consequences:** G3D must rerun the proof independently against the same
  candidate. Only its evidence may advance the run to review.

## ADR-016 — Require baseline failure and unmodified unit proof for PAY-17 verification

- **Status:** Accepted
- **Milestone:** Gate 3 independent verification
- **Decision:** Verification records both the frozen baseline failure and the
  repaired candidate success, while rejecting a candidate that changes the
  PAY-17 unit proof itself or any path outside the approved boundary.
- **Why:** A passing candidate test is meaningful only when the original test
  proved the defect and the repair did not weaken its unit-level contract.
- **Alternatives considered:** Verify only candidate green commands; trust the
  implementer report; permit the proof test to change with the repair.
- **Why rejected:** Candidate-only success lacks before/after causality;
  implementer reports are not evidence; changing the core proof could mask a
  regression.
- **Consequences:** PAY-17 has an auditable fail-before/pass-after evidence
  chain. Browser proof may evolve from reproduction to repaired behavior, but
  the unit contract remains fixed.

## ADR-017 — Make human review a bounded patch decision, not a merge capability

- **Status:** Accepted
- **Milestone:** Gate 3 review artifact
- **Decision:** Present the exact verified candidate diff, its proof contract,
  evidence, and limitations in a review bundle that requires an explicit human
  approve/reject decision without exposing merge or deployment authority.
- **Why:** A reviewer needs enough causal evidence to judge a high-risk payment
  repair, while Foundry must preserve the distinction between review approval
  and production release.
- **Alternatives considered:** Auto-merge after green checks; a narrative-only
  summary; let review approve vault writes implicitly.
- **Why rejected:** Auto-merge exceeds MVP authority; narrative hides the
  patch; implicit vault permission violates the separate durable-memory gate.
- **Consequences:** The next action remains human-controlled. Any candidate
  commit or memory proposal is a separate, reviewable operation.

## ADR-018 — Commit only the human-approved candidate, never the frozen baseline

- **Status:** Accepted
- **Milestone:** Gate 3 human patch approval
- **Decision:** After explicit patch approval, commit the verified diff only in
  the detached disposable candidate, retaining the frozen baseline as its
  parent and recording both commit identities.
- **Why:** A stable candidate commit provides durable provenance for later
  proof and memory proposals without granting merge authority or altering the
  reproducible defect baseline.
- **Alternatives considered:** Leave the approved diff uncommitted; merge it
  into the frozen fixture; create an external GitHub pull request.
- **Why rejected:** An uncommitted diff has weaker provenance; merging destroys
  the baseline; a real GitHub integration is excluded from the MVP.
- **Consequences:** Later evidence can reference `2a5d01f`; the candidate may
  be disposed after its approved artifacts are persisted, while the baseline
  remains available for regression replay.

## ADR-019 — Stage memory revisions against existing stable IDs before vault write

- **Status:** Accepted
- **Milestone:** Gate 3 staged memory proposal
- **Decision:** Stage complete revisions of the existing PAY-17 Incident, ADR,
  Proof, and Evaluation notes outside the vault, preserving their IDs and
  recording typed evidence against the approved candidate commit.
- **Why:** The prior notes document the defective baseline. Revising them with
  explicit fail-before/pass-after evidence retains that history while keeping
  retrieval fresh for the repaired commit; duplicate parallel notes would add
  graph noise and ambiguous authority.
- **Alternatives considered:** Add four new IDs; overwrite the vault directly;
  leave baseline notes unchanged.
- **Why rejected:** New IDs fragment one incident; direct writes bypass human
  approval; unchanged notes become stale for future repaired-commit tasks.
- **Consequences:** A separate human approval must authorize copying the four
  exact staged files into their manifest targets. The deliberate regression
  remains a declared future evaluation until it produces its own evidence.

## ADR-020 — Revalidate minimum-context selection after approved memory updates

- **Status:** Accepted
- **Milestone:** Gate 3 approved vault write
- **Decision:** After an approved vault update, rerun the Memory Pack suite and
  update its deterministic expectation only when the refreshed, verified
  metadata legitimately changes the smallest trustworthy source set.
- **Why:** Memory is product behavior, not static documentation. A note that
  gains a direct verified source reference can correctly replace a broader or
  older note in a minimum-context pack.
- **Alternatives considered:** Keep the old fixture expectation regardless of
  evidence; suppress the changed note from retrieval; skip validation after a
  human-approved write.
- **Why rejected:** The first two options conceal a real selection change; the
  third risks silent retrieval regressions.
- **Consequences:** The PAY-17 pack now selects `ADR-001` and `PROOF-001` as
  its direct minimum context. The vault retains the same stable document IDs
  and explicit links.

## ADR-021 — Prove regression protection with a disposable reintroduced defect

- **Status:** Accepted
- **Milestone:** Gate 3 regression replay
- **Decision:** Starting from the approved repair commit, reintroduce only the
  retry-key mutation in a separate disposable candidate and require the
  unchanged PAY-17 assertion to fail before declaring the saved evaluation
  effective.
- **Why:** A green repaired test alone does not demonstrate that it will catch
  the real defect when it returns. Replaying the exact causal mutation provides
  that evidence without altering the frozen baseline or approved candidate.
- **Alternatives considered:** Rely on historical baseline failure; weaken the
  assertion into a mock check; mutate the approved candidate or frozen fixture.
- **Why rejected:** Historical failure is not replay evidence; mock checks do
  not prove the real causal path; mutating non-disposable repositories violates
  the trust boundary.
- **Consequences:** The replay produced a deliberate failing artifact and the
  regression candidate is blocked from merge. A future vault update for this
  result requires separate human approval.

## ADR-022 — Start the dashboard as a read-only evidence surface

- **Status:** Accepted
- **Milestone:** 4, dashboard foundation
- **Decision:** Build the first judge-facing Foundry dashboard as a local
  Fluent UI React application that renders the actual PAY-17 evidence and
  approval history, while deferring API-backed actions until their policy and
  persistence contracts are implemented.
- **Why:** The completed workflow needs a clear, judge-runnable story now. A
  read-only surface makes evidence, provenance, and human control visible
  without falsely implying that buttons can perform unimplemented operations.
- **Alternatives considered:** Build generic repository chat first; place
  placeholder approval buttons in the UI; delay all UI until every endpoint is
  complete.
- **Why rejected:** Generic chat dilutes Foundry's proof system; placeholder
  actions risk trust-boundary confusion; a delayed UI hides the product value
  already demonstrated by the deterministic scenario.
- **Consequences:** The dashboard must label its evidence clearly and remain
  read-only in this slice. Later API work may replace local data with durable
  run records without changing the user-facing trust model.

## ADR-023 — Project evidence artifacts into the dashboard at build time

- **Status:** Accepted
- **Milestone:** 4, artifact projection
- **Decision:** Use a Vite virtual module to read the fixed PAY-17 verifier,
  approval, vault-write, and regression JSON artifacts and expose a narrow,
  read-only run projection to the React dashboard.
- **Why:** Judge-visible values must come from recorded proof artifacts rather
  than copied UI constants. A local build-time projection is portable and adds
  no service, credential, or write authority.
- **Alternatives considered:** Keep static UI values; add a live API now;
  allow the UI to read arbitrary files in the browser.
- **Why rejected:** Static values drift from evidence; a live API expands this
  slice beyond its trust and persistence contract; browser file access is not
  portable or safe.
- **Consequences:** A missing required artifact prevents a valid dashboard
  build. The projection is refreshed on rebuild or dev-server restart; later
  API work must preserve the same artifact ownership and read-only default.

## ADR-024 — Centralize judge-visible evidence interpretation in the core

- **Status:** Accepted
- **Milestone:** 4, shared evidence projection
- **Decision:** Extract the PAY-17 evidence-to-display projection into the
  core package and have the dashboard consume that one read-only adapter.
- **Why:** The same proof facts must not be reinterpreted independently by the
  Vite build, dashboard, and future local API.
- **Alternatives considered:** Keep projection logic in Vite; let each UI
  component read evidence directly; add a database migration first.
- **Why rejected:** Those options duplicate trust-sensitive mapping logic,
  expose raw artifacts broadly, or add state that the completed fixture does
  not need.
- **Consequences:** Missing required commands or approval fields fail closed.
  A future API may expose the projection but cannot grant evidence ownership or
  write authority.

## ADR-025 — Expose one fixed local read endpoint before any action endpoint

- **Status:** Accepted
- **Milestone:** 4, local read API
- **Decision:** Serve only the completed PAY-17 projection and health status
  from a loopback-only local HTTP API, with all other paths and methods denied.
- **Why:** The dashboard needs live evidence loading without exposing generic
  repository access or confusing a proof viewer with an orchestration control
  plane.
- **Alternatives considered:** Browser filesystem reads; a generic artifact
  API; add approval actions with the first endpoint.
- **Why rejected:** Browser filesystem reads are not portable; generic access
  broadens the trust boundary; action endpoints require separate human-review
  and state-transition contracts.
- **Consequences:** The dashboard can refresh the authoritative projection in
  local development. It remains incapable of changing a run, vault, Git state,
  or production system.

## ADR-026 — Select memory against the task repository commit

- **Status:** Accepted
- **Milestone:** 4, Memory Pack contract correction
- **Decision:** For an intake task pinned to the frozen PAY-17 baseline,
  select only notes verified for that baseline; notes verified only for the
  later approved repair are stale.
- **Why:** Planning a repair must not treat its future outcome as trusted
  context. Commit-aware freshness prevents causal leakage from repair evidence
  into baseline analysis.
- **Alternatives considered:** Select the repaired proof anyway; omit the
  repository commit from intake; revise the vault solely to satisfy the test.
- **Why rejected:** Each option weakens causality, freshness enforcement, or
  the human-approved vault history.
- **Consequences:** The integration contract selects `ARCH-001` for baseline
  intake and explicitly omits `PROOF-001` as stale. The vault is unchanged.

## ADR-027 — Use one versioned, read-only projection for the proof experience

- **Status:** Accepted
- **Milestone:** 4, proof experience
- **Decision:** The dashboard consumes one `FoundryRunProjection` schema
  (`1.0`) derived from recorded artifacts. It contains causal graph data,
  review facts, Memory Pack metadata, versioned evidence items, and measured
  artifact counts.
- **Why:** Judge-facing claims must have one evidence-derived interpretation;
  UI components must not independently parse artifacts or invent workflow
  state.
- **Alternatives considered:** Per-component artifact reads; a mutable review
  API; a timeline-only static presentation.
- **Why rejected:** Direct reads duplicate trust logic; mutable endpoints
  bypass approval contracts; a timeline cannot explain causal proof.
- **Consequences:** The proof UI is transparent and read-only. New evidence
  kinds extend the projection schema and tests; they cannot confer authority.

## ADR-028 — Package the frozen fixture as a baseline-only Git bundle

- **Status:** Accepted
- **Milestone:** 4, release integration
- **Decision:** Include a Git bundle containing only `demo-store`'s immutable
  baseline branch and a manifest of its commit, required commands, and browser
  policy. `npm run demo` materializes it under an ignored local runtime path,
  validates the exact commit and command contract, and never writes to the
  source fixture.
- **Why:** A clean release clone must be self-contained while preserving the
  fixture's independent Git provenance and the rule that Foundry never mutates
  the frozen baseline.
- **Alternatives considered:** A Git submodule; copying fixture files into the
  release repository; requiring a sibling checkout or remote clone.
- **Why rejected:** A submodule or remote clone adds network/setup dependency;
  copying loses the independently verifiable baseline history and risks source
  drift.
- **Consequences:** The release archive contains a small binary bundle and
  produces an ignored materialized checkout on first run. Fixture changes
  bootstrap rewrite.

## ADR-029 — Extend the evidence projection schema for interactive proof inspection

- **Status:** Accepted
- **Milestone:** 4, QA-04
- **Decision:** Make the causal proof graph interactive by adding optional `nodeInspectors` and `edgeInspectors` to the `FoundryRunProjection` schema and passing them through the read-only dashboard layout without parsing raw evidence artifacts in the UI.
- **Why:** The dashboard must allow a user to inspect why a node or edge exists (its authority, verification state, and causal explanation) without violating the central architectural rule that only the core may interpret or grant authority from evidence (ADR-024).
- **Alternatives considered:** Parsing raw artifacts directly in React components; adding a backend API for specific node/edge queries.
- **Why rejected:** Direct artifact parsing in UI violates trust/authority boundaries; adding an API undermines the static, offline-capable projection model.
- **Consequences:** The projection contract remains backward-compatible (`schemaVersion: "1.0"`). The same single projection is available through the virtual-module fallback and the fixed local read API; neither delivery path grants dashboard write authority. The core fails closed if a declared proof node or edge lacks a matching inspector record.

## ADR-030 — Bind the candidate worktree to the approved plan's exact path scope

- **Status:** Accepted
- **Milestone:** Phase 1 engineering QA
- **Decision:** Require an approved stored plan before creating a candidate worktree and expose only that plan's affected paths to the Codex implementation prompt.
- **Why:** The wider PAY-17 policy defines the maximum permitted surface; it must not become execution authority for paths a human did not approve in this run.
- **Alternatives considered:** Continue passing all policy paths to the worktree; rely solely on implementation-report validation after edits.
- **Why rejected:** A broader prompt boundary allows an agent to modify a policy-allowed but plan-unapproved path, while post-hoc self-report validation can be incomplete or dishonest.
- **Consequences:** Worktree creation now fails closed for unapproved or out-of-policy plans. The implementation agent receives the exact reviewed path subset, while existing command allowlist checks remain unchanged.

## ADR-031 — Fail closed when evidence cannot prove the displayed PAY-17 chain

- **Status:** Accepted
- **Milestone:** Phase 1 engineering QA
- **Decision:** Validate artifact authority, run linkage, command outcomes, approval linkage, replay linkage, candidate path scope, and Memory Pack bounds before producing the dashboard/API projection.
- **Why:** A read-only projection is trustworthy only when malformed, contradictory, or unsuccessful evidence cannot still appear as a verified repair.
- **Alternatives considered:** Trust a verifier artifact's `status` field alone; validate only artifact presence; let the dashboard decide which inconsistencies matter.
- **Why rejected:** Status-only and presence-only checks can display a false proof; UI-side validation duplicates evidence interpretation and weakens the core authority boundary.
- **Consequences:** The local API returns `evidence_unavailable` and the dashboard build fails when the PAY-17 evidence chain is inconsistent. This adds no action authority and preserves the verifier as the sole source of proof status.

## ADR-032 — Isolate every browser-proof process with its own port pair

- **Status:** Accepted
- **Milestone:** Phase 1 engineering QA
- **Decision:** Derive API and Vite ports from the browser-proof process identity, pass them through the Playwright runner, API server, Vite proxy, and reset client, and rebaseline PAY-17 on the resulting immutable fixture commit.
- **Why:** Concurrent proof runs previously contended for ports 3001 and 5173, allowing one process to make another candidate browser proof fail before it reached the product behavior.
- **Alternatives considered:** Serialize every browser proof; retain shared ports and rely on browser-session IDs; introduce a hosted test coordinator.
- **Why rejected:** Serialization hides rather than fixes process interference; session IDs isolate application data but not listening sockets; a coordinator expands the local MVP without developer value.
- **Consequences:** Parallel baseline and candidate browser proofs now use independent local servers while retaining their deterministic session-level data isolation. The port-only fixture change created baseline `93ef28f`; the approved repair was independently revalidated as candidate `63417ca`, and the approved vault revision additionally refreshed `ARCH-001` for baseline Memory Pack freshness.

## ADR-033 — Fail closed on cross-artifact regression replay contradictions

- **Status:** Accepted
- **Milestone:** Phase 1 engineering QA
- **Decision:** Require a typed `regressionReplay` claim in the vault-write artifact and compare every typed replay claim in same-run evidence artifacts against the independently verified replay artifact. Reject unstructured `regression replay` assertions in linked evidence JSON.
- **Why:** The projection previously validated the replay artifact independently but did not validate stale replay language in another same-run artifact, allowing the dashboard to display a resolved outcome despite contradictory source evidence.
- **Alternatives considered:** Trust the verifier artifact alone; compare only the vault-write artifact; leave free-text replay assertions readable.
- **Why rejected:** A verifier-only view does not detect contradictory linked evidence; a vault-only comparison misses future artifacts; free text cannot be mechanically cross-checked at the trust boundary.
- **Consequences:** The projection and read API now fail closed with an explicit evidence-contradiction error for mismatched replay IDs, statuses, execution state, commands, or exit codes. Replay claims must be structured rather than narrative.

## ADR-034 — Require persisted intake and approved-plan evidence before later stages can project

- **Status:** Accepted
- **Milestone:** Phase 1 engineering QA
- **Decision:** Add separate run-linked intake and plan evidence artifacts. The intake record preserves untrusted source issue data beside the validated task; the plan record preserves the baseline Memory Pack summary, validated proposal, proof contract, and distinct human approval marker. The projection and read API fail closed if either is absent or malformed while later-stage evidence exists.
- **Why:** SQLite persisted these stages during a live run, but the release evidence set omitted them. The dashboard therefore displayed intake and approval as implied narrative rather than auditable gates, breaking the complete trust chain.
- **Alternatives considered:** Leave SQLite as the only record; infer these gates from implementation evidence; add only static dashboard labels.
- **Why rejected:** The release bundle does not include a reusable SQLite database; inference and labels can silently skip a required human gate and are not evidence.
- **Consequences:** The dashboard and API now expose all six required workflow stages from run-linked artifacts. The historical PAY-17 records are explicitly marked as contract replays, so they document reconstructed durable evidence without claiming a fresh issue submission or planner invocation.
