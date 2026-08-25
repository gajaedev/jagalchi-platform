import { useCallback, useEffect } from 'react';

import { useSetAtom } from 'jotai';

import { useRealtime } from '@/hooks/use-realtime';
import { isEnabled } from '@/lib/feature-flags';

import { sendCursorHide } from '../services/action-dispatcher';
import { nodesAtom, edgesAtom, remoteCursorsAtom, type RemoteCursor } from '../stores/editor-atoms';

import type { RoadmapNode } from '../types/editor.types';
import type { Edge } from '@xyflow/react';

const isRealtimeEnabled = isEnabled('REALTIME_ENABLED');
const isE2EMockingEnabled = process.env.NEXT_PUBLIC_E2E_MOCKING === 'true';
const isApiMockingEnabled =
  process.env.NEXT_PUBLIC_API_MOCKING === 'true' &&
  (process.env.NODE_ENV !== 'production' || isE2EMockingEnabled);
const shouldUseRealtime = isRealtimeEnabled && !isApiMockingEnabled;

interface UseRealtimeSyncOptions {
  roadmapId: string;
  isEnabled?: boolean;
}

/**
 * 에디터 실시간 동기화 훅.
 * Socket.IO 이벤트를 구독하여 원격 변경사항을 로컬 atom에 반영.
 * NEXT_PUBLIC_REALTIME_ENABLED=true 일 때만 활성화.
 */
export function useRealtimeSync({ roadmapId, isEnabled = true }: UseRealtimeSyncOptions) {
  const setNodes = useSetAtom(nodesAtom);
  const setEdges = useSetAtom(edgesAtom);
  const setRemoteCursors = useSetAtom(remoteCursorsAtom);
  const handleBeforeDisconnect = useCallback(() => {
    if (roadmapId) {
      sendCursorHide(roadmapId);
    }
  }, [roadmapId]);
  const { isConnected, subscribe } = useRealtime({
    isAutoConnect: shouldUseRealtime && isEnabled,
    roadmapId,
    onBeforeDisconnect: handleBeforeDisconnect,
  });

  // 커서 위치 구독
  const handleCursorsMessage = useCallback(
    (data: { roadmapId: string; actorId: string; x: number; y: number }) => {
      if (data.roadmapId !== roadmapId) return;
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.set(data.actorId, {
          userName: '공동 학습자',
          x: data.x,
          y: data.y,
          state: 'NORMAL' as RemoteCursor['state'],
        });
        return next;
      });
    },
    [roadmapId, setRemoteCursors],
  );

  const handleCursorsHideMessage = useCallback(
    (data: { roadmapId: string; actorId: string }) => {
      if (data.roadmapId !== roadmapId) return;
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.delete(data.actorId);
        return next;
      });
    },
    [roadmapId, setRemoteCursors],
  );

  // 상태 이벤트 구독 — CREATE/EDIT/DELETE 브로드캐스트
  const handleStateEvent = useCallback(
    (event: {
      roadmapId: string;
      operation: {
        type: string;
        targetId: string;
        value?: {
          payload?: {
            next?: Record<string, unknown> | null;
            data?: Record<string, unknown> | null;
          };
        };
      };
    }) => {
      if (event.roadmapId !== roadmapId) return;
      const { operation } = event;
      const separator = operation.type.lastIndexOf('_');
      if (separator < 0) return;
      const targetType = operation.type.slice(0, separator);
      const verb = operation.type.slice(separator + 1);
      const targetId = operation.targetId;
      const state = operation.value?.payload?.next ?? operation.value?.payload?.data;
      const deleted = verb === 'DELETE';

      if (targetType === 'NODE' || targetType === 'SECTION' || targetType === 'TEXT') {
        if (deleted) {
          // 삭제 이벤트
          setNodes((prev) => prev.filter((node) => node.id !== targetId));
        } else {
          setNodes((prev) => {
            const existingNode = prev.find((n) => n.id === targetId);
            if (!existingNode) {
              // CREATE: payload.state를 새 노드로 추가
              if (state) return [...prev, state as RoadmapNode];
              return prev;
            }
            // UPDATE
            return prev.map((node) => {
              if (node.id !== targetId) return node;
              return state ? ({ ...node, ...state } as RoadmapNode) : node;
            });
          });
        }
      } else if (targetType === 'EDGE') {
        if (deleted) {
          setEdges((prev) => prev.filter((edge) => edge.id !== targetId));
        } else {
          setEdges((prev) => {
            const existingEdge = prev.find((e) => e.id === targetId);
            if (!existingEdge) {
              // CREATE: payload.state를 새 엣지로 추가
              if (state) return [...prev, state as Edge];
              return prev;
            }
            // UPDATE
            return prev.map((edge) => {
              if (edge.id !== targetId) return edge;
              return state ? ({ ...edge, ...state } as Edge) : edge;
            });
          });
        }
      }
    },
    [roadmapId, setNodes, setEdges],
  );

  // 구독 설정
  useEffect(() => {
    if (!isConnected || !shouldUseRealtime || !isEnabled) return;

    const stateSub = subscribe('roadmap:event', handleStateEvent);
    const cursorsSub = subscribe('roadmap:cursor', handleCursorsMessage);
    const cursorsHideSub = subscribe('roadmap:cursor-hide', handleCursorsHideMessage);

    return () => {
      stateSub?.unsubscribe();
      cursorsSub?.unsubscribe();
      cursorsHideSub?.unsubscribe();
    };
  }, [
    isConnected,
    roadmapId,
    isEnabled,
    subscribe,
    handleStateEvent,
    handleCursorsMessage,
    handleCursorsHideMessage,
  ]);

  return { isConnected: shouldUseRealtime ? isConnected : undefined };
}
