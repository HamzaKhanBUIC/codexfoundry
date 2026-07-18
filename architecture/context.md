# Context Strategy

## Context layers

1. **System policy:** tool permissions, security constraints, and proof requirements.
2. **Task context:** issue, acceptance criteria, and risk level.
3. **Memory Pack:** vetted vault notes, linked code excerpts, and evidence references.
4. **Live worktree state:** diff, test output, and browser artifacts.

## Rules

- Prefer structured facts and links over prose summaries.
- Never inject an entire vault or repository by default.
- Include a source only when it is fresh, linked to the task, or required by a human.
- Label inferred claims separately from verified evidence.
- Compact only after recording durable facts in the vault proposal.

## Memory Pack budget

The default demo budget is 12,000 estimated input tokens. The compiler must report omitted sources and explain why they were excluded.
