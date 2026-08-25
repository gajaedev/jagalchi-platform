import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const editBases: number[] = [];
  let editAttempt = 0;
  const socket = {
    connected: true,
    auth: {},
    on: vi.fn((event: string, callback: (payload: unknown) => void) => {
      const callbacks = listeners.get(event) ?? new Set();
      callbacks.add(callback);
      listeners.set(event, callbacks);
      return socket;
    }),
    off: vi.fn((event: string, callback: (payload: unknown) => void) => {
      listeners.get(event)?.delete(callback);
      return socket;
    }),
    emit: vi.fn((event: string, payload: unknown, callback?: (result: unknown) => void) => {
      if (event === 'roadmap:join') {
        callback?.({ ok: true, sequence: 1 });
      } else if (event === 'roadmap:edit') {
        editBases.push((payload as { baseSequence: number }).baseSequence);
        editAttempt += 1;
        callback?.(
          editAttempt === 1
            ? {
                ok: false,
                code: 'SEQUENCE_CONFLICT',
                message: 'stale',
                currentSequence: 2,
              }
            : { ok: true, sequence: 3 },
        );
      }
      return socket;
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(() => listeners.clear()),
  };
  return {
    socket,
    listeners,
    editBases,
    reset() {
      listeners.clear();
      editBases.length = 0;
      editAttempt = 0;
      vi.clearAllMocks();
    },
  };
});

const api = vi.hoisted(() => ({
  getRoadmapDomainEvents: vi.fn(async () => ({
    events: [
      {
        id: 'event-2',
        sequence: '2',
        operation: { type: 'NODE_UPDATE', targetId: 'node-2' },
      },
    ],
    currentSequence: 2,
  })),
}));

vi.mock('socket.io-client', () => ({ io: () => mocks.socket }));
vi.mock('@/api/client', () => ({ getAccessToken: () => 'access-token' }));
vi.mock('@/api/roadmap-domain', () => api);

import {
  connectRealtime,
  disconnectRealtime,
  publishRoadmapAction,
  subscribeRealtime,
} from './realtime-client';

const roadmapId = '00000000-0000-4000-8000-000000000001';
const action = {
  actionId: 'action-1',
  action: 'EDIT',
  payload: { target: { type: 'NODE', object: 'node-1' } },
};

describe('realtime client sequence recovery', () => {
  beforeEach(() => {
    disconnectRealtime();
    mocks.reset();
    api.getRoadmapDomainEvents.mockClear();
    connectRealtime({ roadmapId });
  });

  it('replays missing events before retrying the same idempotent edit', async () => {
    const replayed: unknown[] = [];
    const subscription = subscribeRealtime('roadmap:event', (payload) => replayed.push(payload));

    await expect(publishRoadmapAction(roadmapId, action)).resolves.toMatchObject({
      ok: true,
      sequence: 3,
    });

    expect(api.getRoadmapDomainEvents).toHaveBeenCalledWith(roadmapId, 1);
    expect(replayed).toEqual([
      expect.objectContaining({
        roadmapId,
        eventId: 'event-2',
        sequence: 2,
        replayed: true,
      }),
    ]);
    expect(mocks.editBases).toEqual([1, 2]);
    subscription?.unsubscribe();
  });

  it('uses the sequence from incoming room events for the next edit', async () => {
    const subscription = subscribeRealtime('roadmap:event', () => undefined);
    for (const callback of mocks.listeners.get('roadmap:event') ?? []) {
      callback({
        roadmapId,
        eventId: 'event-4',
        sequence: 4,
        operation: { type: 'NODE_UPDATE', targetId: 'node-2' },
      });
    }
    mocks.socket.emit.mockImplementationOnce(
      (_event: string, payload: unknown, callback?: (result: unknown) => void) => {
        mocks.editBases.push((payload as { baseSequence: number }).baseSequence);
        callback?.({ ok: true, sequence: 5 });
        return mocks.socket;
      },
    );

    await publishRoadmapAction(roadmapId, action);
    expect(mocks.editBases).toEqual([4]);
    subscription?.unsubscribe();
  });
});
