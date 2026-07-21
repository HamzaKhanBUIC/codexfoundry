import { Fragment, useEffect, useState } from "react";
import { Badge, Button, Card, CardHeader, Input, Tab, TabList, Text } from "@fluentui/react-components";
import { CheckmarkCircle20Filled, DocumentBulletList20Regular, ShieldCheckmark20Filled, Warning20Regular } from "@fluentui/react-icons";
import staticRun from "virtual:foundry-run";

type View = "story" | "review" | "memory" | "evidence";
type ProductMode = "home" | "sandbox" | "repository";
type Run = typeof staticRun;

interface EvidenceReference { id: string; source: string; observation: string; line?: number; confidence: string }
interface CrossReference { id: string; kind: "evidence" | "finding" | "module" | "task"; label: string; relationship: string }
interface DecisionCardData { whatThisMeans: string; whyItMatters: string; recommendedNextAction: string; confidence: string; evidenceIds: string[]; crossReferences: CrossReference[] }
interface AnalysisSection<T> { items: T; evidence: EvidenceReference[]; confidence: string; reasoning: string[]; crossReferences: CrossReference[]; unknowns: string[]; limitations: string[]; decision: DecisionCardData }
interface Finding { id: string; title: string; detail: string; confidence: string; paths: string[]; evidence: EvidenceReference[]; reasoning?: string[]; crossReferences?: CrossReference[] }
interface LegacyHealthItem { category: string; score: number | null; confidence: string; rationale: string[]; evidence: EvidenceReference[]; limitations: string[] }
interface LegacyTask { priority: string; title: string; problem: string; evidence: EvidenceReference[]; impact: string; estimatedEffort: string; confidence: string; affectedFiles: string[]; risk: string; expectedValue: string }
interface RepositoryAnalysis {
  repository: { path: string; name: string; commit: string | null; dirty: boolean | null; activeBranch: string | null; branches: string[]; tags: string[]; recentCommits: { hash: string; author: string; date: string; subject: string }[] };
  coverage: { scannedFiles: number; sourceFilesRead: number; scanLimited: boolean; sourceLimited: boolean; unreadablePaths: string[] };
  summary: { languages: string[]; frameworks: string[]; packageManagers: string[]; testFrameworks: string[]; ciFiles: string[]; documentation: string[]; fileCount: number; scannedFiles: number; scanLimited: boolean };
  commands: { build: string[]; test: string[]; run: string[] };
  git: AnalysisSection<{ repositoryAgeDays: number | null; totalCommits: number | null; mergeCommitCount: number | null; releaseTags: string[]; releaseCadenceDays: number | null; authors: { name: string; commits: number }[]; recentCommits: { hash: string; author: string; date: string; subject: string }[] }>;
  languages: AnalysisSection<{ name: string; files: number; role: string; evidence: EvidenceReference[] }[]>;
  frameworks: AnalysisSection<{ name: string; evidence: EvidenceReference[]; confidence: string }[]>;
  packageManagers: AnalysisSection<{ name: string; evidence: EvidenceReference[]; confidence: string }[]>;
  entryPoints: AnalysisSection<{ path: string; kind: string; confidence: string; evidence: EvidenceReference[] }[]>;
  dependencies: AnalysisSection<{ production: string[]; development: string[]; scripts: Record<string, string>; externalImports: string[]; unobservedDirectDependencies: string[]; hotspots: { module: string; connections: number; evidence: EvidenceReference[]; reasoning: string; crossReferences: CrossReference[] }[] }>;
  moduleGraph: AnalysisSection<{ modules: { path: string; domain: string; layer: string | null; evidence: EvidenceReference[] }[]; internalEdges: { from: string; to: string; evidence: EvidenceReference }[]; circularDependencies: string[][]; boundaries: { from: string; to: string; connections: number; evidence: EvidenceReference[] }[] }>;
  architecture: AnalysisSection<{ styles: { name: string; confidence: string; evidence: EvidenceReference[] }[]; directories: string[]; riskyDirectories: string[]; generatedDirectories: string[]; largeFiles: string[] }>;
  domains: AnalysisSection<{ name: string; confidence: string; evidence: EvidenceReference[] }[]>;
  buildSystem: AnalysisSection<{ scripts: Record<string, string>; toolchains: string[]; ciFiles: string[]; containerFiles: string[]; buildFiles: string[] }>;
  testSystem: AnalysisSection<{ frameworks: string[]; kinds: { name: string; files: number; evidence: EvidenceReference[] }[]; testFiles: string[]; missing: string[] }>;
  security: AnalysisSection<Finding[]>; codeSmells: AnalysisSection<Finding[]>; technicalDebt: AnalysisSection<Finding[]>;
  complexity: AnalysisSection<{ sourceFiles: number; totalLines: number; averageLinesPerFile: number; largestModules: { path: string; lines: number; complexityIndicators: number; maxNesting: number }[]; longFunctions: Finding[] }>;
  deadCode: AnalysisSection<Finding[]>; todos: AnalysisSection<{ tag: string; priority: string; path: string; line: number; excerpt: string; evidence: EvidenceReference[] }[]>; duplicates: AnalysisSection<Finding[]>;
  // The principal renderer narrows the runtime report object. This historical
  // renderer remains typed for the fixed PAY-17 dashboard bundle.
  health: AnalysisSection<LegacyHealthItem[]>;
  architectureExplorer: AnalysisSection<ArchitectureExplorerData>;
  decisionSupport: unknown;
  memoryPack: { id: string; available: boolean; estimatedTokens: number; tokenBudget: number; confidence: number; selected: { id: string; title: string; reason: string; freshness: string; confidence: number }[]; omitted: { id: string; reason: string }[]; staleKnowledgeExcluded: boolean; evidence: EvidenceReference[]; unknowns: string[]; limitations: string[] };
  suggestions: LegacyTask[];
  trust: { execution: string; verifier: string; vault: string; facts: string; limitation: string };
}

interface EngineeringPipelineAgent {
  id: string;
  kind: string;
  execution: "deterministic" | "codex_read_only";
  status: "completed" | "skipped" | "failed";
  durationMs: number;
  summary: string;
  confidence: string;
  evidence: EvidenceReference[];
  unknowns: string[];
  limitations: string[];
  error?: string;
}

interface EngineeringPipelineRunData {
  id: string;
  status: "completed" | "completed_with_agent_failures";
  durationMs: number;
  agents: EngineeringPipelineAgent[];
  fused: {
    authority: string;
    summary: string;
    confidence: string;
    evidence: EvidenceReference[];
    unknowns: string[];
    limitations: string[];
  };
  analysis: RepositoryAnalysis;
}

interface GenericRunData {
  id: string;
  status: string;
  baselineCommit: string;
  task: { title: string; acceptanceCriteria: string[] };
  policy: { id: string; allowedPaths: string[]; allowedCommands: { id: string; description: string }[] };
  memoryPack: { id: string; available: boolean; selectedIds: string[]; omittedIds: string[]; limitations: string[] };
  events: { stage: string; status: string; authority: string; recordedAt: string; summary: string }[];
  proposedPlan?: { summary: string; rootCauseHypothesis: string; affectedPaths: string[]; commandIds: string[]; proofContract: { assertion: string; commandIds: string[] }[]; risks: string[]; codexReceipt?: CodexReceipt };
  approvedPlan?: { approval: { actor: string; approvedAt: string; reason: string } };
  implementation?: { summary: string; confidence: string; changedPaths: string[]; codexReceipt?: CodexReceipt };
  verification?: { authority: string; passed: boolean; commands: { display: string; exitCode: number | null; timedOut: boolean }[]; failureReason?: string };
  patchApproval?: { actor: string; approvedAt: string; reason: string };
  vaultApproval?: { actor: string; approvedAt: string; reason: string };
  regression?: { status: string };
}

interface CodexReceipt { stage: string; sandbox: string; repositoryPath: string; prompt: string; responseSchema: object; rawOutput: string; promptSha256: string; responseSha256: string; model?: string; replayNote: string }

export function App() {
  const [mode, setMode] = useState<ProductMode>("home");
  const [view, setView] = useState<View>("story");
  const [run, setRun] = useState<Run>(staticRun);
  const [evidenceError, setEvidenceError] = useState<"evidence_contradiction" | "evidence_incomplete" | "evidence_unavailable" | null>(null);
  useEffect(() => {
    void fetch("/api/runs/RUN-PAY-17-001")
      .then(async (response) => {
        if (response.ok) return { run: await response.json() as Run, error: null };
        const body = await response.json().catch(() => null) as { error?: string } | null;
        const error = body?.error;
        const normalizedError: "evidence_contradiction" | "evidence_incomplete" | "evidence_unavailable" =
          error === "evidence_contradiction" ? "evidence_contradiction" :
          error === "evidence_incomplete" ? "evidence_incomplete" : "evidence_unavailable";
        return { run: null, error: normalizedError };
      })
      .then(({ run: loadedRun, error }) => {
        if (loadedRun) setRun(loadedRun);
        if (error) setEvidenceError(error);
      })
      .catch(() => setEvidenceError("evidence_unavailable"));
  }, []);
  if (evidenceError) {
    const contradiction = evidenceError === "evidence_contradiction";
    const incomplete = evidenceError === "evidence_incomplete";
    return <main className="app-shell"><section className="workspace"><header className="topbar"><div><Text className="breadcrumb" size={200}>Run / RUN-PAY-17-001</Text><h1>{contradiction ? "Evidence contradiction" : incomplete ? "Evidence incomplete" : "Evidence unavailable"}</h1></div></header><Card className="panel"><CardHeader header={<Text weight="semibold">Projection blocked</Text>} description={contradiction ? "Foundry found contradictory recorded evidence and refuses to display a guessed proof status." : incomplete ? "Foundry found later-stage evidence without a valid required stage record and refuses to skip the missing gate." : "Foundry could not validate the recorded evidence and refuses to display a proof status."} /></Card></section></main>;
  }
  if (mode === "home") return <Landing onSandbox={() => setMode("sandbox")} onRepository={() => setMode("repository")} />;
  if (mode === "repository") return <RepositoryMode onBack={() => setMode("home")} />;
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">CF</span><span>Codex Foundry</span></div><Text size={200}>Reference Sandbox · PAY-17</Text><Button appearance="subtle" onClick={() => setMode("home")}>Switch mode</Button><div className="sidebar-foot"><Text size={200}>Verifier-owned evidence</Text><Text size={200}>No production authority</Text></div></aside><section className="workspace">
    <header className="topbar"><div><Text className="breadcrumb" size={200}>Run / RUN-PAY-17-001 / {run.schemaVersion}</Text><h1>{run.title}</h1></div><Badge appearance="filled" color="success" icon={<CheckmarkCircle20Filled />}>Independent verification: {run.status}</Badge></header>
    <section className="run-banner"><div className="banner-icon"><ShieldCheckmark20Filled /></div><div><Text weight="semibold">One duplicate-charge defect was repaired, independently proven, and made reusable.</Text><Text block size={300}>The deliberate retry-key regression was later blocked by the unchanged PAY-17 proof.</Text></div></section>
    <TabList selectedValue={view} onTabSelect={(_, data) => setView(data.value as View)} aria-label="Foundry proof views"><Tab value="story">Proof story</Tab><Tab value="review">Review</Tab><Tab value="memory">Memory Pack</Tab><Tab value="evidence">Evidence</Tab></TabList>
    {view === "story" && <Story run={run} />}{view === "review" && <Review run={run} />}{view === "memory" && <Memory run={run} />}{view === "evidence" && <Evidence run={run} />}
  </section></main>;
}

