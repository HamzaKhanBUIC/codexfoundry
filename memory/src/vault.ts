import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { buildMemoryGraph } from "./graph.js";
import type {
  ConfidenceLevel,
  MemoryDocument,
  MemoryDocumentType,
  MemoryFrontmatter,
  VaultIndex,
} from "./models.js";
import { CONFIDENCE_LEVELS, MEMORY_DOCUMENT_TYPES } from "./models.js";

function asString(value: unknown, field: string, filePath: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${filePath}: frontmatter field '${field}' must be a non-empty string.`);
  }
  return value.trim();
}

function asStringArray(value: unknown, field: string, filePath: string): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${filePath}: frontmatter field '${field}' must be a string array.`);
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
}

function optionalDate(value: unknown, field: string, filePath: string): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const text = asString(value, field, filePath);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${filePath}: frontmatter field '${field}' must be an ISO-8601 date.`);
  }
  return date;
}

function wikiLinks(body: string): string[] {
  return [...new Set([...body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)].map((match) => match[1].trim()))];
}

function estimateTokens(value: string): number {
  return Math.ceil(value.trim().length / 4);
}

function parseFrontmatter(data: Record<string, unknown>, filePath: string): MemoryFrontmatter {
  const type = asString(data.type, "type", filePath) as MemoryDocumentType;
  const confidence = asString(data.confidence, "confidence", filePath) as ConfidenceLevel;
  const staleness = data.staleness === undefined ? undefined : asString(data.staleness, "staleness", filePath);

  if (!MEMORY_DOCUMENT_TYPES.includes(type)) {
    throw new Error(`${filePath}: unsupported memory document type '${type}'.`);
  }
  if (!CONFIDENCE_LEVELS.includes(confidence)) {
    throw new Error(`${filePath}: unsupported confidence level '${confidence}'.`);
  }
  if (staleness !== undefined && staleness !== "fresh" && staleness !== "stale") {
    throw new Error(`${filePath}: staleness must be 'fresh' or 'stale'.`);
  }

  return {
    id: asString(data.id, "id", filePath),
    type,
    title: asString(data.title, "title", filePath),
    summary: data.summary === undefined ? undefined : asString(data.summary, "summary", filePath),
    services: asStringArray(data.services, "services", filePath),
    requirements: asStringArray(data.requirements, "requirements", filePath),
    tags: asStringArray(data.tags, "tags", filePath),
    links: asStringArray(data.links, "links", filePath),
    evidence: asStringArray(data.evidence, "evidence", filePath),
    verifiedCommit: data.verified_commit === undefined ? undefined : asString(data.verified_commit, "verified_commit", filePath),
    verifiedAt: optionalDate(data.verified_at, "verified_at", filePath),
    confidence,
    declaredStaleness: staleness,
  };
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "_templates" ? [] : markdownFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md" ? [fullPath] : [];
  }));
  return nested.flat().sort();
}

function buildRelationIndex(
  documents: MemoryDocument[],
  relation: (document: MemoryDocument) => string[],
): ReadonlyMap<string, readonly MemoryDocument[]> {
  const index = new Map<string, MemoryDocument[]>();
  for (const document of documents) {
    for (const value of relation(document)) {
      const key = value.toLowerCase();
      const entries = index.get(key) ?? [];
      entries.push(document);
      index.set(key, entries);
    }
  }
  return new Map([...index.entries()].map(([key, entries]) => [
    key,
    entries.sort((left, right) => left.id.localeCompare(right.id)),
  ]));
}

export async function loadVault(vaultPath: string): Promise<VaultIndex> {
  const files = await markdownFiles(vaultPath);
  const documents = await Promise.all(files.map(async (filePath): Promise<MemoryDocument> => {
    const source = await readFile(filePath, "utf8");
    const parsed = matter(source);
    const sourcePath = path.relative(vaultPath, filePath).split(path.sep).join("/");
    const frontmatter = parseFrontmatter(parsed.data as Record<string, unknown>, sourcePath);
    return {
      ...frontmatter,
      sourcePath,
      body: parsed.content.trim(),
      wikiLinks: wikiLinks(parsed.content),
      estimatedTokens: estimateTokens(source),
    };
  }));

  const sortedDocuments = documents.sort((left, right) => left.id.localeCompare(right.id));
  const byId = new Map<string, MemoryDocument>();
  for (const document of sortedDocuments) {
    if (byId.has(document.id)) {
      throw new Error(`Duplicate memory document id '${document.id}'.`);
    }
    byId.set(document.id, document);
  }

  return {
    rootPath: vaultPath,
    documents: sortedDocuments,
    byId,
    byService: buildRelationIndex(sortedDocuments, (document) => document.services),
    byRequirement: buildRelationIndex(sortedDocuments, (document) => document.requirements),
    byEvidence: buildRelationIndex(sortedDocuments, (document) => document.evidence),
    byTag: buildRelationIndex(sortedDocuments, (document) => document.tags),
    graph: buildMemoryGraph(sortedDocuments),
  };
}
