import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Divider,
  Tab,
  TabList,
  Text,
} from "@fluentui/react-components";
import {
  ArrowRight20Regular,
  BranchFork20Regular,
  CheckmarkCircle20Filled,
  Code20Regular,
  Database20Regular,
  DocumentBulletList20Regular,
  ShieldCheckmark20Filled,
  Warning20Regular,
} from "@fluentui/react-icons";
import staticRun from "virtual:foundry-run";

type View = "overview" | "evidence" | "memory";
type RunProjection = typeof staticRun;

export function App() {
  const [view, setView] = useState<View>("overview");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [liveRun, setLiveRun] = useState(staticRun);

  useEffect(() => {
    void fetch("/api/runs/RUN-PAY-17-001")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Run evidence is unavailable.")))
      .then((projection) => setLiveRun(projection))
      .catch(() => undefined);
  }, []);
  const run = liveRun;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Foundry navigation">
        <div className="brand">
          <span className="brand-mark">CF</span>
          <span>Codex Foundry</span>
        </div>
        <nav className="nav-list" aria-label="Run sections">
          <button className={view === "overview" ? "nav-item active" : "nav-item"} onClick={() => setView("overview")}>Run overview</button>
          <button className={view === "evidence" ? "nav-item active" : "nav-item"} onClick={() => setView("evidence")}>Proof evidence</button>
          <button className={view === "memory" ? "nav-item active" : "nav-item"} onClick={() => setView("memory")}>Engineering memory</button>
        </nav>
        <div className="sidebar-foot">
          <Text size={200}>Local fixture only</Text>
          <Text size={200}>No production access</Text>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <Text className="breadcrumb" size={200}>Runs / {run.taskId}</Text>
            <h1>{run.title}</h1>
          </div>
          <Badge appearance="filled" color="success" icon={<CheckmarkCircle20Filled />}>{run.status} with memory</Badge>
        </header>

        <section className="run-banner" aria-label="Current run result">
          <div className="banner-icon"><ShieldCheckmark20Filled /></div>
          <div>
            <Text weight="semibold">PAY-17 repaired, verified, and saved as engineering memory.</Text>
            <Text block size={300}>The same regression was deliberately reintroduced in a disposable candidate and the proof blocked it.</Text>
          </div>
          <Button appearance="primary" icon={<DocumentBulletList20Regular />} onClick={() => setEvidenceOpen((open) => !open)}>
            {evidenceOpen ? "Hide evidence" : "Open evidence"}
          </Button>
        </section>

        <TabList selectedValue={view} onTabSelect={(_, data) => setView(data.value as View)} aria-label="Foundry dashboard view">
          <Tab value="overview">Overview</Tab>
          <Tab value="evidence">Evidence</Tab>
          <Tab value="memory">Memory</Tab>
        </TabList>

        {view === "overview" && <Overview run={run} evidenceOpen={evidenceOpen} onOpenEvidence={() => setEvidenceOpen(true)} />}
        {view === "evidence" && <Evidence run={run} />}
        {view === "memory" && <Memory run={run} />}
      </section>
    </main>
  );
}

