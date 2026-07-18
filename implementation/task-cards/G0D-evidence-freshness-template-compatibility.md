# G0D — Evidence, Commit Freshness, and Draft Compatibility

- **Gate:** Gate 0 — Memory trust hardening
- **Status:** Ready for review
- **Objective:** Make evidence references structured and auditable, exclude
  memory verified against a different repository commit, and load incomplete
  draft templates safely without treating them as trusted memory.

## In scope

- `memory/src/models.ts`, `memory/src/vault.ts`, `memory/src/freshness.ts`
- `memory/src/graph.ts`, `memory/src/scoring.ts`, and `memory/src/compiler.ts`
  only for the structured-evidence and repository-commit contract
- `memory/tests/freshness.test.ts`, `memory/tests/vault.test.ts`, and related
  compiler expectations
- Memory architecture/readme/schema documentation and this task card

## Contract

1. New evidence is `{ kind, reference, verified }`; a legacy string remains
   readable only as an explicitly unverified `legacy` reference.
2. Confidence receives evidence credit only for typed evidence marked verified.
3. If a task supplies `repositoryCommit`, a document with a missing or
   different `verified_commit` is stale and excluded by default.
4. `null`/blank optional YAML fields in draft templates load as absent values;
   drafts remain unverified and cannot enter a normal Memory Pack.

## Explicit exclusions

- Vault content migration or write-back; the existing vault remains untouched
- External Git verification, command execution, hash computation, Planner,
  UI, and all `demo-store` files
- Relevance/graph-selection redesign (G0C) and adversarial test-suite work
  beyond this contract (G0E)

## Acceptance criteria

1. Typed evidence is parsed, indexed, graphed, and scored deterministically.
2. Legacy string evidence remains readable but cannot inflate confidence.
3. Repository-commit mismatch and missing commit are detected as stale when a
   task declares its current commit.
4. A draft document with blank optional template fields loads and is excluded
   as unverified.
5. Existing PAY-17 selection, payload integrity, aliases, and controlled
   traversal tests remain green.
6. `npm run build` and `npm test` pass in `memory/`.
