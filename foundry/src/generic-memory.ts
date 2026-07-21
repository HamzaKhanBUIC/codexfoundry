import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenericRunRecord, GenericStagedMemory } from "./generic-run-store.js";
import type { GenericHumanApproval } from "./generic-policy.js";

export interface StagedMarkdownArtifact { id: string; relativePath: string; content: string; }

function safeSegment(value: string): string { return value.replace(/[^A-Za-z0-9-]/g, "-").replace(/-+/g, "-"); }
function markdownList(values: string[]): string { return values.length ? values.map((item) => "- " + item).join("\n") : "- None recorded."; }
function artifact(run: GenericRunRecord, kind: "incident" | "adr" | "proof" | "evaluation", body: string): StagedMarkdownArtifact {
  const id = kind.toUpperCase() + "-" + safeSegment(run.id);
  return { id, relativePath: kind + "s/" + id + ".md", content: ["---", "id: " + id, "type: " + kind, "run_id: " + run.id, "repository_commit: " + run.baselineCommit, "evidence:", "  - kind: run-record", "    reference: " + run.id, "    verified: " + String(kind === "proof" || kind === "evaluation"), "confidence: " + (kind === "proof" || kind === "evaluation" ? "verified" : "reviewed"), "---", "", "# " + id, "", body, ""].join("\n") };
}

/** Renders portable Obsidian Markdown, but does not write a vault. */
export function renderGenericMemory(run: GenericRunRecord): StagedMarkdownArtifact[] {
  if (!run.verification?.passed || !run.patchApproval) throw new Error("Memory can be staged only after independent verification and human patch approval.");
  const plan = run.approvedPlan!;
  return [
    artifact(run, "incident", "## Task\n\n" + run.task.title + "\n\n## Root-cause hypothesis\n\n" + plan.rootCauseHypothesis + "\n\n## Approved scope\n\n" + markdownList(plan.affectedPaths)),
    artifact(run, "adr", "## Decision\n\nPreserve the verified behavior described by the approved plan.\n\n## Why\n\n" + plan.summary + "\n\n## Risks\n\n" + markdownList(plan.risks)),
    artifact(run, "proof", "## Proof contract\n\n" + markdownList(plan.proofContract.map((item) => item.assertion + " (commands: " + item.commandIds.join(", ") + ")")) + "\n\n## Independent verifier\n\n" + markdownList(run.verification.commands.map((item) => item.display + " → exit " + item.exitCode))),
    artifact(run, "evaluation", "## Regression replay\n\n" + (run.regression ? run.regression.status + "\n\n" + run.regression.mutation.reason : "No regression replay has been recorded yet.") + "\n\n## Reuse constraint\n\nUse this evidence only with the repository commit recorded in frontmatter."),
  ];
}

export async function stageGenericMemory(run: GenericRunRecord, stageDirectory: string): Promise<GenericStagedMemory> {
  const artifacts = renderGenericMemory(run);
  for (const item of artifacts) { const destination = path.join(stageDirectory, item.relativePath); await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, item.content, "utf8"); }
  return { artifactIds: artifacts.map((item) => item.id), stageDirectory, stagedAt: new Date().toISOString() };
}

/** Copies only an already approved staged set into a user-selected vault. */
export async function writeApprovedGenericMemory(run: GenericRunRecord, vaultDirectory: string, approval: GenericHumanApproval): Promise<string[]> {
  if (!run.stagedMemory || !approval.actor.trim() || !approval.reason.trim() || Number.isNaN(Date.parse(approval.approvedAt))) throw new Error("Vault write requires a separately supplied human approval and staged memory.");
  const files: string[] = [];
  async function copy(directory: string): Promise<void> { for (const entry of await readdir(directory, { withFileTypes: true })) { const source = path.join(directory, entry.name); if (entry.isDirectory()) await copy(source); else { const relative = path.relative(run.stagedMemory!.stageDirectory, source); if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Staged memory path escapes its owned directory."); const destination = path.join(vaultDirectory, relative); try { await access(destination); throw new Error("Vault destination already exists: " + relative); } catch (error) { if (error instanceof Error && !/ENOENT/.test(error.message)) throw error; } await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, await readFile(source)); files.push(destination); } } }
  await copy(run.stagedMemory.stageDirectory);
  return files;
}
