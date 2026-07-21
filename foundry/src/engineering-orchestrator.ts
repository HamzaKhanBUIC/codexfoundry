import {
  analyzeLocalRepository,
  type Confidence,
  type EvidenceReference,
  type RepositoryAnalysis,
  type SuggestedTask,
} from "./repository-analysis.js";

export type EngineeringAgentKind =
  | "repository"
  | "architecture"
  | "dependency"
  | "business_domain"
  | "security"
  | "testing"
  | "codex_architecture"
  | "codex_business_domain";

export type AgentStatus = "completed" | "skipped" | "failed";

export interface AgentClaim {
  title: string;
  detail: string;
  confidence: Confidence;
  evidenceIds: string[];
  limitations: string[];
}

export interface AgentRecommendation {
  id: string;
  title: string;
  priority: SuggestedTask["priority"];
  confidence: Confidence;
  evidenceIds: string[];
  reason: string;
}

export interface EngineeringAgentResult {
  id: string;
  kind: EngineeringAgentKind;
  execution: "deterministic" | "codex_read_only";
  status: AgentStatus;
  durationMs: number;
  summary: string;
  claims: AgentClaim[];
  recommendations: AgentRecommendation[];
  evidence: EvidenceReference[];
  confidence: Confidence;
  unknowns: string[];
  limitations: string[];
  error?: string;
}

export interface SharedRepositoryContext {
  repositoryPath: string;
  repositoryCommit: string | null;
  memoryPack: Pick<RepositoryAnalysis["memoryPack"], "id" | "available" | "estimatedTokens" | "tokenBudget" | "confidence" | "selected" | "omitted" | "unknowns" | "limitations">;
  staticAnalysis: RepositoryAnalysis;
}

export interface CodexSemanticRequest {
  kind: "codex_architecture" | "codex_business_domain";
  context: SharedRepositoryContext;
}

export interface CodexSemanticReasoner {
  run(request: CodexSemanticRequest): Promise<EngineeringAgentResult>;
}

export interface FusedEngineeringIntelligence {
  authority: "read_only_static_analysis";
  summary: string;
  readiness: RepositoryAnalysis["decisionSupport"]["readiness"]["items"];
  claims: AgentClaim[];
  recommendations: AgentRecommendation[];
  evidence: EvidenceReference[];
  confidence: Confidence;
  unknowns: string[];
  limitations: string[];
}

export interface EngineeringPipelineRun {
  id: string;
  repository: { path: string; commit: string | null; name: string };
  status: "completed" | "completed_with_agent_failures";
  durationMs: number;
  sharedContext: Omit<SharedRepositoryContext, "staticAnalysis">;
  agents: EngineeringAgentResult[];
  fused: FusedEngineeringIntelligence;
  analysis: RepositoryAnalysis;
}

export interface EngineeringOrchestratorOptions {
  analyzeRepository?: typeof analyzeLocalRepository;
  codexReasoner?: CodexSemanticReasoner;
  /** Injectable only for deterministic failure-containment tests. */
  deterministicAgent?: DeterministicAgentRunner;
  now?: () => number;
}

export type DeterministicAgentKind = Exclude<EngineeringAgentKind, "codex_architecture" | "codex_business_domain">;
export type DeterministicAgentRunner = (kind: DeterministicAgentKind, context: SharedRepositoryContext, now: () => number) => EngineeringAgentResult;

function uniqueEvidence(items: EvidenceReference[]): EvidenceReference[] {
  const values = new Map<string, EvidenceReference>();
  items.forEach((item) => values.set(item.id, item));
  return [...values.values()];
}

function lowestConfidence(values: Confidence[]): Confidence {
  return values.includes("low") ? "low" : values.includes("medium") ? "medium" : "high";
}

function agentResult(result: Omit<EngineeringAgentResult, "id">): EngineeringAgentResult {
  return { ...result, id: "agent:" + result.kind };
}

function taskRecommendation(task: SuggestedTask): AgentRecommendation {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    confidence: task.confidence,
    evidenceIds: task.evidence.map((item) => item.id),
    reason: task.priorityReasoning,
  };
}

function recommendationsFor(analysis: RepositoryAnalysis, terms: string[]): AgentRecommendation[] {
  return analysis.suggestions.filter((task) => {
    const text = (task.title + " " + task.problemSummary + " " + task.engineeringImpact.areas.join(" ")).toLowerCase();
    return terms.some((term) => text.includes(term));
  }).map(taskRecommendation);
}

