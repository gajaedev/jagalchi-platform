import { useQuery } from '@tanstack/react-query';

import { listPublicRoadmaps } from '@/api/roadmap-domain';
import type { RoadmapRecord } from '@/api/roadmap-domain';
import { queryKeys } from '@/lib/query-keys';

interface UseProfileRoadmapsParams {
  userName: string;
  userId?: string;
  enabled?: boolean;
}

export function useProfileRoadmaps({ userName, userId, enabled = true }: UseProfileRoadmapsParams) {
  return useQuery<RoadmapRecord[]>({
    queryKey: queryKeys.roadmaps.lists(userId ? { ownerId: userId } : { ownerName: userName }),
    queryFn: async () => {
      if (!userId) return [];
      const response = await listPublicRoadmaps({ ownerId: userId });
      return response.items;
    },
    enabled: enabled && !!userId,
  });
}
