import { nanoid } from 'nanoid';

import { publishCursor, publishCursorHide, publishRoadmapAction } from '@/lib/realtime-client';

type ActionType = 'CREATE' | 'EDIT' | 'DELETE' | 'UNDO' | 'REDO';
type PayloadType = 'INFO' | 'MOVE' | 'SCALE' | 'LOCK' | 'COPY';
type TargetType = 'NODE' | 'GROUP' | 'SECTION' | 'EDGE' | 'TEXT' | 'RESOURCE';

interface ActionTarget {
  type: TargetType;
  object: string;
  tempId?: string;
  nodeId?: number;
}

interface ActionState {
  x?: number;
  y?: number;
  label?: string;
  locked?: boolean;
  metadata?: Record<string, unknown>;
}

interface ActionPayload {
  type: PayloadType;
  target: ActionTarget;
  prev?: ActionState | null;
  next?: ActionState | null;
  data?: Record<string, unknown> | null;
}

interface RealtimeAction {
  actionId: string;
  roadmap: string;
  action: ActionType;
  payload: ActionPayload | null;
}

/** 전송 대기 중인 액션 (ACK 미수신) */
const pendingActions = new Map<string, RealtimeAction>();
const MAX_PENDING_ACTIONS = 500;

/** 액션 전송 */
export function dispatchAction(
  roadmapId: string,
  action: ActionType,
  payload: ActionPayload | null = null,
): string {
  const actionId = nanoid();

  const realtimeAction: RealtimeAction = {
    actionId,
    roadmap: roadmapId,
    action,
    payload,
  };

  // 대기 큐 오버플로우 방지 — 가장 오래된 액션 제거 (NACK 롤백 불가 경고)
  if (pendingActions.size >= MAX_PENDING_ACTIONS) {
    const oldestKey = pendingActions.keys().next().value;
    if (oldestKey) {
      // eslint-disable-next-line no-console
      console.warn(
        `[action-dispatcher] pendingActions overflow: dropping actionId=${oldestKey}. ` +
          'NACK rollback for this action will be silently skipped.',
      );
      pendingActions.delete(oldestKey);
    }
  }

  pendingActions.set(actionId, realtimeAction);

  void publishRoadmapAction(roadmapId, realtimeAction).then((result) => {
    if (result.ok) {
      handleAck(actionId);
      return;
    }
    const { action: rejectedAction } = handleNack(actionId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('jagalchi:realtime-nack', {
          detail: {
            actionId,
            actionType: action,
            errorCode: result.code,
            errorMessage: result.message,
            action: rejectedAction,
          },
        }),
      );
    }
  });

  return actionId;
}

/** ACK 처리 — 대기 목록에서 제거 */
export function handleAck(actionId: string): boolean {
  return pendingActions.delete(actionId);
}

/** NACK 처리 — 대기 목록에서 제거 + 에러 정보 반환 */
export function handleNack(actionId: string): {
  action: RealtimeAction | undefined;
  isFound: boolean;
} {
  const action = pendingActions.get(actionId);
  pendingActions.delete(actionId);
  return { action, isFound: !!action };
}

/** 대기 중인 액션 수 */
export function getPendingCount(): number {
  return pendingActions.size;
}

/** 커서 위치 전송 */
export function sendCursorPosition(roadmapId: string, position: { x: number; y: number }): void {
  publishCursor(roadmapId, { x: position.x, y: position.y });
}

/** 커서 숨기기 전송 — 사용자가 캔버스를 떠날 때 호출 */
export function sendCursorHide(roadmapId: string): void {
  publishCursorHide(roadmapId);
}

export type {
  RealtimeAction,
  ActionPayload,
  ActionState,
  ActionType,
  PayloadType,
  TargetType,
  ActionTarget,
};
