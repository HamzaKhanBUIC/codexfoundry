# Codex Foundry

Codex Foundry transforms every engineering task into verified code changes, executable proof, and reusable engineering memory so every future Codex task becomes smarter, safer, and more efficient.

## Current status

The scoped MVP workflow is implemented on the release branch
`codex/m4-proof-experience` at `520de8a`. Milestones 1–4 now demonstrate the
complete PAY-17 path: deterministic defect → commit-aware Memory Pack →
bounded plan → disposable Codex candidate → independent verification →
separate human approvals → approved Markdown memory → deliberate regression
replay.

Release Tier 1 is also complete: `npm run demo` materializes an immutable
baseline-only fixture bundle, verifies its provenance and prerequisites, then
starts the local Foundry API and dashboard. The frozen source fixture and
`main` remain unchanged. The remaining product work is deliberately narrow:
final judge documentation and polish. The Proof Graph is interactive but
remains strictly read-only.

## Read first

1. [Product vision](product/vision.md)
2. [MVP scope](product/mvp.md)
3. [System design](architecture/system-design.md)
4. [Engineering memory](architecture/memory.md)
5. [Three-minute demo](product/demo-script.md)
6. [Implementation milestones](implementation/milestones.md)
7. [Current project handoff](release/PROJECT_MASTER_HANDOFF.md)
8. [Historical-versus-current QA comparison](release/DOCUMENTATION_COMPARISON.md)

## Demo scenario

`PAY-17`: a checkout retry after a timeout can create two payments. Foundry must create a proof, patch the bug in an isolated worktree, verify it in tests and a browser, save durable engineering memory to an Obsidian vault, and reject a later regression.

## Run the release locally

From this release worktree, run `npm run demo`. The bootstrap validates and
materializes the immutable fixture into an ignored runtime directory; it never
edits the frozen source fixture. See the [master handoff](release/PROJECT_MASTER_HANDOFF.md)
for the recorded validation inventory and current limitations.

## Getting started

From the repository root, no flags, environment variables, or manual
subpackage installs are required:

```powershell
npm install
npm run build
npm test
```

The root commands run the Memory, Foundry core, and dashboard builds in
dependency order. The root test command runs every package that currently has
a test suite (Memory and Foundry core); the dashboard has no test script yet.
After these checks, run `npm run demo` to start the local product.
