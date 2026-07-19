# Codex Foundry Trust Consistency Report

**Scope:** release-blocking presentation consistency only.  
**Run:** `RUN-PAY-17-001`  
**Baseline:** `1169dafdc3d1f18fed2adca11ce900a15a67cfd3`  
**Approved repair:** `2a5d01f47b1ebdbe0ed97633474d2e19adf4b10b`

## 1. Root cause of Issue 1

The Review screen rendered `verifier.limitations` as if it described the final
run state. The verifier artifact was correctly recorded before the separate
vault-approval stage and therefore said that it had not written the vault. A
later authoritative `RUN-PAY-17-001-vault-write.json` artifact records
`APPROVE VAULT WRITE`, `status: completed`, and four written Markdown notes.

The bug was presentation-level lifecycle conflation, not a verifier or
approval-workflow failure.

**Resolution:** the projection now renders patch-approval limits from the
human approval artifact and renders the vault decision, completed status, and
written targets from the vault-write artifact. The Review screen makes the
stages explicit: patch approval did not authorize a vault write; the later,
separate vault approval completed it.

## 2. Root cause of Issue 2

`RUN-PAY-17-001-memory-pack.json` is pinned to the approved repair commit
`2a5d01f...` and includes `PROOF-001`, which is verified after repair. The UI
called it simply “Measured Memory Pack,” while the proof graph also showed an
earlier planner Memory Pack. This made the post-repair snapshot look like it
could have been planner input for the baseline repair.

The underlying compiler and planner policy did not change: baseline planning
remains commit-aware and excludes future repair knowledge. The ambiguity was
only in the judge-facing presentation.

**Resolution:** the graph and incident timeline now name the earlier context
as the **Baseline planner Memory Pack**. The Memory tab names the actual
displayed artifact **Post-repair reusable engineering memory**, identifies the
approved repair and baseline commits, and states that the displayed pack was
not sent to the baseline planner. The core rejects a displayed reusable pack
whose commit does not match the approved repair commit.

## 3. Files changed

- `foundry/src/run-evidence-projection.ts`
  - separates patch-approval limits from completed vault-write state;
  - derives lifecycle metadata from the recorded baseline and approved repair
    commits;
  - fails closed if the displayed post-repair pack is not pinned to the
    approved candidate.
- `foundry/dashboard/src/foundry-run.d.ts`
  - extends the read-only dashboard contract with the new evidence-derived
    review and memory lifecycle fields.
- `foundry/dashboard/src/App.tsx`
  - presents patch approval and completed vault approval as distinct stages;
  - labels and explains post-repair reusable memory and its lifecycle.
- `foundry/dashboard/src/styles.css`
  - adds a minimal lifecycle callout style.
- `foundry/tests/run-evidence-projection.test.ts`
  - verifies completed vault state and post-repair memory provenance.

No fixture, vault note, verifier policy, planner policy, approval workflow, or
trust boundary changed.

## 4. Validation performed

- Foundry core: `npm test` passed, 27/27 tests.
- Foundry core: `npm run build` passed.
- Dashboard: `npm run build` passed.
- `git diff --check` passed.
- Live release bootstrap returned API health and run projection successfully.
- Live Review screen showed `APPROVE VAULT WRITE`, `completed`, and four
  written Markdown notes; it no longer stated that no vault write occurred.
- Live Memory Pack screen showed the post-repair label, the baseline-to-future
  lifecycle, and the explicit non-leakage statement.
- Dashboard browser console contained no warnings or errors during this check.

## 5. Why the final implementation matches the architecture

The verifier remains the sole verification authority. Patch approval remains a
separate human decision with no merge, deployment, or implied vault authority.
Vault approval remains a distinct later human action and is now represented by
its own completed evidence artifact.

The baseline planner remains bounded by pre-repair, commit-aware context. The
displayed `PROOF-001` pack is now accurately shown as knowledge approved after
verification for future tasks. This preserves the required causal order:

Baseline planner Memory Pack → repair → independent verification → approved
engineering memory → future tasks.
