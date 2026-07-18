# Codex Foundry

Codex Foundry transforms every engineering task into verified code changes, executable proof, and reusable engineering memory so every future Codex task becomes smarter, safer, and more efficient.

## Design status

Milestone 1’s deterministic checkout fixture and Milestone 2’s engineering
memory foundation are complete. The agent workflow, worktree orchestration,
verification, UI, and vault write-back remain intentionally out of scope until
their later milestones.

## Read first

1. [Product vision](product/vision.md)
2. [MVP scope](product/mvp.md)
3. [System design](architecture/system-design.md)
4. [Engineering memory](architecture/memory.md)
5. [Three-minute demo](product/demo-script.md)
6. [Implementation milestones](implementation/milestones.md)

## Demo scenario

`PAY-17`: a checkout retry after a timeout can create two payments. Foundry must create a proof, patch the bug in an isolated worktree, verify it in tests and a browser, save durable engineering memory to an Obsidian vault, and reject a later regression.
