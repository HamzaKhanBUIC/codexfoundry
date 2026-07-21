# MVP Scope

## The one complete workflow

Input: a GitHub-style issue reporting duplicate charges after checkout retry.

Foundry must:

1. ingest the issue and repository metadata;
2. compile a task-specific Memory Pack from the Obsidian Engineering Vault;
3. produce a plan and a proof contract;
4. use Codex in an isolated worktree to implement the fix;
5. run unit/integration and browser verification;
6. display a proof graph and a reviewable PR artifact;
7. write an Incident, ADR, Proof, and Evaluation note into the vault; and
8. demonstrate a later intentionally bad change being caught by the saved evaluation.

## Definition of done

- The original regression fails before the patch and passes after it.
- Browser checkout retry creates one payment, not two.
- Every displayed claim links to evidence: test output, commit, or vault note.
- The vault update is human-approved before writing.
- A deliberately regressive follow-up change fails the new evaluation.

## Explicit exclusions

- GitHub App production installation.
- Cloud CI runner provisioning.
- Multiple languages/frameworks.
- Vector database as a dependency for the MVP.
- Automatic merge, deploy, payments, or production credentials.

## Repository-agnostic workflow contract

PAY-17 remains the canonical, fixed evidence scenario. The core also supports
generic local Git runs when a caller supplies a task and an explicit policy
that pins a clean baseline commit, permitted relative paths, and structured
direct command specifications. Repository Intelligence remains read-only; a
successful readiness assessment only makes bounded planning appropriate. It
does not authorize implementation. A generic run records intake, Memory Pack
reference, Codex plan proposal, human plan approval, disposable worktree,
non-authoritative Codex implementation report, independent verification,
human patch approval, staged Markdown memory, separate vault approval, and an
optional independently verified regression replay. It has no merge, deploy,
or production authority.

## Read-only Repository Intelligence mode

The dashboard also supports a separate local Repository Intelligence mode. It
derives evidence-cited Git metadata, languages, framework/package/build/test
markers, entrypoints, static module/dependency graphs, Architecture Explorer
inspection panels, reverse-graph static change-impact estimates,
architecture/domain signals, review risks, health signals, Memory Pack
selection, and suggested engineering tasks from a user-selected local Git
repository. This is
preparation only: it does not execute repository commands, create a worktree,
verify a patch, approve a plan, or write the vault. An explicit opt-in may run
two citation-checked, read-only Codex semantic specialists; their advisory
results cannot grant authority. PAY-17 remains the only bundled, fixed
executable reference workflow.
