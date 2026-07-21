# Phase 1 Completion — Dual-Mode MVP

## What changed

Codex Foundry now opens on a two-option landing page. **Reference Sandbox**
preserves the immutable, evidence-backed PAY-17 workflow. **Analyze
Repository** accepts an absolute local Git repository path and returns a
read-only engineering report: repository structure, languages, frameworks,
dependencies, package managers, scripts, documentation, CI files, Git history,
hot files, risk-signalling directories, explicit unknowns, a bounded Memory
Pack, an explainable repository report card, and a Principal-style
evidence-backed engineering backlog.

The first Repository Intelligence screen is now an Engineering Intelligence
Dashboard. It presents evidence-backed Repository DNA, a conservative
planning-readiness recommendation, an executive briefing, and an engineering
story before engineers drill into the underlying static evidence.

The analyzer reuses the existing Obsidian vault loader and Memory Pack compiler.
Its source facts come from filesystem metadata, package manifests, and read-only
Git queries. Scan limits are explicit, and no project script is executed.

## Intentionally left out

Repository Analysis does not approve tasks, create worktrees, invoke Codex,
run commands, verify patches, produce PRs, write the vault, or perform
regression replay. PAY-17 remains the sole complete executable reference run.
Those exclusions prevent a useful preparation surface from being mistaken for
an autonomous engineering agent.

## Trust preservation

- The planner and implementer remain untrusted.
- The independent verifier remains the only proof authority.
- Human plan, patch, and vault approvals remain separate.
- The repository-analysis endpoint is GET-only, loopback-only, and read-only.
- Backlog items are labelled as non-approved starting points. Their evidence,
  confidence, impact, risk, effort rationale, affected areas, dependencies,
  and expected outcome are inspectable; unknowns are never inferred away.

## Evidence

- Foundry core build passes.
- Memory tests: 18 passed.
- Foundry tests: 40 passed, including repository analysis, readiness escalation,
  inert-detector-pattern protection, and read API tests.
- Dashboard production build passes.
- Reference Sandbox remains the unchanged PAY-17 projection and proof path.

## Manual QA focus

1. Confirm the landing page makes both modes understandable within one glance.
2. Open PAY-17 and verify its proof, review, Memory Pack, and evidence tabs.
3. Analyze a local Git repository and verify the trust callout states that no
   execution, verification, or vault write occurred.
