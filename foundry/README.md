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

## Repository map

`buildRepositoryMap()` reads only the frozen checkout fixture's commit,
required paths, and declared package commands. It emits no source bodies and
fails closed when the fixture baseline, PAY-17 proof paths, or expected judge
commands are missing.
