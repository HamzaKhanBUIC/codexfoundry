# G4E — Memory Pack Baseline Contract

## Scope

Align the Foundry integration test with commit-aware Memory Pack selection.

## Decision

The issue-intake task targets frozen baseline `1169daf`. Notes verified only
against approved repair `2a5d01f` are stale for that task. `ARCH-001` remains
the selected baseline-compatible source; repaired proof notes are omitted.

## Validation

- Core suite: 26 tests pass.
- Core TypeScript build passes.
