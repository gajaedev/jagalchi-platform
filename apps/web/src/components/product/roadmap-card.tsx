'use client';

import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { capture } from '@/lib/analytics/client';
import type { RecommendationSource } from '@/lib/analytics/events';

export type RoadmapCardProps = {
  title: string;
  description: string;
  author: string;
  progress?: number;
  href: string;
  tags?: string[];
  analyticsSource?: RecommendationSource;
};

export function RoadmapCard({
  title,
  description,
  author,
  progress,
  href,
  tags = [],
  analyticsSource,
}: RoadmapCardProps) {
  const normalizedProgress =
    progress === undefined ? undefined : Math.min(100, Math.max(0, progress));

  return (
    <Card
      asChild
      intent="neutral"
      variant="outlined"
      padding="none"
      radius="lg"
      className="border-border bg-surface hover:bg-muted transition-colors"
    >
      <article className="group relative flex h-full min-h-56 flex-col gap-[14px] p-[18px]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-1.5" aria-label="실행 과제 태그">
            {tags.map((tag) => (
              <Badge key={tag} intent="neutral" variant="subtle" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
          <ArrowUpRight
            aria-hidden="true"
            className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-[color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>

        <h3 className="text-lg leading-[1.35] font-extrabold tracking-tight">{title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-[13px] leading-6">{description}</p>

        <div className="mt-auto pt-1">
          {normalizedProgress !== undefined ? (
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">증거 완성률</span>
                <span className="text-primary">{normalizedProgress}%</span>
              </div>
              <div
                className="bg-muted h-1.5 overflow-hidden rounded-full"
                role="progressbar"
                aria-label={`${title} 증거 완성률`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={normalizedProgress}
              >
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${normalizedProgress}%` }}
                />
              </div>
            </div>
          ) : null}
          <p className="text-muted-foreground text-xs">{author}</p>
        </div>

        <Link
          href={href}
          onClick={() => {
            if (analyticsSource) capture('recommendation_selected', { source: analyticsSource });
          }}
          className="focus-visible:ring-primary focus-visible:ring-offset-surface absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span className="sr-only">{title} 실행 과제 보기</span>
        </Link>
      </article>
    </Card>
  );
}
