export const MEMORY_DOCUMENT_TYPES = [
  "architecture",
  "adr",
  "incident",
  "proof",
  "evaluation",
  "service",
] as const;

export type MemoryDocumentType = (typeof MEMORY_DOCUMENT_TYPES)[number];

export const CONFIDENCE_LEVELS = ["draft", "reviewed", "verified"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type FreshnessStatus = "fresh" | "aging" | "stale" | "unverified";

export const EVIDENCE_KINDS = ["test", "browser", "source", "issue", "commit", "other", "legacy"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export interface EvidenceReference {
  kind: EvidenceKind;
  reference: string;
  verified: boolean;
}

export interface MemoryFrontmatter {
  id: string;
  type: MemoryDocumentType;
  title: string;
  summary?: string;
  services: string[];
  requirements: string[];
  tags: string[];
  aliases: string[];
  links: string[];
  evidence: EvidenceReference[];
  verifiedCommit?: string;
  verifiedAt?: Date;
  confidence: ConfidenceLevel;
  declaredStaleness?: "fresh" | "stale";
}

export interface MemoryDocument extends MemoryFrontmatter {
  sourcePath: string;
  body: string;
  wikiLinks: string[];
  estimatedTokens: number;
}

export interface FreshnessPolicy {
  referenceTime: Date;
  maxAgeDays: number;
  agingThreshold: number;
  repositoryCommit?: string;
}

export interface AssessedDocument extends MemoryDocument {
  freshness: FreshnessStatus;
  confidenceScore: number;
}

export interface TaskInput {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  services?: string[];
  requirements?: string[];
  paths?: string[];
  repositoryCommit?: string;
  explicitDocumentIds?: string[];
  tokenBudget?: number;
  includeStale?: boolean;
}

export interface GraphNode {
  id: string;
  kind: "memory" | "service" | "requirement" | "evidence";
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: "serves" | "addresses" | "evidenced-by" | "links-to";
}

export interface DanglingLink {
  fromDocumentId: string;
  target: string;
}

export interface MemoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  danglingLinks: DanglingLink[];
  adjacentDocumentIds(documentId: string): string[];
  outboundLinkedDocumentIds(documentId: string): string[];
}

export interface VaultIndex {
  rootPath: string;
  documents: MemoryDocument[];
  byId: ReadonlyMap<string, MemoryDocument>;
  byService: ReadonlyMap<string, readonly MemoryDocument[]>;
  byRequirement: ReadonlyMap<string, readonly MemoryDocument[]>;
  byEvidence: ReadonlyMap<string, readonly MemoryDocument[]>;
  byTag: ReadonlyMap<string, readonly MemoryDocument[]>;
  graph: MemoryGraph;
}

export interface SourceSelection {
  document: AssessedDocument;
  relevanceScore: number;
  inclusionReason: string;
  graphDistance?: number;
}

export interface OmittedSourceReference {
  id: string;
  title: string;
  freshness: FreshnessStatus;
  confidenceScore: number;
  reason: string;
}

export interface MemoryPack {
  id: string;
  task: TaskInput;
  generatedAt: Date;
  tokenBudget: number;
  estimatedTokens: number;
  confidenceScore: number;
  sources: SourceSelection[];
  omittedSources: OmittedSourceReference[];
}
