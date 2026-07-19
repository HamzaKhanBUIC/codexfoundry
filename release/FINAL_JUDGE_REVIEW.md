# Codex Foundry — Final Judge Review

**Reviewer stance:** OpenAI engineer, Developer Tools practitioner, software
architect, and Build Week judge.  
**Revision reviewed:** `codex/m4-proof-experience` at `1a5f25a`.  
**Scope reviewed:** the runnable release branch, evidence artifacts for
`RUN-PAY-17-001`, dashboard/read API, release bootstrap, tests, submission
materials, and architecture records.

## Verdict

# SUBMIT AFTER MINOR FIXES

Codex Foundry is a credible finalist-level technical submission. Its strongest
idea is not that Codex fixes a checkout bug; it is that Foundry refuses to let
an AI repair become trusted until an independent verifier proves it, a human
approves the bounded result, durable Markdown memory is explicitly approved,
and a later reintroduction of the same defect is blocked.

That is a real point of view about the future of AI-native engineering, and it
is substantially more rigorous than a generic coding-agent wrapper. The
deterministic PAY-17 scenario makes the thesis legible. However, it is not
ready to submit *as-is*: the release branch is not the default `main` branch,
the submission materials do not yet contain the required Codex provenance or
video/write-up assets, and the current UI/docs understate or occasionally
contradict the level of completion. Those are submission and presentation
problems, not reasons to add product scope.

## What is demonstrated

- The frozen baseline deterministically reproduces PAY-17: one logical
  checkout creates two payments after a retry.
- A bounded candidate repair at `2a5d01f` preserves the retry idempotency key
  and passes build, health, PAY-17, and browser proof commands.
- The verifier artifact independently records baseline failure, candidate
  success, permitted changed paths, and the unchanged unit proof.
- Patch approval and vault approval are separate human decisions. The vault
  artifact records a completed write of Incident, ADR, Proof, and Evaluation
  Markdown notes.
- A disposable regression candidate restores the causal mutation and the
  unchanged PAY-17 proof fails again. This is the strongest single proof in
  the project.
- Memory selection is deterministic, commit-aware, provenance-bearing, budget
  bounded, and honest about the lack of a recorded naïve-context comparison.
- The proof viewer is read-only, keyboard-accessible, evidence-derived, and
  explicit that the verifier—not Codex or the UI—is authoritative.
- `npm run demo` packages the frozen fixture as an immutable Git bundle and
  preflights its commit, commands, dependencies, and browser availability.

## Scorecard

| Dimension | Score | Judge note |
|---|---:|---|
| Innovation | 8.5/10 | The proof-and-memory loop is a meaningful product thesis, not a chatbot. |
| Technical Excellence | 9/10 | Deterministic fixture, provenance, trust boundaries, regression replay, and fail-closed contracts are unusually strong. |
| Developer Value | 8/10 | Valuable for high-risk changes; evidence and reusable evaluation address a real pain. Scope is intentionally one scenario. |
| Product Design | 7/10 | Clean and coherent, but it currently feels more like a completed case-study viewer than a live product workflow. |
| Trustworthiness | 9/10 | Independent verifier, separated approvals, no write UI, and the repaired-memory causality label are excellent. |
| Demo Quality | 7/10 | Strong story, but graph framing, setup guidance, and visible Codex provenance need tightening. |
| Engineering Quality | 9/10 | Narrow, typed, tested, maintainable, and disciplined about exclusions. |
| Codex Utilization | 7/10 | Codex is structurally central, but its actual execution/provenance is insufficiently visible in the submitted product. |
| Judge Memorability | 8/10 | “AI repair becomes a verified, reusable regression guard” is memorable. |
| Overall Winner Potential | 8/10 after the blockers/high items | A realistic Top 3 contender if the final submission makes the proof immediately legible and verifiable. |

## Can this finish in the Top 3?

**Yes, realistically—but not automatically.** This has better engineering
discipline than most Developer Tools submissions and a much clearer trust
model than typical autonomous-agent demos. A first-place outcome depends on
whether the three-minute story makes Codex visibly responsible for the repair,
then makes Foundry visibly responsible for not trusting it blindly.

The project will not win on breadth. It can win on a crisp, believable claim:
**Codex does the engineering work; Foundry makes the result safe to reuse.**

## What is genuinely differentiated

### Difficult to replicate well

- The full causal chain: deterministic baseline failure → isolated repair →
  independent proof → separate human gates → Markdown memory → deliberate
  regression replay.
- Commit-aware memory freshness that prevents post-repair knowledge from
  leaking into baseline planning.
- A trust model where an implementer report is explicitly non-authoritative,
  while the verifier owns proof status.
- A real, narrowly scoped regression replay rather than a claim that future
  tasks will somehow improve.

### Good engineering, but not a differentiator by itself

- React/Fluent dashboard, SQLite, Vite, strict TypeScript, Playwright,
  worktrees, and Markdown frontmatter.
- A proof graph and an Obsidian-compatible vault. These are useful, but easy
  for competitors to imitate visually.

### What judges should remember

> A coding agent can produce a patch. Codex Foundry produces the proof,
> human-reviewed memory, and executable regression guard that make the next
> agent run safer.

## Codex evaluation

Codex is conceptually central: it receives a human-approved plan, an exact
Memory Pack, and a restricted disposable worktree; it is not treated as the
verification authority. The prompt and response contracts are unusually good
examples of bounded agent design.

