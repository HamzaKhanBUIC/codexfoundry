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
