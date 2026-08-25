'use client';

import { useEffect } from 'react';

import { useAtomValue, useSetAtom } from 'jotai';

import { getEditableRoadmap, getPublicRoadmap } from '@/api/roadmap-domain';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';

import { viewerErrorAtom, viewerLoadingAtom, viewerRoadmapAtom } from '../stores/viewer-atoms';

export function useViewerRoadmapLoader(roadmapId: string) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setRoadmap = useSetAtom(viewerRoadmapAtom);
  const setLoading = useSetAtom(viewerLoadingAtom);
  const setError = useSetAtom(viewerErrorAtom);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let detail: Awaited<ReturnType<typeof getPublicRoadmap>>;
        try {
          detail = await getPublicRoadmap(roadmapId);
        } catch (error) {
          if (!isAuthenticated) throw error;
          detail = await getEditableRoadmap(roadmapId);
        }
        if (cancelled) return;
        setRoadmap({
          id: detail.id,
          title: detail.title,
          description: detail.description || undefined,
          nodes: detail.graph.nodes,
          edges: detail.graph.edges,
          author: { id: detail.ownerId, name: '자갈치 학습자' },
          isPublic: detail.visibility === 'PUBLIC',
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        });
        setLoading(false);
        return;
      } catch {
        if (cancelled) return;
        setError('공개 로드맵을 불러오지 못했습니다.');
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, roadmapId, setError, setLoading, setRoadmap]);
}
