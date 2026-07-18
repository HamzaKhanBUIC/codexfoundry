# G2A — Seeded PAY-17 Issue Intake

## Scope

Accept only the seeded GitHub-style `PAY-17` issue and persist it as a Foundry
run in `intake` state. Produce a separate, policy-owned handoff record for the
Memory Pack compiler.

## Acceptance criteria

- The issue ID, exact title, required labels, and open status are validated.
- The handoff contains only fixed PAY-17 task facts: high risk, required
  services/path, acceptance criterion, and the validated repository commit.
- The issue body is treated as untrusted source data and is not present in the
  trusted handoff.
- A created run remains in `intake`; this task does not compile memory, create
  a plan, invoke Codex, or create a worktree.
- Contract tests reject lookalike inputs and prompt-injection-shaped prose.

## Expected files

- `foundry/src/models.ts`
- `foundry/src/issue-intake.ts`
- `foundry/src/index.ts`
- `foundry/tests/issue-intake.test.ts`
- `architecture/issue-intake.md`

## Validation

```powershell
npm test
npm run build
```
