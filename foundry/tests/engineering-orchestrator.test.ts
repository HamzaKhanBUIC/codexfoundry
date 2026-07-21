import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EngineeringOrchestrator,
  type CodexSemanticReasoner,
  type EngineeringAgentResult,
} from "../src/engineering-orchestrator.js";

const vaultPath = path.resolve(import.meta.dirname, "../../vault");

async function repositoryFixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "foundry-engineering-orchestrator-"));
  await mkdir(path.join(root, "src", "services"), { recursive: true });
  await Promise.all([
    writeFile(path.join(root, "package.json"), JSON.stringify({
      scripts: { test: "node -e \"require('node:fs').writeFileSync('SCRIPT_RAN', 'unexpected')\"" },
      dependencies: { express: "1.0.0" },
    })),
    writeFile(path.join(root, "index.ts"), "import { calculate } from './src/services/benefit-service.js';\nexport const value = calculate(1);\n"),
    writeFile(path.join(root, "src", "services", "benefit-service.ts"), "export const calculate = (value: number) => value + 1;\n"),
    writeFile(path.join(root, "README.md"), "# Benefits service\n"),
  ]);
  execFileSync("git", ["init"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@example.test", "commit", "-m", "fixture"], { cwd: root });
  return root;
}

function semanticResult(kind: "codex_architecture" | "codex_business_domain", evidenceId: string): EngineeringAgentResult {
  return {
    id: "agent:" + kind,
    kind,
    execution: "codex_read_only",
    status: "completed",
    durationMs: 1,
    summary: "Schema-valid semantic result.",
    claims: [{ title: "Bounded semantic observation", detail: "The result cites supplied static evidence only.", confidence: "medium", evidenceIds: [evidenceId], limitations: ["Advisory only."] }],
    recommendations: [],
    evidence: [],
    confidence: "medium",
    unknowns: ["Runtime behavior remains UNKNOWN."],
    limitations: ["No implementation authority."],
  };
}

describe("EngineeringOrchestrator", () => {
  it("runs deterministic specialists in parallel and fuses only evidence-backed context", async () => {
    const root = await repositoryFixture();
    const run = await new EngineeringOrchestrator().analyze(root, vaultPath);

    expect(run.status).toBe("completed");
    expect(run.agents.map((agent) => agent.kind)).toEqual(["repository", "architecture", "dependency", "business_domain", "security", "testing"]);
    expect(run.agents.every((agent) => agent.status === "completed" && agent.execution === "deterministic")).toBe(true);
    expect(run.fused.authority).toBe("read_only_static_analysis");
    expect(run.fused.evidence.length).toBeGreaterThan(0);
    const knownEvidence = new Set(run.fused.evidence.map((item) => item.id));
    expect(run.fused.claims.every((claim) => claim.evidenceIds.length > 0 && claim.evidenceIds.every((id) => knownEvidence.has(id)))).toBe(true);
    expect(run.fused.recommendations.every((recommendation) => recommendation.evidenceIds.length > 0 && recommendation.evidenceIds.every((id) => knownEvidence.has(id)))).toBe(true);
    expect(run.fused.limitations.join(" ")).toContain("cannot create proof");
    await expect(access(path.join(root, "SCRIPT_RAN"))).rejects.toThrow();
  });

  it("shares one bounded context with opt-in Codex specialists and keeps their output non-authoritative", async () => {
    const root = await repositoryFixture();
    const seen: string[] = [];
    const reasoner: CodexSemanticReasoner = {
      async run(request) {
        seen.push(request.kind + ":" + request.context.repositoryCommit + ":" + request.context.memoryPack.id);
        const evidenceId = request.context.staticAnalysis.architecture.evidence[0]!.id;
        return semanticResult(request.kind, evidenceId);
      },
    };

    const run = await new EngineeringOrchestrator({ codexReasoner: reasoner }).analyze(root, vaultPath, { useCodexReasoning: true });

    expect(seen).toHaveLength(2);
    expect(run.agents.filter((agent) => agent.execution === "codex_read_only").map((agent) => agent.status)).toEqual(["completed", "completed"]);
    expect(run.fused.claims.some((claim) => claim.title === "Bounded semantic observation")).toBe(true);
    expect(run.fused.authority).toBe("read_only_static_analysis");
    await expect(access(path.join(root, "SCRIPT_RAN"))).rejects.toThrow();
  });

  it("records a failed optional semantic agent instead of hiding it", async () => {
    const root = await repositoryFixture();
    const reasoner: CodexSemanticReasoner = {
      async run() {
        throw new Error("semantic executor unavailable");
      },
    };

    const run = await new EngineeringOrchestrator({ codexReasoner: reasoner }).analyze(root, vaultPath, { useCodexReasoning: true });

    expect(run.status).toBe("completed_with_agent_failures");
    expect(run.agents.filter((agent) => agent.status === "failed")).toHaveLength(2);
    expect(run.fused.limitations.join(" ")).toContain("semantic executor unavailable");
  });

  it("degrades gracefully when one deterministic specialist fails", async () => {
    const root = await repositoryFixture();
    const run = await new EngineeringOrchestrator({
      deterministicAgent(kind, context, now) {
        if (kind === "security") throw new Error("security specialist unavailable");
        // Use the default implementation through a fresh isolated orchestrator would recurse,
        // so this fixture only needs each surviving result to stay explicit and evidence-backed.
        return {
          id: "agent:" + kind, kind, execution: "deterministic", status: "completed", durationMs: now() - now(), summary: "Fallback fixture result.",
          claims: [{ title: kind + " claim", detail: "Static fixture observation.", confidence: "medium", evidenceIds: [context.staticAnalysis.git.evidence[0]!.id], limitations: [] }],
          recommendations: [], evidence: [context.staticAnalysis.git.evidence[0]!], confidence: "medium", unknowns: [], limitations: [],
        };
      },
    }).analyze(root, vaultPath);
    expect(run.status).toBe("completed_with_agent_failures");
    expect(run.agents.find((agent) => agent.kind === "security")).toMatchObject({ status: "failed", error: "security specialist unavailable" });
    expect(run.agents.filter((agent) => agent.status === "completed")).toHaveLength(5);
    expect(run.fused.limitations.join(" ")).toContain("security specialist unavailable");
  });
});
