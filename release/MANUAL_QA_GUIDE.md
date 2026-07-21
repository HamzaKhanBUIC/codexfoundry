# Codex Foundry — Manual QA Guide

Use this guide to validate the complete deterministic PAY-17 MVP without
editing code, the frozen fixture, or vault files. Section 4 includes one
explicitly opt-in, reversible evidence-corruption drill for demonstrating the
fail-closed trust boundary; skip that section for a normal read-only review.

## 1. Testing environment

### Required software

- Windows PowerShell.
- Node.js 24.x (`node --version` should begin with `v24`).
- npm 11.x or compatible.
- Bundled Playwright Chromium, or installed Google Chrome as the documented
  fallback.

### Open the checked-out repository

```powershell
$Project = (Get-Location).Path
Set-Location -LiteralPath $Project
git branch --show-current
git status --short
node --version
npm --version
```

Expected:

- Any checked-out branch or commit that contains the documented PAY-17 release
  artifacts. Record the exact value before making a commit-specific claim.
- Node: `v24.x`.
- No unexpected tracked changes.

The immutable PAY-17 baseline is
`93ef28fa1737767a4a0c3b38fa8f9a6158980bb6`. Its browser infrastructure uses
per-process ports; this is an isolation change only and does not repair
PAY-17.

### Start the product

```powershell
npm run demo
```

Expected services:

- Dashboard: `http://127.0.0.1:4173`
- Read-only API health: `http://127.0.0.1:4174/api/health`

Wait for `Codex Foundry is ready.` Keep this terminal open during dashboard
checks. The bootstrap materializes or validates the ignored runtime fixture at
`.foundry-runtime\demo-store` and must report the baseline commit above.

## 2. End-to-end manual test

Open `http://127.0.0.1:4173`.

### A. Proof Story

1. Confirm the title describes a duplicate charge after checkout retry.
2. Confirm the status is `Independent verification: verified`.
3. Confirm the causal graph contains, in order: PAY-17 issue, baseline planner
   pack, approved plan, candidate worktree, independent verification, patch
   approval, vault approval, and regression replay.
4. Open the recorded workflow evidence. Confirm that intake, approved plan,
   implementation, verifier, patch approval, and vault approval each name a
   recorded source artifact for the same run.
5. Click **PAY-17 issue**, **Independent verification**, and **Regression
   replay**. Each inspector must show its evidence source, status, causal
   explanation, and limitations.
6. Click a connector. It must explain why the next artifact is permitted.
7. Use **Clear selection** or `Escape`; no action beyond inspection is
   available.

Expected conclusion: the verifier—not Codex or the dashboard—made the proof
status authoritative.

### B. Review

1. Select **Review**.
2. Confirm only `src/services/checkout-service.ts` and
   `tests/browser/pay-17.spec.ts` changed.
3. Confirm the proof contract is `one logical checkout persists one payment`.
4. Confirm patch approval explicitly grants no merge, deployment, or vault
   write.
5. Confirm the separate vault decision is `APPROVE VAULT WRITE`, with state
   `completed` and five Markdown targets, including `ARCH-001` plus the
   Incident, ADR, Proof, and Evaluation.

### C. Memory Pack

1. Select **Memory Pack**.
2. Confirm its heading is **Post-repair reusable engineering memory**.
3. Confirm the lifecycle is baseline planner input → repair → independent
   verification → approved engineering memory → future tasks.
4. Confirm the pack says it was not sent to the baseline planner.
5. Confirm baseline `93ef28f`, approved repair `63417ca`, token estimate
   `715 / 12000`, and confidence `1`.
6. Confirm omitted note bodies are absent and every source has provenance and
   a freshness/coverage reason.

### D. Evidence

1. Select **Evidence** and expand every **View recorded evidence** control.
2. Confirm baseline PAY-17 has exit code `1` and describes two payments.
3. Confirm candidate build, health, PAY-17, and browser commands have exit
   code `0`.
4. Confirm implementer entries are labelled `implementer`; successful proof is
   labelled `independent_verifier`.
5. Confirm browser evidence honestly says its command log is authoritative and
   that no screenshot/trace was recorded.
6. Confirm the Evidence tab includes the recorded issue intake and the
   recorded, human-approved plan alongside later-stage evidence.

## 3. Workflow validation

### Frozen baseline

Open a second PowerShell window:

```powershell
Set-Location -LiteralPath "$Project\.foundry-runtime\demo-store"
git rev-parse HEAD
npm run build
npm run test:health
npm run test:pay-17
Write-Host "PAY-17 exit code: $LASTEXITCODE"
npm run test:browser
```

Expected:

- Commit exactly `93ef28fa1737767a4a0c3b38fa8f9a6158980bb6`.
- Build and health pass.
- `test:pay-17` exits `1`: expected one payment, received two.
- Browser command exits `0` because it successfully reproduces the known
  defect, visibly observing two payments.

### Approved candidate evidence

The standard release clone packages the frozen baseline, not a checkout-able
approved candidate. Candidate success is therefore inspected as recorded
independent-verifier evidence in the dashboard and
`foundry/evidence/`. Do not claim that a normal clone can rerun the approved
candidate unless your own workspace contains that separately preserved
candidate worktree.

If an engineering workspace does contain the recorded candidate, use its
actual path rather than a hard-coded machine-specific path:

```powershell
$Candidate = '<path-to-a-preserved-RUN-PAY-17-001-candidate-worktree>'
Set-Location -LiteralPath $Candidate
git rev-parse HEAD
npm run build
npm run test:health
npm run test:pay-17
npm run test:browser
```

