# G3D — Independent PAY-17 Verification

## Scope

Independently rerun the PAY-17 proof contract against the exact candidate
created in G3C and record an authoritative verifier result.

## Acceptance evidence

- Frozen baseline `test:pay-17` failed: expected one payment, received two.
- Candidate diff contains only two policy-approved paths.
- Candidate `build`, health, unchanged PAY-17 unit proof, and repaired browser
  proof all passed independently.
- The verifier record states `verified` and names limitations.

## Boundary

This result leads to `review_pending`. It does not merge, deploy, alter the
frozen fixture, or write engineering memory.
