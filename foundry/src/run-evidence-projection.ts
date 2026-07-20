import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
}

interface VerifierArtifact {
  runId: string;
  taskId: string;
  authority: "independent_verifier";
  status: string;
  proofContract: string;
  candidate: { baselineCommit: string; changedPaths: string[]; diffInspection: string };
  baselineEvidence: CommandResult;
  candidateEvidence: CommandResult[];
  limitations: string[];
}

interface RegressionReplayClaim {
  runId: string;
  executed: true;
  status: string;
  afterMutation: { command: string; exitCode: number };
}

interface RegressionReplayArtifact {
  runId: string;
  parentRunId: string;
  authority: string;
  status: string;
  evaluationId: string;
  baseCandidateCommit: string;
  afterMutation: CommandResult;
}

interface VaultWriteArtifact {
  runId: string;
  authority: string;
  approval: string;
  status: string;
  approvedCandidateCommit: string;
  writtenTargets: string[];
  regressionReplay: RegressionReplayClaim;
}

interface IntakeArtifact {
  schemaVersion: "1.0";
  artifactType: "intake";
  runId: string;
  recordedAt: string;
  sourceIssue: { id: string; title: string; body: string; labels: string[]; status: string };
  trustedTask: {
    taskId: string;
    title: string;
    acceptanceCriteria: string[];
    riskLevel: string;
    services: string[];
    paths: string[];
    repositoryCommit: string;
  };
  validation: { status: string; checks: string[] };
}

interface PlanArtifact {
  schemaVersion: "1.0";
  artifactType: "plan";
  runId: string;
  recordedAt: string;
  plan: {
    id: string;
    taskId: string;
    memoryPack: {
      id: string;
      repositoryCommit: string;
      generatedAt: string;
      estimatedTokens: number;
      tokenBudget: number;
      confidenceScore: number;
      sources: { id: string; relevanceScore: number; confidenceScore: number; freshness: string; reason: string }[];
      omittedSourceIds: string[];
    };
    summary: string;
    rootCauseHypothesis: string;
    affectedPaths: string[];
    allowedCommands: string[];
    proofContract: { requirementId: string; assertion: string; commands: string[] }[];
    risks: string[];
    validation: { status: string; checks: string[] };
    approval: { authority: string; decision: string; approvedAt: string; timestampMeaning: string; marker: string; rationale: string };
  };
}

export interface FoundryRunProjection {
  schemaVersion: "1.0";
  taskId: string;
  title: string;
  status: string;
  proofContract: string;
  approvedCommit: string;
  changedPaths: string[];
  vaultRevisionCount: number;
  evaluationId: string;
  regressionStatus: string;
  timeline: readonly (readonly [string, string])[];
  commandEvidence: readonly (readonly [string, string, string, string])[];
  proofGraph: { nodes: readonly ProofNode[]; edges: readonly ProofEdge[] };
  review: ReviewProjection;
  memory: MemoryTransparency & { estimatedTokens: number; tokenBudget: number; confidenceScore: number; naiveComparisonReason: string; lifecycleLabel: string; lifecycleExplanation: string; repositoryCommit: string; baselineCommit: string; };
  workflowStages: readonly WorkflowStage[];
  evidence: readonly EvidenceItem[];
  metrics: readonly MeasuredMetric[];
  nodeInspectors?: Record<string, NodeInspector>;
  edgeInspectors?: Record<string, EdgeInspector>;
}

const proofAssertion = "one logical checkout persists one payment";
const requiredCandidateCommands = ["npm run build", "npm run test:health", "npm run test:pay-17", "npm run test:browser"] as const;
const permittedChangedPaths = new Set(["src/services/checkout-service.ts", "tests/browser/pay-17.spec.ts"]);

