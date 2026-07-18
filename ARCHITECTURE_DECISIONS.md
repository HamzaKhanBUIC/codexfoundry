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
