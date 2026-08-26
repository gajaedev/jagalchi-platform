import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import type { RoadmapListParams } from '@/api/roadmap';
import { listOwnedRoadmaps } from '@/api/roadmap-domain';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';
import { queryKeys } from '@/lib/query-keys';

export function useRoadmaps(params: RoadmapListParams = {}) {
  const authenticated = useAtomValue(isAuthenticatedAtom);
  return useQuery({
    queryKey: [...queryKeys.roadmaps.lists(), params],
    queryFn: () => listOwnedRoadmaps(params.query),
    enabled: authenticated,
    placeholderData: (previousData) => previousData,
  });
}
