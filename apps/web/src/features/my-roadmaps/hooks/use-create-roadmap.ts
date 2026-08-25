import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateRoadmapRequest } from '@/api/roadmap';
import { createOwnedRoadmap } from '@/api/roadmap-domain';
import { queryKeys } from '@/lib/query-keys';

export function useCreateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoadmapRequest) => createOwnedRoadmap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.lists() });
    },
  });
}
