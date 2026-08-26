import Link from 'next/link';

import { ArrowRight, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type CurrentLessonCardProps = {
  roadmap: string;
  title: string;
  meta: string;
  href: string;
};

export function CurrentLessonCard({ roadmap, title, meta, href }: CurrentLessonCardProps) {
  return (
    <Card asChild intent="primary" variant="solid" padding="lg" radius="xl">
      <article className="h-full">
        <div className="text-primary-foreground/75 flex items-center gap-2 text-xs font-bold">
          <span className="bg-primary-foreground/15 flex size-7 items-center justify-center rounded-full">
            <Play aria-hidden="true" className="size-3.5 fill-current" />
          </span>
          이어서 실행하기
        </div>

        <p className="text-primary-foreground/75 mt-7 text-sm font-semibold">{roadmap}</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="text-primary-foreground/75 mt-3 text-sm">{meta}</p>

        <Button asChild intent="inverse" size="lg" className="mt-8 w-fit">
          <Link href={href}>
            과제 이어가기
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </article>
    </Card>
  );
}
