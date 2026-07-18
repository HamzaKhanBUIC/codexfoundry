# G3H — Approved PAY-17 Vault Write

After explicit human approval, Foundry copied exactly four staged PAY-17
revisions into their existing vault destinations: Incident, ADR, Proof, and
Evaluation. All other vault files remain unchanged.

The live vault parsed with typed evidence, passed 18 memory tests and the
TypeScript build, and matched the approved staged content after normalizing
Windows line endings. The result is recorded in
`foundry/evidence/RUN-PAY-17-001-vault-write.json`.

The evaluation's deliberate retry-key regression remains pending; this vault
write records the verified repair and its evaluation contract, not a fabricated
regression replay result.
