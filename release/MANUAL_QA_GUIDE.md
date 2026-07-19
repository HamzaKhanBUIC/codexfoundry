# Codex Foundry — Manual QA Guide

Use this guide to validate the complete deterministic PAY-17 MVP without
editing code, the frozen fixture, evidence, or vault files.

## 1. Testing environment

### Required software

- Windows PowerShell.
- Node.js 24.x (`node --version` should begin with `v24`).
- npm 11.x or compatible.
- Bundled Playwright Chromium, or installed Google Chrome as the documented
  fallback.

### Open the release worktree

```powershell
$Project = 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week-m4'
Set-Location -LiteralPath $Project
git branch --show-current
git status --short
node --version
npm --version
```

Expected:

- Branch: `codex/m4-proof-experience`.
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
4. Click **PAY-17 issue**, **Independent verification**, and **Regression
   replay**. Each inspector must show its evidence source, status, causal
   explanation, and limitations.
5. Click a connector. It must explain why the next artifact is permitted.
6. Use **Clear selection** or `Escape`; no action beyond inspection is
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

### Approved candidate

The isolated candidate is available in this engineering workspace:

```powershell
$Candidate = 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week\.foundry-worktrees\RUN-PAY-17-001-PORTS'
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

### Parallel browser isolation

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

### Regression replay

```powershell
$Regression = 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week\.foundry-worktrees\RUN-PAY-17-001-PORTS-REGRESSION'
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

## 4. Failure cases

| Condition | Expected behavior | Meaning |
|---|---|---|
| Frozen `test:pay-17` fails with two payments | Expected | PAY-17 remains deterministic and unfixed in baseline. |
| Regression `test:pay-17` fails with two payments | Expected | The saved evaluation catches the causal defect. |
| Candidate `test:pay-17` fails | Unexpected | Stop: repair or evidence is invalid. |
| Candidate browser fails or reports `ECONNREFUSED` | Unexpected | Stop: browser-process isolation is broken. |
| Read API `POST` returns `405` | Expected | Dashboard/API cannot mutate runs, vault, Git, or production state. |
| Missing/malformed evidence yields API `503 evidence_unavailable` | Expected | Projection fails closed rather than displaying untrustworthy proof. |

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
- [ ] Foundry tests pass (29 tests) and build succeeds.
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
