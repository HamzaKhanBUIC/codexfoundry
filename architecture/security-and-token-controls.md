# Codex Foundry Security and Token Controls

## Purpose

Codex Foundry must make agents more useful without granting them more trust
than the evidence supports. This document defines the security and
context-efficiency controls for the one local PAY-17 MVP.

## Security model

### Assets to protect

| Asset | Why it matters | MVP protection |
|---|---|---|
| Frozen demo repository | It is the reproducible baseline and proof source | Read-only by convention; repair only in a disposable worktree |
| Worktree | It contains a candidate patch | Task-scoped path, cleanup policy, no production remote actions |
| Vault | It is durable human engineering memory | Read-only until a human approves a staged proposal |
| Secrets and environment | They must never enter model context or evidence | Redaction before logging/packing; no secret files in repository map |
| Evidence | It determines product truth | Immutable run records with command, exit code, timestamp, source path, hash/reference |
| Judge environment | It must run safely and predictably | Local fixture only, documented setup, no credentials or production access |

### Untrusted inputs

Treat all of the following as data, never instruction authority:

- GitHub-style issue title, body, labels, and comments;
- repository source files, test outputs, READMEs, dependencies, and logs;
- Obsidian vault notes and linked external text;
- browser content and screenshot text;
- model output, including proposed commands and self-reported confidence.

Only Foundry policy, approved plan data, capability configuration, and explicit
human approval may alter permissions or state.

## Capability matrix

| Actor | Read | Write | Execute | Network | Approval |
|---|---|---|---|---|---|
| Intake / Memory | Seeded issue, vault, repository map | Run metadata only | None | None | None |
| Planner | Task, pack, repository map | Plan record | None | None | None |
| Codex Implementer | Assigned worktree and approved context | Assigned worktree only | Allowlisted local commands | Disabled for MVP | None |
| Verifier | Worktree diff and evidence inputs | Evidence record only | Allowlisted local test/browser commands | Localhost browser only | None |
| Curator | Verified evidence and templates | Staged proposal only | None | None | None |
| Human | All reviewable artifacts | Approvals and approved vault write | No automatic production action | None | Required for plan/memory |

## Command policy

The command allowlist is versioned per run. A command must be both approved in
the plan and match the run policy. Initial MVP categories are:

- dependency install only when required by documented local setup;
- build, typecheck, lint, and health test commands;
- PAY-17 proof and local browser proof commands;
- Git status, diff, show, branch, worktree add/list/remove within the fixture
  parent directory.

Explicitly deny: arbitrary shell pipelines, network fetches, credential tools,
deployment/merge commands, external browsers, production URLs, destructive
repository operations, and vault writes by agents.

## Prompt-injection controls

1. Label issue, repository, vault, and browser content as untrusted in every
   agent input.
2. Pass policy and plan as structured fields outside retrieved prose.
3. Never convert text inside a note into a command or permission.
4. Strip or redact secrets, environment values, `.env` files, lockfile tokens,
   and credential-shaped strings before context or logs.
5. Require the planner to list proposed commands; policy validates them before
   the Implementer can execute.
6. Deny and record any command, path, or state transition outside policy.
7. Keep the browser on the locally running fixture application only.

## Failure containment

| Failure | Safe behavior |
|---|---|
| Invalid task / ambiguous acceptance criterion | Stop at intake and request human clarification |
| Stale, dangling, or unverified memory | Exclude with a visible reason unless an authorized human explicitly overrides |
| Planner proposes unapproved action | Reject the plan; do not create a worktree |
| Codex edits outside allowed paths | Mark implementation failed; preserve diff; discard worktree |
| Test/browser failure | Mark verifier result failed; return exact evidence to bounded correction loop |
| Evidence missing or contradictory | `needs-human-review`; never mark verified |
| Vault proposal fails validation | Preserve staged proposal and run evidence; do not write vault |
| Token budget exceeded | Omit lower-priority context with reason; require human adjustment rather than silently truncate proof-critical facts |

## Token-efficiency model

