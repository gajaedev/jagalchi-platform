import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  apiClient: { post: vi.fn() },
}));

import { apiClient } from './client';
import { uploadProfileImage } from './uploads';

describe('uploads API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('completes an approved object upload before returning its public URL', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({
        id: 'upload-1',
        uploadUrl: 'https://storage.example/signed',
        method: 'PUT',
        headers: { 'content-type': 'image/png' },
        expiresInSeconds: 600,
      })
      .mockResolvedValueOnce({
        id: 'upload-1',
        fileName: 'avatar.png',
        contentType: 'image/png',
        size: 3,
        status: 'READY',
        publicUrl: 'https://cdn.example/avatar.png',
      });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });

    await expect(uploadProfileImage(file)).resolves.toBe('https://cdn.example/avatar.png');
    expect(fetch).toHaveBeenCalledWith(
      'https://storage.example/signed',
      expect.objectContaining({ method: 'PUT', body: file }),
    );
    expect(apiClient.post).toHaveBeenLastCalledWith('/uploads/upload-1/complete');
  });
});