function Landing({ onSandbox, onRepository }: { onSandbox: () => void; onRepository: () => void }) {
  return <main className="landing-shell"><header className="landing-header"><div className="brand"><span className="brand-mark">CF</span><span>Codex Foundry</span></div><Text size={300}>Trustworthy AI-assisted engineering</Text></header><section className="landing-copy"><Text className="breadcrumb" size={200}>Choose a product mode</Text><h1>Proof when you need trust. Context when you need to start.</h1><Text size={400}>Foundry keeps Codex bounded: it either shows a fully verified reference repair or prepares read-only engineering context from a repository you select.</Text></section><section className="mode-grid"><Card className="mode-card sandbox-mode"><CardHeader header={<Text weight="semibold">Reference Sandbox</Text>} description="Recommended for judges · deterministic PAY-17 proof"/><Text size={300}>Inspect the complete, independently verified checkout repair: evidence, approvals, reusable memory, and regression replay.</Text><div className="mode-points"><span>✓ Fixed evidence chain</span><span>✓ Independent verifier proof</span><span>✓ No repository authority</span></div><Button appearance="primary" onClick={onSandbox}>Open PAY-17 proof</Button></Card><Card className="mode-card repository-mode"><CardHeader header={<Text weight="semibold">Analyze Repository</Text>} description="Prepare trusted engineering context from a local Git repository"/><Text size={300}>Foundry derives structure, commands, risks, a bounded Memory Pack, and evidence-backed task suggestions. An explicit option can add read-only Codex semantic reasoning; neither path executes repository code or changes it.</Text><div className="mode-points"><span>✓ Read-only Git and file facts</span><span>✓ Optional read-only Codex reasoning</span><span>✓ No worktree or repository execution</span></div><Button appearance="secondary" onClick={onRepository}>Analyze a repository</Button></Card></section><section className="landing-trust"><ShieldCheckmark20Filled /><Text>In both modes, planner and implementer claims are non-authoritative. Human approvals and the independent verifier remain separate gates.</Text></section></main>;
}

function RepositoryMode({ onBack }: { onBack: () => void }) {
  const [repositoryPath, setRepositoryPath] = useState(""); const [pipeline, setPipeline] = useState<EngineeringPipelineRunData | null>(null); const [genericRunId, setGenericRunId] = useState(""); const [genericRun, setGenericRun] = useState<GenericRunData | null>(null); const [useCodexReasoning, setUseCodexReasoning] = useState(false); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const analyze = () => { if (!repositoryPath.trim()) return; setLoading(true); setError(null); const requestPath = "/api/engineering-pipeline?path=" + encodeURIComponent(repositoryPath.trim()) + "&codex=" + String(useCodexReasoning); void fetch(requestPath).then(async (response) => ({ response, body: await response.json() as EngineeringPipelineRunData | { message?: string } })).then(({ response, body }) => { if (!response.ok) { setPipeline(null); setError("message" in body ? body.message ?? "Repository intelligence failed." : "Repository intelligence failed."); return; } setPipeline(body as EngineeringPipelineRunData); }).catch(() => setError("Foundry could not reach the local read-only API.")).finally(() => setLoading(false)); };
  const loadRun = () => { if (!genericRunId.trim()) return; setError(null); void fetch("/api/generic-runs/" + encodeURIComponent(genericRunId.trim())).then(async (response) => ({ response, body: await response.json() as GenericRunData | { error?: string } })).then(({ response, body }) => { if (!response.ok) { setGenericRun(null); setError("No persisted generic run was found for that identifier."); return; } setGenericRun(body as GenericRunData); }).catch(() => setError("Foundry could not load generic run evidence.")); };
  return <main className="repository-shell"><header className="repository-header"><div><Text className="breadcrumb" size={200}>Repository Intelligence · read-only preparation</Text><h1>Understand the repository before Codex acts.</h1><Text size={300}>Foundry derives evidence-backed local facts. Optional Codex reasoning is explicit, read-only, advisory, and citation-checked. This mode never runs repository scripts, creates a worktree, verifies a patch, approves a plan, or writes the vault.</Text></div><Button appearance="subtle" onClick={onBack}>Back to modes</Button></header><Card className="panel repository-input"><CardHeader header={<Text weight="semibold">Choose local Git repository</Text>} description="Paste an absolute local path. Foundry reads repository files plus read-only Git metadata only."/><div className="repository-input-row"><Input value={repositoryPath} placeholder="C:\\projects\\my-repository" onChange={(_, data) => setRepositoryPath(data.value)} aria-label="Local Git repository path"/><Button appearance="primary" disabled={!repositoryPath.trim() || loading} onClick={analyze}>{loading ? "Analyzing…" : "Run repository intelligence"}</Button></div><label className="codex-opt-in"><input type="checkbox" checked={useCodexReasoning} onChange={(event) => setUseCodexReasoning(event.target.checked)} disabled={loading}/><span><b>Run Codex read-only semantic reasoning</b><small>Uses the local Codex CLI for evidence-cited architecture and domain analysis. It is advisory only and cannot execute repository scripts or modify files.</small></span></label><div className="generic-run-loader"><Input value={genericRunId} placeholder="RUN-EXAMPLE-001" onChange={(_, data) => setGenericRunId(data.value)} aria-label="Persisted generic run identifier"/><Button appearance="secondary" disabled={!genericRunId.trim()} onClick={loadRun}>Load run evidence</Button></div>{error && <Text className="analysis-error" role="alert">{error}</Text>}</Card>{genericRun && <GenericRunPanel run={genericRun}/>} {pipeline && <PrincipalRepositoryReport analysis={pipeline.analysis} pipeline={pipeline} />}</main>;
}

type ReportHealth = {
  categories: { id: string; category: string; score: number | null; confidence: string; scoreExplanation: { label: string; points?: number; evidence: EvidenceReference[] }[]; strengths: string[]; weaknesses: string[]; evidence: EvidenceReference[]; crossReferences: CrossReference[]; unknowns: string[]; limitations: string[] }[];
  overallScore: number | null;
  summary: string;
  topStrengths: string[];
  topWeaknesses: string[];
  biggestEngineeringRisks: string[];
  highestRoiImprovements: string[];
  quickWins: string[];
  longTermInvestments: string[];
};

type PrincipalTask = {
  id: string; rank: number; priority: string; title: string; problemSummary: string; evidence: EvidenceReference[];
  businessImpact: { level: string; explanation: string }; engineeringImpact: { areas: string[]; explanation: string }; developerProductivityImpact: { level: string; explanation: string };
  expectedDeveloperImpact: { areas: string[]; explanation: string }; riskIfIgnored: string;
  estimatedEngineeringEffort: { size: string; rationale: string }; confidence: string; priorityReasoning: string;
  affectedRepositoryAreas: { files: string[]; modules: string[]; packages: string[]; subsystems: string[] };
  dependencies: string[]; expectedOutcome: string; successCriteria: string[]; crossReferences: CrossReference[];
};

type DecisionSupport = {
  repositoryDna: AnalysisSection<{ repositoryName: string; primaryLanguages: string[]; frameworks: string[]; architectureStyles: string[]; businessDomains: string[]; repositorySize: { label: string; files: number; sourceFiles: number; sourceLines: number; reasoning: string }; estimatedMaturity: { label: string; confidence: string; reasoning: string }; currentHealth: { overallScore: number | null; summary: string }; strengths: string[]; weaknesses: string[]; criticalRisks: string[]; valuableOpportunities: { id: string; title: string; priority: string }[]; overallConfidence: string; unknownAreas: string[]; readiness: string }>;
  readiness: AnalysisSection<{ state: string; label: string; confidence: string; recommendation: string; notRecommended: string[]; reasoning: string[]; evidenceIds: string[]; supportingFiles: string[]; unknowns: string[]; riskExplanation: string; primaryLimitation: string; crossReferences: CrossReference[] }>;
  executiveBriefing: AnalysisSection<{ text: string }>;
  repositoryStory: AnalysisSection<{ text: string }>;
};

type ExplorerDependencyData = { specifier: string; target: string; kind: "internal" | "external" | "unresolved_relative"; evidence: EvidenceReference };
type ExplorerExportData = { name: string; kind: string; sourcePath: string; evidence: EvidenceReference };
type ExplorerImpactData = { impactedModules: { path: string; dependencyChain: string[]; distance: number; evidence: EvidenceReference[] }[]; impactedBusinessDomains: { name: string; confidence: string; evidence: EvidenceReference[] }[]; estimatedBlastRadius: { level: string; directDependents: number; transitiveDependents: number; reasoning: string }; riskLevel: string; confidence: string; evidence: EvidenceReference[]; unknowns: string[]; limitations: string[] };
type ExplorerEntityData = { id: string; kind: "file" | "directory"; path: string; moduleType: string; responsibility: { summary: string; businessDomains: string[]; confidence: string; evidence: EvidenceReference[] }; confidence: string; imports: ExplorerDependencyData[]; exportedSymbols: ExplorerExportData[]; incomingDependencies: ExplorerDependencyData[]; outgoingDependencies: ExplorerDependencyData[]; relatedRisks: Finding[]; relatedRecommendations: { id: string; title: string; priority: string; confidence: string; reason: string; evidence: EvidenceReference[]; crossReferences: CrossReference[] }[]; changeImpact: ExplorerImpactData; evidence: EvidenceReference[]; crossReferences: CrossReference[]; unknowns: string[]; limitations: string[] };
type ArchitectureExplorerData = { entities: ExplorerEntityData[]; totalFiles: number; totalDirectories: number };

function uniqueBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function CrossReferenceList({ items, empty = "No related repository fact was derived." }: { items: CrossReference[]; empty?: string }) {
  const uniqueItems = uniqueBy(items, (item) => `${item.kind}\u0000${item.id}\u0000${item.label}\u0000${item.relationship}`);
  return uniqueItems.length > 0 ? <ul className="cross-reference-list">{uniqueItems.map((item) => <li key={`${item.kind}-${item.id}-${item.label}-${item.relationship}`}><code>{item.kind}:{item.label}</code> — {item.relationship}</li>)}</ul> : <Text size={300}>{empty}</Text>;
}

function DecisionCard({ decision }: { decision: DecisionCardData }) {
  return <section className="section-decision"><Text weight="semibold">Decision support</Text><Text size={300}><b>What this means</b> · {decision.whatThisMeans}</Text><Text size={300}><b>Why it matters</b> · {decision.whyItMatters}</Text><Text size={300}><b>Recommended next action</b> · {decision.recommendedNextAction}</Text><Text size={300}><b>Confidence</b> · {decision.confidence}</Text><Text size={300}><b>Evidence IDs</b> · {decision.evidenceIds.join(", ") || "UNKNOWN"}</Text><CrossReferenceList items={decision.crossReferences}/></section>;
}

function PrincipalTaskCard({ task }: { task: PrincipalTask }) {
  const affected = [
    ...task.affectedRepositoryAreas.files.map((item) => `file · ${item}`),
    ...task.affectedRepositoryAreas.modules.map((item) => `module · ${item}`),
    ...task.affectedRepositoryAreas.packages.map((item) => `package · ${item}`),
    ...task.affectedRepositoryAreas.subsystems.map((item) => `subsystem · ${item}`),
  ];
  return <details className="principal-task">
    <summary><strong>#{task.rank} · {task.priority} · {task.title}</strong><span>{task.confidence} confidence</span></summary>
    <div className="principal-task-body">
      <Text size={300}><b>Problem</b> · {task.problemSummary}</Text>
      <Text size={300}><b>Business impact</b> · {task.businessImpact.level}. {task.businessImpact.explanation}</Text>
      <Text size={300}><b>Engineering impact</b> · {task.engineeringImpact.areas.join(", ") || "UNKNOWN"}. {task.engineeringImpact.explanation}</Text>
      <Text size={300}><b>Developer productivity impact</b> · {task.developerProductivityImpact.level}. {task.developerProductivityImpact.explanation}</Text>
      <Text size={300}><b>Risk if ignored</b> · {task.riskIfIgnored}</Text>
      <Text size={300}><b>Estimated effort</b> · {task.estimatedEngineeringEffort.size}. {task.estimatedEngineeringEffort.rationale}</Text>
      <Text size={300}><b>Priority reasoning</b> · {task.priorityReasoning}</Text>
      <Text size={300}><b>Expected outcome</b> · {task.expectedOutcome}</Text>
      <Text weight="semibold">Success criteria</Text><ValueList values={task.successCriteria}/>
      <Text weight="semibold">Affected repository areas</Text><ValueList values={affected}/>
      <Text weight="semibold">Task dependencies</Text><ValueList values={task.dependencies} empty="No prerequisite backlog item was identified from static evidence."/>
      <Text weight="semibold">Supporting evidence</Text><EvidenceList evidence={task.evidence}/>
      <Text weight="semibold">Cross-references</Text><CrossReferenceList items={task.crossReferences}/>
    </div>
  </details>;
}

function ExplorerDependencyList({ items, onSelectPath, empty }: { items: ExplorerDependencyData[]; onSelectPath: (path: string) => void; empty: string }) {
  return items.length > 0 ? <ul className="explorer-list">{items.map((item, index) => <li key={`${item.kind}-${item.specifier}-${item.target}-${index}`}><span className={`explorer-kind ${item.kind}`}>{item.kind.replace("_", " ")}</span>{item.kind === "internal" ? <button type="button" className="explorer-link" onClick={() => onSelectPath(item.target)}><code>{item.target}</code></button> : <code>{item.target}</code>}<small><code>{item.specifier}</code> · {item.evidence.source}:{item.evidence.line ?? "?"}</small></li>)}</ul> : <Text size={300}>{empty}</Text>;
}

function ArchitectureExplorerPanel({ explorer }: { explorer: AnalysisSection<ArchitectureExplorerData> }) {
  const [selectedId, setSelectedId] = useState(() => explorer.items.entities.find((entity) => entity.kind === "file")?.id ?? explorer.items.entities[0]?.id ?? "");
  useEffect(() => { if (!explorer.items.entities.some((entity) => entity.id === selectedId)) setSelectedId(explorer.items.entities.find((entity) => entity.kind === "file")?.id ?? explorer.items.entities[0]?.id ?? ""); }, [explorer.items.entities, selectedId]);
  const selected = explorer.items.entities.find((entity) => entity.id === selectedId);
  const selectPath = (entityPath: string) => {
    const entity = explorer.items.entities.find((candidate) => candidate.kind === "file" && candidate.path === entityPath) ?? explorer.items.entities.find((candidate) => candidate.path === entityPath);
    if (entity) setSelectedId(entity.id);
  };
  if (!selected) return <Text size={300}>No bounded source entity is available for inspection.</Text>;
  const insight: EvidenceBacked = { evidence: selected.evidence, confidence: selected.confidence, reasoning: [selected.responsibility.summary, selected.changeImpact.estimatedBlastRadius.reasoning], crossReferences: selected.crossReferences, unknowns: selected.unknowns, limitations: selected.limitations };
  return <section className="architecture-explorer" aria-label="Architecture Explorer">
    <div className="explorer-toolbar"><div><Text weight="semibold">Inspect a source file or directory</Text><Text block size={300}>{explorer.items.totalFiles} source files · {explorer.items.totalDirectories} source directories · no code executed</Text></div><label className="explorer-select-label" htmlFor="architecture-entity">Entity<select id="architecture-entity" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{explorer.items.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.kind === "directory" ? "Directory · " : "File · "}{entity.path}</option>)}</select></label></div>
    <div className="explorer-inspector">
      <section className="explorer-identity"><Text className="breadcrumb" size={200}>{selected.kind} · {selected.confidence} confidence</Text><h3><code>{selected.path}</code></h3><div className="analysis-facts"><span><b>Module type</b>{selected.moduleType}</span><span><b>Business domain</b>{selected.responsibility.businessDomains.join(", ") || "UNKNOWN"}</span><span><b>Impact risk</b>{selected.changeImpact.riskLevel}</span><span><b>Blast radius</b>{selected.changeImpact.estimatedBlastRadius.level}</span></div><Text size={300}><b>Responsibility</b> · {selected.responsibility.summary}</Text><EvidenceList evidence={selected.responsibility.evidence}/></section>
      <section className="explorer-section"><h4>Imports</h4><ExplorerDependencyList items={selected.imports} onSelectPath={selectPath} empty="No supported static import was observed."/></section>
      <section className="explorer-section"><h4>Exported symbols</h4>{selected.exportedSymbols.length > 0 ? <ul className="explorer-list">{selected.exportedSymbols.map((item) => <li key={`${item.sourcePath}-${item.name}-${item.evidence.line}`}><span className="explorer-kind export">{item.kind}</span><code>{item.name}</code><small>{item.sourcePath}:{item.evidence.line ?? "?"}</small></li>)}</ul> : <Text size={300}>UNKNOWN — no supported TypeScript or JavaScript static export declaration was found.</Text>}</section>
      <section className="explorer-section explorer-dependency-columns"><div><h4>Incoming dependencies</h4><ExplorerDependencyList items={selected.incomingDependencies} onSelectPath={selectPath} empty="No direct resolved static dependent was observed."/></div><div><h4>Outgoing dependencies</h4><ExplorerDependencyList items={selected.outgoingDependencies} onSelectPath={selectPath} empty="No direct resolved static dependency was observed."/></div></section>
      <section className="explorer-section"><h4>AI change impact prediction</h4><div className="impact-summary"><span><b>{selected.changeImpact.estimatedBlastRadius.level}</b> static blast radius</span><span>{selected.changeImpact.estimatedBlastRadius.directDependents} direct · {selected.changeImpact.estimatedBlastRadius.transitiveDependents} transitive dependents</span><span>{selected.changeImpact.confidence} confidence · risk {selected.changeImpact.riskLevel}</span></div><Text size={300}>{selected.changeImpact.estimatedBlastRadius.reasoning}</Text><Text weight="semibold">Potentially impacted modules</Text>{selected.changeImpact.impactedModules.length > 0 ? <ul className="explorer-list">{selected.changeImpact.impactedModules.map((item) => <li key={item.path}><button type="button" className="explorer-link" onClick={() => selectPath(item.path)}><code>{item.path}</code></button><small>{item.dependencyChain.join(" → ")} · {item.distance} static hop{item.distance === 1 ? "" : "s"}</small></li>)}</ul> : <Text size={300}>No inbound supported static relative import was observed. Runtime impact is UNKNOWN.</Text>}<Text weight="semibold">Potentially impacted business domains</Text><ValueList values={selected.changeImpact.impactedBusinessDomains.map((domain) => `${domain.name} · ${domain.confidence}`)} empty="UNKNOWN — no impacted domain met the path-vocabulary evidence threshold."/><Text weight="semibold">Unknown assumptions</Text><ValueList values={selected.changeImpact.unknowns}/></section>
      <section className="explorer-section"><h4>Related risks</h4><FindingList findings={selected.relatedRisks} empty="No repository-derived risk is directly attached to this entity."/></section>
      <section className="explorer-section"><h4>Related engineering recommendations</h4>{selected.relatedRecommendations.length > 0 ? <div className="finding-list">{selected.relatedRecommendations.map((item) => <details className="finding" key={item.id}><summary><strong>{item.priority} · {item.title}</strong><span>{item.confidence} confidence</span></summary><Text size={300}>{item.reason}</Text><EvidenceList evidence={item.evidence}/><CrossReferenceList items={item.crossReferences}/></details>)}</div> : <Text size={300}>No existing evidence-backed recommendation is scoped directly to this entity.</Text>}</section>
      <EvidenceDisclosure insight={insight}/>
    </div>
  </section>;
}

