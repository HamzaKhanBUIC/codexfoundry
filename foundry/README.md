# Codex Foundry Core

This package is the local persistence and run-state foundation for the one
PAY-17 Foundry workflow. It intentionally contains no HTTP API, UI, Planner,
Codex execution, worktree management, verifier, or vault write-back.

## Validate

```powershell
cd foundry
npm install
npm test
npm run build
```

## Current contract

`RunRepository` persists the issue metadata, frozen repository commit, current
run state, correction count, failure reason, and append-only transition events
in local SQLite through Node's built-in `node:sqlite` module.

The single correction loop permits one return from `verifying` to
`implementing`: the initial implementation plus one evidence-driven repair
attempt. The state machine rejects every other invalid or terminal transition.

## Issue intake

`compilePay17IntakeTask()` accepts only the seeded PAY-17 issue shape and the
validated repository map. It returns a policy-owned, minimal task handoff;
untrusted issue prose is retained only as source metadata in the run record.
This package does not yet create a plan, invoke Codex, manage a worktree, run
verification, expose an HTTP API, or write the vault.

## Memory Pack integration

`compileAndPersistPay17MemoryPack()` consumes only the trusted intake task and
the read-only vault. It persists the exact compiler-rendered Markdown, a
SHA-256 payload hash, measured token/confidence values, and bodyless source /
omission metadata in the same transaction that advances a run to
`memory_compiled`. The raw vault index is never persisted or exposed.

## Repository map

`buildRepositoryMap()` reads only the frozen checkout fixture's commit,
required paths, and declared package commands. It emits no source bodies and
fails closed when the fixture baseline, PAY-17 proof paths, or expected judge
commands are missing.
