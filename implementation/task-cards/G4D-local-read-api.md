# G4D — Local Read API

## Scope

Expose the completed PAY-17 evidence projection through a fixed local GET API
and have the dashboard consume it through the local proxy.

## Validation

- API integration test returns the recorded projection.
- Unknown routes return `404`; non-GET requests return `405`.
- Core and dashboard TypeScript builds pass.

## Deferred

- Generic run lookup.
- Any approval, vault, merge, or production action endpoint.
