export const RUN_STATUSES = [
  "intake",
  "memory_compiled",
  "plan_pending_approval",
  "implementing",
  "verifying",
  "review_pending",
  "memory_pending_approval",
  "complete",
  "complete_without_writeback",
  "stopped",
  "failed",
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];
export type RunActor = "system" | "human" | "planner" | "implementer" | "verifier";

export interface GitHubStyleIssue {
  id?: string;
  title: string;
  body?: string;
  labels?: string[];
  status?: string;
}

export interface CreateRunInput {
  id: string;
  issue: GitHubStyleIssue;
  repositoryCommit: string;
}

export interface FoundryRun {
  id: string;
  issue: CreateRunInput["issue"];
  repositoryCommit: string;
  status: RunStatus;
  correctionAttempts: number;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

export interface RunTransitionEvent {
  id: number;
  runId: string;
  fromStatus: RunStatus | null;
  toStatus: RunStatus;
  actor: RunActor;
  reason?: string;
  createdAt: string;
}

export interface RunRecord extends FoundryRun {
  events: RunTransitionEvent[];
}

export interface RepositoryServiceMap {
  id: "checkout-service" | "payment-gateway";
  sourcePath: string;
}

export interface RepositoryCommandMap {
  build: string;
  health: string;
  pay17: string;
  browser: string;
}

export interface RepositoryMap {
  rootPath: string;
  commit: string;
  services: RepositoryServiceMap[];
  pay17TestPath: string;
  browserTestPath: string;
  commands: RepositoryCommandMap;
}

export type TaskRiskLevel = "high";

/**
 * The trusted, policy-owned task handoff. It intentionally excludes untrusted
 * issue prose, commands, and permissions.
 */
export interface IntakeTask {
  taskId: "PAY-17";
  title: string;
  acceptanceCriteria: readonly ["one logical checkout persists one payment"];
  riskLevel: TaskRiskLevel;
  services: readonly ["checkout-service", "payment-gateway"];
  paths: readonly ["src/services/checkout-service.ts"];
  repositoryCommit: string;
}

export interface StoredMemoryPackSource {
  id: string;
  title: string;
  sourcePath: string;
  inclusionReason: string;
  relevanceScore: number;
  confidenceScore: number;
  freshness: "fresh" | "aging" | "stale" | "unverified";
  graphDistance?: number;
}

export interface StoredMemoryPackOmission {
  id: string;
  title: string;
  confidenceScore: number;
  freshness: "fresh" | "aging" | "stale" | "unverified";
  reason: string;
}

/**
 * SQLite representation of the exact context artifact. Selected vault bodies
 * live only in renderedPayload; source metadata remains bodyless.
 */
export interface StoredMemoryPack {
  id: string;
  runId: string;
  taskId: "PAY-17";
  repositoryCommit: string;
  renderedPayload: string;
  payloadSha256: string;
  estimatedTokens: number;
  tokenBudget: number;
  confidenceScore: number;
  sources: StoredMemoryPackSource[];
  omittedSources: StoredMemoryPackOmission[];
  generatedAt: string;
  createdAt: string;
}

export type PlanStatus = "proposed" | "approved" | "rejected";

export interface ProofAssertion {
  requirementId: "PAY-17";
  assertion: "one logical checkout persists one payment";
  commands: string[];
}

/** A reviewable proposal. It is not evidence and grants no execution authority. */
export interface PlanProposal {
  id: string;
  runId: string;
  memoryPackId: string;
  summary: string;
  rootCauseHypothesis: string;
  affectedPaths: string[];
  allowedCommands: string[];
  proofContract: ProofAssertion[];
  risks: string[];
}

export interface StoredPlan extends PlanProposal {
  status: PlanStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewerReason?: string;
}
