# G4A — Judge-Facing Dashboard Foundation

## Scope

Build the first read-only local Foundry dashboard using Fluent UI React. It
must make the real PAY-17 proof-carrying workflow visible without adding an
unbounded repository chat or bypassing approval controls.

## Acceptance criteria

- Production build succeeds.
- Local dashboard serves successfully.
- Overview shows the proof graph, timeline, verifier verdict, command evidence,
  approved memory, and blocked regression replay.
- Evidence and memory views are keyboard-selectable Fluent tabs.
- Layout is responsive for desktop, tablet, and mobile widths.
- No production action, automatic merge, or vault write is available in the UI.

## Deferred

- API-backed live run data.
- Human approval actions.
- Artifact loading and browser screenshots.
