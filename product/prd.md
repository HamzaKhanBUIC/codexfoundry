# Product Requirements Document

## Success metrics

| Metric | Build Week target |
|---|---:|
| Verified end-to-end task completion | 1/1 scripted scenario |
| Requirement-to-proof linkage | 100% for demo requirement |
| Regression catch rate | 1/1 deliberate regression caught |
| Memory artifact completeness | 4/4: incident, ADR, proof, evaluation |
| Context efficiency | Measure baseline and Memory Pack tokens; target ≥50% reduction |
| Demo duration | ≤3 minutes |

## Product principles

- Proof before confidence.
- Human-readable memory over opaque agent state.
- Minimum necessary context, with inclusion rationale.
- Human approval before persistent memory changes.
- No production-side effects in the MVP.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Agent fails to fix bug live | Use a pre-validated demo repository and rehearse; never fake test results |
| Scope expands into autonomous DevOps | Enforce one issue, one repository, one proof path |
| Obsidian feels bolted on | Make Memory Pack and approved vault write-back central to demo |
| Context savings are unproven | Instrument prompt-token estimates and disclose methodology |