function GenericRunBoundaries({ run }: { run: GenericRunData }) {
  const plan = run.proposedPlan;
  const planApproved = Boolean(run.approvedPlan);
  return <section className="generic-boundaries" aria-label="Bounded plan and policy">
    <div className="generic-boundaries-header"><div><Text weight="semibold">Bounded plan &amp; guardrails</Text><Text block size={300}>This is the scope Foundry gave Codex—not verifier proof or permission to merge.</Text></div><span className={`generic-plan-state ${planApproved ? "approved" : "pending"}`}>{planApproved ? "HUMAN-APPROVED PLAN" : plan ? "CODEX PROPOSAL — AWAITING HUMAN APPROVAL" : "NO PLAN RECORDED"}</span></div>
    <div className="generic-boundary-grid">
      <section><Text weight="semibold">Policy ceiling</Text><Text size={300}>Pinned baseline <code>{run.baselineCommit.slice(0, 12)}</code> · policy <code>{run.policy.id}</code></Text><Text size={300}>Only these paths and direct commands are permitted by the human-supplied policy.</Text><ValueList values={run.policy.allowedPaths.map((item) => `path · ${item}`)} empty="No permitted paths were recorded."/><ValueList values={run.policy.allowedCommands.map((item) => `command · ${item.id} — ${item.description}`)} empty="No permitted commands were recorded."/></section>
      <section><Text weight="semibold">Memory Pack input</Text><Text size={300}><code>{run.memoryPack.id}</code> · {run.memoryPack.available ? "available" : "unavailable"}</Text><ValueList values={run.memoryPack.selectedIds.map((item) => `included · ${item}`)} empty="No reusable vault note was selected."/><ValueList values={run.memoryPack.limitations} empty="No additional Memory Pack limitation was recorded."/></section>
      <section><Text weight="semibold">Task contract</Text><ValueList values={run.task.acceptanceCriteria.map((item) => `acceptance · ${item}`)} empty="No acceptance criterion was recorded."/>{plan ? <><Text size={300}><b>Codex proposal</b> · {plan.summary}</Text><Text size={300}><b>Hypothesis</b> · {plan.rootCauseHypothesis}</Text><Text weight="semibold">Proposed change scope</Text><ValueList values={plan.affectedPaths.map((item) => `path · ${item}`)} empty="No proposed path was recorded."/><Text weight="semibold">Selected proof commands</Text><ValueList values={plan.commandIds.map((item) => `command · ${item}`)} empty="No proof command was selected."/><Text weight="semibold">Proof contract</Text><ValueList values={plan.proofContract.map((item) => `${item.assertion} · via ${item.commandIds.join(", ")}`)} empty="No proof contract was recorded."/><Text weight="semibold">Known risks</Text><ValueList values={plan.risks} empty="No risk was declared by the planner."/></> : <Text size={300}>Foundry has not recorded a Codex plan for this run. Implementation must remain blocked.</Text>}</section>
    </div>
  </section>;
}

function GenericRunPanel({ run }: { run: GenericRunData }) {
  const approvals = [run.approvedPlan?.approval && "Plan approved by " + run.approvedPlan.approval.actor, run.patchApproval && "Patch approved by " + run.patchApproval.actor, run.vaultApproval && "Vault write approved by " + run.vaultApproval.actor].filter((item): item is string => Boolean(item));
  const receipts = [run.proposedPlan?.codexReceipt, run.implementation?.codexReceipt].filter((item): item is CodexReceipt => Boolean(item));
  return <section className="pipeline-section" aria-label="Generic run evidence"><Card className="panel generic-run-card"><CardHeader header={<Text weight="semibold">Persisted Generic Run Evidence</Text>} description={`${run.id} · ${run.status.replaceAll("_", " ")} · ${run.baselineCommit.slice(0, 12)}`}/><div className="pipeline-authority"><ShieldCheckmark20Filled/><div><strong>RECORDED STAGES, NOT LIVE CONTROL</strong><span>This read-only view cannot approve, implement, verify, merge, deploy, or write a vault.</span></div></div><div className="pipeline-summary"><Text size={300}><b>Task</b> · {run.task.title}</Text><Text size={300}><b>Acceptance criteria</b> · {run.task.acceptanceCriteria.join(" | ")}</Text><Text size={300}><b>Human gates</b> · {approvals.join(" · ") || "No human approval recorded yet."}</Text>{run.implementation && <Text size={300}><b>Codex claim (non-authoritative)</b> · {run.implementation.summary} · {run.implementation.confidence} confidence</Text>}{run.verification && <Text size={300}><b>Independent verifier</b> · {run.verification.passed ? "passed" : "failed"} · {run.verification.authority}</Text>}{run.regression && <Text size={300}><b>Regression replay</b> · {run.regression.status}</Text>}</div><GenericRunBoundaries run={run}/><div className="pipeline-stages">{run.events.map((event, index) => <details className={`pipeline-stage ${event.status === "failed" ? "failed" : "completed"}`} key={`${event.stage}-${index}`}><summary><span className={`pipeline-stage-status ${event.status === "failed" ? "failed" : "completed"}`}>{event.status === "failed" ? "!" : "✓"}</span><span><strong>{event.stage.replaceAll("_", " ")}</strong><small>{event.authority.replaceAll("_", " ")} · {event.recordedAt}</small></span><span className="pipeline-evidence-count">{event.status.replaceAll("_", " ")}</span></summary><div className="pipeline-stage-body"><Text size={300}>{event.summary}</Text></div></details>)}</div>{receipts.length > 0 && <div className="pipeline-fusion"><Text weight="semibold">Exact Codex stage receipts</Text><Text size={300}>Stored bounded inputs and structured outputs are auditable. They are not model reasoning or verifier proof.</Text>{receipts.map((receipt) => <details className="codex-receipt" key={receipt.stage}><summary><strong>{receipt.stage}</strong><span>{receipt.sandbox} · prompt {receipt.promptSha256.slice(0, 12)} · output {receipt.responseSha256.slice(0, 12)}</span></summary><Text size={300}>{receipt.replayNote}</Text><Text weight="semibold">Exact prompt received by Codex</Text><pre>{receipt.prompt}</pre><Text weight="semibold">Response schema</Text><pre>{JSON.stringify(receipt.responseSchema, null, 2)}</pre><Text weight="semibold">Exact structured output produced by Codex</Text><pre>{receipt.rawOutput}</pre></details>)}</div>}{run.verification && <div className="pipeline-fusion"><Text weight="semibold">Authoritative verifier commands</Text><ValueList values={run.verification.commands.map((command) => command.display + " → " + (command.timedOut ? "timeout" : "exit " + command.exitCode))} empty={run.verification.failureReason ?? "No verifier command output recorded."}/></div>}</Card></section>;
}

function EngineeringPipelinePanel({ pipeline }: { pipeline: EngineeringPipelineRunData }) {
  const completedAgents = pipeline.agents.filter((agent) => agent.status === "completed").length;
  return <section className="pipeline-section" aria-label="Repository intelligence pipeline">
    <Card className="panel pipeline-card">
      <CardHeader header={<Text weight="semibold">Engineering Intelligence Pipeline</Text>} description={`Run ${pipeline.id} · ${pipeline.status.replaceAll("_", " ")} · ${pipeline.durationMs}ms`}/>
      <div className="pipeline-authority"><ShieldCheckmark20Filled /><div><strong>READ-ONLY, NON-AUTHORITATIVE CONTEXT</strong><span>{pipeline.fused.authority.replaceAll("_", " ")} · {pipeline.fused.confidence} confidence</span></div></div>
      <div className="judge-flow" aria-label="Thirty-second workflow summary"><span><b>1</b> Read evidence</span><span><b>2</b> Human approves a bounded plan</span><span><b>3</b> Codex works in a disposable candidate</span><span><b>4</b> Independent verifier decides proof</span></div>
      <div className="pipeline-summary"><Text size={300}>{pipeline.fused.summary}</Text><Text size={300}><b>What remains</b> · A human must separately approve a bounded plan before any implementation path can exist. This run grants no planning, worktree, implementation, verification, approval, or vault-write authority.</Text></div>
      <div className="pipeline-stages">{pipeline.agents.map((agent) => <details className={`pipeline-stage ${agent.status}`} key={agent.id}><summary><span className={`pipeline-stage-status ${agent.status}`}>{agent.status === "completed" ? "✓" : agent.status === "failed" ? "!" : "—"}</span><span><strong>{agent.kind.replaceAll("_", " ")}</strong><small>{agent.execution === "codex_read_only" ? "Codex · read-only advisory" : "Deterministic analysis"} · {agent.confidence} confidence · {agent.durationMs}ms</small></span><span className="pipeline-evidence-count">{agent.evidence.length} evidence</span></summary><div className="pipeline-stage-body"><Text size={300}>{agent.summary}</Text>{agent.error && <Text className="analysis-error" size={300}>{agent.error}</Text>}<Text weight="semibold">Evidence</Text><EvidenceList evidence={agent.evidence}/><Text weight="semibold">Unknowns</Text><ValueList values={agent.unknowns} empty="None reported by this specialist."/><Text weight="semibold">Limitations</Text><ValueList values={agent.limitations}/></div></details>)}</div>
      <div className="pipeline-fusion"><Text weight="semibold">Evidence fusion</Text><Text size={300}>{completedAgents} of {pipeline.agents.length} specialist results completed. Only cited evidence and explicit limitations are retained.</Text><EvidenceList evidence={pipeline.fused.evidence}/><ValueList values={pipeline.fused.unknowns} empty="No additional fusion-level unknowns."/><ValueList values={pipeline.fused.limitations}/></div>
    </Card>
  </section>;
}

