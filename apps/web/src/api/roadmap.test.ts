import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  forkRoadmap,
  getForkStatus,
  getForkTree,
  getPopularRoadmaps,
  getRoadmaps,
} from './roadmap';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';

const roadmapId = '11111111-1111-4111-8111-111111111111';

describe('forkRoadmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /roadmaps/{id}/fork', () => {
    forkRoadmap(roadmapId);
    expect(apiClient.post).toHaveBeenCalledWith(`/roadmaps/${roadmapId}/fork`);
  });
});

describe('getForkTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /roadmaps/{id}/fork-tree', () => {
    getForkTree(roadmapId);
    expect(apiClient.get).toHaveBeenCalledWith(`/roadmaps/public/${roadmapId}/fork-tree`);
  });
});

describe('getForkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /roadmaps/{id}/fork-status', () => {
    getForkStatus(roadmapId);
    expect(apiClient.get).toHaveBeenCalledWith(`/roadmaps/${roadmapId}/fork-status`);
  });
});

describe('getPopularRoadmaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /roadmaps/public with no params', () => {
    getPopularRoadmaps();
    expect(apiClient.get).toHaveBeenCalledWith('/roadmaps/public');
  });

  it('calls GET /roadmaps/public with canonical query string when params provided', () => {
    getPopularRoadmaps({ page: 1, size: 10, search: 'React', tag: 'frontend' });
    const call = vi.mocked(apiClient.get).mock.calls[0][0] as string;
    expect(call).toContain('/roadmaps/public?');
    expect(call).toContain('page=1');
    expect(call).toContain('size=10');
    expect(call).toContain('search=React');
    expect(call).toContain('tag=frontend');
  });

  it('omits undefined params from query string', () => {
    getPopularRoadmaps({ page: 1 });
    const call = vi.mocked(apiClient.get).mock.calls[0][0] as string;
    expect(call).toContain('page=1');
    expect(call).not.toContain('search');
    expect(call).not.toContain('tag');
    expect(call).not.toContain('size');
  });
});

describe('getRoadmaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /roadmaps/mine with canonical query parameters', () => {
    getRoadmaps({ page: 2, size: 20, search: 'TypeScript', tag: 'backend' });
    expect(apiClient.get).toHaveBeenCalledWith(
      '/roadmaps/mine?page=2&size=20&search=TypeScript&tag=backend',
    );
  });
});
