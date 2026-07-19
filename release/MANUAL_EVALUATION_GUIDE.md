# Codex Foundry — One-Hour Manual Evaluation Guide

This guide is for a non-specialist reviewer. You do **not** need to understand
all of the source code. Your job is to answer a smaller, more important
question:

> Does Codex Foundry honestly demonstrate one AI-assisted repair becoming
> independently verified, human-approved engineering memory that later catches
> the same regression?

Use PowerShell on Windows. Every command below is safe to **read**, build, or
test the project. Do not edit source files during this walkthrough.

## Before you start

### What you need

- About 60 minutes.
- PowerShell.
- Node.js 24. The project currently uses Node's built-in SQLite support.
- Internet only if `npm run demo` needs to install missing dependencies.
- A supported browser. Bundled Playwright Chromium is preferred; installed
  Google Chrome is an accepted fallback.

### Safety rules

- Work only in `OpenAI Build Week-m4`, the release worktree.
- Do **not** edit anything in `demo-store`, `.foundry-runtime`, `vault`, or
  `foundry/evidence`.
- Do **not** run `git reset --hard`, `git checkout`, `git clean`, or delete
  folders.
- `npm run test:pay-17` is designed to fail on the frozen baseline. That is a
  successful demonstration of the seeded bug, not a project failure.
- `npm run demo` creates an ignored local runtime clone in `.foundry-runtime`.
  That is expected and does not alter the frozen source fixture.

## 0. Open the correct project — 5 minutes

Open PowerShell and paste:

```powershell
$Project = 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week-m4'
Set-Location -LiteralPath $Project
Get-Location
git branch --show-current
git status --short
node --version
npm --version
```

### You should see

- Location ending in `OpenAI Build Week-m4`.
- Branch: `codex/m4-proof-experience`.
- No unexpected files from `git status --short`.
- Node version `v24.x`.

If you are in `OpenAI Build Week` without `-m4`, stop: that is the older
planning baseline, not the release worktree.

Check the release commit and the frozen fixture identity:

```powershell
git log -1 --oneline
Get-Content .\release\demo-store-manifest.json
```

The manifest must name baseline commit
`1169dafdc3d1f18fed2adca11ce900a15a67cfd3` and the four fixture commands:
`build`, `test:health`, `test:pay-17`, and `test:browser`.

## 1. Start the local product — 10 minutes

In the same PowerShell window, run:

```powershell
npm run demo
```

Leave this window open while you evaluate. It is the local server window.

### Expected startup messages

- On a first run: `Materializing the immutable PAY-17 fixture from the release bundle.`
- Dependency installation only if needed.
- A browser preflight message. It may say bundled Playwright Chromium is
  available, or it may state that Chrome fallback is being used.
- `Codex Foundry is ready.`
- Dashboard URL: `http://127.0.0.1:4173`

### Stop and record a problem if

- The fixture commit does not match the manifest.
- A required fixture command is missing.
- No browser can be launched and the displayed installation instruction does
  not solve it.
- The API never becomes healthy.

Open `http://127.0.0.1:4173` in your browser. Do not close the PowerShell
window until the end of the walkthrough. When finished, press `Ctrl+C` there.

## 2. Evaluate the dashboard story — 15 minutes

The dashboard is deliberately **read-only**. It does not merge code, deploy,
write to GitHub, or write to Obsidian. That is a trust feature, not missing
functionality.

### A. Proof story

Open the **Proof story** tab.

Check these statements visually:

- [ ] The title identifies PAY-17 as a duplicate-charge checkout-retry issue.
- [ ] The status says independent verification passed.
- [ ] The central causal sequence includes issue, baseline planner memory,
  plan, isolated worktree, verification, human patch approval, durable memory,
  and regression replay.
- [ ] The final result says the deliberate retry-key regression was blocked.
- [ ] The graph says it is evidence-derived and grants no action authority.

