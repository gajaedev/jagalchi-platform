import { normalizeAiJobRequest, normalizeAiJobResponse } from './ai-job-contract';
import { apiClient } from './client';

import type {
  AiJobFeature,
  AiJobRequestMap,
  AiJobResponseMap,
  GeneratedRoadmap,
} from './ai-job-contract';

export type {
  AiJobFeature,
  AiJobRequestMap,
  AiJobResponseMap,
  DeepSearchResponse,
  DocumentConversionResponse,
  GeneratedRoadmap,
  LearningCoachResponse,
  NodeDescriptionResponse,
  RecordCoachResponse,
  ResourceItem,
  ResourceRecommendationResponse,
  RetrievalEvidence,
} from './ai-job-contract';

export interface PersistedRoadmap {
  id: string;
  ownerId: string;
  title: string;
}

export async function runAiJob<Feature extends AiJobFeature>(
  feature: Feature,
  payload: AiJobRequestMap[Feature],
  roadmapId?: string,
): Promise<AiJobResponseMap[Feature]> {
  const normalizedRequest = normalizeAiJobRequest(feature, payload);
  const response = await apiClient.post<unknown>('/ai/jobs', {
    feature,
    idempotencyKey: crypto.randomUUID(),
    payload: normalizedRequest,
    ...(roadmapId ? { roadmapId } : {}),
  });
  return normalizeAiJobResponse(feature, response);
}

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
