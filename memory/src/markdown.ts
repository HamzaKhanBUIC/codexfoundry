import type { MemoryPack, OmittedSourceReference, SourceSelection } from "./models.js";

function estimateTokens(value: string): number {
  return Math.ceil(value.trim().length / 4);
}

function formatSource(source: SourceSelection): string {
  const hops = source.graphDistance && source.graphDistance > 0 ? `; graph distance ${source.graphDistance}` : "";
  return `### [[${source.document.id}]] — ${source.document.title}

Source path: \`${source.document.sourcePath}\`

Reason: ${source.inclusionReason}. Relevance: ${source.relevanceScore}; confidence: ${source.document.confidenceScore}; freshness: ${source.document.freshness}${hops}.

${source.document.body}`;
}

function formatOmission(omission: OmittedSourceReference): string {
  return `- [[${omission.id}]] — ${omission.title}. Reason: ${omission.reason}. Freshness: ${omission.freshness}; confidence: ${omission.confidenceScore}.`;
}

export function renderMemoryPackMarkdown(pack: MemoryPack): string {
  const selected = pack.sources.length > 0 ? pack.sources.map(formatSource).join("\n") : "- No trustworthy sources selected.";
  const omitted = pack.omittedSources.length > 0 ? pack.omittedSources.map(formatOmission).join("\n") : "- No relevant sources omitted.";

  return `---
id: ${pack.id}
type: memory-pack
task_id: ${pack.task.id}
generated_at: ${pack.generatedAt.toISOString()}
estimated_tokens: ${pack.estimatedTokens}
token_budget: ${pack.tokenBudget}
confidence_score: ${pack.confidenceScore}
---

# Memory Pack — ${pack.task.id}

## Task

${pack.task.title}

## Selected trustworthy context

${selected}

## Omitted context

${omitted}

## Compiler contract

This pack was assembled deterministically from Markdown frontmatter, explicit Obsidian links, task relationships, freshness, confidence, and the token budget. It contains the selected source context only; omitted sources are represented by safe reference metadata.
`;
}

export function estimateRenderedMemoryPackTokens(pack: MemoryPack): number {
  return estimateTokens(renderMemoryPackMarkdown(pack));
}
