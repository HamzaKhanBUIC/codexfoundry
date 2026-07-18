declare module "virtual:foundry-run" {
  interface CommandResult {
    command: string;
    exitCode: number;
    stdout: string;
  }

  interface FoundryRunProjection {
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
    replayBeforeMutation: readonly CommandResult[];
  }

  const run: FoundryRunProjection;
  export default run;
}
