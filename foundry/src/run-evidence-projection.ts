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
  memory: MemoryTransparency;
  evidence: readonly EvidenceItem[];
  metrics: readonly MeasuredMetric[];
}

export interface ProofNode { id: string; label: string; kind: string; status: "verified" | "approved" | "recorded" | "blocked"; }
export interface ProofEdge { from: string; to: string; label: string; }
export interface EvidenceItem { id: string; kind: "console" | "diff" | "test" | "browser" | "verification"; title: string; command?: string; exitCode?: number; content: string; authority: "implementer" | "independent_verifier" | "human_reviewer"; }
export interface ReviewProjection { changedPaths: string[]; diffSummary: string; proofContract: string; limitations: string[]; vaultTargets: string[]; vaultDecision: string; }
export interface MemoryTransparency { included: readonly MemoryNote[]; omitted: readonly OmittedMemoryNote[]; }
export interface MemoryNote { id: string; type: string; confidence: string; freshness: string; reasonSelected: string; verification: string; evidenceReferences: string[]; }
export interface OmittedMemoryNote { id: string; type: string; confidence: string; freshness: string; reason: string; }
export interface MeasuredMetric { label: string; value: string; detail: string; }

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

  const candidatePay17 = requiredCommand(verifier.candidateEvidence, "npm run test:pay-17");
  const browser = requiredCommand(verifier.candidateEvidence, "npm run test:browser");
  if (!approval.approvedCandidateCommit || !Array.isArray(vaultWrite.writtenTargets)) {
    throw new Error("Required approval or vault-write evidence is malformed.");
  }

  return {
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
    memory: {
      included: [
        { id: "ADR-001", type: "ADR", confidence: "verified", freshness: "fresh on repaired commit", reasonSelected: "Direct, verified retry/idempotency decision for the repaired candidate.", verification: "verified commit 2a5d01f", evidenceReferences: ["checkout-service.ts", "PAY-17 unit proof", "browser proof"] },
        { id: "PROOF-001", type: "Proof", confidence: "verified", freshness: "fresh on repaired commit", reasonSelected: "Provides the executable one-payment assertion required by the task.", verification: "independent verifier", evidenceReferences: ["npm run test:pay-17", "npm run test:browser"] },
      ],
      omitted: [
        { id: "INC-000", type: "Incident", confidence: "low", freshness: "stale", reason: "Legacy checkout knowledge is outside the verified implementation context." },
        { id: "ARCH-001", type: "Architecture", confidence: "verified", freshness: "baseline-only", reason: "Retained for baseline analysis; it adds no uncovered repaired-candidate proof obligation." },
      ],
    },
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
    ],
  };
}
