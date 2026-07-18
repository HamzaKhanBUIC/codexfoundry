# Codex Foundry Dashboard

The dashboard is the judge-facing local surface for the completed PAY-17
workflow. It renders the real run state, proof chain, command evidence, memory
write, and blocked regression replay from the deterministic fixture artifacts.

## Run locally

```powershell
cd foundry/dashboard
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## First UI slice

This first slice is intentionally read-only. It makes the existing evidence
visible and keeps the human approval boundary intact. API-backed run creation,
approval controls, and live artifact loading are separate follow-up slices.
