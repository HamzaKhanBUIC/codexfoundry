# Codex Implementer Contract

G3B is the boundary between an approved PAY-17 plan and a future Codex repair
run. It does not execute a repair.

## Inputs

- Human-approved structured plan and proof contract.
- Exact persisted, measured Memory Pack.
- Candidate worktree created at the validated frozen commit.
- Exact path and command allowlists from Foundry policy.

## Authority

Codex may edit only the assigned candidate and only approved paths. It may run
only exact approved local commands. It has no authority for vault writes,
network/credentials, remote Git actions, merge/deploy, plan approval, or proof
status.

## Output and evidence separation

Codex returns a narrow JSON report: paths changed, a factual summary, commands
it says it ran, unresolved risks, and a confidence signal. This report is
untrusted. The later execution service records the actual diff and raw command
logs; the independent Verifier evaluates those records against the proof
contract. No self-reported output can mark PAY-17 verified.
