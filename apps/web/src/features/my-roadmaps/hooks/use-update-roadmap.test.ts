import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils';

vi.mock('@/api/roadmap', () => ({
  updateRoadmap: vi.fn().mockResolvedValue({}),
}));

import { updateRoadmap } from '@/api/roadmap';
import { useUpdateRoadmap } from './use-update-roadmap';

describe('useUpdateRoadmap', () => {
  it('calls updateRoadmap with roadmapId and data on mutate', async () => {
    const { result } = renderHook(() => useUpdateRoadmap(), {
      wrapper: createTestWrapper(),
    });

    const roadmapId = '77777777-7777-4777-8777-777777777777';
    result.current.mutate({ roadmapId, data: { title: 'Updated' } });

    await waitFor(() => {
      expect(updateRoadmap).toHaveBeenCalledWith(roadmapId, { title: 'Updated' });
    });
  });
});
