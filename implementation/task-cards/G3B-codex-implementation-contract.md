# G3B — Codex Implementation Contract

## Scope

Define and validate the narrow PAY-17 handoff from a human-approved plan to
Codex in a Foundry-owned candidate worktree. Do not invoke Codex or repair the
fixture in this task.

## Acceptance criteria

- Prompt rendering rejects a plan that is not human-approved or inputs from a
  different run.
- Prompt exposes only the supplied Memory Pack, approved plan, worktree, and
  exact policy paths/commands.
- The response parser accepts only exact JSON and rejects extra authority,
  unapproved paths, and unapproved commands.
- Model confidence and command claims remain non-authoritative; raw logs/diff
  await independent capture and verifier assessment.
- No candidate repair, verifier, browser run, vault write, merge, or deploy is
  performed by this task.
