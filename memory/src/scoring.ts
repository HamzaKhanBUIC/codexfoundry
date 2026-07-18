import type { MemoryDocument, TaskInput } from "./models.js";

const normalise = (value: string): string => value.trim().toLowerCase();

function overlap(left: string[], right: string[]): string[] {
  const rightSet = new Set(right.map(normalise));
  return left.filter((item) => rightSet.has(normalise(item)));
}

function keywords(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9-]{3,}/g) ?? []);
}

export interface RelevanceResult {
  score: number;
  reasons: string[];
}

export function scoreRelevance(document: MemoryDocument, task: TaskInput): RelevanceResult {
  const reasons: string[] = [];
  let score = 0;
  const explicitIds = task.explicitDocumentIds ?? [];

  if (explicitIds.includes(document.id)) {
    return { score: 1, reasons: ["explicitly requested for this task"] };
  }

  const requirements = overlap(document.requirements, [task.id, ...(task.requirements ?? [])]);
  if (requirements.length > 0) {
    score += Math.min(0.45, requirements.length * 0.3);
    reasons.push(`matches requirement ${requirements.join(", ")}`);
  }

  const services = overlap(document.services, task.services ?? []);
  if (services.length > 0) {
    score += Math.min(0.3, services.length * 0.15);
    reasons.push(`matches service ${services.join(", ")}`);
  }

  const labels = overlap(document.tags, task.labels ?? []);
  if (labels.length > 0) {
    score += Math.min(0.12, labels.length * 0.06);
    reasons.push(`matches label ${labels.join(", ")}`);
  }

  const paths = overlap(document.evidence, task.paths ?? []);
  if (paths.length > 0) {
    score += Math.min(0.2, paths.length * 0.1);
    reasons.push(`references path ${paths.join(", ")}`);
  }

  const taskKeywords = keywords([task.title, task.description ?? "", ...(task.labels ?? [])].join(" "));
  const documentKeywords = keywords([document.title, document.summary ?? "", document.body].join(" "));
  const sharedKeywords = [...taskKeywords].filter((item) => documentKeywords.has(item));
  if (sharedKeywords.length > 0) {
    score += Math.min(0.13, sharedKeywords.length * 0.03);
    reasons.push(`shares task terms ${sharedKeywords.slice(0, 3).join(", ")}`);
  }

  return { score: Number(Math.min(1, score).toFixed(2)), reasons };
}
