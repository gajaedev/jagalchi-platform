import { StrictMode } from 'react';

import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuthCallback } from './index';

const capture = vi.hoisted(() => vi.fn());
const exchangeOAuthCode = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const setLogin = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analytics/client', () => ({ capture }));
vi.mock('@/api/auth', () => ({ exchangeOAuthCode }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jotai')>();
  return { ...actual, useSetAtom: () => setLogin };
});
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe('OAuthCallback analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/oauth/callback');
  });

  it('cleans the callback URL before one neutral completion capture across effect replays', async () => {
    exchangeOAuthCode.mockResolvedValue({ accessToken: 'access-token' });
    window.history.replaceState({}, '', '/oauth/callback?code=secret-code&provider=google');
    const replaceState = vi.spyOn(window.history, 'replaceState');

    render(
      <StrictMode>
        <OAuthCallback code="secret-code" />
      </StrictMode>,
    );

    await waitFor(() => expect(capture).toHaveBeenCalledOnce());
    expect(replaceState).toHaveBeenCalledBefore(capture);
    expect(`${window.location.pathname}${window.location.search}`).toBe('/oauth/callback');
    expect(capture).toHaveBeenCalledWith('oauth_completed', {});
    expect(JSON.stringify(capture.mock.calls)).not.toContain('secret-code');
    expect(JSON.stringify(capture.mock.calls)).not.toContain('google');
  });

  it('shares one exchange across an explicit unmount and remount', async () => {
    let resolveExchange!: (value: { accessToken: string }) => void;
    exchangeOAuthCode.mockReturnValue(
      new Promise((resolve) => {
        resolveExchange = resolve;
      }),
    );

    const first = render(<OAuthCallback code="remount-code" />);
    await waitFor(() => expect(exchangeOAuthCode).toHaveBeenCalledOnce());
    first.unmount();
    render(<OAuthCallback code="remount-code" />);

    resolveExchange({ accessToken: 'access-token' });
    await waitFor(() => expect(capture).toHaveBeenCalledOnce());
    expect(exchangeOAuthCode).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledWith('oauth_completed', {});
  });

  it('does not capture when the exchange fails', async () => {
    exchangeOAuthCode.mockRejectedValue(new Error('exchange failed'));

    render(<OAuthCallback code="failed-code" />);

    await waitFor(() => expect(exchangeOAuthCode).toHaveBeenCalledOnce());
    expect(capture).not.toHaveBeenCalled();
  });
});
