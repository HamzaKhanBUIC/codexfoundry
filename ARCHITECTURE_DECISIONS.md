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