Click at least three graph nodes: **Issue**, **Verification**, and
**Regression replay**. For each, check that the inspection panel gives a
source, status, causal explanation, and limits.

Then click one connector line. It should explain *why* the next step is
allowed, not merely show a sequence. Use **Clear selection** or `Escape`.

**Pass condition:** You can explain this in one sentence: “The verifier,
not Codex, proved the candidate; a later deliberate regression was caught by
the saved evaluation.”

### B. Review

Open the **Review** tab.

Check all of the following:

- [ ] The changed paths are `src/services/checkout-service.ts` and
  `tests/browser/pay-17.spec.ts`.
- [ ] The proof contract is “one logical checkout persists one payment.”
- [ ] Patch approval says it does **not** authorize merge, deployment, or a
  vault write.
- [ ] A separate panel says `APPROVE VAULT WRITE` and recorded state
  `completed`.
- [ ] Four Markdown targets are listed: Incident, ADR, Proof, and Evaluation.
- [ ] The page explicitly says it only displays the recorded outcome and has
  no write control.

**Pass condition:** Patch approval and vault approval are visibly separate.
There must be no text claiming that no vault write happened.

### C. Memory Pack

Open the **Memory Pack** tab.

Check:

- [ ] The heading is **Post-repair reusable engineering memory**.
- [ ] It gives an explicit lifecycle:
  `Baseline planner input → repair → independent verification → approved engineering memory → future tasks`.
- [ ] It says this post-repair memory did **not** go to the baseline planner.
- [ ] It displays `715` estimated tokens, `12000` budget, and confidence `1`.
- [ ] It honestly says no naïve repository-context baseline was recorded;
  therefore no reduction percentage is claimed.
- [ ] Included and omitted notes have provenance/freshness reasons, while
  omitted note bodies are not exposed.

**Pass condition:** You understand that `PROOF-001` is reusable *future*
knowledge, not information the agent was allowed to use before the repair.

### D. Evidence

Open the **Evidence** tab and expand every **View recorded evidence** section.

Check:

- [ ] Baseline PAY-17 evidence has exit code `1` and says two payments were
  received. This is expected.
- [ ] Candidate build, health, PAY-17, and browser evidence have exit code
  `0`.
- [ ] Implementer evidence is labeled `implementer` and not presented as
  independent proof.
- [ ] Verifier evidence is labeled `independent_verifier`.
- [ ] Browser evidence truthfully says no screenshot or trace was recorded;
  its command log is the authoritative browser artifact.

**Pass condition:** Every major visible claim can be traced to a command log,
review artifact, or approved vault artifact.

## 3. Reproduce the frozen baseline — 15 minutes

Keep the demo server running. Open a **second** PowerShell window and paste:

```powershell
$Project = 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week-m4'
Set-Location -LiteralPath "$Project\.foundry-runtime\demo-store"
git rev-parse HEAD
npm run build
npm run test:health
```

### Expected result

- The commit is exactly `1169dafdc3d1f18fed2adca11ce900a15a67cfd3`.
- Build passes.
- Health suite passes.

Now prove the intentionally defective behavior:

```powershell
npm run test:pay-17
Write-Host "PAY-17 exit code: $LASTEXITCODE"
```

### Expected result

- The test command fails with exit code `1`.
- Its output says the test expected one payment but received two.

Tick this only if it fails exactly this way:

- [ ] Baseline PAY-17 is deterministically red: expected 1 payment, actual 2.

Finally run the browser reproduction:

```powershell
npm run test:browser
```

### Expected result

- The command itself passes.
- It uses bundled Chromium or clearly reports Chrome fallback.
- The browser scenario reproduces the duplicate payment in the frozen baseline.

Tick:

- [ ] Baseline browser scenario passes as a test of the **bug reproduction**.

This apparent contrast is important:

