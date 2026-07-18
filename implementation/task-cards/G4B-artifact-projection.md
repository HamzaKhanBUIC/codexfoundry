# G4B — Evidence Artifact Projection

## Scope

Replace duplicated dashboard proof values with a read-only projection of the
recorded PAY-17 verifier, approval, vault-write, and regression artifacts.

## Acceptance criteria

- Dashboard data is read from `foundry/evidence/`, not manually duplicated in
  the React view.
- The production build fails closed if a required artifact cannot be loaded.
- The UI remains read-only and has no new approval, merge, or vault-write
  authority.
- `npm run build` succeeds from `foundry/dashboard/`.

## Deferred

- Persistent run API.
- Live updates and polling.
- Approval actions.
