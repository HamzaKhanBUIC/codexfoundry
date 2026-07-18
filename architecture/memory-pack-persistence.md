# Memory Pack Persistence Boundary

## G2B contract

The G2A `IntakeTask` is the only task input accepted by the Memory Pack
integration. It is converted into the memory library's `TaskInput` with its
fixed requirement, services, path, and frozen repository commit. Original
issue prose is intentionally absent.

The integration reads the vault through the existing deterministic compiler.
It stores one record per run containing:

- exact rendered Markdown payload and SHA-256 hash;
- measured token budget/estimate and aggregate confidence;
- bodyless selected-source provenance; and
- bodyless omission metadata and reasons.

The selected source bodies occur only in the rendered payload—the sole artifact
that a later Planner may receive. SQLite never stores the raw vault index or an
unrestricted vault dump. The insert and `intake → memory_compiled` transition
occur in one local SQLite transaction, so a run cannot advance without a pack.

## Explicit exclusions

This boundary does not rank with GPT-5.6, create a plan, expose a UI/API,
execute commands, create a worktree, write the vault, or grant approval.
