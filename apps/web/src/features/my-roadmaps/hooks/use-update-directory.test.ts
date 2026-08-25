import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils';

vi.mock('@/api/roadmap', () => ({
  updateDirectory: vi.fn().mockResolvedValue({}),
}));

import { updateDirectory } from '@/api/roadmap';
import { useUpdateDirectory } from './use-update-directory';

describe('useUpdateDirectory', () => {
  it('calls updateDirectory with id and name on mutate', async () => {
    const { result } = renderHook(() => useUpdateDirectory(), {
      wrapper: createTestWrapper(),
    });

    const directoryId = '10101010-1010-4010-8010-101010101010';
    result.current.mutate({ id: directoryId, name: 'Renamed Folder' });

    await waitFor(() => {
      expect(updateDirectory).toHaveBeenCalledWith(directoryId, {
        name: 'Renamed Folder',
      });
    });
  });
});
