import path from "node:path";

export type GenericRiskLevel = "low" | "medium" | "high";

export interface GenericCommand {
  id: string;
  executable: string;
  args: string[];
  description: string;
  timeoutMs: number;
}

export interface GenericTask {
  id: string;
  title: string;
  /** Untrusted problem statement. It can inform Codex but never alters policy. */
  description: string;
  acceptanceCriteria: string[];
  risk: GenericRiskLevel;
}

export interface GenericExecutionPolicy {
  id: string;
  repositoryRoot: string;
  baselineCommit: string;
  allowedPaths: string[];
  allowedCommands: GenericCommand[];
  worktreeDirectoryName?: string;
}

export interface GenericProofAssertion {
  assertion: string;
  commandIds: string[];
}

/** Immutable receipt for a bounded Codex stage; never an approval or proof. */
export interface GenericCodexInvocationReceipt {
  stage: "planner" | "implementer";
  sandbox: "read-only" | "workspace-write";
  repositoryPath: string;
  prompt: string;
  responseSchema: object;
  rawOutput: string;
  promptSha256: string;
  responseSha256: string;
  model?: string;
  replayNote: string;
}

export interface GenericPlanProposal {
  id: string;
  runId: string;
  taskId: string;
  summary: string;
  rootCauseHypothesis: string;
  affectedPaths: string[];
  commandIds: string[];
  proofContract: GenericProofAssertion[];
  risks: string[];
  codexReceipt?: GenericCodexInvocationReceipt;
}

export interface GenericHumanApproval {
  actor: string;
  approvedAt: string;
  reason: string;
}

export interface ApprovedGenericPlan extends GenericPlanProposal {
  approval: GenericHumanApproval;
}

function text(value: string, field: string): string {
  if (!value.trim()) throw new Error(field + " must be non-empty.");
  return value.trim();
}

export function normalizeRepositoryPath(value: string): string {
  const normalized = value.replace(/\\/g, "/");
  if (!normalized || path.posix.isAbsolute(normalized) || normalized === "." || normalized.split("/").includes("..")) {
    throw new Error("Policy paths must be non-empty relative paths without traversal.");
  }
  return path.posix.normalize(normalized);
}

function assertRunId(runId: string): void {
  if (!/^[A-Z][A-Z0-9-]{2,80}$/.test(runId)) throw new Error("Generic run id must be uppercase letters, digits, and hyphens.");
}

function assertCommand(command: GenericCommand): void {
  if (!/^[A-Za-z0-9._:/\\-]+$/.test(command.executable) || /(^|[\\/])(cmd|powershell|pwsh|bash|sh)(\.exe)?$/i.test(command.executable)) {
    throw new Error("Policy command executable must be a direct approved program, never a shell.");
  }
  if (!/^[a-z][a-z0-9-]{1,80}$/.test(command.id)) throw new Error("Policy command id must be lowercase kebab-case.");
  if (!text(command.description, "Policy command description") || !Number.isInteger(command.timeoutMs) || command.timeoutMs < 1_000 || command.timeoutMs > 10 * 60_000) {
    throw new Error("Policy command requires a bounded timeout between 1 second and 10 minutes.");
  }
  if (command.args.some((item) => !item || /[\u0000\r\n]/.test(item))) throw new Error("Policy command arguments must be non-empty single-line values.");
}

export function validateGenericPolicy(policy: GenericExecutionPolicy): GenericExecutionPolicy {
  text(policy.id, "Policy id");
  text(policy.repositoryRoot, "Policy repository root");
  if (!/^[0-9a-f]{7,64}$/i.test(policy.baselineCommit)) throw new Error("Policy baseline commit must be a Git commit hash.");
  if (policy.allowedPaths.length === 0) throw new Error("Policy must allow at least one repository path.");
  const paths = policy.allowedPaths.map(normalizeRepositoryPath);
  if (new Set(paths).size !== paths.length) throw new Error("Policy allowed paths must be unique.");
  if (policy.allowedCommands.length === 0) throw new Error("Policy must allow at least one command.");
  policy.allowedCommands.forEach(assertCommand);
  if (new Set(policy.allowedCommands.map((item) => item.id)).size !== policy.allowedCommands.length) throw new Error("Policy command ids must be unique.");
  if (policy.worktreeDirectoryName && !/^\.[a-z0-9-]+$/i.test(policy.worktreeDirectoryName)) throw new Error("Policy worktree directory name must be a hidden directory name.");
  return { ...policy, allowedPaths: paths, allowedCommands: policy.allowedCommands.map((item) => ({ ...item, args: [...item.args] })) };
}

export function commandForId(commandId: string, policy: GenericExecutionPolicy): GenericCommand {
  const command = policy.allowedCommands.find((item) => item.id === commandId);
  if (!command) throw new Error("Plan references a command outside the human-approved policy.");
  return command;
}

export function validateGenericPlan(proposal: GenericPlanProposal, policy: GenericExecutionPolicy): GenericPlanProposal {
  assertRunId(proposal.runId);
  [proposal.id, proposal.taskId, proposal.summary, proposal.rootCauseHypothesis].forEach((item, index) => text(item, ["Plan id", "Task id", "Plan summary", "Root-cause hypothesis"][index]));
  const validatedPolicy = validateGenericPolicy(policy);
  const paths = proposal.affectedPaths.map(normalizeRepositoryPath);
  if (paths.length === 0 || paths.some((item) => !validatedPolicy.allowedPaths.includes(item))) throw new Error("Plan contains a path outside the human-approved policy.");
  if (new Set(paths).size !== paths.length) throw new Error("Plan affected paths must be unique.");
  if (proposal.commandIds.length === 0) throw new Error("Plan must select at least one approved command.");
  proposal.commandIds.forEach((id) => commandForId(id, validatedPolicy));
  if (new Set(proposal.commandIds).size !== proposal.commandIds.length) throw new Error("Plan command ids must be unique.");
  if (proposal.proofContract.length === 0 || proposal.proofContract.some((proof) => !text(proof.assertion, "Proof assertion") || proof.commandIds.length === 0 || proof.commandIds.some((id) => !proposal.commandIds.includes(id)))) {
    throw new Error("Plan proof contract must use one or more commands selected by the plan.");
  }
  return { ...proposal, affectedPaths: paths, commandIds: [...proposal.commandIds], proofContract: proposal.proofContract.map((proof) => ({ assertion: proof.assertion.trim(), commandIds: [...proof.commandIds] })), risks: proposal.risks.map((risk) => text(risk, "Plan risk")) };
}

export function approveGenericPlan(proposal: GenericPlanProposal, policy: GenericExecutionPolicy, approval: GenericHumanApproval): ApprovedGenericPlan {
  const plan = validateGenericPlan(proposal, policy);
  if (!text(approval.actor, "Plan approver") || !text(approval.reason, "Plan approval reason") || Number.isNaN(Date.parse(approval.approvedAt))) {
    throw new Error("Plan approval requires an actor, ISO timestamp, and non-empty reason.");
  }
  return { ...plan, approval: { ...approval, actor: approval.actor.trim(), reason: approval.reason.trim() } };
}
