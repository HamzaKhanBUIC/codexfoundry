import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveCodexInvocation } from "../src/codex-cli-reasoner.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("Codex CLI invocation resolution", () => {
  it("resolves a Windows npm shim to the Node entrypoint without using a shell", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-codex-cli-"));
    temporaryDirectories.push(root);
    const shim = path.join(root, "codex.cmd");
    const entrypoint = path.join(root, "node_modules", "@openai", "codex", "bin", "codex.js");
    await mkdir(path.dirname(entrypoint), { recursive: true });
    await writeFile(shim, "@echo off\r\n", "utf8");
    await writeFile(entrypoint, "// test entrypoint\n", "utf8");

    await expect(resolveCodexInvocation("codex.cmd", "win32", root, "node-test"))
      .resolves.toEqual({ command: "node-test", prefixArgs: [entrypoint] });
  });

  it("keeps a non-shim command direct", async () => {
    await expect(resolveCodexInvocation("codex", "linux", "", "node-test"))
      .resolves.toEqual({ command: "codex", prefixArgs: [] });
  });
});
