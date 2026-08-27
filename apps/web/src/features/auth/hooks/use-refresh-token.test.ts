import { renderHook, act } from '@testing-library/react';
import { useSetAtom } from 'jotai';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createTestWrapper } from '@/test-utils';

let currentAccessToken: string | null = null;
const mockSetAccessToken = vi.fn((token: string) => {
  currentAccessToken = token;
});
const mockClearAccessToken = vi.fn(() => {
  currentAccessToken = null;
});
const mockBeginAuthSessionEnding = vi.fn(() => Promise.resolve());
const mockCompleteAuthSessionEnding = vi.fn();
const mockRestoreAuthSession = vi.fn();
const authSessionResumeListeners = new Set<() => void>();
const mockBeginIdentityEnding = vi.fn();
const mockFinishIdentityEnding = vi.fn((_userId: string | null) => Promise.resolve(true));

vi.mock('@/api/auth', () => ({
  refreshToken: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  getAccessToken: () => currentAccessToken,
  setAccessToken: (token: string) => mockSetAccessToken(token),
  clearAccessToken: () => mockClearAccessToken(),
  beginAuthSessionEnding: () => mockBeginAuthSessionEnding(),
  completeAuthSessionEnding: () => mockCompleteAuthSessionEnding(),
  restoreAuthSessionAfterEnding: () => {
    mockRestoreAuthSession();
    authSessionResumeListeners.forEach((listener) => listener());
  },
  subscribeToAuthSessionResume: (listener: () => void) => {
    authSessionResumeListeners.add(listener);
    return () => authSessionResumeListeners.delete(listener);
  },
}));

vi.mock('@/lib/analytics/client', () => ({
  beginIdentityEnding: () => mockBeginIdentityEnding(),
  finishIdentityEnding: (userId: string | null) => mockFinishIdentityEnding(userId),
}));

import { logout, refreshToken } from '@/api/auth';

import { loginAtom } from '../stores/auth.atoms';
import { useRefreshToken } from './use-refresh-token';

