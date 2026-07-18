import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { RepositoryMap } from "./models.js";

export const FROZEN_DEMO_STORE_COMMIT = "1169daf";

const requiredPaths = {
  checkoutService: "src/services/checkout-service.ts",
  paymentGateway: "src/services/payment-gateway.ts",
  pay17Test: "tests/payment-service.pay-17.test.ts",
  browserTest: "tests/browser/pay-17.spec.ts",
} as const;

const requiredCommands = {
  build: "build",
  health: "test:health",
  pay17: "test:pay-17",
  browser: "test:browser",
} as const;

interface PackageManifest {
  scripts?: Record<string, unknown>;
}

function readCommit(repositoryPath: string): string {
  return execFileSync("git", ["-C", repositoryPath, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

async function requirePath(repositoryPath: string, relativePath: string): Promise<void> {
  try {
    await access(path.join(repositoryPath, relativePath));
  } catch {
    throw new Error(`Repository map requires '${relativePath}', but it is missing.`);
  }
}

function requireCommand(scripts: Record<string, unknown>, name: string): string {
  const command = scripts[name];
  if (typeof command !== "string" || command.trim().length === 0) {
    throw new Error(`Repository map requires package script '${name}', but it is missing.`);
  }
  return command;
}

export interface BuildRepositoryMapOptions {
  expectedCommit?: string;
}

export async function buildRepositoryMap(
  repositoryPath: string,
  options: BuildRepositoryMapOptions = {},
): Promise<RepositoryMap> {
  const rootPath = path.resolve(repositoryPath);
  const expectedCommit = options.expectedCommit ?? FROZEN_DEMO_STORE_COMMIT;
  const commit = readCommit(rootPath);
  if (!commit.startsWith(expectedCommit)) {
    throw new Error(`Repository commit '${commit}' does not match frozen baseline '${expectedCommit}'.`);
  }

  await Promise.all(Object.values(requiredPaths).map((relativePath) => requirePath(rootPath, relativePath)));
  const packageManifest = JSON.parse(await readFile(path.join(rootPath, "package.json"), "utf8")) as PackageManifest;
  const scripts = packageManifest.scripts ?? {};

  return {
    rootPath,
    commit,
    services: [
      { id: "checkout-service", sourcePath: requiredPaths.checkoutService },
      { id: "payment-gateway", sourcePath: requiredPaths.paymentGateway },
    ],
    pay17TestPath: requiredPaths.pay17Test,
    browserTestPath: requiredPaths.browserTest,
    commands: {
      build: requireCommand(scripts, requiredCommands.build),
      health: requireCommand(scripts, requiredCommands.health),
      pay17: requireCommand(scripts, requiredCommands.pay17),
      browser: requireCommand(scripts, requiredCommands.browser),
    },
  };
}