function PrincipalRepositoryReport({ analysis, pipeline }: { analysis: RepositoryAnalysis; pipeline: EngineeringPipelineRunData }) {
  const health = analysis.health.items as unknown as ReportHealth;
  const tasks = uniqueBy(analysis.suggestions as unknown as PrincipalTask[], (task) => task.id);
  const decisionSupport = analysis.decisionSupport as DecisionSupport;
  const dna = decisionSupport.repositoryDna.items;
  const readiness = decisionSupport.readiness.items;
  const memoryInsight: EvidenceBacked = { evidence: analysis.memoryPack.evidence, confidence: String(analysis.memoryPack.confidence), reasoning: [analysis.memoryPack.available ? "The pack is commit-aware and compiled from existing vault knowledge." : "No readable commit was available, so the Memory Pack was withheld."], crossReferences: analysis.memoryPack.evidence.map((item) => ({ id: item.id, kind: "evidence", label: item.source, relationship: "Memory Pack provenance." })), unknowns: analysis.memoryPack.unknowns, limitations: analysis.memoryPack.limitations, decision: { whatThisMeans: "Only existing commit-aware vault knowledge is available as read-only context.", whyItMatters: "Bounded planning should avoid stale or unverified memory.", recommendedNextAction: "Use only the listed fresh sources if a human later approves planning.", confidence: String(analysis.memoryPack.confidence), evidenceIds: analysis.memoryPack.evidence.map((item) => item.id), crossReferences: analysis.memoryPack.evidence.map((item) => ({ id: item.id, kind: "evidence", label: item.source, relationship: "Memory Pack provenance." })) } };
  const backlogInsight: EvidenceBacked = { evidence: tasks.flatMap((task) => task.evidence), confidence: tasks.length > 0 ? "evidence-backed" : "unknown", reasoning: ["Tasks are ranked by observed urgency, confidence, and affected scope. They do not grant implementation authority."], crossReferences: tasks.map((task) => ({ id: task.id, kind: "task", label: task.title, relationship: `Ranked backlog item #${task.rank}.` })), unknowns: tasks.length === 0 ? ["No task met the bounded evidence threshold."] : [], limitations: ["Recommendations are engineering context, not plans, approvals, or authorization to modify this repository."], decision: { whatThisMeans: "The recommendations are a deterministic ordering of evidence-backed engineering opportunities.", whyItMatters: "A human can prioritize discovery without treating the list as permission for Codex to change code.", recommendedNextAction: "Select one recommendation, retain its evidence and unknowns, then use the separate human-approved planning workflow.", confidence: tasks.length > 0 ? "medium" : "low", evidenceIds: tasks.flatMap((task) => task.evidence.map((item) => item.id)), crossReferences: tasks.map((task) => ({ id: task.id, kind: "task", label: task.title, relationship: `Ranked recommendation #${task.rank}.` })) } };
  const commit = analysis.repository.commit?.slice(0, 7) ?? "UNKNOWN";
  const healthInsight: EvidenceBacked = { evidence: analysis.health.evidence, confidence: analysis.health.confidence, reasoning: [health.summary], crossReferences: analysis.health.crossReferences, unknowns: analysis.health.unknowns, limitations: analysis.health.limitations };
  return <div className="analysis-report">
    <EngineeringPipelinePanel pipeline={pipeline}/>
    <section className="engineering-decision-dashboard" aria-label="Repository engineering decision">
      <Card className="panel readiness-card">
        <CardHeader header={<Text weight="semibold">Repository Readiness Assessment</Text>} description="Decision support for bounded AI planning only; it never authorizes execution or code changes."/>
        <div className={`readiness-state ${readiness.state}`}><strong>{readiness.label}</strong><span>{readiness.confidence} confidence</span></div>
        <div className="readiness-body"><Text size={300}><b>Reason</b> · {readiness.reasoning.join(" ")}</Text><Text size={300}><b>Primary limitation</b> · {readiness.primaryLimitation}</Text><Text size={300}><b>Risk explanation</b> · {readiness.riskExplanation}</Text><Text size={300}><b>Recommended next step</b> · {readiness.recommendation}</Text><Text weight="semibold">Not recommended by this advisory</Text><ValueList values={readiness.notRecommended}/><Text weight="semibold">Supporting files</Text><ValueList values={readiness.supportingFiles}/><Text weight="semibold">Evidence IDs</Text><ValueList values={readiness.evidenceIds}/><Text weight="semibold">Unknowns</Text><ValueList values={readiness.unknowns}/><Text weight="semibold">Related evidence</Text><CrossReferenceList items={readiness.crossReferences}/></div>
        <DecisionCard decision={decisionSupport.readiness.decision}/>
      </Card>
      <Card className="panel dna-card">
        <CardHeader header={<Text weight="semibold">Repository DNA</Text>} description="The repository's evidence-backed engineering identity at a glance."/>
        <div className="dna-grid"><span><b>Repository</b>{dna.repositoryName}</span><span><b>Languages</b>{dna.primaryLanguages.join(", ") || "UNKNOWN"}</span><span><b>Frameworks</b>{dna.frameworks.join(", ") || "UNKNOWN"}</span><span><b>Architecture</b>{dna.architectureStyles.join(", ") || "UNKNOWN"}</span><span><b>Domains</b>{dna.businessDomains.join(", ") || "UNKNOWN"}</span><span><b>Size</b>{dna.repositorySize.label} · {dna.repositorySize.sourceLines} source lines</span><span><b>Estimated maturity</b>{dna.estimatedMaturity.label} · {dna.estimatedMaturity.confidence} confidence</span><span><b>Static health</b>{dna.currentHealth.overallScore ?? "WITHHELD"}</span><span><b>Overall confidence</b>{dna.overallConfidence}</span><span><b>Readiness</b>{dna.readiness}</span></div>
        <div className="dna-columns"><div><Text weight="semibold">Strengths</Text><ValueList values={dna.strengths}/><Text weight="semibold">Weaknesses</Text><ValueList values={dna.weaknesses}/></div><div><Text weight="semibold">Critical risks</Text><ValueList values={dna.criticalRisks}/><Text weight="semibold">Most valuable opportunities</Text><ValueList values={dna.valuableOpportunities.map((item) => `${item.priority} · ${item.title}`)}/><Text weight="semibold">Unknown areas</Text><ValueList values={dna.unknownAreas}/></div></div>
        <DecisionCard decision={decisionSupport.repositoryDna.decision}/>
      </Card>
      <Card className="panel executive-card"><CardHeader header={<Text weight="semibold">Engineering Executive Summary</Text>} description={`${decisionSupport.executiveBriefing.confidence} confidence · deterministic, evidence-backed briefing`}/><Text size={300}>{decisionSupport.executiveBriefing.items.text}</Text><DecisionCard decision={decisionSupport.executiveBriefing.decision}/></Card>
      <Card className="panel story-card"><CardHeader header={<Text weight="semibold">Repository Story</Text>} description="A concise engineering narrative from bounded static facts."/><Text size={300}>{decisionSupport.repositoryStory.items.text}</Text><DecisionCard decision={decisionSupport.repositoryStory.decision}/></Card>
    </section>
    <section className="analysis-summary">
      <Card className="panel"><CardHeader header={<Text weight="semibold">Repository overview</Text>} description={`${analysis.repository.name} · ${commit} · ${analysis.repository.dirty === null ? "working tree UNKNOWN" : analysis.repository.dirty ? "working tree has changes" : "working tree clean"}`}/><div className="analysis-facts"><span><b>Languages</b>{analysis.summary.languages.join(", ") || "UNKNOWN"}</span><span><b>Frameworks</b>{analysis.summary.frameworks.join(", ") || "UNKNOWN"}</span><span><b>Files scanned</b>{analysis.coverage.scannedFiles}{analysis.coverage.scanLimited ? " · cap reached" : ""}</span><span><b>Source files read</b>{analysis.coverage.sourceFilesRead}{analysis.coverage.sourceLimited ? " · cap reached" : ""}</span></div></Card>
      <Card className="panel trust-card"><CardHeader header={<Text weight="semibold">Trust boundary</Text>} /><Text weight="semibold">READ-ONLY ANALYSIS</Text><Text size={300}>{analysis.trust.limitation}</Text></Card>
    </section>
    <section className="analysis-grid intelligence-grid">
      <InsightPanel title="Engineering report card" description={health.summary} insight={healthInsight}>
        <div className="report-card-total"><strong>{health.overallScore ?? "WITHHELD"}</strong><span>{health.overallScore === null ? "Overall score withheld due to bounded evidence." : "Evidence-backed static report card"}</span></div>
        <div className="health-grid">{health.categories.map((category) => <details key={category.id} className="health-category"><summary><strong>{category.score ?? "UNKNOWN"}</strong><span>{category.category}</span><small>{category.confidence} confidence</small></summary><div><Text weight="semibold">Score explanation</Text>{category.scoreExplanation.map((criterion) => <Text block size={300} key={criterion.label}>{criterion.points ?? 0} pts · {criterion.label}</Text>)}<Text weight="semibold">Strengths</Text><ValueList values={category.strengths}/><Text weight="semibold">Weaknesses</Text><ValueList values={category.weaknesses}/><Text weight="semibold">Evidence</Text><EvidenceList evidence={category.evidence}/><Text weight="semibold">Cross-references</Text><CrossReferenceList items={category.crossReferences}/><Text weight="semibold">Unknowns</Text><ValueList values={category.unknowns}/><Text weight="semibold">Limitations</Text><ValueList values={category.limitations}/></div></details>)}</div>
        <div className="report-story"><Text weight="semibold">Top strengths</Text><ValueList values={health.topStrengths}/><Text weight="semibold">Top weaknesses</Text><ValueList values={health.topWeaknesses}/><Text weight="semibold">Biggest engineering risks</Text><ValueList values={health.biggestEngineeringRisks}/><Text weight="semibold">Highest ROI improvements</Text><ValueList values={health.highestRoiImprovements}/><Text weight="semibold">Quick wins</Text><ValueList values={health.quickWins}/><Text weight="semibold">Long-term investments</Text><ValueList values={health.longTermInvestments}/></div>
      </InsightPanel>
      <InsightPanel title="Principal Engineer Recommendations" description="Actionable, explainable starting points—not approved implementation work." insight={backlogInsight}><div className="principal-task-list">{tasks.map((task) => <PrincipalTaskCard task={task} key={task.id}/>)}</div></InsightPanel>
      <InsightPanel title="Architecture & modules" description="Architecture is inferred only from evidence; static graph conclusions expose their source edges." insight={analysis.architecture}><Text weight="semibold">Observed styles</Text><ValueList values={analysis.architecture.items.styles.map((item) => `${item.name} · ${item.confidence}`)} empty="UNKNOWN — no supported architecture marker crossed the evidence threshold."/><Text weight="semibold">Module graph</Text><div className="analysis-facts"><span><b>Modules</b>{analysis.moduleGraph.items.modules.length}</span><span><b>Static edges</b>{analysis.moduleGraph.items.internalEdges.length}</span><span><b>Cycles</b>{analysis.moduleGraph.items.circularDependencies.length}</span><span><b>Boundaries</b>{analysis.moduleGraph.items.boundaries.length}</span></div><ValueList values={analysis.moduleGraph.items.circularDependencies.map((cycle) => cycle.join(" → "))} empty="No supported static cycle was resolved."/><Text weight="semibold">Business domains</Text><ValueList values={analysis.domains.items.map((item) => `${item.name} · ${item.confidence}`)} empty="UNKNOWN — no domain met the evidence threshold."/><EvidenceDisclosure insight={analysis.moduleGraph}/></InsightPanel>
      <InsightPanel title="Architecture Explorer" description="Select a source file or source directory to inspect only its evidence-backed static relationships and potential change impact." insight={analysis.architectureExplorer}><ArchitectureExplorerPanel explorer={analysis.architectureExplorer}/></InsightPanel>
      <InsightPanel title="Entrypoints & dependencies" description="Entrypoint and dependency facts are static; no source execution or dependency installation occurs." insight={analysis.dependencies}><div className="finding-list">{analysis.entryPoints.items.map((entry) => <details className="finding" key={entry.path}><summary><strong><code>{entry.path}</code></strong><span>{entry.confidence}</span></summary><Text size={300}>{entry.kind}</Text><EvidenceList evidence={entry.evidence}/></details>)}</div><Text weight="semibold">Dependency hotspots</Text>{analysis.dependencies.items.hotspots.map((hotspot) => <details className="finding" key={hotspot.module}><summary><strong><code>{hotspot.module}</code></strong><span>{hotspot.connections} links</span></summary><Text size={300}>{hotspot.reasoning}</Text><EvidenceList evidence={hotspot.evidence}/><CrossReferenceList items={hotspot.crossReferences}/></details>)}<Text weight="semibold">Unobserved declared dependencies</Text><ValueList values={analysis.dependencies.items.unobservedDirectDependencies} empty="None — or no direct dependencies were declared."/></InsightPanel>
      <InsightPanel title="Build, test & documentation" description="Repository commands are read from metadata only; their behavior remains unverified in this mode." insight={analysis.buildSystem}><Text weight="semibold">Build commands</Text><ValueList values={analysis.commands.build}/><Text weight="semibold">Test commands</Text><ValueList values={analysis.commands.test}/><Text weight="semibold">Test conventions</Text><ValueList values={analysis.testSystem.items.kinds.map((item) => `${item.name} · ${item.files} paths`)}/><Text weight="semibold">Documentation paths</Text><ValueList values={analysis.summary.documentation}/><EvidenceDisclosure insight={analysis.testSystem}/></InsightPanel>
      <InsightPanel title="Risks, debt & maintainability" description="Signals remain review prompts, not vulnerability or deletion claims." insight={analysis.security}><Text weight="semibold">Security review signals</Text><FindingList findings={analysis.security.items} empty="No supported static security review signal was found."/><Text weight="semibold">Code smells</Text><FindingList findings={analysis.codeSmells.items} empty="No configured static smell threshold was crossed."/><Text weight="semibold">Technical debt</Text><FindingList findings={analysis.technicalDebt.items} empty="No explicit debt marker was found."/><Text weight="semibold">Dead-code candidates</Text><FindingList findings={analysis.deadCode.items} empty="No low-confidence candidate was found."/><Text weight="semibold">Duplicate code</Text><FindingList findings={analysis.duplicates.items} empty="No exact normalized duplicate block was found."/></InsightPanel>
      <InsightPanel title="Complexity & markers" description="Textual metrics and comment markers are bounded heuristics with direct locations." insight={analysis.complexity}><div className="analysis-facts"><span><b>Total lines</b>{analysis.complexity.items.totalLines}</span><span><b>Average / file</b>{analysis.complexity.items.averageLinesPerFile}</span><span><b>Source files</b>{analysis.complexity.items.sourceFiles}</span><span><b>Largest modules</b>{analysis.complexity.items.largestModules.length}</span></div><FindingList findings={analysis.complexity.items.longFunctions} empty="No long function-like block crossed the static threshold."/><div className="finding-list">{analysis.todos.items.map((todo) => <details className="finding" key={`${todo.path}:${todo.line}`}><summary><strong>{todo.tag} · <code>{todo.path}:{todo.line}</code></strong><span>{todo.priority}</span></summary><Text size={300}>{todo.excerpt}</Text><EvidenceList evidence={todo.evidence}/></details>)}</div></InsightPanel>
      <InsightPanel title="Bounded Memory Pack" description={analysis.memoryPack.available ? `${analysis.memoryPack.estimatedTokens} / ${analysis.memoryPack.tokenBudget} tokens · confidence ${analysis.memoryPack.confidence}` : "Unavailable without a readable repository commit."} insight={memoryInsight}><Text size={300}>{analysis.memoryPack.staleKnowledgeExcluded ? "Stale vault knowledge was excluded." : "No stale selected vault knowledge was included."}</Text><div className="note-list">{analysis.memoryPack.selected.map((source) => <article className="note-row" key={source.id}><strong>{source.id} · {source.title}</strong><Text size={300}>{source.reason}</Text><Text size={300}>Freshness: {source.freshness} · confidence {source.confidence}</Text></article>)}</div></InsightPanel>
    </section>
  </div>;
}

