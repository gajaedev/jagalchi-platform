import { useQuery } from '@tanstack/react-query';

import { type PopularRoadmapsParams, type RoadmapListResponse } from '@/api/roadmap';
import { listPublicRoadmaps } from '@/api/roadmap-domain';
import { queryKeys } from '@/lib/query-keys';

export function usePopularRoadmaps(params: PopularRoadmapsParams = {}) {
  return useQuery<RoadmapListResponse>({
    queryKey: queryKeys.roadmaps.popular(params),
    queryFn: async () => {
      const response = await listPublicRoadmaps({
        page: params.page === undefined ? 1 : params.page + 1,
        size: params.size,
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
