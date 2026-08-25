import Link from 'next/link';

import { ArrowRight, Check, Circle, Clock3, Flame, Sparkles } from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import { CurrentLessonCard } from '@/components/product/current-lesson-card';
import { HomeAudience } from '@/components/product/home-audience';
import { RoadmapCard } from '@/components/product/roadmap-card';
import { Button } from '@/components/ui/button';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '홈 | 자갈치' },
  description: '오늘의 학습 목표와 진행 중인 로드맵을 한곳에서 확인하세요.',
};

const roadmaps = [
  {
    title: '프론트엔드 마스터',
    description: 'React 상태 관리부터 성능 최적화까지 실전으로 익혀요.',
    author: '내가 만든 로드맵',
    progress: 62,
    href: '/myroadmap',
    tags: ['React', '프론트엔드'],
  },
  {
    title: '앱 개발 풀코스',
    description: 'Expo로 시작해 스토어 배포까지 앱 개발 전 과정을 배워요.',
    author: '재민님의 로드맵을 포크',
    progress: 18,
    href: '/myroadmap',
    tags: ['Expo', '모바일'],
  },
  {
    title: 'NestJS 백엔드 입문',
    description: '견고한 API 설계와 데이터베이스 연동의 기초를 다져요.',
    author: '내가 만든 로드맵',
    progress: 0,
    href: '/myroadmap',
    tags: ['NestJS', '백엔드'],
  },
];

const goals = [
  { label: 'React Query 개념 복습', completed: true },
  { label: '캐싱 전략 실습', completed: true },
  { label: '낙관적 업데이트 배우기', completed: false, meta: '18분' },
];

