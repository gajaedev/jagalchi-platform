import Link from 'next/link';

import { ArrowRight, ListChecks, Target } from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import { HomeAudience } from '@/components/product/home-audience';
import { RecommendationListTracker } from '@/components/product/recommendation-list-tracker';
import { RoadmapCard } from '@/components/product/roadmap-card';
import { Button } from '@/components/ui/button';
import { isEnabled } from '@/lib/feature-flags';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '홈 | 자갈치' },
  description: '목표 직무에 필요한 역량과 실제 결과물 사이의 차이를 확인하세요.',
};

const roadmaps = [
  {
    title: '상품 목록 성능 개선',
    description: 'Lighthouse 기준을 정하고 실제 개선 PR과 전후 측정 결과를 남겨요.',
    tags: ['PR', '성능'],
  },
  {
    title: '로그인 E2E 테스트 구축',
    description: 'Playwright 테스트와 CI 실행 결과를 하나의 증거로 완성해요.',
    tags: ['테스트', 'CI'],
  },
  {
    title: '배포 자동화와 롤백 문서',
    description: '배포 워크플로와 실패 시 복구 절차를 실제 저장소에 남겨요.',
    tags: ['배포', '문서'],
  },
];

const isEvidenceExecutionEnabled = isEnabled('EVIDENCE_EXECUTION_ENABLED');

function GuestHome() {
  return (
    <>
      <section className="bg-primary text-primary-foreground overflow-hidden rounded-3xl px-6 py-9 sm:px-10 sm:py-12">
        <p className="text-primary-foreground/80 text-sm font-bold">
          채용공고에서 시작하는 커리어 준비
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          공부한 만큼
          <br />
          증명되는 커리어를 만드세요
        </h1>
        <p className="text-primary-foreground/80 mt-4 max-w-xl text-sm leading-6 sm:text-base">
          목표 직무의 요구사항과 GitHub·배포·기술 문서를 연결해, 부족한 역량 증거를 정확히
          확인하세요.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {isEvidenceExecutionEnabled ? (
            <Button asChild intent="inverse" size="lg">
              <Link href="/register">
                Career Diff 시작
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Button asChild intent="inverse" variant="outline" size="lg">
            <Link href="/explore">실전 과제 둘러보기</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="guest-roadmaps-heading" className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-bold">실무 결과물 중심</p>
            <h2 id="guest-roadmaps-heading" className="mt-1 text-xl font-extrabold sm:text-2xl">
              역량 증거를 만드는 실행 과제
            </h2>
          </div>
          <Link href="/explore" className="text-primary text-sm font-bold hover:underline">
            전체보기
          </Link>
        </div>
        <RecommendationListTracker source="home" resultCount={roadmaps.length} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.title}
              {...roadmap}
              author="자갈치 에디터 추천"
              progress={undefined}
              href="/explore"
              analyticsSource="home"
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
              <header className="max-w-2xl">
                <p className="text-primary text-sm font-bold">결과물 중심 커리어 준비</p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  목표를 정하고 첫 실행 과제를 시작하세요
                </h1>
                <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
                  아직 이 화면에 표시할 계정별 진행 데이터가 없습니다. Career에서 목표 직무와 필요한
                  증거를 정하거나, 실행 과제에서 현재 작업을 확인하세요.
                </p>
              </header>

              <section
                aria-labelledby="signed-start-heading"
                className="mt-7 grid gap-4 md:grid-cols-2"
              >
                <h2 id="signed-start-heading" className="sr-only">
                  커리어 준비 시작
                </h2>
                {isEvidenceExecutionEnabled ? (
                  <article className="border-primary/30 bg-primary-subtle rounded-3xl border p-6 sm:p-7">
                    <Target aria-hidden="true" className="text-primary size-6" />
                    <h3 className="mt-5 text-xl font-extrabold">목표 직무와 증거 차이 정하기</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      목표 공고를 등록하고, 요구 역량에 연결할 결과물과 검토 상태를 관리합니다.
                    </p>
                    <Button asChild className="mt-6">
                      <Link href="/career">
                        Career 열기
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                  </article>
                ) : null}

                <article className="border-border bg-card rounded-3xl border p-6 sm:p-7">
                  <ListChecks aria-hidden="true" className="text-primary size-6" />
                  <h3 className="mt-5 text-xl font-extrabold">실행 과제 확인하기</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    만들어진 실행 과제를 열어 단계와 작업을 확인하고 관리합니다.
                  </p>
                  <Button asChild variant="outline" className="mt-6">
                    <Link href="/myroadmap">
                      실행 과제 열기
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                </article>
              </section>

              <section
                aria-labelledby="discovery-heading"
                className="border-border bg-muted/50 mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-7"
              >
                <div>
                  <p className="text-primary text-xs font-bold">처음 방문하셨나요?</p>
                  <h2 id="discovery-heading" className="mt-2 text-lg font-extrabold">
                    검증 가능한 결과물 사례를 둘러보세요
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    공개된 결과물 사례에서 과제 구성 방식을 확인하세요.
                  </p>
                </div>
                <Link
                  href="/community"
                  className="border-border bg-background hover:bg-accent focus-visible:ring-ring inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  완료 사례 둘러보기
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
