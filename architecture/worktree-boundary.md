# Disposable Worktree Boundary

Foundry creates candidate checkouts only at
`<fixture-parent>/.foundry-worktrees/<RUN-ID>`, detached at the exact commit
validated by the repository map. The runner has no generic destination option.
It never runs a plan command; it only creates, inspects, and disposes a
candidate after independently checking its ownership path and baseline commit.

Commands are opaque strings. A candidate command is permitted only when its
exact string is present in both the human-approved plan and the repository-map
policy. Foundry does not split shell syntax, append arguments, or infer command
permissions from model output.
