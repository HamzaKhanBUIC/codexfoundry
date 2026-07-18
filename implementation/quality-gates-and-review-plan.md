# Codex Foundry Quality Gates and Review Plan

**Purpose:** Define how every planned phase is reviewed and tested so the
single PAY-17 workflow remains real, secure, deterministic, and judge-testable.

## Operating rule

No phase closes because an agent says it is done. It closes only when its
acceptance checks pass, its evidence is recorded, its documentation is current,
and any material decision is appended to `ARCHITECTURE_DECISIONS.md`.

## Delivery tree

```text
Gate 0: Memory trust hardening
  └─ Gate 1: Run foundation and deterministic repository map
       └─ Gate 2: Issue intake, Memory Pack integration, plan approval
            └─ Gate 3: Worktree and Codex implementation boundary
                 └─ Gate 4: Independent verifier and evidence persistence
                      └─ Gate 5: Product review surfaces and vault approval
                           └─ Gate 6: Regression replay, measurement, hardening
                                └─ Submission readiness review
```

## Gate matrix

| Gate | Scope | Required checks | Review owner | Failure outcome |
|---|---|---|---|---|
| 0 | Memory Pack audit fixes | Unit tests for links, stale data, evidence, minimum coverage, exact token payload | Architecture + test review | Stop; no Planner integration |
| 1 | Local run state, SQLite, repository map | Build, migration/load test, state transition tests, no demo-store modification | Implementation review | Stop; preserve run artifacts |
| 2 | Issue → memory → plan | Schema tests, deterministic pack snapshot, plan-validation tests, approval denial test | Product + architecture review | Return to intake or memory |
| 3 | Worktree + Codex boundary | Worktree isolation test, command-denial test, Codex output contract review | Security + implementation review | Destroy/recreate worktree |
| 4 | Verifier + evidence | Baseline red proof, repaired green proof, browser proof, evidence completeness test | Verifier authority | `failed` / `needs-human-review` |
| 5 | Timeline, graph, staged vault proposals | UI acceptance path, graph-link integrity, approval / rejection tests | Product review | Keep proposals staged |
| 6 | Replay + metrics | Deliberate regression caught, token method disclosed, full clean setup | Release review | Fix only the broken gate |

## Milestone 3 build order

This is the planned order only. It does not authorize implementation before
Gate 0 passes.

1. **Run contracts and persistence**
   - Define `Run`, `Plan`, `Evidence`, `MemoryPackRecord`, and
     `VaultProposal` schemas.
   - Add SQLite migrations and explicit one-way state transitions.
   - Test invalid transitions and interrupted runs.

2. **Repository map**
   - Read the demo repository at its known baseline.
   - Build a small deterministic path/service/test map with source locations.
   - Do not install Zoekt, a vector database, or a remote search service.
   - Test that `checkout-service`, `payment-gateway`, and PAY-17 tests resolve.

3. **Issue and plan path**
   - Ingest only the seeded PAY-17 issue shape.
   - Compile the trusted Memory Pack.
   - Use GPT-5.6 for plan/risk reasoning only after deterministic eligibility.
   - Require explicit plan approval before the worktree action.

4. **Codex worktree path**
   - Create a named disposable worktree from the frozen fixture baseline.
   - Provide Codex a narrow implementation contract and record its session
     evidence.
   - Use a bounded stop-and-fix loop; terminate with evidence if unsuccessful.

5. **Verifier and evidence path**
   - Prove baseline failure before repair.
   - Prove health, repair regression, and browser outcomes after repair.
   - Persist outputs, exit codes, timestamps, browser artifacts, and commit ID.

6. **Integration review**
   - Confirm the proof graph can traverse every displayed claim.
   - Confirm no vault write happens without user approval.
   - Confirm a failed check cannot become `verified` through agent text.

## Test pyramid for Foundry

