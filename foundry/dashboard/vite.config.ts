import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dashboardDirectory = path.dirname(fileURLToPath(import.meta.url));
const evidenceDirectory = path.resolve(dashboardDirectory, "../evidence");
const virtualRunModule = "virtual:foundry-run";
const resolvedVirtualRunModule = `\0${virtualRunModule}`;

interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
}

function artifact<T>(fileName: string): T {
  return JSON.parse(readFileSync(path.join(evidenceDirectory, fileName), "utf8")) as T;
}

function projectRun(): string {
  const verifier = artifact<{
    taskId: string;
    status: string;
    proofContract: string;
    candidate: { changedPaths: string[] };
    baselineEvidence: CommandResult;
    candidateEvidence: CommandResult[];
  }>("RUN-PAY-17-001-verifier.json");
  const approval = artifact<{ approvedCandidateCommit: string }>("RUN-PAY-17-001-human-approval.json");
  const vaultWrite = artifact<{ writtenTargets: string[] }>("RUN-PAY-17-001-vault-write.json");
  const replay = artifact<{
    status: string;
    evaluationId: string;
    beforeMutation: CommandResult[];
    afterMutation: CommandResult & { expected: string };
  }>("RUN-PAY-17-001-regression-replay.json");

  const candidatePay17 = verifier.candidateEvidence.find((item) => item.command === "npm run test:pay-17")!;
  const browser = verifier.candidateEvidence.find((item) => item.command === "npm run test:browser")!;
  return JSON.stringify({
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
    replayBeforeMutation: replay.beforeMutation,
  });
}

export default defineConfig({
  server: { host: "127.0.0.1", port: 4173 },
  plugins: [
    react(),
    {
      name: "foundry-run-artifact-projection",
      resolveId(id) {
        return id === virtualRunModule ? resolvedVirtualRunModule : undefined;
      },
      load(id) {
        return id === resolvedVirtualRunModule ? `export default ${projectRun()};` : undefined;
      },
    },
  ],
});
