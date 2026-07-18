# Dashboard Foundation

The first Foundry UI is a local Fluent UI React application at
`foundry/dashboard/`. It presents the PAY-17 workflow as a trust surface rather
than a generic coding-agent chat screen.

## First-slice responsibilities

- Show the scoped issue and completed run state.
- Show a requirement-to-decision-to-code-to-proof graph.
- Separate verifier-owned command evidence from implementer narration.
- Show the approved memory write and the blocked deliberate regression.
- Keep the interface read-only while API and approval endpoints are added.

## Design system

The dashboard uses Fluent UI React v9 with a compact, light, developer-tools
visual language. The single amber accent represents review and safety actions;
verification and failure states retain their semantic Fluent coloring.

## Run instructions

See `foundry/dashboard/README.md` for the local judge-run command.
