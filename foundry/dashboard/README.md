# Codex Foundry Dashboard

The dashboard is a local, read-only proof surface for `RUN-PAY-17-001`. It is
not an orchestration control plane.

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

The app receives the same `FoundryRunProjection` from a Vite build-time module
and the loopback read API. It fetches the API once when the page loads. For a
live evidence-corruption drill, refresh the page after changing or restoring an
artifact; it intentionally does not poll or mutate evidence.

If the API reports `evidence_contradiction` or `evidence_incomplete`, the
dashboard renders **Projection blocked** rather than retaining or guessing a
verified state.
