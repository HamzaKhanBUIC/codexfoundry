# Milestone 4 Proof Experience

The judge-facing proof experience consumes a single versioned (`1.0`)
`FoundryRunProjection`. It is derived from recorded implementation, verifier,
human-approval, vault-write, and regression artifacts. The dashboard does not
parse evidence JSON itself and has no action endpoint.

Views: causal proof graph, engineering incident timeline, reviewer decision,
Memory Pack transparency, and expandable reusable evidence records. Omitted
memory notes are represented by metadata only; their bodies are never included
in the projection.
