# Feature Set

## P0 — required for the demo

| Feature | User value | Evidence of completion |
|---|---|---|
| Issue intake | Starts with a bounded engineering request | Recorded untrusted source issue plus validated task handoff |
| Memory Pack | Shows minimal, relevant, explainable context | Included-note list with reasons and token estimate |
| Proof contract | Defines observable success before code changes | Recorded approved plan, failing baseline proof, and acceptance assertion |
| Isolated implementation | Keeps changes reviewable and safe | Worktree path, diff, command log |
| Verification loop | Demonstrates mechanical trust | Passing test/browser result and failed-before state |
| Proof graph | Makes the work legible to a judge | Evidence-derived graph, source inspectors, and fail-closed projection |
| Vault write-back | Makes knowledge compound | Approved Markdown artifacts in Obsidian vault |
| Regression evaluation | Proves durable prevention | Intentional bad change fails |

## P1 — include only if P0 is solid

- Obsidian plugin side panel for reviewing proposed vault writes.
- Stale-memory badge when a note’s verified commit is no longer current.
- GitHub pull-request creation against a demo repository.
- Recorded naïve-context comparison when a real baseline exists; no inferred percentage.
