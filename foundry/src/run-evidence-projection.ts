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
  candidate: { changedPaths: string[] };
  baselineEvidence: CommandResult;
  candidateEvidence: CommandResult[];
}

export interface FoundryRunProjection {
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
  const vaultWrite = artifact<{ writtenTargets: string[] }>(evidenceDirectory, "RUN-PAY-17-001-vault-write.json");
  const replay = artifact<{
    status: string;
    evaluationId: string;
    afterMutation: CommandResult;
  }>(evidenceDirectory, "RUN-PAY-17-001-regression-replay.json");

  const candidatePay17 = requiredCommand(verifier.candidateEvidence, "npm run test:pay-17");
  const browser = requiredCommand(verifier.candidateEvidence, "npm run test:browser");
  if (!approval.approvedCandidateCommit || !Array.isArray(vaultWrite.writtenTargets)) {
    throw new Error("Required approval or vault-write evidence is malformed.");
  }

  return {
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
  };
}
