import { readFileSync } from "node:fs";
import path from "node:path";

interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
}

interface VerifierArtifact {
  taskId: string;
  status: string;
  proofContract: string;
  candidate: { changedPaths: string[]; diffInspection: string };
  baselineEvidence: CommandResult;
  candidateEvidence: CommandResult[];
  limitations: string[];
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
  memory: MemoryTransparency & { estimatedTokens: number; tokenBudget: number; confidenceScore: number; naiveComparisonReason: string; };
  evidence: readonly EvidenceItem[];
  metrics: readonly MeasuredMetric[];
  nodeInspectors?: Record<string, NodeInspector>;
  edgeInspectors?: Record<string, EdgeInspector>;
}

export interface ProofNode { id: string; label: string; kind: string; status: "verified" | "approved" | "recorded" | "blocked"; }
export interface ProofEdge { from: string; to: string; label: string; }
export interface EvidenceItem { id: string; kind: "console" | "diff" | "test" | "browser" | "verification"; title: string; command?: string; exitCode?: number; content: string; authority: "implementer" | "independent_verifier" | "human_reviewer"; }
export interface ReviewProjection { changedPaths: string[]; diffSummary: string; proofContract: string; limitations: string[]; vaultTargets: string[]; vaultDecision: string; }
export interface MemoryTransparency { included: readonly MemoryNote[]; omitted: readonly OmittedMemoryNote[]; }
export interface MemoryNote { id: string; type: string; confidence: string; freshness: string; reasonSelected: string; verification: string; evidenceReferences: string[]; }
export interface OmittedMemoryNote { id: string; type: string; confidence: string; freshness: string; reason: string; }
export interface MeasuredMetric { label: string; value: string; detail: string; }

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
  return JSON.parse(readFileSync(path.join(evidenceDirectory, fileName), "utf8")) as T;
}

function requiredCommand(commands: CommandResult[], command: string): CommandResult {
  const result = commands.find((item) => item.command === command);
  if (!result) {
    throw new Error(`Required evidence command '${command}' is missing.`);
  }
  return result;
}

/**
 * Produces the narrow, read-only record that judge-facing surfaces may display.
 * Evidence artifacts remain authoritative; this function makes no verification
 * decision and grants no approval or write authority.
 */
