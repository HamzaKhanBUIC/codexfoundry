import type { MemoryPack, OmittedSource, SourceSelection } from "./models.js";

function formatSource(source: SourceSelection): string {
  const hops = source.graphDistance && source.graphDistance > 0 ? `; graph distance ${source.graphDistance}` : "";
  return `- [[${source.document.id}]] — ${source.document.title}  \n  Reason: ${source.inclusionReason}. Relevance: ${source.relevanceScore}; confidence: ${source.document.confidenceScore}; freshness: ${source.document.freshness}; estimated tokens: ${source.document.estimatedTokens}${hops}.`;
}

function formatOmission(omission: OmittedSource): string {
  return `- [[${omission.document.id}]] — ${omission.reason}.`;
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

This pack was assembled deterministically from Markdown frontmatter, explicit Obsidian links, task relationships, freshness, confidence, and the token budget. It contains references and source paths rather than unbounded repository content.
`;
}