export interface ProofNode { id: string; label: string; kind: string; status: "verified" | "approved" | "recorded" | "blocked"; }
export interface ProofEdge { from: string; to: string; label: string; }
export interface EvidenceItem { id: string; kind: "console" | "diff" | "test" | "browser" | "verification" | "record"; title: string; command?: string; exitCode?: number; content: string; authority: "system" | "planner" | "implementer" | "independent_verifier" | "human_reviewer"; }
export interface ReviewProjection { changedPaths: string[]; diffSummary: string; proofContract: string; patchApprovalLimits: string[]; vaultTargets: string[]; vaultDecision: string; vaultStatus: string; }
export interface MemoryTransparency { included: readonly MemoryNote[]; omitted: readonly OmittedMemoryNote[]; }
export interface MemoryNote { id: string; type: string; confidence: string; freshness: string; reasonSelected: string; verification: string; evidenceReferences: string[]; }
export interface OmittedMemoryNote { id: string; type: string; confidence: string; freshness: string; reason: string; }
export interface MeasuredMetric { label: string; value: string; detail: string; }
export interface WorkflowStage { id: "intake" | "plan" | "implementation" | "verification" | "patch_approval" | "vault_approval"; label: string; status: "recorded" | "approved" | "verified" | "completed"; evidenceSource: string; detail: string; }

export interface NodeInspector {
  nodeId: string;
  artifactType: string;
  evidenceSource: string;
  verificationStatus: ProofNode["status"];
  confidence: string;
  freshness: string;
  causalExplanation: string;
  limitations: string[];
  relatedEvidence: string[];
}

export interface EdgeInspector {
  fromId: string;
  toId: string;
  relationship: string;
  causalExplanation: string;
  evidenceBasis: string;
}

function assertInspectorCoverage(projection: FoundryRunProjection): void {
  if (!projection.nodeInspectors || !projection.edgeInspectors) {
    throw new Error("Interactive proof inspection requires complete inspector records.");
  }

  for (const node of projection.proofGraph.nodes) {
    const inspector = projection.nodeInspectors[node.id];
    if (!inspector || inspector.nodeId !== node.id || inspector.verificationStatus !== node.status) {
      throw new Error(`Missing or inconsistent inspector record for proof node '${node.id}'.`);
    }
  }

  for (const edge of projection.proofGraph.edges) {
    const edgeId = `${edge.from}->${edge.to}`;
    const inspector = projection.edgeInspectors[edgeId];
    if (!inspector || inspector.fromId !== edge.from || inspector.toId !== edge.to || inspector.relationship !== edge.label) {
      throw new Error(`Missing or inconsistent inspector record for proof edge '${edgeId}'.`);
    }
  }
}

function artifact<T>(evidenceDirectory: string, fileName: string): T {
  try {
    return JSON.parse(readFileSync(path.join(evidenceDirectory, fileName), "utf8")) as T;
  } catch {
    throw new Error(`Evidence incomplete: required artifact '${fileName}' is missing or malformed.`);
  }
}

