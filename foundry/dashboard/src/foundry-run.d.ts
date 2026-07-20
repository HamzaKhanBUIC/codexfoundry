declare module "virtual:foundry-run" {
  interface FoundryRunProjection {
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
    proofGraph: { nodes: readonly { id: string; label: string; kind: string; status: string }[]; edges: readonly { from: string; to: string; label: string }[]; };
    review: { changedPaths: string[]; diffSummary: string; proofContract: string; patchApprovalLimits: string[]; vaultTargets: string[]; vaultDecision: string; vaultStatus: string; };
    memory: { lifecycleLabel: string; lifecycleExplanation: string; repositoryCommit: string; baselineCommit: string; estimatedTokens: number; tokenBudget: number; confidenceScore: number; naiveComparisonReason: string; included: readonly { id: string; type: string; confidence: string; freshness: string; reasonSelected: string; verification: string; evidenceReferences: string[]; }[]; omitted: readonly { id: string; type: string; confidence: string; freshness: string; reason: string; }[]; };
    workflowStages: readonly { id: "intake" | "plan" | "implementation" | "verification" | "patch_approval" | "vault_approval"; label: string; status: "recorded" | "approved" | "verified" | "completed"; evidenceSource: string; detail: string; }[];
    evidence: readonly { id: string; kind: string; title: string; command?: string; exitCode?: number; content: string; authority: string; }[];
    metrics: readonly { label: string; value: string; detail: string; }[];
    nodeInspectors?: Record<string, {
      nodeId: string;
      artifactType: string;
      evidenceSource: string;
      verificationStatus: "verified" | "approved" | "recorded" | "blocked";
      confidence: string;
      freshness: string;
      causalExplanation: string;
      limitations: string[];
      relatedEvidence: string[];
    }>;
    edgeInspectors?: Record<string, {
      fromId: string;
      toId: string;
      relationship: string;
      causalExplanation: string;
      evidenceBasis: string;
    }>;
  }

  const run: FoundryRunProjection;
  export default run;
}
