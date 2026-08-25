import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils';

vi.mock('@/api/roadmap', () => ({
  deleteDirectory: vi.fn().mockResolvedValue({}),
}));

import { deleteDirectory } from '@/api/roadmap';
import { useDeleteDirectory } from './use-delete-directory';

describe('useDeleteDirectory', () => {
  it('calls deleteDirectory with id on mutate', async () => {
    const { result } = renderHook(() => useDeleteDirectory(), {
      wrapper: createTestWrapper(),
    });

    const directoryId = '55555555-5555-4555-8555-555555555555';
    result.current.mutate(directoryId);

    await waitFor(() => {
      expect(deleteDirectory).toHaveBeenCalledWith(directoryId);
    });
  });
});
