import { beforeEach, describe, expect, it, vi } from 'vitest';

const { publishCursor, publishCursorHide, publishRoadmapAction } = vi.hoisted(() => ({
  publishCursor: vi.fn(),
  publishCursorHide: vi.fn(),
  publishRoadmapAction: vi.fn(() => new Promise(() => undefined)),
}));

vi.mock('@/lib/realtime-client', () => ({
  publishCursor,
  publishCursorHide,
  publishRoadmapAction,
}));

import {
  dispatchAction,
  getPendingCount,
  handleAck,
  handleNack,
  sendCursorHide,
  sendCursorPosition,
} from './action-dispatcher';

const payload = {
  type: 'INFO' as const,
  target: { type: 'NODE' as const, object: 'node-1' },
  next: { label: 'HTTP 기초' },
};

describe('action-dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends a typed roadmap operation and returns its idempotency key', () => {
    const actionId = dispatchAction('roadmap-1', 'CREATE', payload);
    expect(actionId).toBeTruthy();
    expect(publishRoadmapAction).toHaveBeenCalledWith(
      'roadmap-1',
      expect.objectContaining({
        actionId,
        roadmap: 'roadmap-1',
        action: 'CREATE',
        payload,
      }),
    );
  });

  it('never sends client-controlled user headers', () => {
    dispatchAction('roadmap-1', 'EDIT', payload);
    expect(publishRoadmapAction).toHaveBeenCalledWith('roadmap-1', expect.any(Object));
  });

  it('handleAck removes a pending action exactly once', () => {
    const actionId = dispatchAction('roadmap-1', 'EDIT', payload);
    expect(handleAck(actionId)).toBe(true);
    expect(handleAck(actionId)).toBe(false);
  });

  it('handleNack returns the rejected action and removes it', () => {
    const actionId = dispatchAction('roadmap-1', 'DELETE', payload);
    const result = handleNack(actionId);
    expect(result.isFound).toBe(true);
    expect(result.action?.actionId).toBe(actionId);
  });

  it('handleNack reports unknown action ids', () => {
    expect(handleNack('unknown-id')).toEqual({ action: undefined, isFound: false });
  });

  it('publishes only cursor coordinates', () => {
    sendCursorPosition('roadmap-1', {
      x: 100,
      y: 200,
    });
    expect(publishCursor).toHaveBeenCalledWith('roadmap-1', {
      x: 100,
      y: 200,
    });
  });

  it('publishes cursor hide by roadmap room', () => {
    sendCursorHide('roadmap-1');
    expect(publishCursorHide).toHaveBeenCalledWith('roadmap-1');
  });

  it('tracks pending actions until an ACK or NACK arrives', () => {
    const id1 = dispatchAction('roadmap-1', 'CREATE', payload);
    const id2 = dispatchAction('roadmap-1', 'EDIT', payload);
    expect(getPendingCount()).toBeGreaterThanOrEqual(2);
    handleAck(id1);
    handleAck(id2);
  });
});