function deterministicAgent(
  kind: DeterministicAgentKind,
  context: SharedRepositoryContext,
  now: () => number,
): EngineeringAgentResult {
  const started = now();
  const analysis = context.staticAnalysis;
  if (kind === "repository") {
    const readiness = analysis.decisionSupport.readiness.items;
    const evidence = uniqueEvidence([...analysis.decisionSupport.repositoryDna.evidence, ...analysis.decisionSupport.readiness.evidence]);
    return agentResult({
      kind, execution: "deterministic", status: "completed", durationMs: Math.max(0, now() - started),
      summary: "Repository DNA for " + analysis.repository.name + "; readiness: " + readiness.label + ".",
      claims: [{ title: "Repository readiness", detail: readiness.recommendation, confidence: readiness.confidence, evidenceIds: readiness.evidenceIds, limitations: [readiness.primaryLimitation] }],
      recommendations: analysis.suggestions.slice(0, 3).map(taskRecommendation), evidence, confidence: readiness.confidence,
      unknowns: readiness.unknowns, limitations: ["This planning advisory cannot authorize implementation."],
    });
  }
  if (kind === "architecture") {
    const evidence = uniqueEvidence([...analysis.architecture.evidence, ...analysis.moduleGraph.evidence]);
    return agentResult({
      kind, execution: "deterministic", status: "completed", durationMs: Math.max(0, now() - started),
      summary: analysis.architecture.items.styles.length > 0 ? "Observed architecture markers: " + analysis.architecture.items.styles.map((item) => item.name).join(", ") + "." : "Architecture style is UNKNOWN from bounded static evidence.",
      claims: [{ title: "Architecture and module boundaries", detail: analysis.moduleGraph.items.modules.length + " source modules, " + analysis.moduleGraph.items.internalEdges.length + " static edges, and " + analysis.moduleGraph.items.circularDependencies.length + " resolved cycle(s) were observed.", confidence: lowestConfidence([analysis.architecture.confidence, analysis.moduleGraph.confidence]), evidenceIds: evidence.map((item) => item.id), limitations: analysis.moduleGraph.limitations }],
      recommendations: recommendationsFor(analysis, ["architecture", "maintainability", "cycle", "complex"]), evidence,
      confidence: lowestConfidence([analysis.architecture.confidence, analysis.moduleGraph.confidence]),
      unknowns: [...analysis.architecture.unknowns, ...analysis.moduleGraph.unknowns],
      limitations: ["Architecture conclusions are structural observations, not semantic ownership proof."],
    });
  }
  if (kind === "dependency") {
    const evidence = uniqueEvidence([...analysis.dependencies.evidence, ...analysis.moduleGraph.evidence]);
    return agentResult({
      kind, execution: "deterministic", status: "completed", durationMs: Math.max(0, now() - started),
      summary: analysis.moduleGraph.items.internalEdges.length + " resolved static internal dependency edge(s) and " + analysis.dependencies.items.hotspots.length + " hotspot(s) were observed.",
      claims: [{ title: "Change propagation surface", detail: analysis.moduleGraph.items.circularDependencies.length + " static cycle(s) and " + analysis.moduleGraph.items.boundaries.length + " cross-directory boundary relationship(s) are available for review.", confidence: lowestConfidence([analysis.dependencies.confidence, analysis.moduleGraph.confidence]), evidenceIds: evidence.map((item) => item.id), limitations: analysis.moduleGraph.limitations }],
      recommendations: recommendationsFor(analysis, ["dependency", "coupling", "cycle", "duplicate"]), evidence,
      confidence: lowestConfidence([analysis.dependencies.confidence, analysis.moduleGraph.confidence]),
      unknowns: [...analysis.dependencies.unknowns, ...analysis.moduleGraph.unknowns],
      limitations: ["Only supported static relative imports contribute to propagation analysis."],
    });
  }
  if (kind === "business_domain") {
    const evidence = uniqueEvidence(analysis.domains.evidence);
    return agentResult({
      kind, execution: "deterministic", status: "completed", durationMs: Math.max(0, now() - started),
      summary: analysis.domains.items.length > 0 ? "Observed business-domain vocabulary: " + analysis.domains.items.map((item) => item.name).join(", ") + "." : "Business ownership and workflows are UNKNOWN from bounded path vocabulary.",
      claims: analysis.domains.items.map((domain) => ({ title: domain.name + " domain marker", detail: "Path vocabulary met the configured static evidence threshold.", confidence: domain.confidence, evidenceIds: domain.evidence.map((item) => item.id), limitations: analysis.domains.limitations })),
      recommendations: recommendationsFor(analysis, ["business", "workflow", "validation", "test"]), evidence,
      confidence: analysis.domains.confidence, unknowns: analysis.domains.unknowns,
      limitations: ["Business workflows and ownership are not inferred beyond evidence-backed repository vocabulary."],
    });
  }
  if (kind === "security") {
    const evidence = uniqueEvidence(analysis.security.evidence);
    return agentResult({
      kind, execution: "deterministic", status: "completed", durationMs: Math.max(0, now() - started),
      summary: analysis.security.items.length + " static security review signal(s) were observed. They are not vulnerability findings.",
      claims: analysis.security.items.map((finding) => ({ title: finding.title, detail: finding.detail, confidence: finding.confidence, evidenceIds: finding.evidence.map((item) => item.id), limitations: analysis.security.limitations })),
      recommendations: recommendationsFor(analysis, ["security", "validation", "risk"]), evidence,
      confidence: analysis.security.confidence, unknowns: analysis.security.unknowns, limitations: analysis.security.limitations,
    });
  }
  const evidence = uniqueEvidence([...analysis.testSystem.evidence, ...analysis.buildSystem.evidence]);
  return agentResult({
    kind: "testing", execution: "deterministic", status: "completed", durationMs: Math.max(0, now() - started),
    summary: analysis.testSystem.items.testFiles.length + " test-like path(s) and " + analysis.testSystem.items.kinds.length + " test convention(s) were detected; no test command was executed.",
    claims: [{ title: "Regression-test discovery", detail: analysis.testSystem.items.missing[0] ?? "Test paths are discoverable from bounded repository metadata.", confidence: analysis.testSystem.confidence, evidenceIds: evidence.map((item) => item.id), limitations: analysis.testSystem.limitations }],
    recommendations: recommendationsFor(analysis, ["test", "regression", "verification"]), evidence,
    confidence: analysis.testSystem.confidence, unknowns: analysis.testSystem.unknowns, limitations: analysis.testSystem.limitations,
  });
}

