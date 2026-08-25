import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils';

vi.mock('@/api/roadmap', () => ({
  deleteRoadmap: vi.fn().mockResolvedValue({}),
}));

import { deleteRoadmap } from '@/api/roadmap';
import { useDeleteRoadmap } from './use-delete-roadmap';

describe('useDeleteRoadmap', () => {
  it('calls deleteRoadmap with roadmapId on mutate', async () => {
    const { result } = renderHook(() => useDeleteRoadmap(), {
      wrapper: createTestWrapper(),
    });

    const roadmapId = '42424242-4242-4242-8242-424242424242';
    result.current.mutate(roadmapId);

    await waitFor(() => {
      expect(deleteRoadmap).toHaveBeenCalledWith(roadmapId);
    });
  });
});
