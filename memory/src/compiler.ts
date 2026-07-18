import { assessDocument, DEFAULT_FRESHNESS_POLICY } from "./freshness.js";
import { scoreRelevance } from "./scoring.js";
import type {
  AssessedDocument,
  FreshnessPolicy,
  MemoryPack,
  OmittedSource,
  SourceSelection,
  TaskInput,
  VaultIndex,
} from "./models.js";

export const DEFAULT_MEMORY_PACK_BUDGET = 12_000;
const MINIMUM_TRUST_SCORE = 0.65;

function shortestGraphDistance(index: VaultIndex, from: string, targets: Set<string>): number | undefined {
  if (targets.has(from)) {
    return 0;
  }
  const visited = new Set([from]);
  let frontier = [from];
  for (let distance = 1; distance <= 2; distance += 1) {
    const next = frontier.flatMap((id) => index.graph.adjacentDocumentIds(id)).filter((id) => !visited.has(id));
    if (next.some((id) => targets.has(id))) {
      return distance;
    }
    next.forEach((id) => visited.add(id));
    frontier = next;
  }
  return undefined;
}

function averageConfidence(sources: SourceSelection[]): number {
  if (sources.length === 0) {
    return 0;
  }
  const total = sources.reduce((sum, source) => sum + source.document.confidenceScore, 0);
  return Number((total / sources.length).toFixed(2));
}

export interface CompileOptions {
  freshnessPolicy?: FreshnessPolicy;
  generatedAt?: Date;
}

export function compileMemoryPack(
  index: VaultIndex,
  task: TaskInput,
  options: CompileOptions = {},
): MemoryPack {
  const policy = options.freshnessPolicy ?? DEFAULT_FRESHNESS_POLICY;
  const assessed = index.documents.map((document) => assessDocument(document, policy));
  const directResults = new Map(assessed.map((document) => [document.id, scoreRelevance(document, task)]));
  const directIds = new Set(
    assessed.filter((document) => (directResults.get(document.id)?.score ?? 0) > 0).map((document) => document.id),
  );
  const omitted: OmittedSource[] = [];
  const candidates: SourceSelection[] = [];

  for (const document of assessed) {
    const direct = directResults.get(document.id);
    const graphDistance = directIds.size > 0 ? shortestGraphDistance(index, document.id, directIds) : undefined;
    const graphScore = direct?.score === 0 && graphDistance !== undefined ? 0.12 / graphDistance : 0;
    const relevanceScore = Number(Math.min(1, (direct?.score ?? 0) + graphScore).toFixed(2));

    if (relevanceScore === 0) {
      continue;
    }
    if (!task.includeStale && document.freshness === "stale") {
      omitted.push({ document, reason: "excluded because its verified knowledge is stale" });
      continue;
    }
    if (!task.includeStale && document.freshness === "unverified") {
      omitted.push({ document, reason: "excluded because it is unverified" });
      continue;
    }
    if (document.confidenceScore < MINIMUM_TRUST_SCORE) {
      omitted.push({ document, reason: `excluded because confidence ${document.confidenceScore} is below ${MINIMUM_TRUST_SCORE}` });
      continue;
    }

    const reason = direct && direct.reasons.length > 0
      ? direct.reasons.join("; ")
      : `linked within ${graphDistance} graph hop${graphDistance === 1 ? "" : "s"} of task-relevant memory`;
    candidates.push({ document, relevanceScore, inclusionReason: reason, graphDistance });
  }

  candidates.sort((left, right) =>
    right.relevanceScore - left.relevanceScore
    || right.document.confidenceScore - left.document.confidenceScore
    || left.document.estimatedTokens - right.document.estimatedTokens
    || left.document.id.localeCompare(right.document.id),
  );

  const budget = task.tokenBudget ?? DEFAULT_MEMORY_PACK_BUDGET;
  const sources: SourceSelection[] = [];
  let estimatedTokens = 0;
  for (const candidate of candidates) {
    if (estimatedTokens + candidate.document.estimatedTokens <= budget) {
      sources.push(candidate);
      estimatedTokens += candidate.document.estimatedTokens;
    } else {
      omitted.push({ document: candidate.document, reason: `excluded because it exceeds the ${budget}-token pack budget` });
    }
  }

  return {
    id: `PACK-${task.id}`,
    task,
    generatedAt: options.generatedAt ?? new Date(),
    tokenBudget: budget,
    estimatedTokens,
    confidenceScore: averageConfidence(sources),
    sources,
    omittedSources: omitted.sort((left, right) => left.document.id.localeCompare(right.document.id)),
  };
}

export function assessedDocuments(index: VaultIndex, policy: FreshnessPolicy): AssessedDocument[] {
  return index.documents.map((document) => assessDocument(document, policy));
}