| Command | Expected process result | Meaning |
|---|---|---|
| `npm run test:health` | Pass | Normal unrelated behavior is healthy. |
| `npm run test:pay-17` | Fail | The frozen duplicate-charge defect exists. |
| `npm run test:browser` | Pass | The browser successfully reproduces and observes the known defect. |

## 4. Inspect the repair evidence honestly — 10 minutes

Return to the project root:

```powershell
$Project = 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week-m4'
Set-Location -LiteralPath $Project
Get-Content .\foundry\reviews\RUN-PAY-17-001.md
Get-Content .\foundry\evidence\RUN-PAY-17-001-verifier.json
Get-Content .\foundry\evidence\RUN-PAY-17-001-regression-replay.json
```

Read these three things:

1. The review diff changes the retry path so it preserves the original
   logical idempotency key.
2. The independent verifier records baseline failure, candidate green build,
   green health suite, green unchanged PAY-17 unit proof, and green browser
   proof.
3. The regression replay restores only the bad retry-key mutation in a
   disposable candidate and the unchanged PAY-17 proof fails again.

Tick:

- [ ] The repair diff is narrow and easy to explain.
- [ ] The verifier, not the implementer, owns the successful proof result.
- [ ] The regression replay proves the saved evaluation catches the original
  causal bug.

### Important current limitation

The release bundle intentionally packages **only the frozen baseline**. The
approved candidate commit `2a5d01f...` is represented by the recorded review
diff and verifier artifacts; it is not checkout-able from this release clone.
Therefore, you can independently run the baseline live and inspect the
candidate evidence, but you cannot rerun the candidate commit locally from
this exact package.

Do **not** try to invent or manually alter a candidate during this review. If
you need full candidate replay in the final submission, record that as a
release improvement rather than silently claiming it already works.

## 5. Run source-level smoke checks — 5 minutes

These checks validate the Foundry code and dashboard, not the frozen fixture.
From the project root, run each block:

```powershell
Set-Location -LiteralPath "$Project\memory"
npm test
npm run build
```

```powershell
Set-Location -LiteralPath "$Project\foundry"
npm test
npm run build
```

```powershell
Set-Location -LiteralPath "$Project\foundry\dashboard"
npm run build
```

Tick only if all commands exit `0`:

- [ ] Memory tests and strict TypeScript build pass.
- [ ] Foundry tests and strict TypeScript build pass.
- [ ] Dashboard production build passes.

## 6. Your final review scorecard — 5 minutes

Use this quick scorecard. Write one sentence of evidence beside each score.

| Area | Score / 10 | Evidence you personally saw |
|---|---:|---|
| Problem clarity |  |  |
| Codex role |  |  |
| Independent proof |  |  |
| Memory transparency |  |  |
| Human control |  |  |
| Regression protection |  |  |
| Dashboard clarity |  |  |
| Setup reliability |  |  |
| Demo readiness |  |  |

### Ready to record the demo only if all are true

- [ ] `npm run demo` reaches the local dashboard.
- [ ] The dashboard has no broken tab, blank panel, or contradictory trust
  statement.
- [ ] The frozen baseline produces exactly two payments in the PAY-17 proof.
- [ ] The browser reproduction completes.
- [ ] Core and dashboard smoke checks pass.
- [ ] You can explain baseline → Codex candidate → independent verifier →
  separate human approvals → approved memory → regression block in 20 seconds.
- [ ] You will describe candidate results as **recorded verifier evidence**,
  not as a candidate you reran from this release package.

## 7. Stop cleanly

Close the second PowerShell window, then return to the first window where
`npm run demo` is running and press:

```text
Ctrl+C
```

Then verify no tracked project file changed:

```powershell
Set-Location -LiteralPath 'C:\Users\Hamza Imran\Desktop\OpenAI Build Week-m4'
git status --short
```

An ignored `.foundry-runtime` folder is normal. Any tracked source, vault, or
evidence file listed as changed means stop and inspect before recording.