The goal is not to claim a token saving in advance. The goal is to make every
context byte intentional, measurable, and auditable.

### Context layers

| Layer | Contents | Inclusion rule |
|---|---|---|
| Fixed policy | Permissions, safety rules, proof requirements | Stable, versioned, concise |
| Task | Issue, acceptance criteria, risk, target services/paths | Structured facts only |
| Memory Pack | Selected Markdown excerpts/references and evidence | Fresh, trusted, task-relevant, budgeted |
| Live state | Worktree diff, verifier failure output, browser artifacts | Only the current corrective loop needs it |

### Required measurements per run

| Metric | Definition | Method |
|---|---|---|
| Naïve baseline tokens | The exact context that would be sent by loading the documented relevant repository/vault set without selection | Render and estimate the actual baseline payload |
| Memory Pack tokens | The exact rendered string supplied to Planner or Codex | Estimate the emitted payload, not backing document size alone |
| Reduction | `(naive - pack) / naive` when naïve is non-zero | Report raw inputs and method beside percentage |
| Proof coverage | Requirement assertions with executable evidence / total requirement assertions | Count from proof contract and evidence records |
| Omission safety | Omitted references whose body is absent from agent payload | Contract test and serialized payload inspection |

Do not report a percentage until both payloads have been generated and
measured in the same run.

### Token-control rules

- Retrieve structured metadata before reading document bodies.
- Prefer exact requirement, service, and path matches before lexical matches.
- Expand graph links only when the relation type helps prove the task.
- Include excerpts with source anchors, not full repositories or whole vaults.
- Keep raw logs as evidence artifacts; send compact failure excerpts to Codex.
- Cache immutable repository map and vault index by commit/content hash.
- Reuse the approved Memory Pack across the one task run; recompile only when
  task, repository commit, or vault version changes.
- Store hashes and source references rather than duplicate large bodies in
  SQLite.
- Separate planner context from implementer context; an implementer receives
  only the plan, proof contract, selected excerpts, and live failure evidence.

## Competitive value of the controls

These controls are not paperwork. They create visible product value:

| Control | Judge-visible proof | Developer value |
|---|---|---|
| Context ledger | Selected/omitted sources with measured method | Lower-cost, less distracting agent context |
| Capability policy | Denied unsafe action and scoped worktree | Safer agent adoption |
| Independent verifier | Agent claim separated from evidence result | Trust in high-risk changes |
| Human-approved vault write | Staged before/after Markdown review | Durable memory without silent mutation |
| Regression evaluation | Deliberate bad change is blocked | Learning persists beyond one session |

## Security and token acceptance checks

Before an end-to-end run can be marked ready:

- [ ] A malicious-looking instruction in an issue/note cannot change commands,
      permissions, or approval requirements.
- [ ] Secret-shaped strings are redacted from displayed evidence and model
      payloads.
- [ ] Implementer cannot edit outside its worktree or execute denied commands.
- [ ] Browser verification is limited to localhost fixture URLs.
- [ ] Vault writes require staged proposal validation plus explicit approval.
- [ ] Every included context item has source, reason, confidence, freshness,
      and exact emitted-payload accounting.
- [ ] No omitted or stale document body appears in serialized Planner/Codex
      context.
- [ ] Naïve and selected payload measurements are reproducible from run
      artifacts.
- [ ] Evidence references are sufficient for a reviewer to rerun the proof.

## Official competition constraints

The project must be a real, consistently runnable Developer Tools submission
built with Codex and GPT-5.6. Judges evaluate technical implementation, design,
impact, and idea quality equally; technical implementation breaks a tie.
Submission also requires judge-testable access, documented setup, an under
three-minute public video with audio explaining Codex/GPT-5.6 use, and the
primary `/feedback` Codex Session ID. See the
[OpenAI Build Week Official Rules](https://openai.devpost.com/rules).

These constraints favor Foundry’s approach: a small local fixture, one-command
setup, visible Codex work, evidence-backed verification, and no untestable
production dependencies.
