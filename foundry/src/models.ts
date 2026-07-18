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

export interface CreateRunInput {
  id: string;
  issue: {
    title: string;
    body?: string;
    labels?: string[];
  };
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
