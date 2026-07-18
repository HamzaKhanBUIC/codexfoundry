# G1B — Deterministic Repository Map

- **Gate:** Gate 1 — Foundry core foundation
- **Status:** Ready for review
- **Objective:** Build a read-only, deterministic map of the frozen
  `demo-store` PAY-17 fixture for later Planner and Verifier use.

## In scope

- `foundry/src/repository-map.ts` and exported map models
- Unit tests using a temporary Git fixture
- Documentation for the exact map contract

## Contract

The map validates a repository commit and returns only:

- fixture root and baseline commit;
- checkout and payment service source paths;
- PAY-17 unit proof and browser proof paths;
- build, health, PAY-17, and browser commands declared in `package.json`.

The expected commit defaults to the frozen PAY-17 baseline prefix `1169daf`.
Missing paths, commands, Git metadata, or a mismatched commit fail closed.

## Explicit exclusions

- Generic source indexing, Zoekt, embeddings, repository content persistence,
  issue intake, Planner, Codex, worktree creation, command execution, UI, and
  all writes to `demo-store`

## Acceptance criteria

1. The map is deterministic for a committed fixture and contains no source
   bodies.
2. It fails clearly for a mismatched baseline, missing required path, or
   missing required command.
3. The model exposes checkout-service, payment-gateway, PAY-17 test, browser
   test, and build/health/proof/browser commands.
4. `npm run build` and `npm test` pass in `foundry/`.