describe('useRefreshToken', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    currentAccessToken = null;
  });

  afterEach(() => {
    authSessionResumeListeners.clear();
    vi.useRealTimers();
  });

  it('calls refreshToken on mount and sets initialized', async () => {
    vi.mocked(refreshToken).mockResolvedValue({ accessToken: 'new-token' });

    renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    // flush the initial async refresh (use runOnlyPendingTimers to avoid infinite interval loop)
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(refreshToken).toHaveBeenCalled();
    // loginAtom calls setAccessToken internally
    expect(mockSetAccessToken).toHaveBeenCalledWith('new-token');
  });

  it('clears token and logs out on refresh failure', async () => {
    vi.mocked(refreshToken).mockRejectedValue(new Error('expired'));

    renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // logoutAtom calls clearAccessToken, plus the hook itself calls clearAccessToken
    expect(mockClearAccessToken).toHaveBeenCalled();
  });

  it('does not clear a newer interactive login when the initial refresh fails late', async () => {
    let rejectRefresh: (error: Error) => void = () => undefined;
    vi.mocked(refreshToken).mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRefresh = reject;
        }),
    );

    renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });
    currentAccessToken = 'interactive-login-token';
    rejectRefresh(new Error('stale refresh failed'));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockClearAccessToken).not.toHaveBeenCalled();
    expect(currentAccessToken).toBe('interactive-login-token');
  });

  it('starts interval on successful refresh', async () => {
    vi.mocked(refreshToken).mockResolvedValue({ accessToken: 'token' });

    renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    vi.mocked(refreshToken).mockClear();

    // Advance by 14 minutes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });

    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('does not start interval on failed refresh', async () => {
    vi.mocked(refreshToken).mockRejectedValue(new Error('fail'));

    renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    vi.mocked(refreshToken).mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });

    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('cleans up interval on unmount', async () => {
    vi.mocked(refreshToken).mockResolvedValue({ accessToken: 'token' });

    const { unmount } = renderHook(() => useRefreshToken(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    unmount();
    vi.mocked(refreshToken).mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });

    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('does not let a never-settling hook refresh block logout', async () => {
    vi.mocked(refreshToken).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });
    expect(refreshToken).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.logoutSession();
    });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(mockClearAccessToken).toHaveBeenCalled();
    expect(mockCompleteAuthSessionEnding).toHaveBeenCalledTimes(1);
    expect(mockFinishIdentityEnding).toHaveBeenCalledWith(null);
    expect(mockFinishIdentityEnding).toHaveBeenCalledBefore(mockCompleteAuthSessionEnding);
  });

  it('finalizes a successful logout after the provider remounts', async () => {
    let resolveLogout: (() => void) | undefined;
    vi.mocked(refreshToken)
      .mockResolvedValueOnce({ accessToken: 'token' })
      .mockImplementationOnce(() => new Promise(() => undefined));
    vi.mocked(logout).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useRefreshToken(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    mockClearAccessToken.mockClear();
    mockFinishIdentityEnding.mockClear();

    let logoutRequest = Promise.resolve();
    await act(async () => {
      logoutRequest = result.current.logoutSession();
      await Promise.resolve();
    });
    expect(logout).toHaveBeenCalledTimes(1);

    unmount();
    const remounted = renderHook(() => useRefreshToken(), {
      wrapper: createTestWrapper(),
    });
    await act(async () => {
      resolveLogout?.();
      await logoutRequest;
    });

    expect(mockClearAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFinishIdentityEnding).toHaveBeenCalledWith(null);
    remounted.unmount();
  });

  it('invalidates an in-flight refresh and cancels the interval before logout', async () => {
    let resolveRefresh: ((value: { accessToken: string }) => void) | undefined;
    vi.mocked(refreshToken)
      .mockResolvedValue({ accessToken: 'active-token' })
      .mockResolvedValueOnce({ accessToken: 'initial-token' })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
      );
    vi.mocked(logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    mockSetAccessToken.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });

    const logoutRequest = result.current.logoutSession();
    await act(async () => {
      resolveRefresh?.({ accessToken: 'stale-token' });
      await logoutRequest;
    });

    expect(mockBeginIdentityEnding).toHaveBeenCalledTimes(1);
    expect(mockBeginAuthSessionEnding).toHaveBeenCalledBefore(vi.mocked(logout));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(mockFinishIdentityEnding).toHaveBeenCalledWith(null);
    expect(mockSetAccessToken).not.toHaveBeenCalledWith('stale-token');
    expect(mockClearAccessToken).toHaveBeenCalled();
    expect(mockCompleteAuthSessionEnding).toHaveBeenCalledTimes(1);

    vi.mocked(refreshToken).mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('starts periodic refresh again when a new user logs in after logout', async () => {
    const firstToken = 'header.eyJzdWIiOiJmaXJzdC11c2VyIn0.signature';
    const secondToken = 'header.eyJzdWIiOiJzZWNvbmQtdXNlciJ9.signature';
    vi.mocked(refreshToken)
      .mockResolvedValueOnce({ accessToken: firstToken })
      .mockResolvedValue({ accessToken: 'rotated-token' });
    vi.mocked(logout).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => ({ session: useRefreshToken(), setLogin: useSetAtom(loginAtom) }),
      { wrapper: createTestWrapper() },
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    await act(async () => {
      await result.current.session.logoutSession();
    });

    vi.mocked(refreshToken).mockClear();
    act(() => result.current.setLogin(secondToken));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });

    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('keeps the local session and exposes a retryable error when revoke fails', async () => {
    vi.mocked(refreshToken).mockResolvedValue({ accessToken: 'token' });
    vi.mocked(logout).mockRejectedValue(new Error('revoke failed'));

    const { result } = renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    mockClearAccessToken.mockClear();

    let logoutError: unknown;
    await act(async () => {
      try {
        await result.current.logoutSession();
      } catch (error) {
        logoutError = error;
      }
    });

    expect(logoutError).toEqual(new Error('revoke failed'));
    expect(mockClearAccessToken).not.toHaveBeenCalled();
    expect(mockBeginIdentityEnding).toHaveBeenCalledTimes(1);
    expect(mockFinishIdentityEnding).toHaveBeenCalled();
    expect(mockFinishIdentityEnding).toHaveBeenCalledBefore(mockRestoreAuthSession);

    vi.mocked(refreshToken).mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('restores the remounted provider after revoke fails during session ending', async () => {
    let rejectLogout: ((error: Error) => void) | undefined;
    const priorToken = 'header.eyJzdWIiOiJwcmlvci11c2VyIn0.signature';
    vi.mocked(refreshToken)
      .mockResolvedValueOnce({ accessToken: priorToken })
      .mockResolvedValueOnce({ status: 'session-ending' })
      .mockResolvedValueOnce({ accessToken: 'restored-token' })
      .mockResolvedValue({ accessToken: 'interval-token' });
    vi.mocked(logout).mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectLogout = reject;
        }),
    );

    const initial = renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    mockClearAccessToken.mockClear();

    let logoutRequest = Promise.resolve();
    await act(async () => {
      logoutRequest = initial.result.current.logoutSession();
      await Promise.resolve();
    });
    expect(logout).toHaveBeenCalledTimes(1);

    initial.unmount();
    const remounted = renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    let logoutError: unknown;
    await act(async () => {
      rejectLogout?.(new Error('revoke failed'));
      try {
        await logoutRequest;
      } catch (error) {
        logoutError = error;
      }
    });

    expect(logoutError).toEqual(new Error('revoke failed'));
    expect(mockClearAccessToken).not.toHaveBeenCalled();
    expect(mockFinishIdentityEnding).toHaveBeenCalledWith('prior-user');
    expect(mockSetAccessToken).toHaveBeenCalledWith('restored-token');

    vi.mocked(refreshToken).mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });
    expect(refreshToken).toHaveBeenCalledTimes(1);
    remounted.unmount();
  });

  it('uses the same local cleanup path after account deletion succeeds', async () => {
    vi.mocked(refreshToken).mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useRefreshToken(), { wrapper: createTestWrapper() });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    mockClearAccessToken.mockClear();

    await act(async () => {
      await result.current.beginSessionEnding();
      await result.current.clearDeletedSession();
    });

    expect(mockClearAccessToken).toHaveBeenCalled();
    expect(mockCompleteAuthSessionEnding).toHaveBeenCalledTimes(1);

    vi.mocked(refreshToken).mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });
    expect(refreshToken).not.toHaveBeenCalled();
  });
});
