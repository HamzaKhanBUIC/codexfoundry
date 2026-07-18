# Local Read API

The local API exposes only `GET /api/health` and the fixed completed PAY-17
run at `GET /api/runs/RUN-PAY-17-001`. It maps recorded evidence through the
shared projection, returns `404` for unknown routes, and returns `405` for all
non-GET methods. It has no generic file access or action endpoint.

The Vite dashboard proxies `/api` to `127.0.0.1:4174` during local use.