function Overview({ run, evidenceOpen, onOpenEvidence }: { run: RunProjection; evidenceOpen: boolean; onOpenEvidence: () => void }) {
  return (
    <div className="content-grid">
      <section className="main-column">
        <Card className="panel proof-panel">
          <CardHeader header={<Text weight="semibold">Proof chain</Text>} description="Requirement, decision, code, executable proof, and saved regression evaluation." />
          <div className="proof-graph" aria-label="PAY-17 proof graph">
            <GraphNode label="PAY-17" caption="Requirement" tone="amber" />
            <GraphLine />
            <GraphNode label="ADR-001" caption="Preserve retry key" tone="neutral" />
            <GraphLine />
            <GraphNode label="2a5d01f" caption="Approved repair" tone="neutral" />
            <GraphLine />
            <GraphNode label="PROOF-001" caption="One payment" tone="green" />
            <GraphLine />
            <GraphNode label="EVAL-001" caption="Regression blocked" tone="green" />
          </div>
          <div className="proof-note"><Code20Regular /> <Text size={300}>The unit proof did not change during repair or replay.</Text></div>
        </Card>

        <Card className="panel">
          <CardHeader header={<Text weight="semibold">Execution timeline</Text>} description="A single high-risk payment repair, bounded by human approval and independent verification." />
          <ol className="timeline">
            {run.timeline.map(([title, detail], index) => (
              <li key={title}>
                <span className="timeline-index">{String(index + 1).padStart(2, "0")}</span>
                <div><Text weight="semibold">{title}</Text><Text block size={300}>{detail}</Text></div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <aside className="rail">
        <Card className="panel verdict-panel">
          <CardHeader header={<Text weight="semibold">Verifier verdict</Text>} />
          <Text className="verdict">Verified</Text>
          <Text size={300}>Baseline failure and candidate success were independently recorded.</Text>
          <Divider />
          <div className="mini-metric"><span>Changed paths</span><strong>{run.changedPaths.length}</strong></div>
          <div className="mini-metric"><span>Proof commands</span><strong>4</strong></div>
          <div className="mini-metric"><span>Vault revisions</span><strong>{run.vaultRevisionCount}</strong></div>
          <Button appearance="secondary" icon={<ArrowRight20Regular />} onClick={onOpenEvidence}>Inspect proof</Button>
        </Card>

        <Card className="panel regression-panel">
          <CardHeader header={<Text weight="semibold">Regression replay</Text>} />
          <div className="warning-line"><Warning20Regular /><Text weight="semibold">Blocked before review</Text></div>
          <Text size={300}>Only the retry-key mutation was restored. The unchanged PAY-17 proof failed with two payments.</Text>
        </Card>

        {evidenceOpen && <Evidence run={run} compact />}
      </aside>
    </div>
  );
}

function Evidence({ run, compact = false }: { run: RunProjection; compact?: boolean }) {
  return (
    <Card className={compact ? "panel evidence-panel compact" : "panel evidence-panel"}>
      <CardHeader header={<Text weight="semibold">Command evidence</Text>} description={compact ? undefined : "Verifier-owned outputs. Implementer narration is never proof."} />
      <div className="evidence-list">
        {run.commandEvidence.map(([label, command, status, detail]) => (
          <div className="evidence-row" key={label}>
            <div><Text weight="semibold">{label}</Text><code>{command}</code></div>
            <div className={status === "Blocked" ? "status blocked" : status.startsWith("Failed") ? "status expected" : "status pass"}>{status}</div>
            {!compact && <Text size={300}>{detail}</Text>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Memory({ run }: { run: RunProjection }) {
  return (
    <div className="memory-layout">
      <Card className="panel memory-lead">
        <CardHeader header={<Text weight="semibold">Engineering memory written after review</Text>} description="The durable vault remains Markdown-first and each note is tied to verified evidence." />
        <div className="memory-stats">
          <div><Database20Regular /><strong>INC-001</strong><span>Incident</span></div>
          <div><BranchFork20Regular /><strong>ADR-001</strong><span>Decision</span></div>
          <div><ShieldCheckmark20Filled /><strong>PROOF-001</strong><span>{run.proofContract}</span></div>
          <div><DocumentBulletList20Regular /><strong>{run.evaluationId}</strong><span>{run.regressionStatus.replace("_", " ")}</span></div>
        </div>
      </Card>
      <Card className="panel">
        <CardHeader header={<Text weight="semibold">Context boundary</Text>} />
        <Text size={300}>The Planner and Implementer receive the measured Memory Pack, not the raw vault. Stale and omitted notes stay out of their context.</Text>
        <Divider />
        <div className="memory-detail"><Text weight="semibold">Direct pack sources</Text><Text block size={300}>ADR-001 and PROOF-001</Text></div>
        <div className="memory-detail"><Text weight="semibold">Durable commit</Text><code>{run.approvedCommit}</code></div>
      </Card>
    </div>
  );
}

function GraphNode({ label, caption, tone }: { label: string; caption: string; tone: "amber" | "neutral" | "green" }) {
  return <div className={`graph-node ${tone}`}><strong>{label}</strong><span>{caption}</span></div>;
}

function GraphLine() {
  return <span className="graph-line" aria-hidden="true" />;
}
