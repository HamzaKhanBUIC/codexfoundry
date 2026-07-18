# Security and Trust Model

## Guardrails

- Worktrees are disposable and restricted to the demo repository.
- Commands use an allowlist: install, test, lint, build, and local browser test commands only.
- Secret files and environment variables are redacted from agent context and logs.
- Vault write-back is a two-step staged proposal plus human approval.
- Proof status is generated from verifier outputs, not agent self-report.

## Prompt-injection handling

Issue text, repository files, and vault notes are untrusted content. They cannot alter system permissions, command policy, or approval requirements. The UI labels agent-supplied and source-supplied instructions separately.
