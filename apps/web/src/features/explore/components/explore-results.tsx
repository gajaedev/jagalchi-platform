'use client';

import { useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { listPublicRoadmaps } from '@/api/roadmap-domain';
import { RecommendationListTracker } from '@/components/product/recommendation-list-tracker';
import { RoadmapCard } from '@/components/product/roadmap-card';

export function ExploreResults() {
  const params = useSearchParams();
  const search = params.get('q')?.trim() || undefined;
  const topic = params.get('topic')?.trim();
  const tag = topic && topic !== '전체' ? topic : undefined;
  const query = useQuery({
    queryKey: ['roadmaps', 'public', { search, tag }],
    queryFn: () => listPublicRoadmaps({ search, tag }),
  });

  if (query.isLoading) {
    return (
      <p className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
        로드맵을 찾고 있어요.
      </p>
    );
  }
  if (query.isError) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-sm font-bold">로드맵을 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="text-primary mt-3 text-sm font-bold hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }
  const roadmaps = query.data?.items ?? [];
  if (!roadmaps.length) {
    return (
      <>
        <RecommendationListTracker source="explore" resultCount={0} />
        <p className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
          조건에 맞는 공개 로드맵이 없어요.
        </p>
      </>
    );
  }
  return (
    <>
      <RecommendationListTracker source="explore" resultCount={roadmaps.length} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roadmaps.map((roadmap) => (
          <RoadmapCard
            key={roadmap.id}
            title={roadmap.title}
            description={roadmap.description}
            author="자갈치 학습자"
            href={`/viewer/${roadmap.id}`}
            tags={roadmap.tags}
            analyticsSource="explore"
          />
        ))}
      </div>
    </>
  );
}
