import { afterEach, describe, expect, it, vi } from 'vitest';

import { NativeBridgeError, requestNative } from './native-bridge';

describe('requestNative', () => {
  afterEach(() => {
    delete window.ReactNativeWebView;
  });

  it('correlates a successful native result by request id and action', async () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };
    const pending = requestNative<{
      id: string;
      action: 'products';
      ok: true;
      products: [];
    }>('products');
    const request = JSON.parse(postMessage.mock.calls[0]?.[0] as string) as {
      id: string;
    };
    window.dispatchEvent(
      new CustomEvent('jagalchi:native-result', {
        detail: { id: request.id, action: 'products', ok: true, products: [] },
      }),
    );
    await expect(pending).resolves.toMatchObject({ ok: true, products: [] });
  });

  it('preserves native error code and retryability', async () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };
    const pending = requestNative('restore-purchases', { accessToken: 'token' });
    const request = JSON.parse(postMessage.mock.calls[0]?.[0] as string) as {
      id: string;
    };
    window.dispatchEvent(
      new CustomEvent('jagalchi:native-result', {
        detail: {
          id: request.id,
          action: 'restore-purchases',
          ok: false,
          error: { code: 'recovery-required', message: 'retry', retryable: true },
        },
      }),
    );
    await expect(pending).rejects.toEqual(
      expect.objectContaining<Partial<NativeBridgeError>>({
        code: 'recovery-required',
        retryable: true,
      }),
    );
  });
});