type EvidenceBacked = Pick<AnalysisSection<unknown>, "evidence" | "confidence" | "unknowns" | "limitations"> & Partial<Pick<AnalysisSection<unknown>, "reasoning" | "crossReferences" | "decision">>;
function ValueList({ values, empty = "None derived." }: { values: string[]; empty?: string }) { const uniqueValues = uniqueBy(values, (value) => value); return uniqueValues.length > 0 ? <ul className="analysis-list">{uniqueValues.map((value) => <li key={value}><code>{value}</code></li>)}</ul> : <Text size={300}>{empty}</Text>; }
function EvidenceList({ evidence }: { evidence: EvidenceReference[] }) { const uniqueEvidence = uniqueBy(evidence, (item) => `${item.id}\u0000${item.source}\u0000${item.line ?? ""}\u0000${item.observation}`); return uniqueEvidence.length > 0 ? <ul className="analysis-list">{uniqueEvidence.map((item) => <li key={`${item.id}-${item.source}-${item.line ?? ""}-${item.observation}`}><code>{item.source}{item.line ? `:${item.line}` : ""} · {item.confidence}</code> — {item.observation}</li>)}</ul> : <Text size={300}>No evidence was available.</Text>; }
function EvidenceDisclosure({ insight }: { insight: EvidenceBacked }) { return <details className="intelligence-evidence"><summary>Evidence, reasoning &amp; limits · {insight.confidence} confidence</summary><div className="intelligence-detail"><Text weight="semibold">Reasoning</Text><ValueList values={insight.reasoning ?? []} empty="No additional reasoning was derived beyond the cited facts."/><Text weight="semibold">Evidence</Text><EvidenceList evidence={insight.evidence}/><Text weight="semibold">Cross-references</Text><CrossReferenceList items={insight.crossReferences ?? []}/><Text weight="semibold">Unknowns</Text><ValueList values={insight.unknowns} empty="None reported for this bounded analysis."/><Text weight="semibold">Limitations</Text><ValueList values={insight.limitations}/></div></details>; }
function InsightPanel({ title, description, insight, children }: { title: string; description: string; insight: EvidenceBacked; children: React.ReactNode }) { return <Card className="panel intelligence-panel"><CardHeader header={<Text weight="semibold">{title}</Text>} description={description}/><div className="intelligence-body">{children}</div>{insight.decision && <DecisionCard decision={insight.decision}/>}<EvidenceDisclosure insight={insight}/></Card>; }
function FindingList({ findings, empty = "No evidence-backed findings." }: { findings: Finding[]; empty?: string }) { return findings.length > 0 ? <div className="finding-list">{findings.map((finding) => <details key={finding.id} className="finding"><summary><strong>{finding.title}</strong><span>{finding.confidence} confidence</span></summary><Text size={300}>{finding.detail}</Text><Text weight="semibold">Affected files</Text><ValueList values={finding.paths}/><Text weight="semibold">Reasoning</Text><ValueList values={finding.reasoning ?? []} empty="The cited static fact is the available reasoning."/><Text weight="semibold">Evidence</Text><EvidenceList evidence={finding.evidence}/><Text weight="semibold">Cross-references</Text><CrossReferenceList items={finding.crossReferences ?? []}/></details>)}</div> : <Text size={300}>{empty}</Text>; }
function RepositoryReport({ analysis }: { analysis: RepositoryAnalysis }) {
  const commit = analysis.repository.commit?.slice(0, 7) ?? "UNKNOWN";
  const memoryInsight: EvidenceBacked = { evidence: analysis.memoryPack.evidence, confidence: String(analysis.memoryPack.confidence), unknowns: analysis.memoryPack.unknowns, limitations: analysis.memoryPack.limitations };
  const opportunityInsight: EvidenceBacked = { evidence: analysis.suggestions.flatMap((item) => item.evidence), confidence: analysis.suggestions.length > 0 ? "evidence-backed" : "unknown", unknowns: analysis.suggestions.length === 0 ? ["No prioritized task met the static-evidence threshold."] : [], limitations: ["Suggestions are not plans, approvals, or authorization to change this repository."] };
  return <div className="analysis-report"><section className="analysis-summary"><Card className="panel"><CardHeader header={<Text weight="semibold">Overview</Text>} description={`${analysis.repository.name} · ${commit} · ${analysis.repository.dirty === null ? "working tree UNKNOWN" : analysis.repository.dirty ? "working tree has changes" : "working tree clean"}`}/><div className="analysis-facts"><span><b>Languages</b>{analysis.summary.languages.join(", ") || "UNKNOWN"}</span><span><b>Frameworks</b>{analysis.summary.frameworks.join(", ") || "UNKNOWN"}</span><span><b>Files scanned</b>{analysis.coverage.scannedFiles}{analysis.coverage.scanLimited ? " · cap reached" : ""}</span><span><b>Source files read</b>{analysis.coverage.sourceFilesRead}{analysis.coverage.sourceLimited ? " · cap reached" : ""}</span></div></Card><Card className="panel trust-card"><CardHeader header={<Text weight="semibold">Trust boundary</Text>} /><Text weight="semibold">READ-ONLY ANALYSIS</Text><Text size={300}>{analysis.trust.limitation}</Text></Card></section><section className="analysis-grid intelligence-grid"><InsightPanel title="Git analysis" description="Read-only history, authorship, branch, and release signals." insight={analysis.git}><div className="analysis-facts"><span><b>Active branch</b>{analysis.repository.activeBranch ?? "detached / UNKNOWN"}</span><span><b>Repository age</b>{analysis.git.items.repositoryAgeDays === null ? "UNKNOWN" : `${analysis.git.items.repositoryAgeDays} days`}</span><span><b>Commits</b>{analysis.git.items.totalCommits ?? "UNKNOWN"}</span><span><b>Release cadence</b>{analysis.git.items.releaseCadenceDays === null ? "UNKNOWN" : `${analysis.git.items.releaseCadenceDays} days`}</span></div><Text weight="semibold">Recent commits</Text><div className="commit-list">{analysis.repository.recentCommits.map((item) => <div key={item.hash}><code>{item.hash}</code><span>{item.subject}</span><small>{item.author} · {item.date}</small></div>)}</div></InsightPanel><InsightPanel title="Architecture & risks" description="Structure is inferred only when directory evidence crosses a threshold." insight={analysis.architecture}><Text weight="semibold">Observed styles</Text><ValueList values={analysis.architecture.items.styles.map((item) => `${item.name} · ${item.confidence}`)} empty="UNKNOWN — no named architecture pattern met the evidence threshold."/><Text weight="semibold">Risk-signalling directories</Text><ValueList values={analysis.architecture.items.riskyDirectories}/><Text weight="semibold">Top-level directories</Text><ValueList values={analysis.architecture.items.directories}/></InsightPanel><InsightPanel title="Repository health" description="Static signal scores explain where evidence is strong and where human review remains necessary." insight={analysis.health}><div className="health-grid">{analysis.health.items.map((item) => <article key={item.category}><strong>{item.score ?? "UNKNOWN"}</strong><span>{item.category}</span><small>{item.confidence} confidence</small></article>)}</div></InsightPanel><InsightPanel title="Entrypoints" description="Manifest-declared and conventional entrypoints; dynamic loaders remain unknown." insight={analysis.entryPoints}><div className="finding-list">{analysis.entryPoints.items.map((item) => <details className="finding" key={item.path}><summary><strong><code>{item.path}</code></strong><span>{item.confidence}</span></summary><Text size={300}>{item.kind}</Text><ul className="analysis-list">{item.evidence.map((proof, index) => <li key={index}>{proof.observation}</li>)}</ul></details>)}</div></InsightPanel><InsightPanel title="Dependencies" description="Declared packages, observed static imports, and candidates needing human confirmation." insight={analysis.dependencies}><Text weight="semibold">Production dependencies</Text><ValueList values={analysis.dependencies.items.production}/><Text weight="semibold">Not observed in static imports</Text><ValueList values={analysis.dependencies.items.unobservedDirectDependencies} empty="None — or no direct dependencies were declared."/><Text weight="semibold">Dependency hotspots</Text><ValueList values={analysis.dependencies.items.hotspots.map((item) => `${item.module} · ${item.connections} connections`)}/></InsightPanel><InsightPanel title="Modules & boundaries" description="Resolvable static relative imports only; no dynamic module claim is made." insight={analysis.moduleGraph}><div className="analysis-facts"><span><b>Modules</b>{analysis.moduleGraph.items.modules.length}</span><span><b>Resolved edges</b>{analysis.moduleGraph.items.internalEdges.length}</span><span><b>Cycles</b>{analysis.moduleGraph.items.circularDependencies.length}</span><span><b>Cross-domain boundaries</b>{analysis.moduleGraph.items.boundaries.length}</span></div><Text weight="semibold">Circular dependencies</Text><ValueList values={analysis.moduleGraph.items.circularDependencies.map((cycle) => cycle.join(" → "))} empty="No static cycles were resolved."/></InsightPanel><InsightPanel title="Business domains" description="Only path vocabulary supported by at least two repository paths is shown." insight={analysis.domains}><ValueList values={analysis.domains.items.map((item) => `${item.name} · ${item.confidence}`)} empty="UNKNOWN — no domain met the evidence threshold."/></InsightPanel><InsightPanel title="Build & test systems" description="Commands are read from metadata, never executed by this mode." insight={analysis.buildSystem}><Text weight="semibold">Build commands (unexecuted)</Text><ValueList values={analysis.commands.build}/><Text weight="semibold">Test commands (unexecuted)</Text><ValueList values={analysis.commands.test}/><Text weight="semibold">Detected test kinds</Text><ValueList values={analysis.testSystem.items.kinds.map((item) => `${item.name} · ${item.files} files`)}/><EvidenceDisclosure insight={analysis.testSystem}/></InsightPanel><InsightPanel title="Repository risks" description="High-impact paths and security review signals are intentionally separated from vulnerability claims." insight={analysis.security}><Text weight="semibold">High-impact directories</Text><ValueList values={analysis.architecture.items.riskyDirectories}/><Text weight="semibold">Security review signals</Text><ValueList values={analysis.security.items.map((item) => item.title)} empty="No supported static security review signal was found."/></InsightPanel><InsightPanel title="Security review signals" description="Potential patterns are review signals—not vulnerability claims—and secret values never leave the repository." insight={analysis.security}><FindingList findings={analysis.security.items} empty="No supported static security-review pattern was found."/></InsightPanel><InsightPanel title="Code smells" description="File size, nesting, and branch-indicator heuristics. No semantic quality claim is made." insight={analysis.codeSmells}><FindingList findings={analysis.codeSmells.items} empty="No configured static smell threshold was crossed."/></InsightPanel><InsightPanel title="Technical debt" description="TODO, FIXME, HACK, XXX, and BUG markers are extracted as untrusted, sanitized source evidence." insight={analysis.technicalDebt}><FindingList findings={analysis.technicalDebt.items} empty="No debt markers were found."/></InsightPanel><InsightPanel title="Complexity" description="Bounded source metrics identify places that may deserve human review." insight={analysis.complexity}><div className="analysis-facts"><span><b>Total lines</b>{analysis.complexity.items.totalLines}</span><span><b>Average / file</b>{analysis.complexity.items.averageLinesPerFile}</span><span><b>Source files</b>{analysis.complexity.items.sourceFiles}</span></div><ValueList values={analysis.complexity.items.largestModules.map((item) => `${item.path} · ${item.lines} lines · ${item.complexityIndicators} branch indicators`)}/><FindingList findings={analysis.complexity.items.longFunctions} empty="No long function-like block crossed the review threshold."/></InsightPanel><InsightPanel title="Dead-code candidates" description="Candidates are deliberately low confidence: dynamic loading and external consumers are unknown." insight={analysis.deadCode}><FindingList findings={analysis.deadCode.items} empty="No candidate was found under the bounded static rule."/></InsightPanel><InsightPanel title="TODOs & notes" description="Every marker is traceable to a path and line; comments remain untrusted content." insight={analysis.todos}><div className="finding-list">{analysis.todos.items.map((item) => <details className="finding" key={`${item.path}:${item.line}`}><summary><strong>{item.tag} · <code>{item.path}:{item.line}</code></strong><span>{item.priority}</span></summary><Text size={300}>{item.excerpt}</Text></details>)}</div></InsightPanel><InsightPanel title="Duplicate code" description="Only exact normalized four-line blocks are reported; semantic duplication is UNKNOWN." insight={analysis.duplicates}><FindingList findings={analysis.duplicates.items} empty="No exact normalized duplicate block was found."/></InsightPanel><InsightPanel title="Bounded Memory Pack" description={analysis.memoryPack.available ? `${analysis.memoryPack.estimatedTokens} / ${analysis.memoryPack.tokenBudget} tokens · confidence ${analysis.memoryPack.confidence}` : "Unavailable without a readable repository commit."} insight={memoryInsight}><Text size={300}>{analysis.memoryPack.staleKnowledgeExcluded ? "Stale vault knowledge was excluded." : "No stale selected vault knowledge was included."}</Text><div className="note-list">{analysis.memoryPack.selected.map((source) => <article className="note-row" key={source.id}><strong>{source.id} · {source.title}</strong><Text size={300}>{source.reason}</Text><Text size={300}>Freshness: {source.freshness} · confidence {source.confidence}</Text></article>)}</div></InsightPanel><InsightPanel title="Engineering opportunities" description="Prioritized, evidence-backed starting points only. They are never approved plans." insight={opportunityInsight}><div className="finding-list">{analysis.suggestions.map((item) => <details className="finding" key={item.title}><summary><strong>{item.priority.toUpperCase()} · {item.title}</strong><span>{item.confidence} confidence</span></summary><Text size={300}>{item.problem}</Text><Text size={300}>{item.impact}</Text><Text size={300}>Effort: {item.estimatedEffort} · risk: {item.risk}</Text><ValueList values={item.affectedFiles}/><ul className="analysis-list">{item.evidence.map((proof, index) => <li key={index}><code>{proof.source}{proof.line ? `:${proof.line}` : ""}</code> — {proof.observation}</li>)}</ul></details>)}</div></InsightPanel></section></div>;
}

