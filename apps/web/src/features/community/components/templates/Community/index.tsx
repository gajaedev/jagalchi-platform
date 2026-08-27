'use client';

import React, { useMemo } from 'react';

import { useAtomValue } from 'jotai';

import { Button } from '@/components/ui/button';
import { COMMUNITY_MESSAGES } from '@/constants/messages';
import { useCommunityRoadmaps } from '@/hooks/use-community-roadmaps';
import { useDebounce } from '@/hooks/use-debounce';
import { usePopularRoadmaps } from '@/hooks/use-popular-roadmaps';

import { activeTabAtom, searchQueryAtom } from '../../../stores/community.atoms';
import { CommunityFilter } from '../../molecules/CommunityFilter';
import { CommunityHeader } from '../../molecules/CommunityHeader';
import { CommunityHero } from '../../molecules/CommunityHero';
import { CommunityGrid } from '../../organisms/CommunityGrid';

import type { CommunityItem } from '../../../types/community.types';

export function Community() {
  const searchQuery = useAtomValue(searchQueryAtom);
  const activeTab = useAtomValue(activeTabAtom);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const {
    data: popularData,
    isLoading: isPopularLoading,
    isError: isPopularError,
    refetch: refetchPopular,
  } = usePopularRoadmaps({ size: 12 });

  const {
    data: latestData,
    isLoading: isLatestLoading,
    isError: isLatestError,
    refetch: refetchLatest,
  } = useCommunityRoadmaps({
    search: debouncedQuery || undefined,
    size: 12,
  });

  const popularItems = useMemo<
    Pick<CommunityItem, 'id' | 'title' | 'author' | 'imageUrl'>[]
  >(() => {
    if (!popularData?.items) return [];
    return popularData.items.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.ownerId,
    }));
  }, [popularData]);

  const latestItems = useMemo<Pick<CommunityItem, 'id' | 'title' | 'author' | 'imageUrl'>[]>(() => {
    if (!latestData?.items) return [];
    return latestData.items.map((item) => ({
      id: item.id,
      title: item.title,
      author: item.ownerId,
    }));
  }, [latestData]);

  const isLoading =
    (activeTab === 'popular' && isPopularLoading) || (activeTab === 'latest' && isLatestLoading);
  const isError =
    (activeTab === 'popular' && isPopularError) || (activeTab === 'latest' && isLatestError);
  const refetch = activeTab === 'popular' ? refetchPopular : refetchLatest;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[400px] w-full items-center justify-center">
          <p className="text-muted-foreground text-sm">{COMMUNITY_MESSAGES.LOADING}</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="border-border bg-muted flex h-[400px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
          <p className="text-error text-sm font-medium">{COMMUNITY_MESSAGES.ERROR_LOAD_FAILED}</p>
          <Button
            type="button"
            intent="neutral"
            variant="outline"
            size="xs"
            className="rounded-md font-medium"
            onClick={() => refetch()}
          >
            다시 시도
          </Button>
        </div>
      );
    }

    switch (activeTab) {
      case 'popular':
        return popularItems.length === 0 ? (
          <div className="border-border bg-muted flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm font-medium">
              {COMMUNITY_MESSAGES.POPULAR_EMPTY}
            </p>
          </div>
        ) : (
          <CommunityGrid items={popularItems} />
        );
      case 'latest':
        return <CommunityGrid items={latestItems} />;
      case 'saved':
        return (
          <div className="border-border bg-muted flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm font-medium">
              {COMMUNITY_MESSAGES.SAVED_EMPTY}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center">
      <CommunityHeader />
      <CommunityHero />
      <div className="bg-background flex w-full flex-col items-center pt-[40px] pb-[100px]">
        <CommunityFilter />
        {renderContent()}
      </div>
    </div>
  );
}