function requiredCommand(commands: CommandResult[], command: string): CommandResult {
  const result = commands.find((item) => item.command === command);
  if (!result) {
    throw new Error(`Required evidence command '${command}' is missing.`);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRegressionReplayClaim(value: unknown): value is RegressionReplayClaim {
  if (!isRecord(value) || value.executed !== true || typeof value.runId !== "string" || typeof value.status !== "string" || !isRecord(value.afterMutation)) {
    return false;
  }

  return typeof value.afterMutation.command === "string" && typeof value.afterMutation.exitCode === "number";
}

function containsUnstructuredReplayClaim(value: unknown): boolean {
  if (typeof value === "string") return /\bregression replay\b/i.test(value);
  if (Array.isArray(value)) return value.some(containsUnstructuredReplayClaim);
  if (isRecord(value)) return Object.entries(value).some(([key, nested]) => key !== "regressionReplay" && containsUnstructuredReplayClaim(nested));
  return false;
}

function assertRegressionReplayConsistency(evidenceDirectory: string, parentRunId: string, replay: RegressionReplayArtifact): void {
  for (const fileName of readdirSync(evidenceDirectory).filter((name) => name.endsWith(".json"))) {
    const candidate = artifact<unknown>(evidenceDirectory, fileName);
    if (!isRecord(candidate) || (candidate.runId !== parentRunId && candidate.parentRunId !== parentRunId)) continue;

    if (containsUnstructuredReplayClaim(candidate)) {
      throw new Error(`Evidence contradiction: '${fileName}' contains an unstructured regression replay claim.`);
    }

    if (candidate.regressionReplay === undefined) continue;
    if (!isRegressionReplayClaim(candidate.regressionReplay)) {
      throw new Error(`Evidence contradiction: '${fileName}' has malformed typed regression replay evidence.`);
    }

    const claim = candidate.regressionReplay;
    if (
      claim.runId !== replay.runId ||
      claim.executed !== true ||
      claim.status !== replay.status ||
      claim.afterMutation.command !== replay.afterMutation.command ||
      claim.afterMutation.exitCode !== replay.afterMutation.exitCode
    ) {
      throw new Error(`Evidence contradiction: '${fileName}' regression replay claim conflicts with '${replay.runId}'.`);
    }
  }
}

/**
 * Produces the narrow, read-only record that judge-facing surfaces may display.
 * Evidence artifacts remain authoritative; this function makes no verification
 * decision and grants no approval or write authority.
 */
export function loadPay17RunProjection(evidenceDirectory: string): FoundryRunProjection {
  const intake = artifact<IntakeArtifact>(evidenceDirectory, "RUN-PAY-17-001-intake.json");
  const plan = artifact<PlanArtifact>(evidenceDirectory, "RUN-PAY-17-001-plan.json");
  const verifier = artifact<VerifierArtifact>(evidenceDirectory, "RUN-PAY-17-001-verifier.json");
  const approval = artifact<{ runId: string; authority: string; decision: string; approvedCandidateCommit: string; parentBaselineCommit: string; limits: string[] }>(evidenceDirectory, "RUN-PAY-17-001-human-approval.json");
  const vaultWrite = artifact<VaultWriteArtifact>(evidenceDirectory, "RUN-PAY-17-001-vault-write.json");
  const replay = artifact<RegressionReplayArtifact>(evidenceDirectory, "RUN-PAY-17-001-regression-replay.json");
  const implementation = artifact<{
    runId: string;
    taskId: string;
    status: string;
    verificationAuthority: string;
    candidate: { baselineCommit: string; changedPaths: string[]; diffStat: string };
    commandLogs: CommandResult[];
    implementerReport: { changeSummary: string; confidence: string };
  }>(evidenceDirectory, "RUN-PAY-17-001-implementation.json");
  const memoryPack = artifact<{ runId: string; repositoryCommit: string; estimatedTokens: number; tokenBudget: number; confidenceScore: number; naiveComparisonReason: string; sources: { id: string; type: string; confidence: number; freshness: string; reason: string; verification: string; evidenceReferences: string[] }[]; omittedSources: { id: string; type: string; confidence: number; freshness: string; reason: string }[] }>(evidenceDirectory, "RUN-PAY-17-001-memory-pack.json");

  assertEvidenceContract(evidenceDirectory, intake, plan, verifier, approval, vaultWrite, replay, implementation, memoryPack);
  const candidatePay17 = requiredCommand(verifier.candidateEvidence, "npm run test:pay-17");
  const browser = requiredCommand(verifier.candidateEvidence, "npm run test:browser");
  if (!Array.isArray(approval.limits) || !Array.isArray(vaultWrite.writtenTargets)) {
    throw new Error("Required approval or vault-write evidence is malformed.");
  }

  const projection: FoundryRunProjection = {
    schemaVersion: "1.0",
    taskId: verifier.taskId,
    title: "Duplicate charge after checkout retry",
    status: verifier.status,
    proofContract: verifier.proofContract,
    approvedCommit: approval.approvedCandidateCommit.slice(0, 7),
    changedPaths: verifier.candidate.changedPaths,
    vaultRevisionCount: vaultWrite.writtenTargets.length,
    evaluationId: replay.evaluationId,
    regressionStatus: replay.status,
    timeline: [
      ["Issue intake", `${intake.trustedTask.taskId} was accepted as a ${intake.trustedTask.riskLevel}-risk checkout and payment task.`],
      ["Baseline planner Memory Pack", `${plan.plan.memoryPack.id} selected ${plan.plan.memoryPack.sources.map((source) => source.id).join(", ")} at ${plan.plan.memoryPack.estimatedTokens} estimated tokens; post-repair proof knowledge was excluded.`],
      ["Plan approved", `${plan.plan.approval.marker} confirmed ${plan.plan.id}; the confirmation was recorded at ${plan.plan.approval.approvedAt}. The original approval preceded implementation, but its legacy wall-clock timestamp was not retained.`],
      ["Candidate repair", "Codex preserved the logical idempotency key across retries."],
      ["Independent verification", "Baseline failed. Candidate unit and browser proofs passed."],
      ["Memory write", `${vaultWrite.writtenTargets.length} durable notes were approved and written.`],
      ["Regression replay", "Reintroduced mutation failed the unchanged PAY-17 proof."],
    ],
    commandEvidence: [
      ["Baseline PAY-17", verifier.baselineEvidence.command, "Failed as expected", verifier.baselineEvidence.stdout],
      ["Candidate PAY-17", candidatePay17.command, "Passed", candidatePay17.stdout],
      ["Browser proof", browser.command, "Passed", browser.stdout],
      ["Regression replay", replay.afterMutation.command, "Blocked", replay.afterMutation.stdout],
    ],
    proofGraph: {
      nodes: [
        { id: "issue", label: "PAY-17 issue", kind: "Requirement", status: "recorded" },
        { id: "memory", label: "Baseline planner pack", kind: "Context", status: "recorded" },
        { id: "plan", label: "Approved plan", kind: "Human gate", status: "approved" },
        { id: "worktree", label: "Candidate worktree", kind: "Isolated change", status: "recorded" },
        { id: "verification", label: "Independent verification", kind: "Proof", status: "verified" },
        { id: "patch", label: "Patch approval", kind: "Human gate", status: "approved" },
        { id: "vault", label: "Vault approval", kind: "Durable memory", status: "approved" },
        { id: "replay", label: "Regression replay", kind: "Evaluation", status: "blocked" },
      ],
      edges: [
        { from: "issue", to: "memory", label: "scopes context" }, { from: "memory", to: "plan", label: "bounds proposal" },
        { from: "plan", to: "worktree", label: "permits paths/commands" }, { from: "worktree", to: "verification", label: "candidate tested" },
        { from: "verification", to: "patch", label: "evidence enables review" }, { from: "patch", to: "vault", label: "proposes durable notes" },
        { from: "vault", to: "replay", label: "saved evaluation detects regression" },
      ],
    },
    review: {
      changedPaths: verifier.candidate.changedPaths,
      diffSummary: `${implementation.candidate.diffStat}. ${verifier.candidate.diffInspection}`,
      proofContract: verifier.proofContract,
      patchApprovalLimits: approval.limits,
      vaultTargets: vaultWrite.writtenTargets,
      vaultDecision: vaultWrite.approval,
      vaultStatus: vaultWrite.status,
    },
    memory: { lifecycleLabel: "Post-repair reusable engineering memory", lifecycleExplanation: `This displayed pack was compiled after repair against approved candidate ${memoryPack.repositoryCommit.slice(0, 7)}. It was not sent to the baseline planner, which was bounded by pre-repair commit ${verifier.candidate.baselineCommit.slice(0, 7)} context.`, repositoryCommit: memoryPack.repositoryCommit.slice(0, 7), baselineCommit: verifier.candidate.baselineCommit.slice(0, 7), estimatedTokens: memoryPack.estimatedTokens, tokenBudget: memoryPack.tokenBudget, confidenceScore: memoryPack.confidenceScore, naiveComparisonReason: memoryPack.naiveComparisonReason, included: memoryPack.sources.map((source) => ({ id: source.id, type: source.type, confidence: String(source.confidence), freshness: source.freshness, reasonSelected: source.reason, verification: source.verification, evidenceReferences: source.evidenceReferences })), omitted: memoryPack.omittedSources.map((source) => ({ id: source.id, type: source.type, confidence: String(source.confidence), freshness: source.freshness, reason: source.reason })) },
    workflowStages: [
      { id: "intake", label: "Issue intake", status: "recorded", evidenceSource: "RUN-PAY-17-001-intake.json", detail: `${intake.sourceIssue.id} was validated into a bounded ${intake.trustedTask.riskLevel}-risk task.` },
      { id: "plan", label: "Plan", status: "approved", evidenceSource: "RUN-PAY-17-001-plan.json", detail: `${plan.plan.id} passed policy validation and was human-approved before implementation.` },
      { id: "implementation", label: "Implementation", status: "recorded", evidenceSource: "RUN-PAY-17-001-implementation.json", detail: `${implementation.candidate.changedPaths.length} candidate paths were recorded as unverified implementer output.` },
      { id: "verification", label: "Independent verification", status: "verified", evidenceSource: "RUN-PAY-17-001-verifier.json", detail: "The independent verifier recorded the baseline failure and all candidate proof commands." },
      { id: "patch_approval", label: "Patch approval", status: "approved", evidenceSource: "RUN-PAY-17-001-human-approval.json", detail: "Human review approved only the verified disposable candidate commit." },
      { id: "vault_approval", label: "Vault approval", status: "completed", evidenceSource: "RUN-PAY-17-001-vault-write.json", detail: `${vaultWrite.writtenTargets.length} Markdown revisions were separately human-approved and written.` },
    ],
    evidence: [
      { id: "intake:record", kind: "record", title: "Recorded issue intake", content: JSON.stringify(intake, null, 2), authority: "system" },
      { id: "plan:record", kind: "record", title: "Recorded approved plan", content: JSON.stringify(plan, null, 2), authority: "planner" },
      ...implementation.commandLogs.map((log) => ({ id: `implementer:${log.command}`, kind: "console" as const, title: `Implementer log: ${log.command}`, command: log.command, exitCode: log.exitCode, content: log.stdout, authority: "implementer" as const })),
      { id: "verifier:diff", kind: "diff", title: "Verifier diff inspection", content: verifier.candidate.diffInspection, authority: "independent_verifier" },
      { id: "verifier:baseline", kind: "test", title: "Baseline PAY-17 proof", command: verifier.baselineEvidence.command, exitCode: verifier.baselineEvidence.exitCode, content: verifier.baselineEvidence.stdout, authority: "independent_verifier" },
      { id: "verifier:browser", kind: "browser", title: "Browser proof", command: browser.command, exitCode: browser.exitCode, content: browser.stdout, authority: "independent_verifier" },
      { id: "verifier:summary", kind: "verification", title: "Independent verification", content: `Status: ${verifier.status}. ${verifier.proofContract}.`, authority: "independent_verifier" },
    ],
    metrics: [
      { label: "Verification commands", value: String(verifier.candidateEvidence.length), detail: "Independent verifier commands recorded." },
      { label: "Changed paths", value: String(verifier.candidate.changedPaths.length), detail: "Within the approved candidate boundary." },
      { label: "Vault revisions", value: String(vaultWrite.writtenTargets.length), detail: "Explicitly human-approved Markdown revisions." },
      { label: "Regression status", value: replay.status, detail: "Unchanged PAY-17 proof blocked the deliberate mutation." },
      { label: "Memory Pack", value: `${memoryPack.estimatedTokens} / ${memoryPack.tokenBudget}`, detail: memoryPack.naiveComparisonReason },
    ],
    nodeInspectors: {
      issue: { nodeId: "issue", artifactType: "Requirement", evidenceSource: "RUN-PAY-17-001-intake.json", verificationStatus: "recorded", confidence: "n/a", freshness: "n/a", causalExplanation: "Defines the defect that must be repaired and records the policy-owned task derived from untrusted issue input.", limitations: ["Issue prose is untrusted and does not grant permissions or policy."], relatedEvidence: ["intake:record"] },
      memory: { nodeId: "memory", artifactType: "Context", evidenceSource: "RUN-PAY-17-001-plan.json baseline Memory Pack summary", verificationStatus: "recorded", confidence: String(plan.plan.memoryPack.confidenceScore), freshness: "fresh", causalExplanation: "Provides pre-repair context to bound the plan. It does not include PROOF-001, which was verified only after the repair.", limitations: ["The separately displayed post-repair reusable memory was not sent to the baseline planner."], relatedEvidence: ["plan:record"] },
      plan: { nodeId: "plan", artifactType: "Human gate", evidenceSource: "RUN-PAY-17-001-plan.json", verificationStatus: "approved", confidence: "n/a", freshness: "n/a", causalExplanation: "Records the policy-valid proposal and human approval that restrict Codex implementation to a specific bounded diff.", limitations: ["Only authorizes a disposable worktree; no direct repository merge."], relatedEvidence: ["plan:record"] },
      worktree: { nodeId: "worktree", artifactType: "Isolated change", evidenceSource: "RUN-PAY-17-001-implementation.json", verificationStatus: "recorded", confidence: implementation.implementerReport.confidence, freshness: "n/a", causalExplanation: "Produces a candidate patch under the approved plan.", limitations: ["This is an implementer artifact, not independent proof. It is non-authoritative."], relatedEvidence: implementation.commandLogs.map(log => `implementer:${log.command}`) },
      verification: { nodeId: "verification", artifactType: "Proof", evidenceSource: "RUN-PAY-17-001-verifier.json", verificationStatus: "verified", confidence: "1", freshness: "n/a", causalExplanation: "Proves the unmodified baseline fails and the candidate patch passes.", limitations: ["Does not automatically merge the patch or write to the vault."], relatedEvidence: ["verifier:diff", "verifier:baseline", "verifier:browser", "verifier:summary"] },
      patch: { nodeId: "patch", artifactType: "Human gate", evidenceSource: "RUN-PAY-17-001-human-approval.json", verificationStatus: "approved", confidence: "n/a", freshness: "n/a", causalExplanation: "Authorizes the specific verified candidate commit.", limitations: ["Approval created a commit only in the disposable candidate worktree.", "No merge, deploy, or Obsidian vault write is authorized by this decision."], relatedEvidence: [] },
      vault: { nodeId: "vault", artifactType: "Durable memory", evidenceSource: "RUN-PAY-17-001-vault-write.json", verificationStatus: "approved", confidence: "n/a", freshness: "n/a", causalExplanation: "Saves verified repair knowledge for future AI sessions.", limitations: ["Vault writes are explicit separate actions from code patches."], relatedEvidence: [] },
      replay: { nodeId: "replay", artifactType: "Evaluation", evidenceSource: "RUN-PAY-17-001-regression-replay.json", verificationStatus: "blocked", confidence: "n/a", freshness: "n/a", causalExplanation: "Proves that if Codex hallucinates the same defect later, the test suite blocks it.", limitations: ["The regression candidate must not be merged or written to the vault."], relatedEvidence: [] }
    },
    edgeInspectors: {
      "issue->memory": { fromId: "issue", toId: "memory", relationship: "scopes context", causalExplanation: "The recorded trusted task determines which vault notes are relevant to compile.", evidenceBasis: "RUN-PAY-17-001-intake.json and RUN-PAY-17-001-plan.json." },
      "memory->plan": { fromId: "memory", toId: "plan", relationship: "bounds proposal", causalExplanation: "The recorded structured plan is derived from the baseline Memory Pack constraints.", evidenceBasis: "RUN-PAY-17-001-plan.json." },
      "plan->worktree": { fromId: "plan", toId: "worktree", relationship: "permits paths/commands", causalExplanation: "The recorded human approval limits the disposable worktree to its approved paths and commands.", evidenceBasis: "RUN-PAY-17-001-plan.json." },
      "worktree->verification": { fromId: "worktree", toId: "verification", relationship: "candidate tested", causalExplanation: "The candidate patch must be independently verified against the unchanged baseline proof.", evidenceBasis: "RUN-PAY-17-001-verifier.json" },
      "verification->patch": { fromId: "verification", toId: "patch", relationship: "evidence enables review", causalExplanation: "Human review requires verifier success evidence before patch approval.", evidenceBasis: "RUN-PAY-17-001-human-approval.json prerequisite." },
      "patch->vault": { fromId: "patch", toId: "vault", relationship: "proposes durable notes", causalExplanation: "Only an approved patch can generate new durable Incident and Proof memory.", evidenceBasis: "Vault write requirements." },
      "vault->replay": { fromId: "vault", toId: "replay", relationship: "saved evaluation detects regression", causalExplanation: "The newly saved evaluation protects the patch from future regressions.", evidenceBasis: "RUN-PAY-17-001-regression-replay.json" }
    }
  };

  assertInspectorCoverage(projection);
  return projection;
}

function assertCommandExit(result: CommandResult, expectedExitCode: number, context: string): void {
  if (result.exitCode !== expectedExitCode) {
    throw new Error(`${context} must exit ${expectedExitCode}; received ${result.exitCode}.`);
  }
}

function assertEvidenceContract(
  evidenceDirectory: string,
  intake: IntakeArtifact,
  plan: PlanArtifact,
  verifier: VerifierArtifact,
  approval: { runId: string; authority: string; decision: string; approvedCandidateCommit: string; parentBaselineCommit: string; limits: string[] },
  vaultWrite: VaultWriteArtifact,
  replay: RegressionReplayArtifact,
  implementation: { runId: string; taskId: string; status: string; verificationAuthority: string; candidate: { baselineCommit: string; changedPaths: string[] } },
  memoryPack: { runId: string; repositoryCommit: string; estimatedTokens: number; tokenBudget: number; confidenceScore: number },
): void {
  if (
    intake.schemaVersion !== "1.0" ||
    intake.artifactType !== "intake" ||
    intake.runId !== "RUN-PAY-17-001" ||
    intake.sourceIssue.id !== "PAY-17" ||
    !intake.sourceIssue.title ||
    !Array.isArray(intake.sourceIssue.labels) ||
    !intake.sourceIssue.labels.includes("bug") ||
    !intake.sourceIssue.labels.includes("payments") ||
    !intake.sourceIssue.labels.includes("checkout") ||
    !intake.sourceIssue.labels.includes("high-risk") ||
    intake.sourceIssue.status !== "open" ||
    typeof intake.sourceIssue.body !== "string" ||
    intake.trustedTask.taskId !== "PAY-17" ||
    intake.trustedTask.acceptanceCriteria.join("\n") !== proofAssertion ||
    intake.trustedTask.riskLevel !== "high" ||
    intake.trustedTask.paths.join("\n") !== "src/services/checkout-service.ts" ||
    intake.validation.status !== "accepted" ||
    intake.validation.checks.length === 0
  ) {
    throw new Error("Evidence incomplete: intake evidence is malformed or does not satisfy the PAY-17 intake contract.");
  }
  if (
    plan.schemaVersion !== "1.0" ||
    plan.artifactType !== "plan" ||
    plan.runId !== intake.runId ||
    plan.plan.taskId !== intake.trustedTask.taskId ||
    plan.plan.memoryPack.repositoryCommit !== intake.trustedTask.repositoryCommit ||
    plan.plan.memoryPack.estimatedTokens <= 0 ||
    plan.plan.memoryPack.tokenBudget <= 0 ||
    plan.plan.memoryPack.estimatedTokens > plan.plan.memoryPack.tokenBudget ||
    plan.plan.memoryPack.confidenceScore < 0 ||
    plan.plan.memoryPack.confidenceScore > 1 ||
    plan.plan.memoryPack.sources.length === 0 ||
    plan.plan.validation.status !== "accepted" ||
    plan.plan.validation.checks.length === 0 ||
    plan.plan.approval.authority !== "human_reviewer" ||
    plan.plan.approval.decision !== "approved" ||
    plan.plan.approval.timestampMeaning !== "historical approval confirmation recorded during evidence materialization" ||
    !plan.plan.approval.marker ||
    Number.isNaN(Date.parse(plan.plan.approval.approvedAt)) ||
    plan.plan.affectedPaths.join("\n") !== verifier.candidate.changedPaths.join("\n") ||
    plan.plan.allowedCommands.join("\n") !== requiredCandidateCommands.join("\n") ||
    plan.plan.proofContract.length !== 1 ||
    plan.plan.proofContract[0].requirementId !== "PAY-17" ||
    plan.plan.proofContract[0].assertion !== proofAssertion ||
    plan.plan.proofContract[0].commands.join("\n") !== ["npm run test:pay-17", "npm run test:browser"].join("\n")
  ) {
    throw new Error("Evidence incomplete: plan evidence is malformed, unapproved, or inconsistent with the PAY-17 candidate.");
  }
  if (verifier.runId !== "RUN-PAY-17-001" || verifier.taskId !== "PAY-17" || verifier.authority !== "independent_verifier" || verifier.status !== "verified" || verifier.proofContract !== proofAssertion) {
    throw new Error("Verifier artifact does not satisfy the PAY-17 authority or proof contract.");
  }
  if (intake.trustedTask.repositoryCommit !== verifier.candidate.baselineCommit || implementation.runId !== verifier.runId || implementation.taskId !== verifier.taskId || implementation.status !== "implementation_complete_unverified" || implementation.verificationAuthority !== "deferred_to_independent_verifier") {
    throw new Error("Implementer artifact must remain unverified and match the verifier run.");
  }
  if (implementation.candidate.baselineCommit !== verifier.candidate.baselineCommit || implementation.candidate.changedPaths.join("\n") !== verifier.candidate.changedPaths.join("\n")) {
    throw new Error("Implementer and verifier candidate records disagree.");
  }
  if (verifier.candidate.changedPaths.length === 0 || verifier.candidate.changedPaths.some((candidate) => !permittedChangedPaths.has(candidate))) {
    throw new Error("Verifier artifact contains a candidate path outside the approved PAY-17 proof scope.");
  }
  if (verifier.baselineEvidence.command !== "npm run test:pay-17") {
    throw new Error("Verifier baseline evidence must execute the unchanged PAY-17 proof.");
  }
  assertCommandExit(verifier.baselineEvidence, 1, "Verifier baseline PAY-17 evidence");
  for (const command of requiredCandidateCommands) {
    assertCommandExit(requiredCommand(verifier.candidateEvidence, command), 0, `Verifier candidate evidence '${command}'`);
  }
  if (approval.runId !== verifier.runId || approval.authority !== "human_reviewer" || approval.decision !== "approved" || !approval.approvedCandidateCommit || approval.parentBaselineCommit !== verifier.candidate.baselineCommit) {
    throw new Error("Patch approval evidence is not a valid human decision for this verifier result.");
  }
  if (vaultWrite.runId !== verifier.runId || vaultWrite.authority !== "human_reviewer" || vaultWrite.approval !== "APPROVE VAULT WRITE" || vaultWrite.status !== "completed" || vaultWrite.approvedCandidateCommit !== approval.approvedCandidateCommit || vaultWrite.writtenTargets.length === 0) {
    throw new Error("Vault-write evidence is not a valid separate human-approved result.");
  }
  if (replay.parentRunId !== verifier.runId || replay.authority !== "independent_verifier" || replay.status !== "regression_blocked" || replay.baseCandidateCommit !== approval.approvedCandidateCommit || replay.afterMutation.command !== "npm run test:pay-17") {
    throw new Error("Regression replay evidence is not linked to the approved PAY-17 candidate.");
  }
  assertCommandExit(replay.afterMutation, 1, "Regression replay evidence");
  if (!isRegressionReplayClaim(vaultWrite.regressionReplay)) {
    throw new Error("Vault-write evidence must declare typed regression replay evidence.");
  }
  assertRegressionReplayConsistency(evidenceDirectory, verifier.runId, replay);
  if (memoryPack.runId !== verifier.runId || memoryPack.repositoryCommit !== approval.approvedCandidateCommit || memoryPack.estimatedTokens <= 0 || memoryPack.tokenBudget <= 0 || memoryPack.estimatedTokens > memoryPack.tokenBudget || memoryPack.confidenceScore < 0 || memoryPack.confidenceScore > 1) {
    throw new Error("Post-repair Memory Pack metadata is not trustworthy for this approved candidate.");
  }
}
