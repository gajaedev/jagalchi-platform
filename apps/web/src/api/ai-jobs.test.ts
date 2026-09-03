import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  apiClient: { post: vi.fn() },
}));

import { normalizeAiJobRequest, normalizeAiJobResponse } from './ai-job-contract';
import { apiClient } from './client';
import { persistGeneratedRoadmap, runAiJob } from './ai-jobs';

import type { AiJobFeature, AiJobRequestMap, AiJobResponseMap } from './ai-job-contract';

const evidence = [{ source: 'fixture', id: 'evidence-1', snippet: 'verified' }];

type ContractFixtures = {
  [Feature in AiJobFeature]: {
    request: AiJobRequestMap[Feature];
    response: AiJobResponseMap[Feature];
    roadmapId?: string;
  };
};

const fixtures = {
  coaching: {
    request: { question: '다음 행동은?', compose_level: 'quick' },
    response: {
      user_id: 'user-1',
      question: '다음 행동은?',
      intent: 'next-action',
      toolchain: [],
      plan: ['테스트 추가'],
      answer: '테스트를 추가하세요.',
      retrieval_evidence: evidence,
      behavior_summary: { motivation: 1 },
      model_version: 'fixture',
      prompt_version: 'v1',
      created_at: '2026-09-03T00:00:00Z',
      cache_hit: false,
    },
    roadmapId: '11111111-1111-4111-8111-111111111111',
  },
  node_explanation: {
    request: { node_title: 'React Query', context: 'frontend' },
    response: {
      node_title: 'React Query',
      description: '서버 상태를 관리합니다.',
      generated_at: '2026-09-03T00:00:00Z',
    },
  },
  resource_recommendation: {
    request: { query: 'React', top_k: 5, recency_days: 30 },
    response: {
      query: 'React',
      generated_at: '2026-09-03T00:00:00Z',
      items: [{ title: 'React', url: 'https://react.dev', source: 'web', score: 0.9 }],
      model_version: 'fixture',
      retrieval_evidence: evidence,
    },
  },
  deep_search: {
    request: { query: 'React architecture', top_k: 3 },
    response: {
      graph_snapshot: {
        nodes: [{ node_id: 'node-1', text: 'React', tags: ['react'] }],
        edges: [{ source: 'node-1', target: 'node-2', type: null }],
      },
      retrieval_evidence: evidence,
    },
  },
  feedback: {
    request: { node_id: 'node-1', compose_level: 'full' },
    response: {
      record_id: 'record-1',
      model_version: 'fixture',
      prompt_version: 'v1',
      created_at: '2026-09-03T00:00:00Z',
      scores: {
        evidence_level: 1,
        structure_score: 1,
        specificity_score: 1,
        reproducibility_score: 1,
        quality_score: 1,
      },
      strengths: [],
      gaps: [],
      rewrite_suggestions: { portfolio_bullets: [], improved_memo: '' },
      code_feedback: { language: 'typescript' },
      next_actions: [{ effort: 'small', task: '테스트 추가' }],
      followup_questions: [],
      retrieval_evidence: evidence,
    },
    roadmapId: '11111111-1111-4111-8111-111111111111',
  },
  roadmap_generation: {
    request: {
      goal: 'Expo 앱 출시',
      preferred_tags: 'Expo,TypeScript',
      max_nodes: 8,
      compose_level: 'full',
    },
    response: {
      roadmap_id: 'generated-1',
      title: 'Expo 앱 출시',
      description: '출시까지 배우는 경로',
      tags: ['expo'],
      nodes: [{ node_id: 'node-1', title: 'Expo 기초', tags: ['expo'] }],
      edges: [{ source: 'node-1', target: 'node-2' }],
      model_version: 'fixture',
      prompt_version: 'v1',
      created_at: '2026-09-03T00:00:00Z',
      retrieval_evidence: evidence,
    },
  },
  document_conversion: {
    request: { document: 'Expo 학습 기록', goal: '모바일 개발자' },
    response: {
      document_summary: 'Expo 학습',
      extracted_keywords: ['Expo'],
      recommended_roadmaps: [
        {
          related_roadmap_id: 'roadmap-1',
          score: 0.9,
          reasons: [{ type: 'keyword', value: { keyword: 'Expo' } }],
        },
      ],
      suggested_topics: ['EAS'],
      model_version: 'fixture',
      created_at: '2026-09-03T00:00:00Z',
    },
  },
} satisfies ContractFixtures;

const features = Object.keys(fixtures) as AiJobFeature[];

describe('AI jobs compatibility contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(features)('normalizes and validates the complete %s contract', async (feature) => {
    const fixture = fixtures[feature];
    const roadmapId = 'roadmapId' in fixture ? fixture.roadmapId : undefined;
    vi.mocked(apiClient.post).mockResolvedValue(fixture.response);

    await expect(runAiJob(feature, fixture.request as never, roadmapId)).resolves.toEqual(
      fixture.response,
    );
    expect(apiClient.post).toHaveBeenCalledWith('/ai/jobs', {
      feature,
      idempotencyKey: expect.any(String),
      payload: fixture.request,
      ...(roadmapId ? { roadmapId } : {}),
    });
  });

  it.each(features)('rejects extra %s request fields before transport', async (feature) => {
    const fixture = fixtures[feature];
    const roadmapId = 'roadmapId' in fixture ? fixture.roadmapId : undefined;
    await expect(
      runAiJob(feature, { ...fixture.request, unexpected: true } as never, roadmapId),
    ).rejects.toThrow();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it.each(features)('rejects incomplete %s responses', (feature) => {
    const response = { ...fixtures[feature].response } as Record<string, unknown>;
    delete response[Object.keys(response)[0]!];
    expect(() => normalizeAiJobResponse(feature, response)).toThrow();
  });

  it.each(features)('rejects extra %s response fields', (feature) => {
    expect(() =>
      normalizeAiJobResponse(feature, { ...fixtures[feature].response, unexpected: true }),
    ).toThrow();
  });

  it.each(features)('accepts the reviewed %s request fixture', (feature) => {
    expect(normalizeAiJobRequest(feature, fixtures[feature].request)).toEqual(
      fixtures[feature].request,
    );
  });

  it('persists generated nodes as a versioned editable graph', () => {
    persistGeneratedRoadmap(fixtures.roadmap_generation.response);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/roadmaps',
      expect.objectContaining({
        visibility: 'PRIVATE',
        graph: expect.objectContaining({
          schemaVersion: 1,
          nodes: expect.arrayContaining([
            expect.objectContaining({ id: 'node-1', type: 'jagalchi-node' }),
          ]),
        }),
      }),
    );
  });
});