function GuestHome() {
  return (
    <>
      <section className="bg-primary text-primary-foreground overflow-hidden rounded-3xl px-6 py-9 sm:px-10 sm:py-12">
        <p className="text-primary-foreground/80 text-sm font-bold">로그인 없이 바로 탐색</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          배우고 싶은 것을
          <br />
          순서대로 시작하세요
        </h1>
        <p className="text-primary-foreground/80 mt-4 max-w-xl text-sm leading-6 sm:text-base">
          다른 학습자가 만든 로드맵을 둘러보고, 나에게 맞는 경로를 발견해 보세요.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild intent="inverse" size="lg">
            <Link href="/explore">
              로드맵 탐색
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          <Button asChild intent="inverse" variant="outline" size="lg">
            <Link href="/register">무료로 시작</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="guest-roadmaps-heading" className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-bold">에디터 추천</p>
            <h2 id="guest-roadmaps-heading" className="mt-1 text-xl font-extrabold sm:text-2xl">
              지금 인기 있는 로드맵
            </h2>
          </div>
          <Link href="/explore" className="text-primary text-sm font-bold hover:underline">
            전체보기
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.title}
              {...roadmap}
              author="자갈치 에디터 추천"
              progress={undefined}
              href="/explore"
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <AppShell activeTab="home">
      <div className="w-full">
        <HomeAudience
          guest={<GuestHome />}
          signed={
            <>
              <header className="mb-6">
                <p className="text-muted-foreground text-sm font-semibold">
                  좋은 아침이에요, 민지님
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  오늘은 여기서 시작해요
                </h1>
              </header>

              <section
                aria-labelledby="current-lesson-heading"
                className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:gap-6"
              >
                <h2 id="current-lesson-heading" className="sr-only">
                  현재 학습
                </h2>
                <CurrentLessonCard
                  roadmap="프론트엔드 마스터 · 11 / 18 완료"
                  title="오늘은 React 상태 관리부터 이어가요"
                  meta="약 18분 · 자료 3개 · 퀘스트 2개"
                  href="/myroadmap"
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
                  <article className="border-border bg-card rounded-2xl border p-4 sm:p-5">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold">
                      <Clock3 aria-hidden="true" className="text-primary size-4" />
                      이번 주 학습
                    </div>
                    <p className="mt-3 text-xl font-extrabold sm:text-2xl">3시간 24분</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      지난주보다 42분 늘었어요
                    </p>
                  </article>
                  <article className="border-border bg-card rounded-2xl border p-4 sm:p-5">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold">
                      <Flame aria-hidden="true" className="text-warning size-4" />
                      연속 학습
                    </div>
                    <p className="mt-3 text-xl font-extrabold sm:text-2xl">7일</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      오늘 기록하면 8일
                    </p>
                  </article>
                </div>
              </section>

              <section aria-labelledby="roadmaps-heading" className="mt-10">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-primary text-xs font-bold">나의 학습 경로</p>
                    <h2
                      id="roadmaps-heading"
                      className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl"
                    >
                      학습 중인 로드맵
                    </h2>
                  </div>
                  <Link
                    href="/myroadmap"
                    className="text-primary focus-visible:ring-ring shrink-0 rounded-md text-sm font-bold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-offset-4"
                  >
                    전체보기
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roadmaps.map((roadmap) => (
                    <RoadmapCard key={roadmap.title} {...roadmap} />
                  ))}
                </div>
              </section>

              <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-6">
                <section
                  aria-labelledby="goals-heading"
                  className="border-border bg-card rounded-2xl border p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 id="goals-heading" className="text-lg font-extrabold">
                      오늘의 목표
                    </h2>
                    <span className="text-primary text-xs font-bold">2 / 3 완료</span>
                  </div>
                  <ul className="mt-5 space-y-4">
                    {goals.map((goal) => (
                      <li key={goal.label} className="flex items-center gap-3">
                        <span
                          className={
                            goal.completed
                              ? 'bg-success text-success-foreground flex size-7 shrink-0 items-center justify-center rounded-full'
                              : 'border-border text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border'
                          }
                        >
                          {goal.completed ? (
                            <Check aria-hidden="true" className="size-4" />
                          ) : (
                            <Circle aria-hidden="true" className="size-3" />
                          )}
                        </span>
                        <span
                          className={
                            goal.completed
                              ? 'text-muted-foreground text-sm line-through'
                              : 'text-sm font-bold'
                          }
                        >
                          {goal.label}
                        </span>
                        <span
                          className={
                            goal.completed
                              ? 'text-success ml-auto text-xs font-semibold'
                              : 'text-primary ml-auto text-xs font-semibold'
                          }
                        >
                          {goal.completed ? '완료' : goal.meta}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <aside
                  aria-labelledby="ai-recommendation-heading"
                  className="bg-ticket-subtle text-foreground rounded-2xl p-5 sm:p-6"
                >
                  <div className="text-ticket flex items-center gap-2 text-xs font-extrabold">
                    <Sparkles aria-hidden="true" className="size-4" />
                    AI 추천
                  </div>
                  <h2 id="ai-recommendation-heading" className="mt-4 text-lg font-extrabold">
                    지금은 짧은 실습이 효과적이에요
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    최근 학습 패턴을 보면 20분 내외 실습에서 완료율이 가장 높아요.
                  </p>
                  <Button asChild intent="ticket" size="sm" className="mt-5">
                    <Link href="/community">
                      추천 실습 보기
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                </aside>
              </div>

              <section
                aria-labelledby="discovery-heading"
                className="border-border bg-muted/50 mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-7"
              >
                <div>
                  <p className="text-primary text-xs font-bold">처음 방문하셨나요?</p>
                  <h2 id="discovery-heading" className="mt-2 text-lg font-extrabold">
                    로그인 없이도 새로운 학습 경로를 발견할 수 있어요
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    다른 학습자들이 만든 인기 로드맵을 편하게 둘러보세요.
                  </p>
                </div>
                <Link
                  href="/community"
                  className="border-border bg-background hover:bg-accent focus-visible:ring-ring inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  인기 로드맵 둘러보기
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </section>
            </>
          }
        />
      </div>
    </AppShell>
  );
}
