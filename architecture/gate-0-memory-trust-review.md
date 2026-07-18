# Gate 0 — Memory Trust Review

**Status:** Ready for human approval after automated evidence review.

## Scope reviewed

Gate 0 resolves the Memory Quality Review findings that had to pass before a
future Planner can consume a Memory Pack:

| Trust control | Verification |
|---|---|
| Omitted/stale body isolation and exact payload metering | Compiler contract tests |
| Obsidian ID, filename, path, and alias resolution | Vault/graph tests |
| Dangling and ambiguous links | Diagnostic and rejection tests |
| Minimum trustworthy coverage | PAY-17 and synthetic coverage tests |
| Directional, one-hop graph expansion | Forward-link and reverse-link adversarial tests |
| Typed evidence | Parser, index, graph, and confidence tests |
| Repository-commit freshness | Freshness and compiler tests |
| Blank draft-template compatibility | Isolated draft fixture test |
| Over-small context budgets | Fail-closed compiler test |

## Evidence commands

Run in `memory/`:

```powershell
npm test
npm run build
```

The passing suite is the Gate 0 evidence. It has no browser component because
the memory subsystem has no UI, command execution, or fixture mutation
authority.

## Approval decision

**Approved for the constrained Gate 1 integration boundary, pending human
approval of this review.** A Planner may receive only the rendered Memory Pack,
not raw vault documents or the derived index.

## Bounded limitations intentionally deferred

- Evidence references are schema-validated locally; an independent verifier
  must execute and persist test/browser evidence in Gate 4.
- Repository commit identity is supplied by task intake; Gate 1 will derive it
  from the frozen fixture baseline.
- System-level command policy, secret redaction, and prompt-injection labeling
  are enforced by later intake/orchestration surfaces, not by Markdown parsing.
- Vault writes remain prohibited until the staged approval workflow is built.
