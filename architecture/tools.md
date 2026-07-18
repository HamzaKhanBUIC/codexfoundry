# Tool Policy

## Planner

- Read repository files, vault notes, issue metadata, and test list.
- No write or shell execution.

## Implementer

- Write only inside a generated worktree.
- Run allowlisted local commands.
- Create commits only in the worktree.

## Verifier

- Read diff and outputs.
- Run allowlisted tests and local browser checks.
- Write evidence records only.

## Curator

- Generate staged Markdown proposals only.
- No direct vault modification without explicit approval.
