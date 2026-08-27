import { useQuery } from '@tanstack/react-query';

import { type PopularRoadmapsParams, type RoadmapListResponse } from '@/api/roadmap';
import { listPublicRoadmaps } from '@/api/roadmap-domain';
import { queryKeys } from '@/lib/query-keys';

export function usePopularRoadmaps(params: PopularRoadmapsParams = {}) {
  return useQuery<RoadmapListResponse>({
    queryKey: queryKeys.roadmaps.popular(params),
    queryFn: () => listPublicRoadmaps(params),
  });
}
