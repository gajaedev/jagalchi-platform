import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils';

vi.mock('@/api/roadmap-domain', () => ({
  createOwnedRoadmap: vi.fn().mockResolvedValue({
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Test Roadmap',
    description: '',
    visibility: 'PRIVATE',
  }),
}));

import { createOwnedRoadmap } from '@/api/roadmap-domain';
import { useCreateRoadmap } from './use-create-roadmap';

describe('useCreateRoadmap', () => {
  it('creates a persisted UUID roadmap without a numeric local shadow', async () => {
    const { result } = renderHook(() => useCreateRoadmap(), {
      wrapper: createTestWrapper(),
    });

    await result.current.mutateAsync({ title: 'Test Roadmap' });

    expect(createOwnedRoadmap).toHaveBeenCalledWith({ title: 'Test Roadmap' });
  });
});
