import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from './client';
import { persistGeneratedRoadmap, runAiJob } from './ai-jobs';

describe('AI jobs API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends a paid feature through the Nest ticket reservation boundary', () => {
    runAiJob('roadmap_generation', { goal: 'Expo 앱 출시' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/ai/jobs',
      expect.objectContaining({
        feature: 'roadmap_generation',
        idempotencyKey: expect.any(String),
        payload: { goal: 'Expo 앱 출시' },
      }),
    );
  });

  it('persists generated nodes as a versioned editable graph', () => {
    persistGeneratedRoadmap({
      roadmap_id: 'generated-1',
      title: 'Expo 앱 출시',
      description: '출시까지 배우는 경로',
      tags: ['expo'],
      nodes: [
        { node_id: 'node-1', title: 'Expo 기초', tags: ['expo'] },
        { node_id: 'node-2', title: '스토어 출시', tags: ['store'] },
      ],
      edges: [{ source: 'node-1', target: 'node-2' }],
    });
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
