import type { RunStatus } from "./models.js";

const transitions: Readonly<Record<RunStatus, readonly RunStatus[]>> = {
  intake: ["memory_compiled"],
  memory_compiled: ["plan_pending_approval"],
  plan_pending_approval: ["implementing", "stopped"],
  implementing: ["verifying", "failed"],
  verifying: ["implementing", "review_pending", "failed"],
  review_pending: ["memory_pending_approval", "complete_without_writeback"],
  memory_pending_approval: ["complete"],
  complete: [],
  complete_without_writeback: [],
  stopped: [],
  failed: [],
};

export function canTransition(from: RunStatus, to: RunStatus): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: RunStatus, to: RunStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid run transition: ${from} -> ${to}.`);
  }
}
