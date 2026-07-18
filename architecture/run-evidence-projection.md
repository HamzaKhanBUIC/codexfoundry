# Run Evidence Projection

`loadPay17RunProjection()` is the single read-only adapter from recorded
PAY-17 evidence JSON to the values a judge-facing surface may display. It
fails closed when required proof commands or approval data are missing.

The adapter has no verifier, approval, vault-write, or merge authority. It is
shared by the dashboard build now and is the future input boundary for a local
read API.