But the shipped surface primarily presents a recorded run. The core contains
prompt/response contracts rather than a live Codex invocation, and the
submission directory has no filled Codex Session ID. Therefore, a skeptical
judge can conclude that the *architecture* is Codex-first while the *visible
demo evidence* of Codex performing the repair is incomplete.

- **Could this product exist without Codex?** The memory, verifier, and review
  shell could. Its intended repair loop could use another model unless the
  submission clearly ties the actual repair to Codex.
- **Does Codex materially improve the workflow?** Yes: it supplies the
  bounded plan/implementation capability that Foundry wraps with proof and
  approval. The verifier and memory system are deliberately the safeguards,
  not substitutes for Codex.
- **Will the demo clearly show engineering value created by Codex?** Not yet
  strongly enough. Show the real bounded Codex implementation artifact and
  its resulting diff before showing the verifier contradiction/prevention
  story.
- **Would OpenAI engineers see a good Codex showcase?** They will respect the
  architecture. They will expect direct provenance—a real `/feedback` session
  ID and an unambiguous demo statement that Codex made the candidate change.

## Findings requiring action before submission

### BLOCKER — Submitted repository can land judges on an incomplete branch

`main` remains at the planning baseline (`dcef411`), while the working release
is on `codex/m4-proof-experience` (`1a5f25a`). A repository link that defaults
to `main` will not give judges the product reviewed here.

**Smallest fix:** make the submitted repository/default branch point to the
release revision, or merge the approved release branch only after an explicit
release decision. State the exact commit in the submission. Do not ask judges
to discover a worktree branch.

### BLOCKER — Required submission provenance/assets are not present

`submission/devpost.md`, `submission/screenshots.md`, and `submission/video.md`
are empty, and `submission/checklist.md` still leaves the official Codex
`/feedback` Session ID, repository access, demo video, and write-up unchecked.
This is not cosmetic: it prevents a judge from verifying eligibility and
Codex use.

**Smallest fix:** manually attach the actual primary Codex `/feedback` Session
ID, ensure the repository is accessible under the event rule, publish the
real 1–3 minute video, and complete the human-authored Devpost materials.
Do not fabricate a session ID, video, screenshot, or outcome.

### HIGH — Documentation currently undermines release credibility

Several current-facing documents still cite `520de8a` and ADR-028 even though
the reviewed release is `1a5f25a` and includes ADR-029/trust consistency work.
More seriously, `foundry/README.md` says the core intentionally contains no
Planner, Codex execution, worktree management, verifier, or vault write-back,
which conflicts with the evidence-backed workflow being submitted. The
dashboard README similarly calls the product a “first UI slice.” A judge who
opens these files can reasonably doubt the demo.

**Smallest fix:** reconcile only the current-status statements, commit/ADR
references, run instructions, and scope wording. Preserve historical QA
reports as historical records; do not rewrite their findings.

### HIGH — The first desktop proof view does not show the whole payoff at once

The causal graph is interactive and mobile-stacked, but its desktop horizontal
sequence requires horizontal discovery to reach the memory/replay ending. In a
three-minute review, the most important moment—the future regression being
blocked—must be visible in the first proof frame or reached deliberately in
the narration.

**Smallest fix:** adjust the desktop presentation or demo framing so all
stages, especially `verification → approval → memory → regression blocked`,
are immediately visible. Do not add a new graph feature.

### HIGH — The runnable path still has avoidable judge setup ambiguity

The bootstrap is solid, but the root package has no stated Node requirement;
the core relies on Node 24 built-in SQLite, and the browser may use a Chrome
fallback. There is no dedicated concise judge guide or final readiness report.

**Smallest fix:** provide one short judge-facing instruction page stating Node
24, `npm run demo`, the local URL, browser fallback behavior, expected
baseline/candidate/regression results, and the known absence of a recorded
browser trace. This is documentation, not a new feature.

## Non-blocking findings

### MEDIUM

- The dashboard is a polished read-only projection of one completed run, not
  an issue-to-action control plane. That is correct for the MVP, but the demo
  must call it a **deterministic reference run** rather than imply judges can
  create arbitrary repairs from the UI.
- Browser evidence is a valid command log, but no screenshot or trace exists.
  The UI handles the absence honestly; a real captured artifact would improve
  demo speed only if it can be generated from the actual final run.
- The Memory Pack reports 715 estimated tokens of a 12,000-token budget and
  correctly refuses to invent a percentage saved. This is trustworthy, but it
  leaves the “cheaper” claim qualitative rather than quantified.
- API fetch failure silently retains the build-time projection. This is safe
  for the fixed demo but lacks a visible loading/error state.

### LOW

- Terms such as `regression_blocked`, `candidate`, and `projection` are exact
  but technical. The existing explanatory copy helps; narration should use
  plain language first.
- The local Chrome fallback is acceptable when preflighted, but it is weaker
  portability than bundled Chromium alone.
- The README has no public-license guidance even though the submission
  checklist requires a license if the repository will be public.

## Final judge assessment

I would advance this project past an initial Developer Tools screen because it
has a rare combination of product clarity and evidence discipline. It does not
promise magical autonomy. It demonstrates one dangerous, familiar defect and
shows exactly why the agent’s patch should be trusted, remembered, and tested
again later.

I would not award first place solely for the current repository state because
submission access, Codex provenance, and presentation polish can make a strong
system look like a static artifact. Resolve the two blockers and four high
items without expanding scope, then submit. At that point, Codex Foundry has a
plausible Top 3 case and a credible first-place narrative.
