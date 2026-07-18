# Codex Foundry Engineering Vault

This directory is the seeded, local Obsidian Engineering Vault used by the
Codex Foundry demo. It is Markdown-first: every durable fact is readable in
Obsidian without Foundry, and relationships are visible as frontmatter IDs and
`[[Obsidian links]]`.

## Layout

- `architecture/` — verified boundaries and system behavior.
- `services/` — service-level responsibilities and constraints.
- `adrs/` — approved decisions with their trade-offs.
- `incidents/` — impact, reproduction, and root cause.
- `proofs/` — executable behavior claims and evidence.
- `evaluations/` — reusable regression scenarios.
- `_templates/` — document schemas for future staged proposals.

The Memory Pack compiler reads these documents but never writes to this vault.
Later Foundry milestones will stage proposed additions and require explicit
human approval before a vault write.

## Linking rules

- `id` is stable and unique across the vault.
- Use `services`, `requirements`, `evidence`, and `links` frontmatter for
  machine-readable relations.
- Use `[[DOCUMENT-ID]]` in body text for human-readable Obsidian traversal.
- A document is excluded from normal packs when it is stale or unverified.