function knownEvidence(analysis: RepositoryAnalysis): Map<string, EvidenceReference> {
  const discovered = new Map<string, EvidenceReference>();
  const seen = new WeakSet<object>();
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    const candidate = value as Partial<EvidenceReference> & Record<string, unknown>;
    if (typeof candidate.id === "string" && typeof candidate.source === "string" && typeof candidate.observation === "string" && (candidate.confidence === "low" || candidate.confidence === "medium" || candidate.confidence === "high")) {
      discovered.set(candidate.id, candidate as EvidenceReference);
    }
    Object.values(candidate).forEach(visit);
  };
  visit(analysis);
  return discovered;
}

function fuse(context: SharedRepositoryContext, agents: EngineeringAgentResult[]): FusedEngineeringIntelligence {
  const completed = agents.filter((agent) => agent.status === "completed");
  const failures = agents.filter((agent) => agent.status !== "completed");
  const evidenceById = knownEvidence(context.staticAnalysis);
  const isTraceable = (evidenceIds: string[]): boolean => evidenceIds.length > 0 && evidenceIds.every((id) => evidenceById.has(id));
  const uncitedCount = completed.flatMap((agent) => [...agent.claims.map((claim) => claim.evidenceIds), ...agent.recommendations.map((item) => item.evidenceIds)]).filter((ids) => !isTraceable(ids)).length;
  const claims = completed.flatMap((agent) => agent.claims).filter((claim) => isTraceable(claim.evidenceIds)).filter((claim, index, values) => values.findIndex((item) => item.title === claim.title && item.detail === claim.detail) === index);
  const recommendations = [...new Map(completed.flatMap((agent) => agent.recommendations).filter((item) => isTraceable(item.evidenceIds)).map((item) => [item.id, item])).values()]
    .sort((left, right) => left.priority.localeCompare(right.priority) || left.title.localeCompare(right.title));
  const citedEvidence = uniqueEvidence([...completed.flatMap((agent) => agent.evidence), ...claims.flatMap((claim) => claim.evidenceIds.map((id) => evidenceById.get(id)!)), ...recommendations.flatMap((item) => item.evidenceIds.map((id) => evidenceById.get(id)!))]);
  return {
    authority: "read_only_static_analysis",
    summary: completed.length + " evidence-backed specialist result(s) were fused from one bounded repository analysis" + (failures.length > 0 ? "; " + failures.length + " optional specialist result(s) were unavailable." : "."),
    readiness: context.staticAnalysis.decisionSupport.readiness.items,
    claims, recommendations, evidence: citedEvidence,
    confidence: lowestConfidence(completed.map((agent) => agent.confidence)),
    unknowns: [...new Set(completed.flatMap((agent) => agent.unknowns))],
    limitations: [...new Set(["Evidence fusion cannot create proof, implementation authority, or human approval.", ...(uncitedCount > 0 ? [uncitedCount + " untraceable specialist conclusion(s) were excluded from fusion."] : []), ...completed.flatMap((agent) => agent.limitations), ...failures.map((agent) => agent.kind + ": " + (agent.error ?? "result unavailable"))])],
  };
}

