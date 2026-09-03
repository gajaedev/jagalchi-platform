import { z } from 'zod';

const composeLevel = z.enum(['quick', 'full']);
const jsonObject = z.record(z.string(), z.unknown());
const retrievalEvidence = z.strictObject({
  source: z.string(),
  id: z.string(),
  snippet: z.string(),
});

export const aiJobRequestSchemas = {
  coaching: z.strictObject({
    question: z.string().max(2_000),
    compose_level: composeLevel.optional(),
  }),
  node_explanation: z.strictObject({
    node_title: z.string().max(300),
    context: z.string().max(10_000).optional(),
  }),
  resource_recommendation: z.strictObject({
    query: z.string().max(2_000),
    top_k: z.number().int().min(1).max(20).optional(),
    recency_days: z.number().int().min(0).max(3_650).optional(),
  }),
  deep_search: z.strictObject({
    query: z.string().max(2_000),
    top_k: z.number().int().min(1).max(20).optional(),
  }),
  feedback: z.strictObject({
    node_id: z.string().max(200),
    compose_level: composeLevel.optional(),
  }),
  roadmap_generation: z.strictObject({
    goal: z.string().max(1_000),
    preferred_tags: z.string().optional(),
    max_nodes: z.number().int().min(1).max(30).optional(),
    compose_level: composeLevel.optional(),
  }),
  document_conversion: z.strictObject({
    document: z.string().max(100_000),
    goal: z.string().max(1_000).optional(),
  }),
} as const;

const learningCoachResponse = z.strictObject({
  user_id: z.string(),
  question: z.string(),
  intent: z.string(),
  toolchain: z.array(z.string()),
  plan: z.array(z.string()),
  answer: z.string(),
  retrieval_evidence: z.array(retrievalEvidence),
  behavior_summary: jsonObject,
  model_version: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
  cache_hit: z.boolean(),
});

const nodeDescriptionResponse = z.strictObject({
  node_title: z.string(),
  description: z.string(),
  generated_at: z.string(),
});

const resourceItem = z.strictObject({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  score: z.number(),
});

const resourceRecommendationResponse = z.strictObject({
  query: z.string(),
  generated_at: z.string(),
  items: z.array(resourceItem),
  model_version: z.string(),
  retrieval_evidence: z.array(retrievalEvidence),
});

const graphEdge = z.strictObject({
  source: z.string(),
  target: z.string(),
  type: z.string().nullable().optional(),
});

const deepSearchResponse = z.strictObject({
  graph_snapshot: z.strictObject({
    nodes: z.array(
      z.strictObject({
        node_id: z.string(),
        text: z.string(),
        tags: z.array(z.string()),
      }),
    ),
    edges: z.array(graphEdge),
  }),
  retrieval_evidence: z.array(retrievalEvidence),
});

const feedbackResponse = z.strictObject({
  record_id: z.string(),
  model_version: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
  scores: z.strictObject({
    evidence_level: z.number().int(),
    structure_score: z.number().int(),
    specificity_score: z.number().int(),
    reproducibility_score: z.number().int(),
    quality_score: z.number().int(),
  }),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  rewrite_suggestions: z.strictObject({
    portfolio_bullets: z.array(z.string()),
    improved_memo: z.string(),
  }),
  code_feedback: jsonObject,
  next_actions: z.array(
    z.strictObject({
      effort: z.string(),
      task: z.string(),
    }),
  ),
  followup_questions: z.array(z.string()),
  retrieval_evidence: z.array(retrievalEvidence),
});

const generatedRoadmapResponse = z.strictObject({
  roadmap_id: z.string(),
  title: z.string(),
  description: z.string(),
  nodes: z.array(
    z.strictObject({
      node_id: z.string(),
      title: z.string(),
      tags: z.array(z.string()),
    }),
  ),
  edges: z.array(graphEdge),
  tags: z.array(z.string()),
  model_version: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
  retrieval_evidence: z.array(retrievalEvidence),
});

const documentConversionResponse = z.strictObject({
  document_summary: z.string(),
  extracted_keywords: z.array(z.string()),
  recommended_roadmaps: z.array(
    z.strictObject({
      related_roadmap_id: z.string(),
      score: z.number(),
      reasons: z.array(
        z.strictObject({
          type: z.string(),
          value: jsonObject,
        }),
      ),
    }),
  ),
  suggested_topics: z.array(z.string()),
  model_version: z.string(),
  created_at: z.string(),
});

export const aiJobResponseSchemas = {
  coaching: learningCoachResponse,
  node_explanation: nodeDescriptionResponse,
  resource_recommendation: resourceRecommendationResponse,
  deep_search: deepSearchResponse,
  feedback: feedbackResponse,
  roadmap_generation: generatedRoadmapResponse,
  document_conversion: documentConversionResponse,
} as const;

export type AiJobFeature = keyof typeof aiJobRequestSchemas;
export type AiJobRequestMap = {
  [Feature in AiJobFeature]: z.infer<(typeof aiJobRequestSchemas)[Feature]>;
};
export type AiJobResponseMap = {
  [Feature in AiJobFeature]: z.infer<(typeof aiJobResponseSchemas)[Feature]>;
};

export type RetrievalEvidence = z.infer<typeof retrievalEvidence>;
export type LearningCoachResponse = z.infer<typeof learningCoachResponse>;
export type NodeDescriptionResponse = z.infer<typeof nodeDescriptionResponse>;
export type ResourceItem = z.infer<typeof resourceItem>;
export type ResourceRecommendationResponse = z.infer<typeof resourceRecommendationResponse>;
export type DeepSearchResponse = z.infer<typeof deepSearchResponse>;
export type RecordCoachResponse = z.infer<typeof feedbackResponse>;
export type GeneratedRoadmap = z.infer<typeof generatedRoadmapResponse>;
export type DocumentConversionResponse = z.infer<typeof documentConversionResponse>;

export function normalizeAiJobRequest<Feature extends AiJobFeature>(
  feature: Feature,
  payload: unknown,
): AiJobRequestMap[Feature] {
  return aiJobRequestSchemas[feature].parse(payload) as AiJobRequestMap[Feature];
}

export function normalizeAiJobResponse<Feature extends AiJobFeature>(
  feature: Feature,
  payload: unknown,
): AiJobResponseMap[Feature] {
  return aiJobResponseSchemas[feature].parse(payload) as AiJobResponseMap[Feature];
}
