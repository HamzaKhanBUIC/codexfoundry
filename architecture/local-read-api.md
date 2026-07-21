# Local Read API

The local API is loopback and read-only. It maps recorded evidence and bounded
static analysis through shared core contracts, returns `404` for unknown
routes, and returns `405` for all non-GET methods. It has no action endpoint.

| Route | Input | Result | Authority boundary |
|---|---|---|---|
| `GET /api/health` | none | API health JSON | No repository or evidence mutation. |
| `GET /api/runs/RUN-PAY-17-001` | none | Validated PAY-17 projection | Fails closed instead of returning a partial proof. |
| `GET /api/repository-analysis` | required absolute `path` | Bounded static repository analysis | Reads files and Git metadata only; never executes the target repository. |
| `GET /api/engineering-pipeline` | required absolute `path`; optional `codex=true` | Fused Repository Intelligence pipeline | Optional Codex specialists are read-only, citation-checked, advisory context. |
| `GET /api/generic-runs/<run-id>` | persisted run ID | Stored generic-run evidence | Reads an existing record; cannot start, approve, or advance a run. |

The run endpoint returns HTTP `503` rather than a partial or guessed projection
when evidence cannot prove the chain:

- `{"error":"evidence_incomplete"}` for a missing or malformed required
  intake, plan, implementation, verification, approval, replay, or Memory
  Pack artifact.
- `{"error":"evidence_contradiction"}` when same-run structured replay
  claims disagree.

The Vite dashboard proxies `/api` to `127.0.0.1:4174` during local use. It
fetches once on page load; a user refresh is required to observe a live
artifact change.
