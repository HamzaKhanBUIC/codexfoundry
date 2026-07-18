import type {
  AssessedDocument,
  ConfidenceLevel,
  FreshnessPolicy,
  FreshnessStatus,
  MemoryDocument,
} from "./models.js";

export const DEFAULT_FRESHNESS_POLICY: FreshnessPolicy = {
  referenceTime: new Date(),
  maxAgeDays: 90,
  agingThreshold: 0.75,
};

const confidenceBase: Record<ConfidenceLevel, number> = {
  draft: 0.35,
  reviewed: 0.65,
  verified: 0.82,
};

function matchingCommitIdentity(left: string, right: string): boolean {
  const expected = left.trim().toLowerCase();
  const observed = right.trim().toLowerCase();
  return expected.length >= 7
    && observed.length >= 7
    && (expected === observed || expected.startsWith(observed) || observed.startsWith(expected));
}

export function assessFreshness(
  document: MemoryDocument,
  policy: FreshnessPolicy = DEFAULT_FRESHNESS_POLICY,
): FreshnessStatus {
  if (document.confidence === "draft" || !document.verifiedAt) {
    return "unverified";
  }

  if (document.declaredStaleness === "stale") {
    return "stale";
  }

  if (policy.repositoryCommit && (!document.verifiedCommit || !matchingCommitIdentity(document.verifiedCommit, policy.repositoryCommit))) {
    return "stale";
  }

  const ageMs = Math.max(0, policy.referenceTime.getTime() - document.verifiedAt.getTime());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays > policy.maxAgeDays) {
    return "stale";
  }

  if (ageDays > policy.maxAgeDays * policy.agingThreshold) {
    return "aging";
  }

  return "fresh";
}

export function calculateConfidence(
  document: MemoryDocument,
  freshness: FreshnessStatus,
): number {
  const evidenceBonus = Math.min(document.evidence.filter((evidence) => evidence.verified).length * 0.04, 0.12);
  const commitBonus = document.verifiedCommit ? 0.04 : 0;
  const timestampBonus = document.verifiedAt ? 0.02 : 0;
  const raw = Math.min(1, confidenceBase[document.confidence] + evidenceBonus + commitBonus + timestampBonus);

  const freshnessMultiplier: Record<FreshnessStatus, number> = {
    fresh: 1,
    aging: 0.85,
    stale: 0.35,
    unverified: 0.55,
  };

  return Number((raw * freshnessMultiplier[freshness]).toFixed(2));
}

export function assessDocument(
  document: MemoryDocument,
  policy: FreshnessPolicy = DEFAULT_FRESHNESS_POLICY,
): AssessedDocument {
  const freshness = assessFreshness(document, policy);
  return {
    ...document,
    freshness,
    confidenceScore: calculateConfidence(document, freshness),
  };
}
