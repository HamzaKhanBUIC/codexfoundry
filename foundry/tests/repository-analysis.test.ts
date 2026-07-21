import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeLocalRepository } from "../src/repository-analysis.js";

const vaultPath = path.resolve(import.meta.dirname, "../../vault");

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "foundry-repository-analysis-"));
  await Promise.all([
    mkdir(path.join(root, "src", "controllers"), { recursive: true }),
    mkdir(path.join(root, "src", "services"), { recursive: true }),
    mkdir(path.join(root, "src", "repositories"), { recursive: true }),
    mkdir(path.join(root, "tests"), { recursive: true }),
    mkdir(path.join(root, ".github", "workflows"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(root, "package.json"), JSON.stringify({
      scripts: {
        build: "tsc --noEmit",
        test: "node -e \"require('node:fs').writeFileSync('SCRIPT_RAN', 'unexpected')\"",
        dev: "vite",
      },
      dependencies: { express: "1.0.0" },
      devDependencies: { typescript: "1.0.0", vitest: "1.0.0" },
    })),
    writeFile(path.join(root, "src", "controllers", "order-controller.ts"), "import { checkout } from '../services/order-service.js';\nexport const controller = checkout;\n"),
    writeFile(path.join(root, "src", "services", "order-service.ts"), "import { save } from '../repositories/order-repository.js';\nimport { cycle } from './cycle.js';\n// TODO: add payment receipt reconciliation\nexport const checkout = (input: string) => { if (input) return save(cycle(input)); return input; };\n"),
    writeFile(path.join(root, "src", "services", "cycle.ts"), "import { checkout } from './order-service.js';\nexport const cycle = (value: string) => checkout(value);\n"),
    writeFile(path.join(root, "src", "repositories", "order-repository.ts"), "export const save = (value: string) => value;\n"),
    writeFile(path.join(root, "tests", "order.test.ts"), "import { expect, it } from 'vitest'; it('works', () => expect(true).toBe(true));\n"),
    writeFile(path.join(root, ".github", "workflows", "test.yml"), "name: test\n"),
    writeFile(path.join(root, "README.md"), "# Checkout service\n"),
    writeFile(path.join(root, ".env"), "INTENTIONALLY_NOT_READ=demo\n"),
    writeFile(path.join(root, "src", "risk.ts"), "export const execute = (value: string) => eval(value);\n"),
  ]);
  execFileSync("git", ["init"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@example.test", "commit", "-m", "fixture"], { cwd: root });
  return root;
}

async function languageFixture(name: string, files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), `foundry-repository-${name}-`));
  await Promise.all(Object.entries(files).map(async ([relative, content]) => {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await writeFile(path.join(root, relative), content, "utf8");
  }));
  execFileSync("git", ["init"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@example.test", "commit", "-m", "fixture"], { cwd: root });
  return root;
}

describe("local repository analysis", () => {
  it("derives evidence-backed static intelligence without executing repository scripts", async () => {
    const root = await fixture();
    const analysis = await analyzeLocalRepository(root, vaultPath);

    expect(analysis.repository.name).toBe(path.basename(root));
    expect(analysis.repository.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(analysis.git.items.totalCommits).toBe(1);
    expect(analysis.summary.languages).toContain("TypeScript");
    expect(analysis.summary.frameworks).toContain("Express");
    expect(analysis.commands.test).toEqual(["npm run test"]);
    expect(analysis.entryPoints.items.some((item) => item.path.includes("order-service"))).toBe(false);
    expect(analysis.moduleGraph.items.internalEdges.length).toBeGreaterThan(2);
    expect(analysis.moduleGraph.items.circularDependencies).toHaveLength(1);
    expect(analysis.testSystem.items.testFiles).toContain("tests/order.test.ts");
    expect(analysis.security.items.some((item) => item.title === "Sensitive configuration path present")).toBe(true);
    expect(analysis.security.items.some((item) => item.title === "Dynamic execution API")).toBe(true);
    expect(analysis.todos.items).toHaveLength(1);
    expect(analysis.technicalDebt.items[0]?.title).toContain("TODO");
    expect(analysis.health.items.overallScore).not.toBeNull();
    expect(analysis.health.items.categories.every((category) => category.scoreExplanation.length > 0 && category.evidence.every((item) => item.id.length > 0 && item.confidence !== undefined))).toBe(true);
    expect(analysis.health.items.categories.every((category) => category.crossReferences.every((reference) => reference.kind === "evidence" || reference.kind === "finding"))).toBe(true);
    expect(analysis.suggestions.map((task) => task.rank)).toEqual(analysis.suggestions.map((_, index) => index + 1));
    expect(analysis.suggestions.every((task) => task.rank > 0 && task.evidence.length > 0 && task.evidence.every((item) => item.id.length > 0 && item.source.length > 0 && item.confidence !== undefined) && task.priorityReasoning.length > 0 && task.estimatedEngineeringEffort.rationale.length > 0 && task.businessImpact.explanation.length > 0 && task.engineeringImpact.explanation.length > 0 && task.developerProductivityImpact.explanation.length > 0 && task.riskIfIgnored.length > 0 && task.successCriteria.length > 0 && task.crossReferences.length > 0)).toBe(true);
    expect(analysis.decisionSupport.repositoryDna.items.repositoryName).toBe(path.basename(root));
    expect(analysis.decisionSupport.repositoryDna.items.repositorySize.files).toBeGreaterThan(0);
    expect(analysis.decisionSupport.readiness.items.state).toBe("needs_manual_review");
    expect(analysis.decisionSupport.readiness.items.evidenceIds.length).toBeGreaterThan(0);
    expect(analysis.decisionSupport.executiveBriefing.items.text).toContain("Readiness:");
    expect(analysis.decisionSupport.repositoryStory.items.text).toContain("bounded AI planning");
    expect(analysis.decisionSupport.readiness.decision.evidenceIds).toEqual(analysis.decisionSupport.readiness.evidence.map((item) => item.id));
    expect(analysis.decisionSupport.readiness.items.notRecommended).toContain("Codex implementation");
    const orderService = analysis.architectureExplorer.items.entities.find((entity) => entity.kind === "file" && entity.path === "src/services/order-service.ts");
    expect(orderService).toMatchObject({ moduleType: "service module" });
    expect(orderService?.imports.map((item) => item.target)).toEqual(expect.arrayContaining(["src/repositories/order-repository.ts", "src/services/cycle.ts"]));
    expect(orderService?.exportedSymbols).toEqual(expect.arrayContaining([expect.objectContaining({ name: "checkout", kind: "constant", sourcePath: "src/services/order-service.ts" })]));
    expect(orderService?.incomingDependencies.map((item) => item.target)).toEqual(expect.arrayContaining(["src/controllers/order-controller.ts", "src/services/cycle.ts"]));
    expect(orderService?.changeImpact.impactedModules.map((item) => item.path)).toEqual(expect.arrayContaining(["src/controllers/order-controller.ts", "src/services/cycle.ts"]));
    expect(orderService?.changeImpact.estimatedBlastRadius.directDependents).toBe(2);
    expect(orderService?.changeImpact.unknowns.join(" ")).toContain("Runtime call paths");
    const servicesDirectory = analysis.architectureExplorer.items.entities.find((entity) => entity.kind === "directory" && entity.path === "src/services");
    expect(servicesDirectory?.responsibility.summary).toContain("Directory grouping 2");
    expect(analysis.architectureExplorer.items.totalFiles).toBeGreaterThan(0);
    expect(analysis.architectureExplorer.evidence.length).toBeGreaterThan(0);
    expect(analysis.trust).toMatchObject({ execution: "not_available", verifier: "not_invoked", vault: "not_written", facts: "read_only" });
    await expect(access(path.join(root, "SCRIPT_RAN"))).rejects.toThrow();
  });

  it("rejects a path that is not a Git repository", async () => {
    await expect(analyzeLocalRepository(os.tmpdir(), vaultPath)).rejects.toThrow("local Git repository");
  });

  it("cites the bounded inventory when a negative finding creates a task", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "foundry-repository-analysis-no-tests-"));
    await writeFile(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"require('node:fs').writeFileSync('SCRIPT_RAN', 'unexpected')\"" } }));
    await writeFile(path.join(root, "index.ts"), "export const value = 1;\n");
    execFileSync("git", ["init"], { cwd: root });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@example.test", "commit", "-m", "fixture"], { cwd: root });

    const analysis = await analyzeLocalRepository(root, vaultPath);
    const testTask = analysis.suggestions.find((task) => task.title === "Establish a deterministic test boundary");
    expect(analysis.testSystem.items.missing).toHaveLength(1);
    expect(analysis.testSystem.evidence.some((item) => item.source === "bounded file inventory")).toBe(true);
    expect(testTask?.evidence.some((item) => item.source === "bounded file inventory")).toBe(true);
    expect(analysis.decisionSupport.readiness.items.state).toBe("safe_for_bounded_ai_planning");
    expect(analysis.decisionSupport.readiness.items.recommendation).toContain("bounded plan");
    await expect(access(path.join(root, "SCRIPT_RAN"))).rejects.toThrow();
  });

  it("escalates multiple code-level review signals without executing the repository", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "foundry-repository-analysis-high-risk-"));
    await Promise.all([
      writeFile(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"require('node:fs').writeFileSync('SCRIPT_RAN', 'unexpected')\"" } })),
      writeFile(path.join(root, "index.ts"), "export const compute = (value: string) => eval(value);\nexport const html = { dangerouslySetInnerHTML: { __html: '<p>untrusted</p>' } };\n"),
    ]);
    execFileSync("git", ["init"], { cwd: root });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@example.test", "commit", "-m", "fixture"], { cwd: root });

    const analysis = await analyzeLocalRepository(root, vaultPath);
    expect(analysis.decisionSupport.readiness.items.state).toBe("high_risk_repository");
    expect(analysis.decisionSupport.readiness.items.label).toBe("HIGH-RISK REPOSITORY");
    expect(analysis.decisionSupport.readiness.items.reasoning).toHaveLength(2);
    expect(analysis.decisionSupport.readiness.items.notRecommended).toContain("Bounded AI planning");
    await expect(access(path.join(root, "SCRIPT_RAN"))).rejects.toThrow();
  });

  it("does not treat inert detector-pattern declarations as security use sites", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "foundry-repository-analysis-patterns-"));
    await Promise.all([
      writeFile(path.join(root, "package.json"), JSON.stringify({ scripts: { test: "node -e \"require('node:fs').writeFileSync('SCRIPT_RAN', 'unexpected')\"" } })),
      writeFile(path.join(root, "index.ts"), "export const rules = [{ pattern: /eval\\(/ }, { pattern: /dangerouslySetInnerHTML/ }];\nexport const value = 1;\n"),
    ]);
    execFileSync("git", ["init"], { cwd: root });
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["-c", "user.name=Foundry Test", "-c", "user.email=foundry@example.test", "commit", "-m", "fixture"], { cwd: root });

    const analysis = await analyzeLocalRepository(root, vaultPath);
    expect(analysis.security.items.filter((item) => item.title !== "Sensitive configuration path present")).toHaveLength(0);
    expect(analysis.decisionSupport.readiness.items.state).toBe("safe_for_bounded_ai_planning");
    await expect(access(path.join(root, "SCRIPT_RAN"))).rejects.toThrow();
  });

  it.each([
    ["react", {
      "package.json": JSON.stringify({ dependencies: { react: "1.0.0", vite: "1.0.0" }, scripts: { build: "vite build", test: "vitest" } }),
      "src/main.tsx": "import React from 'react'; export const App = () => <main />;\n",
      "src/App.test.tsx": "export const test = true;\n",
    }, "TypeScript", "React", "npm"],
    ["node-api", {
      "package.json": JSON.stringify({ dependencies: { express: "1.0.0" }, scripts: { start: "node src/server.js", test: "node tests/server.test.js" } }),
      "src/server.js": "const express = require('express'); const app = express(); app.get('/health', (_, res) => res.send('ok'));\n",
      "tests/server.test.js": "console.log('test convention');\n",
    }, "JavaScript", "Express", "npm"],
    ["python", {
      "pyproject.toml": "[project]\nname = 'notes'\ndependencies = ['fastapi', 'pytest']\n",
      "src/app.py": "from fastapi import FastAPI\napp = FastAPI()\n",
      "tests/test_app.py": "def test_health():\n    assert True\n",
    }, "Python", "FastAPI", "Python packaging (pyproject)"],
    ["java", {
      "pom.xml": "<project><dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot</artifactId></dependency><dependency><groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId></dependency></dependencies></project>",
      "src/main/java/demo/Application.java": "public class Application { public static void main(String[] args) {} }\n",
      "src/test/java/demo/ApplicationTest.java": "public class ApplicationTest {}\n",
    }, "Java", "Spring", "Maven"],
    ["cpp", {
      "CMakeLists.txt": "cmake_minimum_required(VERSION 3.20)\nproject(sample)\nadd_executable(sample src/main.cpp)\n",
      "src/main.cpp": "int main() { return 0; }\n",
      "tests/sample_test.cpp": "int main() { return 0; }\n",
    }, "C++", undefined, undefined],
  ])("analyzes a %s repository without executing it", async (_name, files, language, framework, packageManager) => {
    const root = await languageFixture(_name, files);
    const analysis = await analyzeLocalRepository(root, vaultPath);
    expect(analysis.summary.languages).toContain(language);
    if (framework) expect(analysis.summary.frameworks).toContain(framework);
    if (packageManager) expect(analysis.summary.packageManagers).toContain(packageManager);
    expect(analysis.repository.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(analysis.coverage.sourceFilesRead).toBeGreaterThan(0);
    expect(analysis.decisionSupport.readiness.items.evidenceIds.length).toBeGreaterThan(0);
    expect(analysis.suggestions.every((task) => task.evidence.length > 0 && task.crossReferences.some((reference) => reference.kind === "evidence"))).toBe(true);
  });
});
