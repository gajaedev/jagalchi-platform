import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils';

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_REALTIME_ENABLED = 'true';
});

const subscribeCallbacks = new Map<string, (payload: unknown) => void>();
const mockSubscribe = vi.fn((event: string, callback: (payload: unknown) => void) => {
  subscribeCallbacks.set(event, callback);
  return { unsubscribe: vi.fn() };
});

const mockUseRealtime = vi.fn((_options?: unknown) => ({
  isConnected: true,
  subscribe: mockSubscribe,
  disconnect: vi.fn(),
}));

vi.mock('@/hooks/use-realtime', () => ({
  useRealtime: (options?: unknown) => mockUseRealtime(options),
}));

vi.mock('../services/action-dispatcher', () => ({
  sendCursorHide: vi.fn(),
}));

import { sendCursorHide } from '../services/action-dispatcher';
import { useRealtimeSync } from './use-realtime-sync';

describe('useRealtimeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeCallbacks.clear();
  });

  it('connects to the authenticated Socket.IO roadmap channel', () => {
    renderHook(() => useRealtimeSync({ roadmapId: 'roadmap-1' }), {
      wrapper: createTestWrapper(),
    });

    expect(mockUseRealtime).toHaveBeenCalledWith({
      isAutoConnect: true,
      roadmapId: 'roadmap-1',
      onBeforeDisconnect: expect.any(Function),
    });
    expect(mockSubscribe).toHaveBeenCalledTimes(3);
    expect(mockSubscribe).toHaveBeenCalledWith('roadmap:event', expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith('roadmap:cursor', expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith('roadmap:cursor-hide', expect.any(Function));
  });

  it('never passes client-controlled user identity to the connection hook', () => {
    renderHook(() => useRealtimeSync({ roadmapId: 'roadmap-7' }), {
      wrapper: createTestWrapper(),
    });

    expect(mockUseRealtime).toHaveBeenCalledWith({
      isAutoConnect: true,
      roadmapId: 'roadmap-7',
      onBeforeDisconnect: expect.any(Function),
    });
  });

  it('hides the cursor before disconnecting', () => {
    renderHook(() => useRealtimeSync({ roadmapId: 'roadmap-9' }), {
      wrapper: createTestWrapper(),
    });

    const options = mockUseRealtime.mock.calls.at(-1)?.[0] as
      { onBeforeDisconnect?: () => void } | undefined;
    options?.onBeforeDisconnect?.();
    expect(sendCursorHide).toHaveBeenCalledWith('roadmap-9');
  });

  it('ignores malformed remote operations without throwing', () => {
    renderHook(() => useRealtimeSync({ roadmapId: 'roadmap-1' }), {
      wrapper: createTestWrapper(),
    });

    const callback = subscribeCallbacks.get('roadmap:event');
    expect(() => {
      act(() =>
        callback?.({
          roadmapId: 'roadmap-1',
          operation: { type: 'INVALID', targetId: 'node-1' },
        }),
      );
    }).not.toThrow();
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => useRealtimeSync({ roadmapId: 'roadmap-1', isEnabled: false }), {
      wrapper: createTestWrapper(),
    });
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('returns the connection status', () => {
    const { result } = renderHook(() => useRealtimeSync({ roadmapId: 'roadmap-1' }), {
      wrapper: createTestWrapper(),
    });
    expect(result.current.isConnected).toBe(true);
  });
});
