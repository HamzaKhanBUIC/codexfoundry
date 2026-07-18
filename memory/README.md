# Codex Foundry Memory Subsystem

The memory subsystem compiles a minimal, trustworthy, human-readable context
package from the Obsidian Engineering Vault. It has no agent execution,
worktree, planner, verifier, PR, or UI responsibilities.

## Install and validate

```powershell
cd memory
npm install
npm run build
npm test
```

## Responsibilities

1. Load and validate Markdown frontmatter from `../vault`.
2. Index stable IDs, services, requirements, evidence, tags, and Obsidian links.
3. Resolve IDs, filename stems, vault-relative paths, and frontmatter aliases
   into a traversable in-memory graph with explicit dangling-link diagnostics.
4. Assess freshness and calculate confidence from declared evidence, verification
   metadata, and age.
5. Rank task-relevant documents deterministically.
6. Exclude stale, unverified, low-confidence, and over-budget knowledge by
   default.
7. Render the exact selected source context as reviewable Markdown, while
   representing every omitted source with bodyless reference metadata only.

Selection uses greedy minimum coverage for explicit document IDs, requirements,
services, and evidence paths. A relevant Proof is retained as an executable
trust anchor. Graph expansion is limited to one outbound explicit Obsidian link
from selected direct context, and only when that link fills an unmet coverage
obligation.

## Memory Pack contract

`compileMemoryPack(index, task)` accepts a task ID, title, optional services,
requirements, labels, repository paths, explicit document IDs, and a token
budget. It returns sources with their inclusion reason, relevance score,
confidence score, freshness, and selected source body. Omitted sources expose
only ID, title, freshness, confidence score, and omission reason.
`estimatedTokens` is measured from the exact rendered Markdown payload that a
future planner would receive.

If the requested budget cannot accommodate even the safe payload metadata, the
compiler fails closed with the measured minimum rather than returning an
over-budget context package.

The compiler is deterministic. GPT-assisted ranking mentioned in the product
architecture remains a later, bounded enhancement; it cannot override the
freshness, confidence, provenance, or budget gates implemented here.

## Freshness and confidence

Freshness is `fresh`, `aging`, `stale`, or `unverified`:

- `draft` documents or documents without `verified_at` are unverified.
- A document explicitly marked stale, or older than the configured 90-day
  window, is stale.
- A document in the last 25% of that window is aging.

Confidence is a reproducible 0–1 score. It combines the declared confidence
level, evidence count, verified commit, verified timestamp, and freshness.
Normal packs require a score of at least `0.65`.

## Non-goals in this milestone

- Writing to the vault; future write-back remains staged and human-approved.
- Repository or source-code indexing.
- Calling an LLM or a vector database.
- Planning, implementation, verification, browser execution, or a dashboard.
