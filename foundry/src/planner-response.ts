import type { PlanProposal, ProofAssertion } from "./models.js";

type JsonObject = Record<string, unknown>;

const responseKeys = new Set([
  "summary",
  "rootCauseHypothesis",
  "affectedPaths",
  "allowedCommands",
  "proofContract",
  "risks",
]);

function object(value: unknown, field: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Planner response '${field}' must be an object.`);
  }
  return value as JsonObject;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Planner response '${field}' must be a non-empty string.`);
  }
  return value.trim();
}

function textArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Planner response '${field}' must be a non-empty string array.`);
  }
  return value.map((item, index) => text(item, `${field}[${index}]`));
}

function proofAssertions(value: unknown): ProofAssertion[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Planner response 'proofContract' must be a non-empty array.");
  }
  return value.map((item, index) => {
    const proof = object(item, `proofContract[${index}]`);
    const keys = Object.keys(proof);
    if (keys.some((key) => !["requirementId", "assertion", "commands"].includes(key))) {
      throw new Error("Planner response proof contract contains an unknown field.");
    }
    return {
      requirementId: text(proof.requirementId, `proofContract[${index}].requirementId`) as "PAY-17",
      assertion: text(proof.assertion, `proofContract[${index}].assertion`) as "one logical checkout persists one payment",
      commands: textArray(proof.commands, `proofContract[${index}].commands`),
    };
  });
}

/**
 * Converts only exact JSON emitted by the Codex Planner prompt into a typed
 * proposal. It deliberately accepts no markdown fences, free-form narrative,
 * extra fields, or model-provided authority metadata.
 */
export function parsePlannerResponse(rawJson: string, runId: string, memoryPackId: string, planId: string): PlanProposal {
  let raw: unknown;
  try {
    raw = JSON.parse(rawJson);
  } catch {
    throw new Error("Planner response must be exact JSON without Markdown fences or narrative.");
  }
  const response = object(raw, "root");
  const keys = Object.keys(response);
  if (keys.length !== responseKeys.size || keys.some((key) => !responseKeys.has(key))) {
    throw new Error("Planner response must contain exactly the required proposal fields.");
  }

  return {
    id: planId,
    runId,
    memoryPackId,
    summary: text(response.summary, "summary"),
    rootCauseHypothesis: text(response.rootCauseHypothesis, "rootCauseHypothesis"),
    affectedPaths: textArray(response.affectedPaths, "affectedPaths"),
    allowedCommands: textArray(response.allowedCommands, "allowedCommands"),
    proofContract: proofAssertions(response.proofContract),
    risks: textArray(response.risks, "risks"),
  };
}
