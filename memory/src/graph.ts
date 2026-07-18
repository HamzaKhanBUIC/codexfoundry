import type { GraphEdge, GraphNode, MemoryDocument, MemoryGraph } from "./models.js";

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

export function buildMemoryGraph(documents: MemoryDocument[]): MemoryGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const knownIds = new Set(documents.map((document) => document.id));

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
      const id = knownIds.has(link) ? link : `reference:${link}`;
      addNode(nodes, { id, kind: knownIds.has(link) ? "memory" : "reference", label: link });
      addEdge(edges, { from: document.id, to: id, relation: "links-to" });
    }
  }

  const graphNodes = [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  const graphEdges = [...edges].sort((left, right) =>
    `${left.from}:${left.to}:${left.relation}`.localeCompare(`${right.from}:${right.to}:${right.relation}`),
  );

  return {
    nodes: graphNodes,
    edges: graphEdges,
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
  };
}
