import { describe, expect, it, vi } from 'vitest';

import { createApiTransport, getProjectRun, projectRunQueryKey } from './index.js';

describe('api-client', () => {
  it('normalizes paths and accepts an injected fetch implementation', async () => {
    const fetchImplementation = vi.fn(async () =>
      Response.json({
        id: 'run-1', state: 'ACTIVE', version: 1, currentTaskId: null,
        recommendedTaskId: null, plan: { id: 'plan-1', schemaVersion: 1 },
        map: { nodes: [], edges: [] }, tasks: [], proof: null,
      }),
    );
    const result = await getProjectRun(createApiTransport('https://api.example.com/', fetchImplementation), 'run 1');
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.example.com/project-runs/run%201',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.id).toBe('run-1');
    expect(projectRunQueryKey('run-1')).toEqual(['project-run', 'run-1']);
  });
});