Expected:

- Commit exactly `63417cadd2ed28ec0a0dd7832be900285119c885`.
- Every command exits `0`.
- Browser proof observes one payment after retry.

### Parallel browser isolation (engineering workspace only)

Run these in two PowerShell windows at the same time:

```powershell
Set-Location -LiteralPath "$Project\.foundry-runtime\demo-store"
npm run test:browser
```

```powershell
Set-Location -LiteralPath $Candidate
npm run test:browser
```

Expected: both commands exit `0`, print distinct API/web port pairs, and do
not produce `ECONNREFUSED` errors.

### Regression replay evidence

As with the approved candidate, a normal release clone does not package the
regression worktree. Inspect its recorded independent-verifier artifact unless
you are in an engineering workspace that preserved this disposable worktree.

```powershell
$Regression = '<path-to-a-preserved-RUN-PAY-17-001-regression-worktree>'
Set-Location -LiteralPath $Regression
git rev-parse HEAD
git status --short
npm run test:pay-17
Write-Host "Regression exit code: $LASTEXITCODE"
```

Expected:

- The parent commit is `63417ca...`.
- Only `src/services/checkout-service.ts` is modified.
- The PAY-17 proof exits `1` and reports two payments. This is success: the
  unchanged proof blocked the deliberate retry-key mutation.

## 4. Optional live fail-closed drill

This is the only section that temporarily edits evidence. It is safe only in
the release worktree, with the demo server already running. It never touches
the frozen baseline or the vault. The dashboard fetches the read API on page
load, so refresh the browser after each edit; no server restart is required.

```powershell
Set-Location -LiteralPath $Project
$VaultEvidence = '.\foundry\evidence\RUN-PAY-17-001-vault-write.json'
$Backup = Join-Path $env:TEMP 'RUN-PAY-17-001-vault-write.demo-backup.json'
Copy-Item -LiteralPath $VaultEvidence -Destination $Backup -Force
$Evidence = Get-Content -Raw -LiteralPath $VaultEvidence | ConvertFrom-Json
$Evidence.regressionReplay.status = 'pending'
$Evidence | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $VaultEvidence -Encoding utf8
```

Refresh `http://127.0.0.1:4173`. Expected result: the API responds to
`GET /api/runs/RUN-PAY-17-001` with HTTP `503` and
`{"error":"evidence_contradiction"}`; the dashboard displays **Evidence
contradiction / Projection blocked**, rather than a guessed verified result.

Restore immediately, then refresh once more:

```powershell
Copy-Item -LiteralPath $Backup -Destination $VaultEvidence -Force
Remove-Item -LiteralPath $Backup -Force
```

Expected recovery: API and dashboard return to their normal verified state
without restarting `npm run demo`. Stop and restore the backup before any
other troubleshooting if the blocked state does not appear.

## 5. Failure cases

| Condition | Expected behavior | Meaning |
|---|---|---|
| Frozen `test:pay-17` fails with two payments | Expected | PAY-17 remains deterministic and unfixed in baseline. |
| Regression `test:pay-17` fails with two payments | Expected | The saved evaluation catches the causal defect. |
| Candidate `test:pay-17` fails | Unexpected | Stop: repair or evidence is invalid. |
| Candidate browser fails or reports `ECONNREFUSED` | Unexpected | Stop: browser-process isolation is broken. |
| Read API `POST` returns `405` | Expected | Dashboard/API cannot mutate runs, vault, Git, or production state. |
| Missing/malformed required evidence yields API `503 evidence_incomplete` | Expected | Projection fails closed rather than displaying an incomplete workflow as complete. |
| Valid evidence disagrees about regression replay | API `503 evidence_contradiction`; dashboard says **Evidence contradiction / Projection blocked** | Projection refuses to choose a preferred claim. |

## 5. Acceptance checklist

- [ ] `npm run demo` starts the dashboard and read API.
- [ ] Dashboard Proof Story is readable and inspectors are interactive only.
- [ ] Review shows separate patch and vault approvals.
- [ ] Review lists five approved vault revisions.
- [ ] Memory Pack identifies post-repair memory and excludes it from baseline planning.
- [ ] Evidence separates implementer claims from verifier authority.
- [ ] Frozen baseline commit is `93ef28f...`.
- [ ] Frozen health passes.
- [ ] Frozen PAY-17 proof fails with exactly two payments.
- [ ] Frozen browser proof passes while reproducing two payments.
- [ ] Candidate commit is `63417ca...`.
- [ ] Candidate build, health, unit proof, and browser proof pass.
- [ ] Baseline and candidate browser proofs pass concurrently on distinct ports.
- [ ] Regression candidate changes only the retry-key line.
- [ ] Regression PAY-17 proof fails with two payments.
- [ ] Memory tests pass (18 tests) and build succeeds.
- [ ] Foundry tests pass (61 tests in the 2026-07-21 validation) and build succeeds.
- [ ] Dashboard production build succeeds.
- [ ] No dashboard console warnings or errors occur during the workflow.
- [ ] No step grants merge, deployment, production, generic file, or automatic vault-write authority.

## Clean stop

Return to the terminal running `npm run demo` and press `Ctrl+C`. Then run:

```powershell
Set-Location -LiteralPath $Project
git status --short
```

The ignored `.foundry-runtime` directory is expected. Stop and inspect any
unexpected tracked modification before starting another run.
