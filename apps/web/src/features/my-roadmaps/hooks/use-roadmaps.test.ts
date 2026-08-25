import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { accessTokenAtom } from '@/lib/auth-atoms';
import { createTestWrapper } from '@/test-utils';

vi.mock('@/api/roadmap-domain', () => ({
  listOwnedRoadmaps: vi.fn().mockResolvedValue({
    items: [
      { id: 'roadmap-1', title: 'My Roadmap', tags: [] },
      { id: 'roadmap-2', title: 'Another Roadmap', tags: ['react'] },
    ],
    page: 1,
    size: 50,
    total: 2,
  }),
}));

import { listOwnedRoadmaps } from '@/api/roadmap-domain';
import { useRoadmaps } from './use-roadmaps';

const wrapper = () => createTestWrapper([[accessTokenAtom, 'access-token']] as const);

describe('useRoadmaps', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useRoadmaps(), { wrapper: wrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('loads all owned roadmaps by default', async () => {
    const { result } = renderHook(() => useRoadmaps(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listOwnedRoadmaps).toHaveBeenCalledWith(undefined);
  });

  it('passes the search query to the UUID roadmap endpoint', async () => {
    const { result } = renderHook(() => useRoadmaps({ query: 'React' }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listOwnedRoadmaps).toHaveBeenCalledWith('React');
  });

  it('returns persisted roadmap data', async () => {
    const { result } = renderHook(() => useRoadmaps(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
  });

  it('returns an error when the API fails', async () => {
    vi.mocked(listOwnedRoadmaps).mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useRoadmaps(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
