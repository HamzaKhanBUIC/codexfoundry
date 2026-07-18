# G3B — PAY-17 Codex Implementer Prompt

**Use:** GPT-5.6 Codex, **max effort**, Code mode, inside the generated
disposable worktree only.

Foundry renders the exact runtime prompt through
`foundry/src/implementer-prompt.ts`. It supplies only the human-approved plan,
exact persisted Memory Pack, assigned worktree path, policy paths/commands, and
proof contract.

Codex must make the smallest repair, edit only the allowed paths, and run only
the exact allowed local commands. It cannot use a network, credentials, Git
remote operations, merge/deploy actions, vault writes, or verification status.

Its final output is exact JSON with `changedPaths`, `changeSummary`,
`commandsRun`, `unresolvedRisks`, and non-authoritative `confidence`. The
executor captures raw command output and the Git diff separately; the Verifier
alone decides whether PAY-17 is proven.
