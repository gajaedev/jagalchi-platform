import { useQuery } from '@tanstack/react-query';

import { type RoadmapListParams, type RoadmapListResponse } from '@/api/roadmap';
import { listPublicRoadmaps } from '@/api/roadmap-domain';
import { queryKeys } from '@/lib/query-keys';

interface UseCommunityRoadmapsParams {
  sort?: string;
  query?: string;
  tags?: string[];
  page?: number;
  size?: number;
}

export function useCommunityRoadmaps(params: UseCommunityRoadmapsParams = {}) {
  const apiParams: RoadmapListParams = {
    isPublic: true,
    sort: params.sort,
    query: params.query || undefined,
    tags: params.tags,
    page: params.page,
    size: params.size,
  };

  return useQuery<RoadmapListResponse>({
    queryKey: queryKeys.community.lists(apiParams),
    queryFn: async () => {
      const response = await listPublicRoadmaps({
        search: apiParams.query,
        tag: apiParams.tags?.[0],
        page: apiParams.page === undefined ? 1 : apiParams.page + 1,
        size: apiParams.size,
      });
      return {
        content: response.items.map((roadmap) => ({
          id: roadmap.id,
          isPublic: true,
          thumbnailUrl: null,
          title: roadmap.title,
          tags: roadmap.tags,
          updatedAt: roadmap.updatedAt,
          owner: {
            id: roadmap.ownerId,
            nickname: '자갈치 학습자',
            profileImageUrl: null,
          },
        })),
        pageable: { pageNumber: response.page, pageSize: response.size },
        totalElements: response.total,
        totalPages: Math.ceil(response.total / response.size),
        hasNext: response.page * response.size < response.total,
      };
    },
  });
}
