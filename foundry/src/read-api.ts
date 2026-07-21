import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import path from "node:path";
import { loadPay17RunProjection, type FoundryRunProjection } from "./run-evidence-projection.js";
import { analyzeLocalRepository } from "./repository-analysis.js";
import { CodexCliSemanticReasoner } from "./codex-cli-reasoner.js";
import { EngineeringOrchestrator } from "./engineering-orchestrator.js";
import { GenericRunStore } from "./generic-run-store.js";

const PAY17_PATH = "/api/runs/RUN-PAY-17-001";
const REPOSITORY_ANALYSIS_PATH = "/api/repository-analysis";
const ENGINEERING_PIPELINE_PATH = "/api/engineering-pipeline";
const GENERIC_RUN_PREFIX = "/api/generic-runs/";

function json(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function evidenceErrorCode(error: unknown): "evidence_contradiction" | "evidence_incomplete" | "evidence_unavailable" {
  if (error instanceof Error && error.message.startsWith("Evidence contradiction:")) return "evidence_contradiction";
  if (error instanceof Error && error.message.startsWith("Evidence incomplete:")) return "evidence_incomplete";
  return "evidence_unavailable";
}

/** Read-only local API. It exposes no generic file access or action endpoints. */
export function createFoundryReadApi(evidenceDirectory: string, vaultDirectory = path.resolve(evidenceDirectory, "../../vault"), genericRunDirectory = process.env.FOUNDRY_GENERIC_RUN_DIRECTORY ?? path.resolve(evidenceDirectory, "../runtime/generic-runs")): Server {
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
      } catch (error) {
        json(response, 503, { error: evidenceErrorCode(error) });
        return;
      }
      json(response, 200, run);
      return;
    }
    if (pathname === REPOSITORY_ANALYSIS_PATH) {
      const repositoryPath = new URL(request.url ?? "/", "http://127.0.0.1").searchParams.get("path");
      if (!repositoryPath) {
        json(response, 400, { error: "repository_path_required" });
        return;
      }
      void analyzeLocalRepository(repositoryPath, vaultDirectory)
        .then((analysis) => json(response, 200, analysis))
        .catch((error: unknown) => json(response, 400, { error: "repository_analysis_failed", message: error instanceof Error ? error.message : "Repository analysis failed." }));
      return;
    }
    if (pathname === ENGINEERING_PIPELINE_PATH) {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const repositoryPath = requestUrl.searchParams.get("path");
      if (!repositoryPath) {
        json(response, 400, { error: "repository_path_required" });
        return;
      }
      const useCodexReasoning = requestUrl.searchParams.get("codex") === "true";
      const orchestrator = new EngineeringOrchestrator({
        codexReasoner: useCodexReasoning ? new CodexCliSemanticReasoner() : undefined,
      });
      void orchestrator.analyze(repositoryPath, vaultDirectory, { useCodexReasoning })
        .then((pipeline) => json(response, 200, pipeline))
        .catch((error: unknown) => json(response, 400, { error: "engineering_pipeline_failed", message: error instanceof Error ? error.message : "Engineering pipeline failed." }));
      return;
    }
    if (pathname.startsWith(GENERIC_RUN_PREFIX)) {
      const runId = decodeURIComponent(pathname.slice(GENERIC_RUN_PREFIX.length));
      if (!/^[A-Z][A-Z0-9-]{2,80}$/.test(runId)) {
        json(response, 400, { error: "generic_run_id_invalid" });
        return;
      }
      void new GenericRunStore(genericRunDirectory).get(runId)
        .then((run) => json(response, 200, run))
        .catch(() => json(response, 404, { error: "generic_run_not_found" }));
      return;
    }
    json(response, 404, { error: "not_found" });
  });
}
