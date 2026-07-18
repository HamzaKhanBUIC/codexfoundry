import type { DanglingLink, GraphEdge, GraphNode, MemoryDocument, MemoryGraph } from "./models.js";

function addNode(nodes: Map<string, GraphNode>, node: GraphNode): void {
  if (!nodes.has(node.id)) {
    nodes.set(node.id, node);
  }
}

function addEdge(edges: GraphEdge[], edge: GraphEdge): void {
  if (!edges.some((item) => item.from === edge.from && item.to === edge.to && item.relation === edge.relation)) {
    edges.push(edge);
  }
}

function normalizeLinkTarget(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function sourcePathStem(sourcePath: string): string {
  return sourcePath.replace(/\.md$/i, "");
}

function fileNameStem(sourcePath: string): string {
  return sourcePathStem(sourcePath).split("/").at(-1)!;
}

function canonicalLinkTargets(documents: MemoryDocument[]): ReadonlyMap<string, string> {
  const targets = new Map<string, string>();
  for (const document of documents) {
    for (const target of [document.id, sourcePathStem(document.sourcePath), fileNameStem(document.sourcePath), ...document.aliases]) {
      const normalized = normalizeLinkTarget(target);
      const existing = targets.get(normalized);
      if (existing && existing !== document.id) {
        throw new Error(`Ambiguous Obsidian link target '${target}' resolves to both '${existing}' and '${document.id}'.`);
      }
      targets.set(normalized, document.id);
    }
  }
  return targets;
}

export function buildMemoryGraph(documents: MemoryDocument[]): MemoryGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const knownIds = new Set(documents.map((document) => document.id));
  const targets = canonicalLinkTargets(documents);
  const danglingLinks: DanglingLink[] = [];

  for (const document of documents) {
    addNode(nodes, { id: document.id, kind: "memory", label: document.title });

    for (const service of document.services) {
      const id = `service:${service}`;
      addNode(nodes, { id, kind: "service", label: service });
      addEdge(edges, { from: document.id, to: id, relation: "serves" });
    }

    for (const requirement of document.requirements) {
      const id = `requirement:${requirement}`;
      addNode(nodes, { id, kind: "requirement", label: requirement });
      addEdge(edges, { from: document.id, to: id, relation: "addresses" });
    }

    for (const evidence of document.evidence) {
      const id = `evidence:${evidence}`;
      addNode(nodes, { id, kind: "evidence", label: evidence });
      addEdge(edges, { from: document.id, to: id, relation: "evidenced-by" });
    }

    for (const link of [...document.links, ...document.wikiLinks]) {
      const targetId = targets.get(normalizeLinkTarget(link));
      if (targetId) {
        addEdge(edges, { from: document.id, to: targetId, relation: "links-to" });
      } else if (!danglingLinks.some((item) => item.fromDocumentId === document.id && item.target === link)) {
        danglingLinks.push({ fromDocumentId: document.id, target: link });
      }
    }
  }

  const graphNodes = [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  const graphEdges = [...edges].sort((left, right) =>
    `${left.from}:${left.to}:${left.relation}`.localeCompare(`${right.from}:${right.to}:${right.relation}`),
  );

  return {
    nodes: graphNodes,
    edges: graphEdges,
    danglingLinks: danglingLinks.sort((left, right) =>
      `${left.fromDocumentId}:${left.target}`.localeCompare(`${right.fromDocumentId}:${right.target}`),
    ),
    adjacentDocumentIds(documentId: string): string[] {
      const adjacent = new Set<string>();
      for (const edge of graphEdges) {
        if (edge.from === documentId && knownIds.has(edge.to)) {
          adjacent.add(edge.to);
        }
        if (edge.to === documentId && knownIds.has(edge.from)) {
          adjacent.add(edge.from);
        }
      }
      return [...adjacent].sort();
    },
    outboundLinkedDocumentIds(documentId: string): string[] {
      return graphEdges
        .filter((edge) => edge.from === documentId && edge.relation === "links-to" && knownIds.has(edge.to))
        .map((edge) => edge.to)
        .sort();
    },
  };
}
