# G3A — Disposable Worktree and Command Policy

## Scope

Create the isolated candidate-worktree lifecycle and exact command-policy check
for an already approved PAY-17 plan.

## Acceptance criteria

- Candidate worktrees are detached at the validated frozen commit.
- Their path is restricted to `.foundry-worktrees/<RUN-ID>` beside the fixture.
- A plan command is allowed only when it exactly appears in both the approved
  plan and validated repository map.
- Inspecting a candidate returns Git status/diff only.
- Disposal refuses paths outside Foundry ownership; it removes only the
  disposable candidate, never the frozen fixture.
- No plan command, Codex invocation, repair, merge, push, browser, verifier,
  or vault write occurs in this task.
