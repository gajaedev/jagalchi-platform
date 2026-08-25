import { useEffect, useRef } from 'react';

import { updateEditableRoadmap } from '@/api/roadmap-domain';
import { useDebounce } from '@/hooks/use-debounce';
import { isEnabled } from '@/lib/feature-flags';

import { dispatchAction } from '../services/action-dispatcher';
import { hashEdges, hashNodes } from '../utils/fast-hash';

import type { RoadmapNode } from '../types/editor.types';
import type { Edge } from '@xyflow/react';

interface UseAutoSaveProps {
  roadmapId: string;
  nodes: RoadmapNode[];
  edges: Edge[];
  title: string;
  isEnabled?: boolean;
}

const isRealtimeEnabled = isEnabled('REALTIME_ENABLED');

export function useAutoSave({
  roadmapId,
  nodes,
  edges,
  title,
  isEnabled = true,
}: UseAutoSaveProps) {
  const prevNodesRef = useRef<string>('');
  const prevEdgesRef = useRef<string>('');
  const prevTitleRef = useRef<string>('');
  const debouncedNodes = useDebounce(nodes, 500);
  const debouncedEdges = useDebounce(edges, 500);
  const debouncedTitle = useDebounce(title, 500);

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined' || !roadmapId) return;

    const currentNodesHash = hashNodes(debouncedNodes);
    const currentEdgesHash = hashEdges(debouncedEdges);
    const currentTitle = debouncedTitle;
    const nodesChanged = currentNodesHash !== prevNodesRef.current;
    const edgesChanged = currentEdgesHash !== prevEdgesRef.current;
    const titleChanged = currentTitle !== prevTitleRef.current;

    if (!nodesChanged && !edgesChanged && !titleChanged) return;

    if (isRealtimeEnabled && titleChanged) {
      dispatchAction(roadmapId, 'EDIT', {
        type: 'INFO',
        target: { type: 'NODE', object: roadmapId },
        data: { title: debouncedTitle },
      });
    }

    void updateEditableRoadmap(roadmapId, {
      title: debouncedTitle,
      graph: {
        schemaVersion: 1,
        nodes: debouncedNodes,
        edges: debouncedEdges,
      },
    })
      .then(() => {
        prevNodesRef.current = currentNodesHash;
        prevEdgesRef.current = currentEdgesHash;
        prevTitleRef.current = currentTitle;
      })
      .catch((error: unknown) => {
        window.dispatchEvent(new CustomEvent('jagalchi:autosave-error', { detail: error }));
      });
  }, [debouncedNodes, debouncedEdges, debouncedTitle, roadmapId, isEnabled]);
}