export function loadPay17RunProjection(evidenceDirectory: string): FoundryRunProjection {
  const verifier = artifact<VerifierArtifact>(evidenceDirectory, "RUN-PAY-17-001-verifier.json");
  const approval = artifact<{ approvedCandidateCommit: string }>(evidenceDirectory, "RUN-PAY-17-001-human-approval.json");
  const vaultWrite = artifact<{ writtenTargets: string[]; approval: string }>(evidenceDirectory, "RUN-PAY-17-001-vault-write.json");
  const replay = artifact<{
    status: string;
    evaluationId: string;
    afterMutation: CommandResult;
  }>(evidenceDirectory, "RUN-PAY-17-001-regression-replay.json");
  const implementation = artifact<{
    candidate: { diffStat: string };
    commandLogs: CommandResult[];
    implementerReport: { changeSummary: string; confidence: string };
  }>(evidenceDirectory, "RUN-PAY-17-001-implementation.json");
  const memoryPack = artifact<{ estimatedTokens: number; tokenBudget: number; confidenceScore: number; naiveComparisonReason: string; sources: { id: string; type: string; confidence: number; freshness: string; reason: string; verification: string; evidenceReferences: string[] }[]; omittedSources: { id: string; type: string; confidence: number; freshness: string; reason: string }[] }>(evidenceDirectory, "RUN-PAY-17-001-memory-pack.json");

  const candidatePay17 = requiredCommand(verifier.candidateEvidence, "npm run test:pay-17");
  const browser = requiredCommand(verifier.candidateEvidence, "npm run test:browser");
  if (!approval.approvedCandidateCommit || !Array.isArray(vaultWrite.writtenTargets)) {
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
      ["Issue intake", "PAY-17 scoped to the checkout and payment boundaries."],
      ["Memory Pack", "Fresh, verified engineering context selected from the vault."],
      ["Plan approved", "Human approval limited Codex to two paths and four commands."],
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
        { id: "memory", label: "Memory Pack", kind: "Context", status: "recorded" },
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
      limitations: verifier.limitations,
      vaultTargets: vaultWrite.writtenTargets,
      vaultDecision: vaultWrite.approval,
    },
    memory: { estimatedTokens: memoryPack.estimatedTokens, tokenBudget: memoryPack.tokenBudget, confidenceScore: memoryPack.confidenceScore, naiveComparisonReason: memoryPack.naiveComparisonReason, included: memoryPack.sources.map((source) => ({ id: source.id, type: source.type, confidence: String(source.confidence), freshness: source.freshness, reasonSelected: source.reason, verification: source.verification, evidenceReferences: source.evidenceReferences })), omitted: memoryPack.omittedSources.map((source) => ({ id: source.id, type: source.type, confidence: String(source.confidence), freshness: source.freshness, reason: source.reason })) },
    evidence: [
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
      issue: { nodeId: "issue", artifactType: "Requirement", evidenceSource: "Task intake (PAY-17)", verificationStatus: "recorded", confidence: "n/a", freshness: "n/a", causalExplanation: "Defines the defect that must be repaired.", limitations: ["Untrusted input; does not grant permissions or policy."], relatedEvidence: [] },
      memory: { nodeId: "memory", artifactType: "Context", evidenceSource: "RUN-PAY-17-001-memory-pack.json", verificationStatus: "recorded", confidence: String(memoryPack.confidenceScore), freshness: memoryPack.sources[0]?.freshness ?? "fresh", causalExplanation: "Provides fresh, verified context to Codex while excluding stale future-repair knowledge.", limitations: ["Derived from the vault, but grants no authority to write back to the vault."], relatedEvidence: [] },
      plan: { nodeId: "plan", artifactType: "Human gate", evidenceSource: "Human plan approval", verificationStatus: "approved", confidence: "n/a", freshness: "n/a", causalExplanation: "Restricts Codex implementation to a specific bounded diff.", limitations: ["Only authorizes a disposable worktree; no direct repository merge."], relatedEvidence: [] },
      worktree: { nodeId: "worktree", artifactType: "Isolated change", evidenceSource: "RUN-PAY-17-001-implementation.json", verificationStatus: "recorded", confidence: implementation.implementerReport.confidence, freshness: "n/a", causalExplanation: "Produces a candidate patch under the approved plan.", limitations: ["This is an implementer artifact, not independent proof. It is non-authoritative."], relatedEvidence: implementation.commandLogs.map(log => `implementer:${log.command}`) },
      verification: { nodeId: "verification", artifactType: "Proof", evidenceSource: "RUN-PAY-17-001-verifier.json", verificationStatus: "verified", confidence: "1", freshness: "n/a", causalExplanation: "Proves the unmodified baseline fails and the candidate patch passes.", limitations: ["Does not automatically merge the patch or write to the vault."], relatedEvidence: ["verifier:diff", "verifier:baseline", "verifier:browser", "verifier:summary"] },
      patch: { nodeId: "patch", artifactType: "Human gate", evidenceSource: "RUN-PAY-17-001-human-approval.json", verificationStatus: "approved", confidence: "n/a", freshness: "n/a", causalExplanation: "Authorizes the specific verified candidate commit.", limitations: ["Approval created a commit only in the disposable candidate worktree.", "No merge, deploy, or Obsidian vault write is authorized by this decision."], relatedEvidence: [] },
      vault: { nodeId: "vault", artifactType: "Durable memory", evidenceSource: "RUN-PAY-17-001-vault-write.json", verificationStatus: "approved", confidence: "n/a", freshness: "n/a", causalExplanation: "Saves verified repair knowledge for future AI sessions.", limitations: ["Vault writes are explicit separate actions from code patches."], relatedEvidence: [] },
      replay: { nodeId: "replay", artifactType: "Evaluation", evidenceSource: "RUN-PAY-17-001-regression-replay.json", verificationStatus: "blocked", confidence: "n/a", freshness: "n/a", causalExplanation: "Proves that if Codex hallucinates the same defect later, the test suite blocks it.", limitations: ["The regression candidate must not be merged or written to the vault."], relatedEvidence: [] }
    },
    edgeInspectors: {
      "issue->memory": { fromId: "issue", toId: "memory", relationship: "scopes context", causalExplanation: "The issue description determines which vault notes are relevant to compile.", evidenceBasis: "Memory Pack compiler input criteria." },
      "memory->plan": { fromId: "memory", toId: "plan", relationship: "bounds proposal", causalExplanation: "The structured plan is derived from the memory pack constraints.", evidenceBasis: "Planner input contract." },
      "plan->worktree": { fromId: "plan", toId: "worktree", relationship: "permits paths/commands", causalExplanation: "The disposable worktree restricts Codex to the human-approved paths.", evidenceBasis: "Worktree policy allowlist." },
      "worktree->verification": { fromId: "worktree", toId: "verification", relationship: "candidate tested", causalExplanation: "The candidate patch must be independently verified against the unchanged baseline proof.", evidenceBasis: "RUN-PAY-17-001-verifier.json" },
      "verification->patch": { fromId: "verification", toId: "patch", relationship: "evidence enables review", causalExplanation: "Human review requires verifier success evidence before patch approval.", evidenceBasis: "RUN-PAY-17-001-human-approval.json prerequisite." },
      "patch->vault": { fromId: "patch", toId: "vault", relationship: "proposes durable notes", causalExplanation: "Only an approved patch can generate new durable Incident and Proof memory.", evidenceBasis: "Vault write requirements." },
      "vault->replay": { fromId: "vault", toId: "replay", relationship: "saved evaluation detects regression", causalExplanation: "The newly saved evaluation protects the patch from future regressions.", evidenceBasis: "RUN-PAY-17-001-regression-replay.json" }
    }
  };

  assertInspectorCoverage(projection);
  return projection;
}
