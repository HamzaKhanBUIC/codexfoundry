# Security and Trust Model

## Guardrails

- PAY-17 worktrees remain disposable and restricted to its frozen demo
  repository. A generic run may create a disposable sibling worktree only
  after a human-approved policy pins the target repository's clean baseline
  commit, exact relative paths, and direct command specifications.
- The verifier executes only policy command IDs through direct process
  invocation—never a shell. Windows npm commands resolve to `npm-cli.js` so a
  `.cmd` shim is not treated as shell authority.
- Secret files and environment variables are redacted from agent context and logs.
- Vault write-back is a two-step staged proposal plus human approval.
- Proof status is generated from verifier outputs, not agent self-report.
- Codex planner and implementation output is structured, bounded, and
  non-authoritative. The verifier independently scopes the actual Git diff and
  reruns approved commands before a run can reach human patch approval.

## Prompt-injection handling

Issue text, repository files, and vault notes are untrusted content. They cannot alter system permissions, command policy, or approval requirements. The UI labels agent-supplied and source-supplied instructions separately.
