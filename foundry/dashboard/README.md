# Codex Foundry Dashboard

The dashboard is a local, read-only engineering evidence surface. It is not an
orchestration control plane.

It opens with two modes:

- **Reference Sandbox** renders the validated `RUN-PAY-17-001` PAY-17 proof
  story, review, Memory Pack, and evidence projection.
- **Analyze Repository** sends an absolute local Git path to the loopback
  read API and renders Repository Intelligence. The analysis is static and
  bounded; it does not execute, modify, plan for, or verify the selected
  repository.

The Repository Intelligence view can also load a persisted generic-run record
by ID. This is an evidence handoff view only: it cannot create a run, approve
a plan, invoke Codex, make a worktree, verify a patch, merge, deploy, or write
memory.

## Run locally

Prefer the root command, which starts both services and validates the immutable
fixture:

```powershell
npm run demo
```

For dashboard-only development:

```powershell
cd foundry
npm run serve

cd dashboard
npm run dev
```

Open `http://127.0.0.1:4173`.

## What it displays

- Interactive, keyboard-accessible causal graph with node and edge inspectors.
- Evidence-backed intake, baseline Memory Pack, approved plan, candidate,
  verifier, patch approval, vault approval, and regression replay.
- Review limits, post-repair reusable memory provenance, and recorded command
  evidence.
- A six-stage workflow-evidence list: intake, plan, implementation,
  verification, patch approval, and vault approval.
- Engineering Intelligence Dashboard: Repository DNA, planning-readiness,
  executive briefing, Repository Story, static Architecture Explorer,
  evidence-linked report card, risks, and recommendations.
- Persisted generic-run handoffs: policy ceiling, Memory Pack reference,
  acceptance criteria, approved plan scope, verifier evidence, approvals, and
  exact bounded Codex invocation receipts when one was recorded.

The app receives the same `FoundryRunProjection` from a Vite build-time module
and the loopback read API. It fetches the API once when the page loads. For a
live evidence-corruption drill, refresh the page after changing or restoring an
artifact; it intentionally does not poll or mutate evidence.

If the API reports `evidence_contradiction` or `evidence_incomplete`, the
dashboard renders **Projection blocked** rather than retaining or guessing a
verified state.
