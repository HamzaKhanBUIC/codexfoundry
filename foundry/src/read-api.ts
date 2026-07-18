import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { loadPay17RunProjection, type FoundryRunProjection } from "./run-evidence-projection.js";

const PAY17_PATH = "/api/runs/RUN-PAY-17-001";

function json(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

/** Read-only local API. It exposes no generic file access or action endpoints. */
export function createFoundryReadApi(evidenceDirectory: string): Server {
  return createServer((request: IncomingMessage, response: ServerResponse) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (request.method !== "GET") {
      json(response, 405, { error: "method_not_allowed" });
      return;
    }
    if (pathname === "/api/health") {
      json(response, 200, { status: "ok" });
      return;
    }
    if (pathname === PAY17_PATH) {
      let run: FoundryRunProjection;
      try {
        run = loadPay17RunProjection(evidenceDirectory);
      } catch {
        json(response, 503, { error: "evidence_unavailable" });
        return;
      }
      json(response, 200, run);
      return;
    }
    json(response, 404, { error: "not_found" });
  });
}
