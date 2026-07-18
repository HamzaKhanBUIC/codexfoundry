import type { GitHubStyleIssue, IntakeTask, RepositoryMap, RunRecord } from "./models.js";
import { FROZEN_DEMO_STORE_COMMIT } from "./repository-map.js";
import { RunRepository } from "./run-repository.js";

export const PAY17_ISSUE_ID = "PAY-17";
export const PAY17_ISSUE_TITLE = "Duplicate charge during checkout retry";

const requiredLabels = ["bug", "payments", "checkout", "high-risk"] as const;

function fail(message: string): never {
  throw new Error(`PAY-17 intake rejected: ${message}`);
}

function assertSeededPay17Issue(issue: GitHubStyleIssue): void {
  if (issue.id !== PAY17_ISSUE_ID) {
    fail(`issue id must be '${PAY17_ISSUE_ID}'.`);
  }
  if (issue.title !== PAY17_ISSUE_TITLE) {
    fail(`issue title must be '${PAY17_ISSUE_TITLE}'.`);
  }
  if (issue.status !== undefined && issue.status !== "open") {
    fail("issue status must be 'open'.");
  }

  const labels = new Set(issue.labels ?? []);
  for (const label of requiredLabels) {
    if (!labels.has(label)) {
      fail(`issue is missing required '${label}' label.`);
    }
  }
}

function assertPay17RepositoryMap(repository: RepositoryMap): void {
  const serviceIds = repository.services.map((service) => service.id);
  if (serviceIds.length !== 2 || serviceIds[0] !== "checkout-service" || serviceIds[1] !== "payment-gateway") {
    fail("repository map does not match the frozen PAY-17 service contract.");
  }
  if (repository.services[0].sourcePath !== "src/services/checkout-service.ts") {
    fail("repository map has an unexpected checkout-service path.");
  }
  if (!repository.commit.trim()) {
    fail("repository map must include a validated commit.");
  }
  if (!repository.commit.startsWith(FROZEN_DEMO_STORE_COMMIT)) {
    fail(`repository commit must match frozen baseline '${FROZEN_DEMO_STORE_COMMIT}'.`);
  }
}

/**
 * Creates a small trusted handoff from a single known issue shape. The issue's
 * body remains untrusted source data and is intentionally absent from this
 * task object.
 */
export function compilePay17IntakeTask(issue: GitHubStyleIssue, repository: RepositoryMap): IntakeTask {
  assertSeededPay17Issue(issue);
  assertPay17RepositoryMap(repository);

  return {
    taskId: PAY17_ISSUE_ID,
    title: PAY17_ISSUE_TITLE,
    acceptanceCriteria: ["one logical checkout persists one payment"],
    riskLevel: "high",
    services: ["checkout-service", "payment-gateway"],
    paths: ["src/services/checkout-service.ts"],
    repositoryCommit: repository.commit,
  };
}

export interface Pay17IntakeRun {
  task: IntakeTask;
  run: RunRecord;
}

/** Persists the source issue as data while returning the trusted handoff separately. */
export function createPay17IntakeRun(
  runs: RunRepository,
  runId: string,
  issue: GitHubStyleIssue,
  repository: RepositoryMap,
): Pay17IntakeRun {
  const task = compilePay17IntakeTask(issue, repository);
  const run = runs.create({ id: runId, issue, repositoryCommit: task.repositoryCommit });
  return { task, run };
}