/** Coordinates specialist engineering analysis. Codex reasoning is opt-in and read-only. */
export class EngineeringOrchestrator {
  private readonly analyzeRepository: typeof analyzeLocalRepository;
  private readonly now: () => number;
  private readonly runDeterministicAgent: DeterministicAgentRunner;

  constructor(private readonly options: EngineeringOrchestratorOptions = {}) {
    this.analyzeRepository = options.analyzeRepository ?? analyzeLocalRepository;
    this.now = options.now ?? Date.now;
    this.runDeterministicAgent = options.deterministicAgent ?? deterministicAgent;
  }

  async analyze(repositoryPath: string, vaultPath: string, options: { useCodexReasoning?: boolean } = {}): Promise<EngineeringPipelineRun> {
    const started = this.now();
    const analysis = await this.analyzeRepository(repositoryPath, vaultPath);
    const context: SharedRepositoryContext = { repositoryPath: analysis.repository.path, repositoryCommit: analysis.repository.commit, memoryPack: analysis.memoryPack, staticAnalysis: analysis };
    const deterministic = await Promise.all((["repository", "architecture", "dependency", "business_domain", "security", "testing"] as const).map(async (kind) => {
      const agentStarted = this.now();
      try { return await Promise.resolve(this.runDeterministicAgent(kind, context, this.now)); }
      catch (error) {
        return agentResult({ kind, execution: "deterministic", status: "failed", durationMs: Math.max(0, this.now() - agentStarted), summary: "Deterministic specialist analysis did not complete.", claims: [], recommendations: [], evidence: [], confidence: "low", unknowns: ["No validated result is available from this specialist."], limitations: ["Other specialist results remain available and explicitly retain this gap."], error: error instanceof Error ? error.message : "deterministic_specialist_failed" });
      }
    }));
    const semantic: EngineeringAgentResult[] = [];
    if (options.useCodexReasoning) {
      if (!this.options.codexReasoner) {
        (["codex_architecture", "codex_business_domain"] as const).forEach((kind) => semantic.push(agentResult({ kind, execution: "codex_read_only", status: "skipped", durationMs: 0, summary: "Codex semantic reasoning was requested but no local reasoner was configured.", claims: [], recommendations: [], evidence: [], confidence: "low", unknowns: ["No semantic reasoning result is available."], limitations: ["Deterministic specialist results remain available."], error: "codex_reasoner_not_configured" })));
      } else {
        const results = await Promise.all((["codex_architecture", "codex_business_domain"] as const).map(async (kind) => {
          try { return await this.options.codexReasoner!.run({ kind, context }); }
          catch (error) { return agentResult({ kind, execution: "codex_read_only", status: "failed", durationMs: 0, summary: "Codex semantic reasoning did not produce a validated result.", claims: [], recommendations: [], evidence: [], confidence: "low", unknowns: ["No validated semantic result is available."], limitations: ["Deterministic specialist results remain available."], error: error instanceof Error ? error.message : "codex_reasoning_failed" }); }
        }));
        semantic.push(...results);
      }
    }
    const agents = [...deterministic, ...semantic];
    const fused = fuse(context, agents);
    return {
      id: "RI-" + (analysis.repository.commit ?? "UNANCHORED").slice(0, 12).toUpperCase(),
      repository: { path: analysis.repository.path, commit: analysis.repository.commit, name: analysis.repository.name },
      status: agents.some((agent) => agent.status === "failed") ? "completed_with_agent_failures" : "completed",
      durationMs: Math.max(0, this.now() - started),
      sharedContext: { repositoryPath: context.repositoryPath, repositoryCommit: context.repositoryCommit, memoryPack: context.memoryPack },
      agents, fused, analysis,
    };
  }
}
