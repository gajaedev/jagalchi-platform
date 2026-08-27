import { useQuery } from '@tanstack/react-query';

import { type RoadmapListParams, type RoadmapListResponse } from '@/api/roadmap';
import { listPublicRoadmaps } from '@/api/roadmap-domain';
import { queryKeys } from '@/lib/query-keys';

interface UseCommunityRoadmapsParams {
  search?: string;
  tag?: string;
  page?: number;
  size?: number;
}

export function useCommunityRoadmaps(params: UseCommunityRoadmapsParams = {}) {
  const apiParams: RoadmapListParams = {
    search: params.search,
    tag: params.tag,
    page: params.page,
    size: params.size,
  };

  return useQuery<RoadmapListResponse>({
    queryKey: queryKeys.community.lists(apiParams),
    queryFn: () => listPublicRoadmaps(apiParams),
  });
}
