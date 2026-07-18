# G0B — Obsidian Link Integrity

- **Gate:** Gate 0 — Memory trust hardening
- **Status:** Ready for review
- **Objective:** Resolve ordinary Obsidian filename and frontmatter-alias links
  to canonical memory IDs, and surface unresolved links as deterministic graph
  diagnostics before any future Planner consumes the graph.

## In scope

- `memory/src/models.ts`
- `memory/src/vault.ts`
- `memory/src/graph.ts`
- `memory/tests/vault.test.ts`
- `memory/README.md` and `architecture/memory-subsystem.md` where the public
  contract changes

## Explicit exclusions

- Vault content edits or write-back
- Relevance scoring, graph traversal directionality, or minimum-coverage
  selection (G0C)
- Evidence/freshness redesign (G0D)
- Planner, Codex execution, worktree orchestration, UI, and every `demo-store`
  file

## Acceptance criteria

1. `[[canonical-id]]`, `[[filename-stem]]`, and `[[frontmatter-alias]]` resolve
   to the same canonical memory ID.
2. The graph never silently treats an unresolved link as valid memory.
3. Every dangling link is available as deterministic, source-attributed graph
   diagnostics.
4. Duplicate canonical link targets fail vault loading with a clear error.
5. Existing seeded-vault graph relations and Memory Pack behavior remain valid.
6. `npm run build` and `npm test` pass in `memory/`.

## Required evidence

- Unit tests for filename, alias, and dangling-link handling
- `npm run build`
- `npm test`
- Diff review confirming no vault or `demo-store` file changed
