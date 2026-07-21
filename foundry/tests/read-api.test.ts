import type { AddressInfo } from "node:net";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFoundryReadApi } from "../src/read-api.js";
import { GenericRunStore } from "../src/generic-run-store.js";

const evidenceDirectory = fileURLToPath(new URL("../evidence/", import.meta.url));

async function request(pathname: string, method = "GET", directory = evidenceDirectory, genericRunDirectory?: string) {
  const server = createFoundryReadApi(directory, undefined, genericRunDirectory);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address() as AddressInfo;
    return await fetch(`http://127.0.0.1:${address.port}${pathname}`, { method });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

describe("Foundry read API", () => {
  it("returns only the fixed PAY-17 evidence projection", async () => {
    const response = await request("/api/runs/RUN-PAY-17-001");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ taskId: "PAY-17", approvedCommit: "63417ca" });
  });

  it("rejects unknown paths and all write methods", async () => {
    expect((await request("/api/runs/other")).status).toBe(404);
    expect((await request("/api/runs/RUN-PAY-17-001", "POST")).status).toBe(405);
  });

  it("exposes read-only repository analysis only when a local path is supplied", async () => {
    expect((await request("/api/repository-analysis")).status).toBe(400);
    expect((await request("/api/repository-analysis", "POST")).status).toBe(405);
  });

  it("returns an evidence-backed, non-authoritative repository report", async () => {
    const repositoryPath = path.resolve(import.meta.dirname, "../..");
    const response = await request(`/api/repository-analysis?path=${encodeURIComponent(repositoryPath)}`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mode: "repository_analysis",
      trust: { execution: "not_available", verifier: "not_invoked", vault: "not_written", facts: "read_only" },
      git: { evidence: expect.any(Array), confidence: expect.any(String), reasoning: expect.any(Array), crossReferences: expect.any(Array), unknowns: expect.any(Array), limitations: expect.any(Array) },
      health: { evidence: expect.any(Array), confidence: expect.any(String), reasoning: expect.any(Array), crossReferences: expect.any(Array), unknowns: expect.any(Array), limitations: expect.any(Array), decision: { evidenceIds: expect.any(Array), recommendedNextAction: expect.any(String) }, items: { categories: expect.any(Array), summary: expect.any(String), quickWins: expect.any(Array) } },
      decisionSupport: { repositoryDna: { items: { repositoryName: expect.any(String), readiness: expect.any(String) }, evidence: expect.any(Array) }, readiness: { items: { state: expect.any(String), evidenceIds: expect.any(Array), recommendation: expect.any(String), notRecommended: expect.any(Array) }, evidence: expect.any(Array) }, executiveBriefing: { items: { text: expect.any(String) } }, repositoryStory: { items: { text: expect.any(String) } } },
      architectureExplorer: {
        evidence: expect.any(Array),
        decision: { evidenceIds: expect.any(Array) },
        items: {
          totalFiles: expect.any(Number),
          totalDirectories: expect.any(Number),
          entities: expect.arrayContaining([
            expect.objectContaining({
              kind: "file",
              path: expect.any(String),
              imports: expect.any(Array),
              exportedSymbols: expect.any(Array),
              incomingDependencies: expect.any(Array),
              outgoingDependencies: expect.any(Array),
              changeImpact: expect.objectContaining({ estimatedBlastRadius: expect.any(Object), impactedModules: expect.any(Array), unknowns: expect.any(Array) }),
            }),
          ]),
        },
      },
    });
  });

  it("returns a generic engineering pipeline without invoking Codex unless explicitly requested", async () => {
    const repositoryPath = path.resolve(import.meta.dirname, "../..");
    const response = await request("/api/engineering-pipeline?path=" + encodeURIComponent(repositoryPath));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "completed",
      fused: { authority: "read_only_static_analysis", readiness: { label: expect.any(String) }, evidence: expect.any(Array) },
      agents: expect.arrayContaining([
        expect.objectContaining({ kind: "repository", execution: "deterministic", status: "completed" }),
        expect.objectContaining({ kind: "architecture", execution: "deterministic", status: "completed" }),
      ]),
      analysis: { mode: "repository_analysis", trust: { execution: "not_available", facts: "read_only" } },
    });
  });

  it("exposes only a persisted generic run record through the read-only API", async () => {
    const stateDirectory = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-generic-api-"));
    try {
      await new GenericRunStore(stateDirectory).create({
        id: "RUN-GENERIC-API-001", task: { id: "TASK-API-001", title: "Inspect state", description: "Untrusted description.", acceptanceCriteria: ["state is visible"], risk: "low" },
        policy: { id: "POLICY-API-001", repositoryRoot: "C:/fixture", baselineCommit: "abcdef1234567", allowedPaths: ["src/value.ts"], allowedCommands: [{ id: "proof", executable: "node", args: ["--version"], description: "Proof command", timeoutMs: 10_000 }] },
        memoryPack: { id: "PACK-API-001", available: false, selectedIds: [], omittedIds: [], limitations: ["No vault context."] },
      });
      const response = await request("/api/generic-runs/RUN-GENERIC-API-001", "GET", evidenceDirectory, stateDirectory);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ id: "RUN-GENERIC-API-001", status: "intake", events: [expect.objectContaining({ authority: "system" })] });
      expect((await request("/api/generic-runs/RUN_invalid", "GET", evidenceDirectory, stateDirectory)).status).toBe(400);
    } finally { await rm(stateDirectory, { recursive: true, force: true }); }
  });

  it("preserves persisted Codex receipts exactly through the read-only API", async () => {
    const stateDirectory = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-generic-receipt-api-"));
    try {
      const store = new GenericRunStore(stateDirectory);
      const task = { id: "TASK-RECEIPT-001", title: "Inspect receipt", description: "Untrusted task.", acceptanceCriteria: ["receipt remains visible"], risk: "low" } as const;
      const policy = { id: "POLICY-RECEIPT-001", repositoryRoot: "C:/fixture", baselineCommit: "abcdef1234567", allowedPaths: ["src/value.ts"], allowedCommands: [{ id: "proof", executable: "node", args: ["--version"], description: "Proof command", timeoutMs: 10_000 }] };
      await store.create({ id: "RUN-RECEIPT-API-001", task: { ...task, acceptanceCriteria: [...task.acceptanceCriteria] }, policy, memoryPack: { id: "PACK-RECEIPT-001", available: false, selectedIds: [], omittedIds: [], limitations: ["No vault context."] } });
      await store.recordMemoryCompiled("RUN-RECEIPT-API-001");
      await store.recordProposedPlan("RUN-RECEIPT-API-001", { id: "PLAN-RECEIPT-001", runId: "RUN-RECEIPT-API-001", taskId: task.id, summary: "Inspect the stored receipt.", rootCauseHypothesis: "Receipt visibility is required for audit.", affectedPaths: ["src/value.ts"], commandIds: ["proof"], proofContract: [{ assertion: "receipt remains visible", commandIds: ["proof"] }], risks: [], codexReceipt: { stage: "planner", sandbox: "read-only", repositoryPath: "C:/fixture", prompt: "exact bounded prompt", responseSchema: { type: "object" }, rawOutput: "{\"summary\":\"Inspect the stored receipt.\"}", promptSha256: "prompt-sha", responseSha256: "output-sha", replayNote: "A controlled re-invocation may differ." } });

      const response = await request("/api/generic-runs/RUN-RECEIPT-API-001", "GET", evidenceDirectory, stateDirectory);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ proposedPlan: { affectedPaths: ["src/value.ts"], codexReceipt: { stage: "planner", sandbox: "read-only", prompt: "exact bounded prompt", rawOutput: "{\"summary\":\"Inspect the stored receipt.\"}", promptSha256: "prompt-sha", responseSha256: "output-sha" } } });
    } finally { await rm(stateDirectory, { recursive: true, force: true }); }
  });

  it("reports an evidence contradiction instead of a projection when same-run replay claims disagree", async () => {
    const temporaryEvidence = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-api-evidence-"));
    try {
      await cp(evidenceDirectory, temporaryEvidence, { recursive: true });
      const vaultWritePath = path.join(temporaryEvidence, "RUN-PAY-17-001-vault-write.json");
      const vaultWrite = JSON.parse(await readFile(vaultWritePath, "utf8")) as { regressionReplay: { status: string } };
      vaultWrite.regressionReplay.status = "pending";
      await writeFile(vaultWritePath, JSON.stringify(vaultWrite), "utf8");

      const response = await request("/api/runs/RUN-PAY-17-001", "GET", temporaryEvidence);
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ error: "evidence_contradiction" });
    } finally {
      await rm(temporaryEvidence, { recursive: true, force: true });
    }
  });

  it("reports incomplete evidence instead of skipping a missing intake gate", async () => {
    const temporaryEvidence = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-api-evidence-"));
    try {
      await cp(evidenceDirectory, temporaryEvidence, { recursive: true });
      await rm(path.join(temporaryEvidence, "RUN-PAY-17-001-intake.json"));

      const response = await request("/api/runs/RUN-PAY-17-001", "GET", temporaryEvidence);
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ error: "evidence_incomplete" });
    } finally {
      await rm(temporaryEvidence, { recursive: true, force: true });
    }
  });
});
