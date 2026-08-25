import { apiClient } from './client';

export type AiJobFeature =
  | 'coaching'
  | 'node_explanation'
  | 'resource_recommendation'
  | 'deep_search'
  | 'feedback'
  | 'roadmap_generation'
  | 'document_conversion';

interface GeneratedRoadmapNode {
  node_id: string;
  title: string;
  tags: string[];
}

interface GeneratedRoadmapEdge {
  source: string;
  target: string;
}

export interface GeneratedRoadmap {
  roadmap_id: string;
  title: string;
  description: string;
  nodes: GeneratedRoadmapNode[];
  edges: GeneratedRoadmapEdge[];
  tags: string[];
}

export interface PersistedRoadmap {
  id: string;
  ownerId: string;
  title: string;
}

type ComposeLevel = 'quick' | 'full';

interface AiJobPayloadMap {
  coaching: { question: string; compose_level?: ComposeLevel };
  node_explanation: { node_title: string; context?: string };
  resource_recommendation: { query: string; top_k?: number; recency_days?: number };
  deep_search: { query: string; top_k?: number };
  feedback: { node_id: string; compose_level?: ComposeLevel };
  roadmap_generation: {
    goal: string;
    preferred_tags?: string | string[];
    max_nodes?: number;
    compose_level?: ComposeLevel;
  };
  document_conversion: { document: string; goal?: string };
}

interface AiJobResponseMap {
  coaching: unknown;
  node_explanation: unknown;
  resource_recommendation: unknown;
  deep_search: unknown;
  feedback: unknown;
  roadmap_generation: GeneratedRoadmap;
  document_conversion: unknown;
}

export const runAiJob = <Feature extends AiJobFeature>(
  feature: Feature,
  payload: AiJobPayloadMap[Feature],
  roadmapId?: string,
) =>
  apiClient.post<AiJobResponseMap[Feature]>('/ai/jobs', {
    feature,
    idempotencyKey: crypto.randomUUID(),
    payload,
    ...(roadmapId ? { roadmapId } : {}),
  });

export const persistGeneratedRoadmap = (generated: GeneratedRoadmap) => {
  const nodes = generated.nodes.map((node, index) => ({
    id: node.node_id,
    type: 'jagalchi-node' as const,
    position: {
      x: (index % 3) * 280,
      y: Math.floor(index / 3) * 180,
    },
    data: {
      label: node.title,
      description: '',
      tags: node.tags,
      resources: [],
      variant: 'white',
      isLocked: false,
    },
  }));
  const edges = generated.edges.map((edge, index) => ({
    id: `edge-${index + 1}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
  }));
  return apiClient.post<PersistedRoadmap>('/roadmaps', {
    title: generated.title,
    description: generated.description,
    tags: generated.tags,
    visibility: 'PRIVATE',
    graph: { schemaVersion: 1, nodes, edges },
  });
};
