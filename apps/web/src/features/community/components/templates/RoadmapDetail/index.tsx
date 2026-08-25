'use client';

import { useState } from 'react';

import NextImage from 'next/image';
import { useRouter } from 'next/navigation';

import { Heart, FilePlus2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { COMMUNITY_MESSAGES } from '@/constants/messages';
import { useForkRoadmap } from '@/hooks/use-fork-roadmap';
import { useRoadmapDetail } from '@/hooks/use-roadmap-detail';
import { cn } from '@/lib/utils';

import { ContributorItem } from '../../atoms/ContributorItem';
import { CommunityHeader } from '../../molecules/CommunityHeader';

interface RoadmapDetailProps {
  id: string;
}

export function RoadmapDetail({ id }: RoadmapDetailProps) {
  const router = useRouter();
  const { data: item, isLoading, isError } = useRoadmapDetail(id);
  const { mutate: fork, isPending: isForking } = useForkRoadmap();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [forkMessage, setForkMessage] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg font-medium">
          {COMMUNITY_MESSAGES.LOADING_DETAIL}
        </p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg font-medium">{COMMUNITY_MESSAGES.NOT_FOUND}</p>
      </div>
    );
  }

  const handleLikeToggle = () => {
    setIsLiked((prev) => {
      const nextLiked = !prev;
      setLikeCount((count) => (nextLiked ? count + 1 : count - 1));
      return nextLiked;
    });
  };

  const handleFork = () => {
    setForkMessage('');
    fork(id, {
      onSuccess: () => setForkMessage(COMMUNITY_MESSAGES.FORK_SUCCESS),
      onError: () => setForkMessage(COMMUNITY_MESSAGES.FORK_FAILED),
    });
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center">
      <CommunityHeader />

      <div className="bg-muted relative h-[400px] w-full">
        {item.thumbnailUrl && (
          <NextImage
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      <div className="flex w-full max-w-[960px] flex-col gap-6 px-4 py-10 md:flex-row md:px-6">
        <div className="flex w-full max-w-[696px] flex-col">
          <div className="mb-4 flex flex-col gap-[16px]">
            <div className="flex items-center justify-between">
              <h1 className="text-foreground text-[24px] leading-[28.8px] font-semibold tracking-[-1px]">
                {item.title}
              </h1>
              <Button
                type="button"
                intent="neutral"
                variant="ghost"
                size="sm"
                onClick={handleLikeToggle}
                className="gap-2"
                aria-pressed={isLiked}
              >
                {likeCount}
                <Heart className={cn('h-[13px] w-[13px]', isLiked && 'fill-error text-error')} />
              </Button>
            </div>

            <div className="flex items-center gap-[16px]">
              <Button intent="neutral" size="sm" onClick={() => router.push(`/viewer/${id}`)}>
                {COMMUNITY_MESSAGES.VIEW_ROADMAP}
              </Button>
              <Button
                intent="neutral"
                size="sm"
                onClick={handleFork}
                loading={isForking}
                loadingLabel="포크 중…"
              >
                <FilePlus2 className="h-[13px] w-[13px]" />
                {COMMUNITY_MESSAGES.ADD_TO_MY_ROADMAPS}
              </Button>
            </div>
            {forkMessage && (
              <p
                className={cn(
                  'text-sm font-medium',
                  forkMessage === COMMUNITY_MESSAGES.FORK_SUCCESS
                    ? 'text-success'
                    : 'text-destructive',
                )}
              >
                {forkMessage}
              </p>
            )}
          </div>

          <section className="flex flex-col gap-[16px]">
            <h2 className="text-foreground text-[20px] leading-none font-semibold">
              {COMMUNITY_MESSAGES.ABOUT}
            </h2>
            <p className="text-foreground text-[16px] leading-[24px]">{item.description ?? ''}</p>
          </section>
        </div>

        <Separator
          orientation="vertical"
          className="bg-border hidden h-auto self-stretch md:block"
        />
        <Separator className="bg-border md:hidden" />

        <aside className="flex w-full flex-col gap-4 md:w-[134px]">
          <div className="flex flex-col gap-[24px]">
            <h3 className="text-foreground text-[20px] leading-none font-semibold">
              {COMMUNITY_MESSAGES.MADE_BY}
            </h3>
            <div className="flex flex-col gap-[16px]">
              <ContributorItem name={item.owner.nickname} />
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="flex flex-col gap-0">
            <span className="text-muted-foreground text-xs font-normal">
              {COMMUNITY_MESSAGES.LAST_UPDATED}
            </span>
            <span className="text-foreground text-xs font-normal">{item.updatedAt}</span>
          </div>

          {item.stats.forkCount > 0 && (
            <div className="flex flex-col gap-0">
              <span className="text-muted-foreground text-xs font-normal">
                {COMMUNITY_MESSAGES.FORK_COUNT_LABEL}
              </span>
              <span className="text-foreground text-xs font-normal">{item.stats.forkCount}</span>
            </div>
          )}

          {item.tags.length > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