function Story({ run }: { run: Run }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const handleNodeClick = (id: string) => { setSelectedNodeId(id); setSelectedEdgeId(null); };
  const handleEdgeClick = (id: string) => { setSelectedEdgeId(id); setSelectedNodeId(null); };
  const clearSelection = () => { setSelectedNodeId(null); setSelectedEdgeId(null); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Escape") clearSelection(); };

  const activeNodeInspector = selectedNodeId && run.nodeInspectors ? run.nodeInspectors[selectedNodeId] : null;
  const activeEdgeInspector = selectedEdgeId && run.edgeInspectors ? run.edgeInspectors[selectedEdgeId] : null;

  return (
    <div className="content-grid">
      <section className="main-column">
        <Card className="panel proof-panel">
          <CardHeader header={<Text weight="semibold">Causal proof graph</Text>} description="Edges show why the next artifact is allowed, not merely what happened next."/>
          <div className="proof-graph" aria-label="Causal PAY-17 proof graph" role="group">
            {run.proofGraph.nodes.map((node) => {
              const edge = run.proofGraph.edges.find((candidate) => candidate.from === node.id);
              const edgeId = edge ? `${edge.from}->${edge.to}` : null;
              const nodeInspector = run.nodeInspectors?.[node.id];
              const edgeInspector = edgeId ? run.edgeInspectors?.[edgeId] : undefined;
              return (
                <Fragment key={node.id}>
                  {nodeInspector ? <button
                    type="button"
                    className={`graph-node ${node.status === "blocked" ? "amber" : node.status === "verified" ? "green" : "neutral"} ${selectedNodeId === node.id ? "selected" : ""}`}
                    aria-pressed={selectedNodeId === node.id}
                    aria-controls="proof-graph-inspector"
                    aria-label={`Inspect ${node.label}`}
                    onClick={() => handleNodeClick(node.id)}
                    onKeyDown={handleKeyDown}
                  >
                    <strong>{node.label}</strong><span>{node.kind} · {node.status}</span>
                  </button> : <div className={`graph-node ${node.status === "blocked" ? "amber" : node.status === "verified" ? "green" : "neutral"}`}><strong>{node.label}</strong><span>{node.kind} · {node.status}</span></div>}
                  {edge && edgeId && edgeInspector ? (
                    <button
                      type="button"
                      className={`graph-line-container ${selectedEdgeId === edgeId ? "selected" : ""}`}
                      aria-pressed={selectedEdgeId === edgeId}
                      aria-controls="proof-graph-inspector"
                      aria-label={`Inspect relationship: ${edgeInspector.relationship}`}
                      onClick={() => handleEdgeClick(edgeId)}
                      onKeyDown={handleKeyDown}
                    >
                      <span className="graph-line" aria-hidden="true" />
                    </button>
                  ) : edge ? <span className="graph-line" aria-hidden="true" /> : null}
                </Fragment>
              );
            })}
          </div>
          {activeNodeInspector && <NodeInspectorPanel inspector={activeNodeInspector} onClear={clearSelection} />}
          {activeEdgeInspector && <EdgeInspectorPanel inspector={activeEdgeInspector} onClear={clearSelection} />}
          <div className="proof-note"><DocumentBulletList20Regular /><Text size={300}>The proof graph is evidence-derived. It grants no action authority.</Text></div>
        </Card>
        <Timeline run={run} />
      </section>
      <aside className="rail">
        <Card className="panel verdict-panel"><CardHeader header={<Text weight="semibold">What happened?</Text>} /><Text className="verdict">Verified repair</Text><Text size={300}>{run.proofContract}. The baseline failed; the isolated candidate passed; a later replay was blocked.</Text>{run.metrics.map((metric) => <div className="mini-metric" key={metric.label}><span title={metric.detail}>{metric.label}</span><strong>{metric.value}</strong></div>)}</Card>
        <Card className="panel regression-panel"><CardHeader header={<Text weight="semibold">Regression evaluation</Text>} /><div className="warning-line"><Warning20Regular /><Text weight="semibold">{run.regressionStatus}</Text></div><Text size={300}>Only the causal retry-key mutation was restored in a disposable candidate. The proof was unchanged.</Text></Card>
        <Card className="panel workflow-panel"><CardHeader header={<Text weight="semibold">Recorded workflow evidence</Text>} description="Every execution gate shown in this run has a source artifact."/><ol className="workflow-stage-list">{run.workflowStages.map((stage) => <li key={stage.id}><div><Text weight="semibold">{stage.label}</Text><Text block size={300}>{stage.detail}</Text></div><code>{stage.evidenceSource}</code></li>)}</ol></Card>
      </aside>
    </div>
  );
}

type NodeInspector = NonNullable<Run["nodeInspectors"]>[string];
type EdgeInspector = NonNullable<Run["edgeInspectors"]>[string];

function InspectorHeader({ title, onClear }: { title: string; onClear: () => void }) {
  return <div className="inspector-header"><h3 id="proof-graph-inspector-title">{title}</h3><button type="button" className="inspector-dismiss" onClick={onClear}>Clear selection</button></div>;
}

function NodeInspectorPanel({ inspector, onClear }: { inspector: NodeInspector; onClear: () => void }) {
  const badgeColor = inspector.verificationStatus === "verified" ? "success" : inspector.verificationStatus === "blocked" ? "danger" : "informative";
  return <section className="inspector-panel" id="proof-graph-inspector" role="region" aria-live="polite" aria-labelledby="proof-graph-inspector-title">
    <InspectorHeader title="Artifact inspection" onClear={onClear} />
    <div className="inspector-field"><strong>Artifact Type</strong><span>{inspector.artifactType}</span></div>
    <div className="inspector-field"><strong>Evidence Source</strong><span>{inspector.evidenceSource}</span></div>
    <div className="inspector-field"><strong>Verification</strong><Badge appearance="filled" color={badgeColor}>{inspector.verificationStatus}</Badge></div>
    {inspector.confidence !== "n/a" && <div className="inspector-field"><strong>Confidence and Freshness</strong><span>{inspector.confidence} · {inspector.freshness}</span></div>}
    <div className="inspector-field"><strong>Causal Explanation</strong><span>{inspector.causalExplanation}</span></div>
    {inspector.relatedEvidence.length > 0 && <div className="inspector-field"><strong>Evidence References</strong><ul className="inspector-limitations">{inspector.relatedEvidence.map((reference) => <li key={reference}><code>{reference}</code></li>)}</ul></div>}
    {inspector.limitations.length > 0 && <div className="inspector-field"><strong>Limits</strong><ul className="inspector-limitations">{inspector.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div>}
  </section>;
}

function EdgeInspectorPanel({ inspector, onClear }: { inspector: EdgeInspector; onClear: () => void }) {
  return <section className="inspector-panel" id="proof-graph-inspector" role="region" aria-live="polite" aria-labelledby="proof-graph-inspector-title">
    <InspectorHeader title="Relationship inspection" onClear={onClear} />
    <div className="inspector-field"><strong>Relationship</strong><span>{inspector.relationship}</span></div>
    <div className="inspector-field"><strong>Causal Explanation</strong><span>{inspector.causalExplanation}</span></div>
    <div className="inspector-field"><strong>Evidence Basis</strong><span>{inspector.evidenceBasis}</span></div>
  </section>;
}
function Timeline({ run }: { run: Run }) { return <Card className="panel"><CardHeader header={<Text weight="semibold">Engineering incident narrative</Text>} description="One bounded task, from issue intake to regression protection."/><ol className="timeline">{run.timeline.map(([title, detail], i) => <li key={title}><span className="timeline-index">{String(i + 1).padStart(2, "0")}</span><div><Text weight="semibold">{title}</Text><Text block size={300}>{detail}</Text></div></li>)}</ol></Card>; }
function Review({ run }: { run: Run }) { return <div className="review-grid"><Card className="panel"><CardHeader header={<Text weight="semibold">Reviewer decision record</Text>} description="The human approved a candidate commit only. No merge, deployment, or implied vault permission."/><section className="review-section"><Text weight="semibold">What changed</Text><Text block size={300}>{run.review.diffSummary}</Text><ul>{run.review.changedPaths.map((path) => <li key={path}><code>{path}</code></li>)}</ul></section><section className="review-section"><Text weight="semibold">Why this is sufficient</Text><Text block size={300}>Proof contract: <code>{run.review.proofContract}</code></Text><Text block size={300}>Verifier evidence includes baseline failure, build, health suite, unchanged PAY-17 unit proof, and browser proof.</Text></section><section className="review-section"><Text weight="semibold">Patch approval limits</Text><ul>{run.review.patchApprovalLimits.map((item) => <li key={item}>{item}</li>)}</ul></section></Card><Card className="panel"><CardHeader header={<Text weight="semibold">Vault approval and completed write</Text>} description="This was a separate human-controlled durable-memory decision after patch approval."/><Text className="verdict">{run.review.vaultDecision}</Text><Text block size={300}>Recorded state: <strong>{run.review.vaultStatus}</strong>. This separate approval wrote {run.review.vaultTargets.length} Markdown notes.</Text><ul>{run.review.vaultTargets.map((target) => <li key={target}><code>{target}</code></li>)}</ul><Text size={300}>Foundry exposes no write control in this proof viewer; this screen displays the recorded outcome only.</Text></Card></div>; }
function Memory({ run }: { run: Run }) { return <div className="memory-layout"><Card className="panel memory-lead"><CardHeader header={<Text weight="semibold">{run.memory.lifecycleLabel}</Text>} description={`${run.memory.estimatedTokens} estimated tokens of ${run.memory.tokenBudget} budget · confidence ${run.memory.confidenceScore} · approved repair ${run.memory.repositoryCommit}.`}/><div className="memory-lifecycle"><Text weight="semibold">Memory lifecycle</Text><Text block size={300}>Baseline planner input → repair → independent verification → approved engineering memory → future tasks</Text><Text block size={300}>{run.memory.lifecycleExplanation}</Text></div><div className="memory-detail"><Text size={300}>{run.memory.naiveComparisonReason}</Text></div><CardHeader header={<Text weight="semibold">Included notes</Text>} description="Every included note carries provenance. Omitted note bodies are never rendered."/><div className="note-list">{run.memory.included.map((note) => <article className="note-row" key={note.id}><div><strong>{note.id}</strong><span>{note.type}</span></div><Text size={300}><b>Confidence:</b> {note.confidence} · <b>Freshness:</b> {note.freshness}</Text><Text size={300}><b>Selected:</b> {note.reasonSelected}</Text><Text size={300}><b>Verified:</b> {note.verification}</Text><Text size={300}><b>Evidence:</b> {note.evidenceReferences.join(" · ")}</Text></article>)}</div></Card><Card className="panel"><CardHeader header={<Text weight="semibold">Omitted metadata</Text>} description="No omitted bodies cross the context boundary."/><div className="note-list">{run.memory.omitted.map((note) => <article className="note-row omitted" key={note.id}><div><strong>{note.id}</strong><span>{note.type}</span></div><Text size={300}>{note.confidence} · {note.freshness}</Text><Text size={300}>{note.reason}</Text></article>)}</div></Card></div>; }
function AuthoritySignal({ authority }: { authority: string }) {
  if (authority === "implementer") {
    return <div className="authority-signal authority-claim"><Warning20Regular aria-hidden="true" /><div><strong>CODEX CLAIM</strong><span>Non-authoritative · awaiting independent proof</span></div></div>;
  }
  if (authority === "independent_verifier") {
    return <div className="authority-signal authority-verified"><CheckmarkCircle20Filled aria-hidden="true" /><div><strong>INDEPENDENTLY VERIFIED</strong><span>Authoritative verifier evidence</span></div></div>;
  }
  return null;
}

function Evidence({ run }: { run: Run }) { return <div className="evidence-stack">{run.evidence.map((item) => <Card className="panel evidence-panel" key={item.id}><CardHeader header={<Text weight="semibold">{item.title}</Text>} description={`${item.kind} · ${item.authority}${item.command ? ` · ${item.command}` : ""}${item.exitCode !== undefined ? ` · exit ${item.exitCode}` : ""}`}/><AuthoritySignal authority={item.authority} />{item.kind === "browser" && <Text className="artifact-note" size={300}>No screenshot or trace was recorded for this historical run; this command log is the authoritative browser artifact.</Text>}<details><summary>View recorded evidence</summary><pre>{item.content}</pre></details></Card>)}</div>; }
