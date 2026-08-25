let browserStartPromise: Promise<void> | null = null;

/** 브라우저 환경에서 MSW를 조건부로 초기화 (프로덕션 차단 이중 가드) */
export async function initMocks() {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== 'true') return;
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_E2E_MOCKING !== 'true') {
    return;
  }

  if (typeof window !== 'undefined') {
    browserStartPromise ??= import('./browser').then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });
    });
    await browserStartPromise;
  }
}
