import { Suspense } from 'react';

import Link from 'next/link';

import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import { ExploreResults } from '@/features/explore/components/explore-results';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '과제 템플릿',
  description: '지원에 필요한 결과물을 만드는 실전 과제 템플릿을 찾아보세요.',
};

const topics = ['전체', '테스트', '성능', '접근성', 'API', '아키텍처', '배포'];

export default function ExplorePage() {
  return (
    <AppShell activeTab="explore">
      <div className="w-full">
        <header className="bg-primary/10 rounded-2xl px-5 py-7 sm:px-8 sm:py-9">
          <p className="text-primary text-sm font-bold">로그인 없이 누구나 둘러볼 수 있어요</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            지원에 쓸 결과물 과제를 찾아보세요
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            PR·테스트·배포처럼 완료 조건이 분명한 과제를 내 프로젝트에 적용하세요.
          </p>

          <form action="/explore" className="mt-5 flex max-w-3xl gap-2" role="search">
            <label htmlFor="roadmap-search" className="sr-only">
              실전 과제 또는 증거 유형 검색
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
                placeholder="예: 로그인 E2E 테스트 추가"
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

        <nav aria-label="과제 주제" className="mt-6 overflow-x-auto pb-1">
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
              <p className="text-primary text-xs font-bold">바로 실행할 수 있어요</p>
              <h2
                id="results-heading"
                className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl"
              >
                증거를 만드는 과제 템플릿
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

          <Suspense fallback={<p className="text-muted-foreground text-sm">과제 준비 중…</p>}>
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
              완료 사례와 보완 피드백을 확인하세요
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              다른 개발자가 어떤 PR과 배포 결과로 과제를 끝냈는지 둘러볼 수 있어요.
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
