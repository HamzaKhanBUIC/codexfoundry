import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createFoundryReadApi } from "../src/read-api.js";

const evidenceDirectory = fileURLToPath(new URL("../evidence/", import.meta.url));

async function request(pathname: string, method = "GET") {
  const server = createFoundryReadApi(evidenceDirectory);
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
});
