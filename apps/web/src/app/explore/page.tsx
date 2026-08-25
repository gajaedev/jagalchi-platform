import { Suspense } from 'react';

import Link from 'next/link';

import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import { ExploreResults } from '@/features/explore/components/explore-results';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '탐색',
  description: '직무, 기술, 목표에 맞는 인기 학습 로드맵을 찾아보세요.',
};

const topics = ['전체', '프론트엔드', '백엔드', '모바일', 'AI', '데이터', 'DevOps'];

export default function ExplorePage() {
  return (
    <AppShell activeTab="explore">
      <div className="w-full">
        <header className="bg-primary/10 rounded-2xl px-5 py-7 sm:px-8 sm:py-9">
          <p className="text-primary text-sm font-bold">로그인 없이 누구나 둘러볼 수 있어요</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            배우고 싶은 기술을 찾아보세요
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            직무, 기술, 목표로 검색하면 지금 시작하기 좋은 로드맵을 추천해드려요.
          </p>

          <form action="/explore" className="mt-5 flex max-w-3xl gap-2" role="search">
            <label htmlFor="roadmap-search" className="sr-only">
              로드맵, 기술 또는 직무 검색
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
              />
              <input
                id="roadmap-search"
                name="q"
                type="search"
                placeholder="예: Expo로 앱 출시하기"
                className="border-border bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-12 w-full rounded-xl border pr-4 pl-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Search aria-hidden="true" className="size-5 sm:mr-2" />
              <span className="sr-only sm:not-sr-only">검색</span>
            </button>
          </form>
        </header>

        <nav aria-label="로드맵 주제" className="mt-6 overflow-x-auto pb-1">
          <ul className="flex min-w-max gap-2">
            {topics.map((topic, index) => (
              <li key={topic}>
                <Link
                  href={index === 0 ? '/explore' : `/explore?topic=${encodeURIComponent(topic)}`}
                  aria-current={index === 0 ? 'page' : undefined}
                  className={
                    index === 0
                      ? 'bg-foreground text-background focus-visible:ring-ring inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                      : 'border-border bg-background hover:bg-accent focus-visible:ring-ring inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                  }
                >
                  {topic}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="results-heading" className="mt-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary text-xs font-bold">에디터 추천</p>
              <h2
                id="results-heading"
                className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl"
              >
                지금 인기 있는 로드맵
              </h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="결과 필터 및 정렬">
              <label className="sr-only" htmlFor="level-filter">
                난이도 필터
              </label>
              <select
                id="level-filter"
                name="level"
                defaultValue="beginner"
                className="border-border bg-background focus-visible:ring-ring min-h-11 shrink-0 rounded-xl border px-3 text-sm font-bold outline-none focus-visible:ring-2"
              >
                <option value="all">모든 난이도</option>
                <option value="beginner">초급</option>
                <option value="intermediate">중급</option>
              </select>
              <label className="sr-only" htmlFor="sort-order">
                정렬 기준
              </label>
              <select
                id="sort-order"
                name="sort"
                defaultValue="popular"
                className="border-border bg-background focus-visible:ring-ring min-h-11 shrink-0 rounded-xl border px-3 text-sm font-bold outline-none focus-visible:ring-2"
              >
                <option value="popular">인기순</option>
                <option value="recent">최신순</option>
              </select>
              <button
                type="button"
                className="border-border bg-background hover:bg-accent focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                최근 1년
              </button>
            </div>
          </div>

          <Suspense fallback={<p className="text-muted-foreground text-sm">로드맵 준비 중…</p>}>
            <ExploreResults />
          </Suspense>
        </section>

        <aside
          aria-labelledby="community-heading"
          className="border-border bg-muted/50 mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-7"
        >
          <div>
            <p className="text-primary text-xs font-bold">커뮤니티</p>
            <h2 id="community-heading" className="mt-2 text-lg font-extrabold sm:text-xl">
              혼자 막히지 않도록 함께 질문해요
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              로그인하지 않아도 학습자들의 질문과 앱 출시 이야기를 먼저 둘러볼 수 있어요.
            </p>
          </div>
          <Link
            href="/community"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            커뮤니티 보기
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
