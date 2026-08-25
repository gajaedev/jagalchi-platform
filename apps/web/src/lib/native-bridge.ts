declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

export class NativeBridgeError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
    readonly result: unknown,
  ) {
    super(message);
  }
}

function createRequestId(): string {
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function hasNativeBridge(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
}

export function requestNative<TResult extends { id: string; action: string; ok: boolean }>(
  action: string,
  payload: Record<string, unknown> = {},
  timeoutMs = 120_000,
): Promise<TResult> {
  const bridge = window.ReactNativeWebView;
  if (!bridge) return Promise.reject(new Error('네이티브 기능을 사용할 수 없습니다.'));
  const id = createRequestId();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('네이티브 응답 시간이 초과되었습니다.'));
    }, timeoutMs);

    const accept = (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      const result = value as TResult & {
        error?: { code?: string; message?: string; retryable?: boolean };
      };
      if (result.id !== id || result.action !== action) return;
      cleanup();
      if (!result.ok) {
        reject(
          new NativeBridgeError(
            result.error?.message ?? '네이티브 작업에 실패했습니다.',
            result.error?.code ?? 'native-error',
            result.error?.retryable ?? false,
            result,
          ),
        );
        return;
      }
      resolve(result);
    };

    const onNativeResult = (event: Event) => accept((event as CustomEvent).detail);
    const onMessage = (event: MessageEvent) => {
      try {
        accept(typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
      } catch {
        // Ignore unrelated window messages.
      }
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('jagalchi:native-result', onNativeResult);
      window.removeEventListener('message', onMessage);
    };

    window.addEventListener('jagalchi:native-result', onNativeResult);
    window.addEventListener('message', onMessage);
    bridge.postMessage(JSON.stringify({ id, action, ...payload }));
  });
}
