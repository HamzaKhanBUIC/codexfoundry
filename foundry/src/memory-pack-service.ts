import { createHash } from "node:crypto";
import {
  compileMemoryPack,
  loadVault,
  renderMemoryPackMarkdown,
  type CompileOptions,
  type MemoryPack,
  type TaskInput,
} from "@codex-foundry/memory";
import type { IntakeTask, StoredMemoryPackOmission, StoredMemoryPackSource } from "./models.js";
import { MemoryPackRepository, type CreateStoredMemoryPackInput } from "./memory-pack-repository.js";

export function toMemoryPackTask(task: IntakeTask): TaskInput {
  return {
    id: task.taskId,
    title: task.title,
    services: [...task.services],
    requirements: [task.taskId],
    paths: [...task.paths],
    repositoryCommit: task.repositoryCommit,
  };
}

function sources(pack: MemoryPack): StoredMemoryPackSource[] {
  return pack.sources.map((source) => ({
    id: source.document.id,
    title: source.document.title,
    sourcePath: source.document.sourcePath,
    inclusionReason: source.inclusionReason,
    relevanceScore: source.relevanceScore,
    confidenceScore: source.document.confidenceScore,
    freshness: source.document.freshness,
    graphDistance: source.graphDistance,
  }));
}

function omissions(pack: MemoryPack): StoredMemoryPackOmission[] {
  return pack.omittedSources.map((source) => ({
    id: source.id,
    title: source.title,
    confidenceScore: source.confidenceScore,
    freshness: source.freshness,
    reason: source.reason,
  }));
}

export interface CompilePay17MemoryPackOptions {
  vaultPath: string;
  compilerOptions?: CompileOptions;
}

/**
 * Reads the vault once, compiles the deterministic pack, and persists only
 * the exact rendered payload plus bodyless selection metadata.
 */
export async function compileAndPersistPay17MemoryPack(
  packs: MemoryPackRepository,
  runId: string,
  task: IntakeTask,
  options: CompilePay17MemoryPackOptions,
) {
  const index = await loadVault(options.vaultPath);
  const pack = compileMemoryPack(index, toMemoryPackTask(task), options.compilerOptions);
  const renderedPayload = renderMemoryPackMarkdown(pack);
  const record: CreateStoredMemoryPackInput = {
    id: pack.id,
    runId,
    taskId: task.taskId,
    repositoryCommit: task.repositoryCommit,
    renderedPayload,
    payloadSha256: createHash("sha256").update(renderedPayload, "utf8").digest("hex"),
    estimatedTokens: pack.estimatedTokens,
    tokenBudget: pack.tokenBudget,
    confidenceScore: pack.confidenceScore,
    sources: sources(pack),
    omittedSources: omissions(pack),
    generatedAt: pack.generatedAt.toISOString(),
  };
  return packs.saveForIntakeRun(record);
}
