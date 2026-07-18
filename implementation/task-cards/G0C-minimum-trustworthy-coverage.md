# G0C — Minimum Trustworthy Coverage

- **Gate:** Gate 0 — Memory trust hardening
- **Status:** Ready for review
- **Objective:** Compile the smallest eligible Memory Pack that covers the
  task's explicit engineering signals and an executable Proof when one is
  relevant, while allowing only noise-controlled graph expansion.

## In scope

- `memory/src/compiler.ts`
- `memory/src/graph.ts` and `memory/src/models.ts` for a directional link API
- `memory/tests/compiler.test.ts` and `memory/tests/vault.test.ts`
- `memory/README.md` and `architecture/memory-subsystem.md` where the public
  contract changes

## Selection contract

1. Cover explicit document IDs, requirements, services, and evidence paths
   before adding optional context.
2. Require one trustworthy `proof` source where a task-relevant proof exists,
   or where one is explicitly linked from direct task context.
3. Choose candidates greedily by newly-covered obligations, then relevance,
   confidence, token cost, and stable ID.
4. Traverse only one outbound `links-to` hop from selected direct context, and
   only admit a linked document when it covers an unmet obligation.
5. Omit relevant but redundant documents with an explainable reason.

## Explicit exclusions

- Evidence/commit freshness redesign and template compatibility (G0D)
- New document types, vector search, model ranking, Planner, Codex execution,
  UI, vault write-back, and all `demo-store` files
- Multi-hop, reverse, or service/requirement-node graph expansion

## Acceptance criteria

1. PAY-17 returns a smaller selected set than the prior all-relevant strategy,
   while retaining requirement/service coverage and a proof source.
2. A linked proof with no direct textual match can be selected only through the
   bounded outbound link rule when it is needed for coverage.
3. A linked but redundant document is not selected.
4. Each selected source has an inclusion reason naming its newly-covered
   obligation; each redundant relevant source has an omission reason.
5. Existing stale exclusion, payload-integrity, alias, and dangling-link tests
   remain green.
6. `npm run build` and `npm test` pass in `memory/`.
