import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { completeNode, getMyProgress } from '@/api/roadmap';
import type { ProgressResponse } from '@/api/roadmap';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';
import { queryKeys } from '@/lib/query-keys';

export function useRoadmapProgress(roadmapId: string) {
  const authenticated = useAtomValue(isAuthenticatedAtom);
  return useQuery<ProgressResponse>({
    queryKey: queryKeys.roadmaps.progress(roadmapId),
    queryFn: () => getMyProgress(roadmapId),
    enabled: Boolean(roadmapId) && authenticated,
  });
}

export function useCompleteNode(roadmapId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      nodeId,
      isCompleted,
      link,
    }: {
      nodeId: string;
      isCompleted: boolean;
      link?: string;
    }) => completeNode(roadmapId, nodeId, { isCompleted, link }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.progress(roadmapId) });
    },
  });
}
