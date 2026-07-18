# Obsidian Engineering Memory

## Purpose

The vault is durable, portable, human-readable engineering memory. It is not raw chat history and not a generic vector-store dump.

## Artifact types

| Type | Meaning | Authoritative evidence |
|---|---|---|
| Architecture | Service boundaries and behavior | Code links and verified commit |
| ADR | A decision and its rationale | Human approval + linked evidence |
| Incident | Failure impact, timeline, root cause | Issue and reproduction |
| Proof | Executable assertion of behavior | Command/test/browser artifact |
| Evaluation | Reusable regression scenario | Failing and passing runs |

## Required frontmatter

```yaml
id: PROOF-042
type: proof
services: [checkout-api, payments-api]
requirements: [PAY-17]
evidence:
  - tests/checkout-retry.spec.ts
verified_commit: abc123
verified_at: 2026-07-18T00:00:00Z
confidence: verified
staleness: fresh
```

## Memory Pack Compiler

Selection is deterministic first, model-assisted second:

1. Match issue labels, services, paths, and requirement IDs.
2. Traverse explicit Obsidian links and frontmatter relations.
3. Exclude notes marked stale, unverified, or outside the token budget unless explicitly requested.
4. Ask GPT-5.6 to rank remaining candidates and provide inclusion reasons.
5. Render a human-reviewable pack with estimated tokens, source confidence, and provenance.

## Context-efficiency measurement

For each run, store estimated input tokens for:

- naïve baseline: relevant repository/docs loaded without selection;
- Foundry pack: selected notes and code excerpts; and
- proof coverage: number of requirement assertions backed by executable evidence.

The demo reports the measured delta, not a fabricated savings claim.

## Milestone 2 implementation

The local implementation and seeded Obsidian-compatible fixture are documented
in `architecture/memory-subsystem.md`, `memory/`, and `vault/`. It implements
the deterministic selection, provenance, freshness, confidence, graph, and
budget gates. GPT-5.6 ranking, repository excerpts, persistence, and proposed
vault write-back remain later bounded integrations.