| Layer | What it tests | Examples | Required signal |
|---|---|---|---|
| Unit | Pure policy, scoring, state, graph, serializers | freshness, approval validation, command policy | Fast deterministic green suite |
| Integration | Service boundaries and local SQLite/filesystem adapters | run transition, pack persistence, worktree lifecycle | Repeatable local result |
| Contract | Inputs/outputs exchanged by agents and UI | plan schema, evidence schema, vault proposal schema | Invalid data rejected |
| End-to-end | The one PAY-17 run | issue → pack → approval → patch → verify → proposal | Visible, replayable evidence |
| Adversarial | Trust and safety failure modes | prompt injection text, stale note, dangling link, denied command | Safe rejection with reason |
| Regression | Durable prevention | deliberate retry-key mutation | Saved evaluation fails |

## Definition of evidence

Every claim shown to a user or judge must be backed by one of these records:

| Claim | Required evidence |
|---|---|
| Baseline defect exists | `npm run test:pay-17` exit code and failure output; browser proof |
| Codex changed code | Worktree diff, commit ID, session evidence, changed-path list |
| Repair meets PAY-17 | Repaired proof assertion plus independent browser result |
| Context was trustworthy | Source IDs, selection/omission reasons, freshness/confidence, token method |
| Memory was approved | Staged proposal hash, approval record, vault paths |
| Regression is prevented | Deliberate bad change and failed evaluation output |

Agent narration may explain evidence but never substitutes for it.

## Review protocol

### Before every logical change

- Restate the narrow acceptance criterion.
- Name the files/services expected to change.
- Name the tests that prove the change.
- Identify the expected security and token impact.

### After every logical change

- Run the smallest relevant unit/contract tests.
- Run TypeScript build or lint where applicable.
- Inspect the diff for scope expansion, secrets, generated artifacts, and
  unrelated edits.
- Record actual command output; do not summarize a command that did not run.
- Stop on a failure instead of accumulating unrelated edits.

### At gate completion

- Run the full gate suite from a clean local state.
- Re-read the relevant product, architecture, and ADR constraints.
- Update only truthful documentation and append material decisions to the ADR.
- Require a human architecture/product review before beginning the next gate.

## Deterministic PAY-17 proof protocol

| Stage | Expected state | Required command or observation |
|---|---|---|
| Frozen baseline | Defect remains intact | `npm run test:pay-17` is intentionally red |
| Health baseline | Unrelated fixture behavior works | `npm run build`, `npm run test:health` are green |
| Browser baseline | Defect is visibly reproducible | `npm run test:browser` proves two captures |
| Candidate repair | Worktree only | Diff changes retry/idempotency behavior and proof test as necessary |
| Repaired proof | Requirement passes | One payment assertion is green in candidate worktree |
| Repaired browser | User-visible behavior passes | Checkout displays one capture |
| Regression replay | Protection is real | Deliberate bad mutation turns saved evaluation red |

The frozen baseline repository must not be “fixed” directly. The repair exists
only in the disposable worktree until review.

## Competition-compliance gate

Before submission, verify these official requirements against the live Devpost
page, not an AI summary:

- Project uses Codex with GPT-5.6 and fits Developer Tools.
- Project installs/runs consistently as represented.
- Public YouTube video is under three minutes and has audio explaining Codex
  and GPT-5.6 use.
- Repository is public with an appropriate license, or private and shared with
  the required judge accounts.
- README explains setup, testing, supported platform, and how Codex/GPT-5.6
  contributed to the work.
- Submission contains the `/feedback` Session ID from the primary build thread.
- Judges can test the developer tool without rebuilding it from scratch.
- All submission materials and test instructions are in English.

Source of truth: [OpenAI Build Week Official Rules](https://openai.devpost.com/rules).

## Release blockers

Do not claim a finalist-ready project if any condition is true:

- Core workflow is simulated rather than backed by commands and artifacts.
- PAY-17 does not fail before the repair and pass after it.
- Browser proof is missing or flaky.
- Memory selection cannot explain every inclusion and omission.
- Vault documents are written without explicit approval.
- The regression evaluation cannot catch the deliberate bad change.
- Codex/GPT-5.6 use is invisible, undocumented, or lacks the required session
  evidence.
- A judge cannot install or test the system from the provided instructions.
