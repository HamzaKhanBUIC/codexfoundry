import type { ImplementationReport, RepositoryMap, StoredPlan } from "./models.js";

type JsonObject = Record<string, unknown>;

const responseKeys = new Set(["changedPaths", "changeSummary", "commandsRun", "unresolvedRisks", "confidence"]);
const confidences = new Set<ImplementationReport["confidence"]>(["low", "medium", "high"]);

function object(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Implementation response must be an object.");
  }
  return value as JsonObject;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Implementation response '${field}' must be a non-empty string.`);
  }
  return value.trim();
}

function textArray(value: unknown, field: string, allowEmpty = false): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`Implementation response '${field}' must be ${allowEmpty ? "a" : "a non-empty"} string array.`);
  }
  return value.map((item, index) => text(item, `${field}[${index}]`));
}

function allowedPaths(repository: RepositoryMap): Set<string> {
  return new Set([repository.services[0].sourcePath, repository.pay17TestPath, repository.browserTestPath]);
}

/** Accepts only the bounded Codex implementation-report JSON contract. */
export function parseImplementationResponse(
  rawJson: string,
  plan: StoredPlan,
  repository: RepositoryMap,
): ImplementationReport {
  if (plan.status !== "approved") throw new Error("Implementation response requires a human-approved plan.");
  let raw: unknown;
  try {
    raw = JSON.parse(rawJson);
  } catch {
    throw new Error("Implementation response must be exact JSON without Markdown fences or narrative.");
  }
  const response = object(raw);
  const keys = Object.keys(response);
  if (keys.length !== responseKeys.size || keys.some((key) => !responseKeys.has(key))) {
    throw new Error("Implementation response must contain exactly the required report fields.");
  }

  const changedPaths = textArray(response.changedPaths, "changedPaths", true);
  const commandsRun = textArray(response.commandsRun, "commandsRun", true);
  if (changedPaths.some((item) => !allowedPaths(repository).has(item) || !plan.affectedPaths.includes(item))) {
    throw new Error("Implementation response contains a changed path outside the approved plan boundary.");
  }
  if (commandsRun.some((item) => !plan.allowedCommands.includes(item) || !Object.values(repository.commands).includes(item))) {
    throw new Error("Implementation response contains a command outside the approved plan and policy.");
  }
  const confidence = text(response.confidence, "confidence") as ImplementationReport["confidence"];
  if (!confidences.has(confidence)) throw new Error("Implementation response confidence must be low, medium, or high.");

  return {
    runId: plan.runId,
    planId: plan.id,
    changedPaths,
    changeSummary: text(response.changeSummary, "changeSummary"),
    commandsRun,
    unresolvedRisks: textArray(response.unresolvedRisks, "unresolvedRisks", true),
    confidence,
  };
}
