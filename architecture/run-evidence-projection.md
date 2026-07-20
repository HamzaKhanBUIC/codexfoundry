# Run Evidence Projection

`loadPay17RunProjection()` is the single read-only adapter from recorded
PAY-17 evidence JSON to the values a judge-facing surface may display. It
requires intake, approved plan, implementation, verifier, patch approval,
vault write, regression replay, and post-repair Memory Pack artifacts for
`RUN-PAY-17-001`.

It validates stage/run linkage, baseline and candidate commit linkage,
approved paths and commands, verifier command exits, separate human approvals,
replay consistency, Memory Pack bounds, and inspector coverage. Missing or
malformed stage evidence raises `Evidence incomplete`; contradictory structured
replay claims raise `Evidence contradiction`.

The adapter has no verifier, approval, vault-write, or merge authority. It is
shared by the dashboard build and the loopback local read API.
