# G3C — PAY-17 Candidate Implementation

## Scope

Create one detached candidate worktree from the frozen PAY-17 baseline, apply
the smallest approved repair, and retain the implementer's real command
results for later independent verification.

## Result

- Candidate: `.foundry-worktrees/RUN-PAY-17-001`, detached at `1169daf`.
- Repair: retry attempts reuse the logical checkout idempotency key.
- Changed paths: checkout service and repaired browser proof only.
- Implementer-run build, health, PAY-17, and browser commands exited zero.
- Artifact: `foundry/evidence/RUN-PAY-17-001-implementation.json`.

## Boundary

The candidate remains dirty and uncommitted. This task does not mark a proof
verified, merge a patch, write the vault, or begin the review/UI milestone.
G3D independently reruns the evidence and decides the proof status.
