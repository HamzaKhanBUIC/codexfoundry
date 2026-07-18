import { assessDocument, DEFAULT_FRESHNESS_POLICY } from "./freshness.js";
import { estimateRenderedMemoryPackTokens } from "./markdown.js";
import { scoreRelevance } from "./scoring.js";
import type {
  AssessedDocument,
  FreshnessPolicy,
  MemoryPack,
  OmittedSourceReference,
  SourceSelection,
  TaskInput,
  VaultIndex,
} from "./models.js";

export const DEFAULT_MEMORY_PACK_BUDGET = 12_000;
const MINIMUM_TRUST_SCORE = 0.65;

interface CoverageCandidate extends SourceSelection {
  obligations: string[];
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

function taskObligations(task: TaskInput): Set<string> {
  const obligations = new Set<string>();
  for (const id of task.explicitDocumentIds ?? []) {
    obligations.add(`document:${normalize(id)}`);
  }
  for (const requirement of [task.id, ...(task.requirements ?? [])]) {
    obligations.add(`requirement:${normalize(requirement)}`);
  }
  for (const service of task.services ?? []) {
    obligations.add(`service:${normalize(service)}`);
  }
  for (const sourcePath of task.paths ?? []) {
    obligations.add(`path:${normalize(sourcePath)}`);
  }
  return obligations;
}

function candidateObligations(document: AssessedDocument, task: TaskInput, fallbackToTask: boolean): string[] {
  const obligations = new Set<string>();
  const explicitIds = new Set((task.explicitDocumentIds ?? []).map(normalize));
  if (explicitIds.has(normalize(document.id))) {
    obligations.add(`document:${normalize(document.id)}`);
  }
  const requestedRequirements = new Set([task.id, ...(task.requirements ?? [])].map(normalize));
  for (const requirement of document.requirements) {
    if (requestedRequirements.has(normalize(requirement))) {
      obligations.add(`requirement:${normalize(requirement)}`);
    }
  }
  const requestedServices = new Set((task.services ?? []).map(normalize));
  for (const service of document.services) {
    if (requestedServices.has(normalize(service))) {
      obligations.add(`service:${normalize(service)}`);
    }
  }
  const requestedPaths = new Set((task.paths ?? []).map(normalize));
  for (const evidence of document.evidence) {
    const sourcePath = evidence.reference;
    if (requestedPaths.has(normalize(sourcePath))) {
      obligations.add(`path:${normalize(sourcePath)}`);
    }
  }
  if (fallbackToTask) {
    obligations.add("task:relevance");
  }
  return [...obligations].sort();
}

function coverageGains(candidate: CoverageCandidate, uncovered: Set<string>): string[] {
  return candidate.obligations.filter((obligation) => uncovered.has(obligation));
}

function bestCoverageCandidate(candidates: CoverageCandidate[], uncovered: Set<string>): CoverageCandidate | undefined {
  return candidates
    .filter((candidate) => coverageGains(candidate, uncovered).length > 0)
    .sort((left, right) =>
      coverageGains(right, uncovered).length - coverageGains(left, uncovered).length
      || right.relevanceScore - left.relevanceScore
      || right.document.confidenceScore - left.document.confidenceScore
      || left.document.estimatedTokens - right.document.estimatedTokens
      || left.document.id.localeCompare(right.document.id),
    )[0];
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

function omit(document: AssessedDocument, reason: string): OmittedSourceReference {
  return {
    id: document.id,
    title: document.title,
    freshness: document.freshness,
    confidenceScore: document.confidenceScore,
    reason,
  };
}

function measurePack(pack: MemoryPack): MemoryPack {
  let estimatedTokens = pack.estimatedTokens;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const measured = estimateRenderedMemoryPackTokens({ ...pack, estimatedTokens });
    if (measured === estimatedTokens) {
      break;
    }
    estimatedTokens = measured;
  }
  return { ...pack, estimatedTokens };
}

export function compileMemoryPack(
  index: VaultIndex,
  task: TaskInput,
  options: CompileOptions = {},
): MemoryPack {
  const basePolicy = options.freshnessPolicy ?? DEFAULT_FRESHNESS_POLICY;
  const policy = task.repositoryCommit
    ? { ...basePolicy, repositoryCommit: task.repositoryCommit }
    : basePolicy;
  const assessed = index.documents.map((document) => assessDocument(document, policy));
  const directResults = new Map(assessed.map((document) => [document.id, scoreRelevance(document, task)]));
  const omitted: OmittedSourceReference[] = [];
  const directCandidates: CoverageCandidate[] = [];
  const fallbackToTask = taskObligations(task).size === 0;

  for (const document of assessed) {
    const direct = directResults.get(document.id);
    if ((direct?.score ?? 0) === 0) {
      continue;
    }
    if (!task.includeStale && document.freshness === "stale") {
      omitted.push(omit(document, "excluded because its verified knowledge is stale"));
      continue;
    }
    if (!task.includeStale && document.freshness === "unverified") {
      omitted.push(omit(document, "excluded because it is unverified"));
      continue;
    }
    if (document.confidenceScore < MINIMUM_TRUST_SCORE) {
      omitted.push(omit(document, `excluded because confidence ${document.confidenceScore} is below ${MINIMUM_TRUST_SCORE}`));
      continue;
    }

    const reason = direct && direct.reasons.length > 0
      ? direct.reasons.join("; ")
      : "matches the task";
    directCandidates.push({
      document,
      relevanceScore: direct!.score,
      inclusionReason: reason,
      graphDistance: 0,
      obligations: candidateObligations(document, task, fallbackToTask),
    });
  }

  const uncovered = taskObligations(task);
  if (fallbackToTask) {
    uncovered.add("task:relevance");
  }
  const reachableProof = directCandidates.some((candidate) =>
    index.graph.outboundLinkedDocumentIds(candidate.document.id)
      .some((id) => index.byId.get(id)?.type === "proof"),
  );
  if (directCandidates.some((candidate) => candidate.document.type === "proof") || reachableProof) {
    uncovered.add("type:proof");
    for (const candidate of directCandidates) {
      if (candidate.document.type === "proof") {
        candidate.obligations.push("type:proof");
      }
    }
  }

  const selected: CoverageCandidate[] = [];
  while (uncovered.size > 0) {
    const candidate = bestCoverageCandidate(
      directCandidates.filter((item) => !selected.some((source) => source.document.id === item.document.id)),
      uncovered,
    );
    if (!candidate) {
      break;
    }
    const gains = coverageGains(candidate, uncovered);
    candidate.inclusionReason = `${candidate.inclusionReason}; covers ${gains.join(", ")}`;
    gains.forEach((gain) => uncovered.delete(gain));
    selected.push(candidate);
  }

  while (uncovered.size > 0) {
    const linkedCandidates = selected
      .filter((source) => source.graphDistance === 0)
      .flatMap((source) => index.graph.outboundLinkedDocumentIds(source.document.id)
        .map((id) => assessed.find((document) => document.id === id))
        .filter((document): document is AssessedDocument => document !== undefined)
        .filter((document) => !selected.some((source) => source.document.id === document.id))
        .filter((document) => document.freshness !== "stale" && document.freshness !== "unverified")
        .filter((document) => document.confidenceScore >= MINIMUM_TRUST_SCORE)
        .map((document) => ({
          document,
          relevanceScore: 0.12,
          inclusionReason: `explicitly linked from selected task context`,
          graphDistance: 1,
          obligations: document.type === "proof" ? ["type:proof"] : [],
        })));
    const candidate = bestCoverageCandidate(linkedCandidates, uncovered);
    if (!candidate) {
      break;
    }
    const gains = coverageGains(candidate, uncovered);
    candidate.inclusionReason = `${candidate.inclusionReason}; covers ${gains.join(", ")}`;
    gains.forEach((gain) => uncovered.delete(gain));
    selected.push(candidate);
  }

  for (const candidate of directCandidates) {
    if (!selected.some((source) => source.document.id === candidate.document.id)) {
      omitted.push(omit(candidate.document, "excluded because it does not add uncovered task coverage"));
    }
  }

  const budget = task.tokenBudget ?? DEFAULT_MEMORY_PACK_BUDGET;
  const sources: SourceSelection[] = [];
  let estimatedTokens = 0;
  for (const candidate of selected) {
    if (estimatedTokens + candidate.document.estimatedTokens <= budget) {
      sources.push(candidate);
      estimatedTokens += candidate.document.estimatedTokens;
    } else {
      omitted.push(omit(candidate.document, `excluded because it exceeds the ${budget}-token pack budget`));
    }
  }

  let pack = measurePack({
    id: `PACK-${task.id}`,
    task,
    generatedAt: options.generatedAt ?? new Date(),
    tokenBudget: budget,
    estimatedTokens,
    confidenceScore: averageConfidence(sources),
    sources,
    omittedSources: omitted.sort((left, right) => left.id.localeCompare(right.id)),
  });

  while (pack.estimatedTokens > budget && pack.sources.length > 0) {
    const source = pack.sources.at(-1)!;
    pack = measurePack({
      ...pack,
      sources: pack.sources.slice(0, -1),
      omittedSources: [...pack.omittedSources, omit(source.document, `excluded because it exceeds the ${budget}-token pack budget`)]
        .sort((left, right) => left.id.localeCompare(right.id)),
    });
  }

  if (pack.estimatedTokens > budget) {
    throw new Error(
      `Memory Pack minimum safe payload requires ${pack.estimatedTokens} tokens, exceeding the ${budget}-token budget.`,
    );
  }

  return pack;
}

export function assessedDocuments(index: VaultIndex, policy: FreshnessPolicy): AssessedDocument[] {
  return index.documents.map((document) => assessDocument(document, policy));
}
