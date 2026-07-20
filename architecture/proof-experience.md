# Milestone 4 Proof Experience

The judge-facing proof experience consumes a single versioned (`1.0`)
`FoundryRunProjection`. It is derived from recorded intake, plan, implementation,
verifier, human-approval, vault-write, regression, and Memory Pack artifacts.
The dashboard does not parse evidence JSON itself and has no action endpoint.

Views: causal proof graph, engineering incident timeline, reviewer decision,
Memory Pack transparency, and expandable reusable evidence records. Omitted
memory notes are represented by metadata only; their bodies are never included
in the projection. The story view also identifies the six workflow stages and
their source artifacts. A missing/contradictory evidence chain blocks the
entire view rather than rendering an inferred success state.
