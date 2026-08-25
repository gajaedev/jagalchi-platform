import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { getForkStatus, type RoadmapForkStatusResponse } from '@/api/roadmap';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';
import { queryKeys } from '@/lib/query-keys';

export function useForkStatus(roadmapId: string) {
  const authenticated = useAtomValue(isAuthenticatedAtom);
  return useQuery<RoadmapForkStatusResponse>({
    queryKey: queryKeys.roadmaps.forkStatus(roadmapId),
    queryFn: () => getForkStatus(roadmapId),
    enabled: Boolean(roadmapId) && authenticated,
  });
}
