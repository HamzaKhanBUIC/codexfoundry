import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildRepositoryMap } from "../src/repository-map.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function fixture(options: { omitPath?: string; omitCommand?: string } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "codex-foundry-fixture-"));
  temporaryDirectories.push(root);
  const files = [
    "src/services/checkout-service.ts",
    "src/services/payment-gateway.ts",
    "tests/payment-service.pay-17.test.ts",
    "tests/browser/pay-17.spec.ts",
  ].filter((file) => file !== options.omitPath);
  await Promise.all(files.map(async (file) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), "export {};\n", "utf8");
  }));
  const scripts: Record<string, string> = {
    build: "npm run build",
    "test:health": "npm run test:health",
    "test:pay-17": "npm run test:pay-17",
    "test:browser": "npm run test:browser",
  };
  if (options.omitCommand) {
    delete scripts[options.omitCommand];
  }
  await writeFile(path.join(root, "package.json"), JSON.stringify({ scripts }, null, 2), "utf8");
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["add", "--all"], { cwd: root });
  execFileSync("git", ["-c", "user.name=Codex Foundry", "-c", "user.email=codex-foundry@local", "commit", "--quiet", "-m", "fixture"], { cwd: root });
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  return { root, commit };
}

describe("buildRepositoryMap", () => {
  it("returns a deterministic read-only PAY-17 service, proof, and command map", async () => {
    const { root, commit } = await fixture();
    const map = await buildRepositoryMap(root, { expectedCommit: commit.slice(0, 7) });

    expect(map).toEqual({
      rootPath: path.resolve(root),
      commit,
      services: [
        { id: "checkout-service", sourcePath: "src/services/checkout-service.ts" },
        { id: "payment-gateway", sourcePath: "src/services/payment-gateway.ts" },
      ],
      pay17TestPath: "tests/payment-service.pay-17.test.ts",
      browserTestPath: "tests/browser/pay-17.spec.ts",
      commands: {
        build: "npm run build",
        health: "npm run test:health",
        pay17: "npm run test:pay-17",
        browser: "npm run test:browser",
      },
    });
  });

  it("fails closed for a mismatched commit, missing path, or missing command", async () => {
    const wrongCommit = await fixture();
    await expect(buildRepositoryMap(wrongCommit.root, { expectedCommit: "not-the-baseline" }))
      .rejects.toThrow("does not match frozen baseline");

    const missingPath = await fixture({ omitPath: "tests/browser/pay-17.spec.ts" });
    await expect(buildRepositoryMap(missingPath.root, { expectedCommit: missingPath.commit.slice(0, 7) }))
      .rejects.toThrow("tests/browser/pay-17.spec.ts");

    const missingCommand = await fixture({ omitCommand: "test:browser" });
    await expect(buildRepositoryMap(missingCommand.root, { expectedCommit: missingCommand.commit.slice(0, 7) }))
      .rejects.toThrow("test:browser");
  });
});
