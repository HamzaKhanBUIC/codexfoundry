import type { AddressInfo } from "node:net";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFoundryReadApi } from "../src/read-api.js";

const evidenceDirectory = fileURLToPath(new URL("../evidence/", import.meta.url));

async function request(pathname: string, method = "GET", directory = evidenceDirectory) {
  const server = createFoundryReadApi(directory);
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
