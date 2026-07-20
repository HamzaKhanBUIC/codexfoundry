import { Fragment, useEffect, useState } from "react";
import { Badge, Card, CardHeader, Tab, TabList, Text } from "@fluentui/react-components";
import { CheckmarkCircle20Filled, DocumentBulletList20Regular, ShieldCheckmark20Filled, Warning20Regular } from "@fluentui/react-icons";
import staticRun from "virtual:foundry-run";

type View = "story" | "review" | "memory" | "evidence";
type Run = typeof staticRun;

export function App() {
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
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">CF</span><span>Codex Foundry</span></div><Text size={200}>Proof system · local fixture</Text><div className="sidebar-foot"><Text size={200}>Verifier-owned evidence</Text><Text size={200}>No production authority</Text></div></aside><section className="workspace">
    <header className="topbar"><div><Text className="breadcrumb" size={200}>Run / RUN-PAY-17-001 / {run.schemaVersion}</Text><h1>{run.title}</h1></div><Badge appearance="filled" color="success" icon={<CheckmarkCircle20Filled />}>Independent verification: {run.status}</Badge></header>
    <section className="run-banner"><div className="banner-icon"><ShieldCheckmark20Filled /></div><div><Text weight="semibold">One duplicate-charge defect was repaired, independently proven, and made reusable.</Text><Text block size={300}>The deliberate retry-key regression was later blocked by the unchanged PAY-17 proof.</Text></div></section>
    <TabList selectedValue={view} onTabSelect={(_, data) => setView(data.value as View)} aria-label="Foundry proof views"><Tab value="story">Proof story</Tab><Tab value="review">Review</Tab><Tab value="memory">Memory Pack</Tab><Tab value="evidence">Evidence</Tab></TabList>
    {view === "story" && <Story run={run} />}{view === "review" && <Review run={run} />}{view === "memory" && <Memory run={run} />}{view === "evidence" && <Evidence run={run} />}
  </section></main>;
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
