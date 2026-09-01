import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import { CurrentLessonCard } from '@/components/product/current-lesson-card';
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

type SupportCardProps = {
  label: string;
  title: string;
  description: string;
};

function SupportCard({ label, title, description }: SupportCardProps) {
  return (
    <article className="border-border bg-surface flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border p-[22px]">
      <p className="text-muted-foreground text-xs font-bold">{label}</p>
      <h3 className="text-lg leading-tight font-extrabold tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-6">{description}</p>
    </article>
  );
}

function HomeRoadmaps({
  heading,
  headingId,
  trackRecommendations = true,
}: {
  heading: string;
  headingId: string;
  trackRecommendations?: boolean;
}) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-bold">실무 결과물 중심</p>
          <h2 id={headingId} className="mt-1 text-2xl font-extrabold tracking-tight">
            {heading}
          </h2>
        </div>
        <Link
          href="/explore"
          className="text-primary focus-visible:ring-primary inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-bold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          전체보기
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </header>
      {trackRecommendations ? (
        <RecommendationListTracker source="home" resultCount={roadmaps.length} />
      ) : null}
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-3">
        {roadmaps.map((roadmap) => (
          <RoadmapCard
            key={roadmap.title}
            {...roadmap}
            author="자갈치 에디터 추천"
            href="/explore"
            analyticsSource={trackRecommendations ? 'home' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function DiscoveryPanel({ signed = false }: { signed?: boolean }) {
  return (
    <aside
      aria-labelledby={signed ? 'signed-discovery-heading' : 'guest-discovery-heading'}
      className="border-border bg-muted flex h-full flex-col gap-3 rounded-2xl border p-[22px]"
    >
      <p className="text-muted-foreground text-xs font-bold">공개 자료</p>
      <h2
        id={signed ? 'signed-discovery-heading' : 'guest-discovery-heading'}
        className="text-lg leading-tight font-extrabold"
      >
        검증 가능한 결과물 사례를 둘러보세요
      </h2>
      <p className="text-muted-foreground text-sm leading-6">
        공개된 결과물 사례에서 과제 구성 방식을 확인하세요.
      </p>
      <Link
        href="/community"
        className="border-border bg-surface text-foreground hover:bg-muted focus-visible:ring-primary mt-auto inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        완료 사례 둘러보기
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </aside>
  );
}

function GuestBottom() {
  return (
    <section
      aria-labelledby="guest-next-heading"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]"
    >
      <article className="border-border bg-surface flex h-full flex-col gap-3 rounded-2xl border p-[22px]">
        <p className="text-muted-foreground text-xs font-bold">Career Diff</p>
        <h2 id="guest-next-heading" className="text-lg leading-tight font-extrabold">
          목표 직무와 필요한 증거를 정해보세요
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          목표 직무의 요구사항과 GitHub·배포·기술 문서를 연결해 부족한 역량 증거를 확인하세요.
        </p>
        {isEvidenceExecutionEnabled ? (
          <Button asChild className="mt-auto w-fit">
            <Link href="/register">
              Career Diff 시작
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </article>
      <DiscoveryPanel />
    </section>
  );
}

function SignedBottom() {
  return (
    <section
      aria-labelledby="signed-next-heading"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]"
    >
      <article className="border-border bg-surface flex h-full flex-col gap-3 rounded-2xl border p-[22px]">
        <p className="text-muted-foreground text-xs font-bold">다음 작업</p>
        <h2 id="signed-next-heading" className="text-lg leading-tight font-extrabold">
          목표와 실행을 이어가세요
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          아직 이 화면에 표시할 계정별 진행 데이터가 없습니다. Career에서 목표 직무와 필요한 증거를
          정하거나, 실행 과제에서 현재 작업을 확인하세요.
        </p>
        {isEvidenceExecutionEnabled ? (
          <Button asChild className="mt-auto w-fit">
            <Link href="/career">
              Career 열기
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </article>
      <DiscoveryPanel signed />
    </section>
  );
}

function GuestHome() {
  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="guest-home-heading"
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <CurrentLessonCard
          roadmap="채용공고에서 시작하는 커리어 준비"
          title={
            <>
              공부한 만큼
              <br />
              증명되는 커리어를 만드세요
            </>
          }
          meta="목표 직무의 요구사항과 GitHub·배포·기술 문서를 연결해, 부족한 역량 증거를 정확히 확인하세요."
          href="/explore"
          actionLabel="실전 과제 둘러보기"
          headingId="guest-home-heading"
        />

        <aside aria-label="커리어 준비 보조 정보" className="flex flex-col gap-4">
          <SupportCard
            label="지금 시작할 곳"
            title="실전 과제"
            description="결과물로 남길 수 있는 공개 실행 과제를 살펴보세요."
          />
          <SupportCard
            label="완료 사례"
            title="공개된 결과물"
            description="다른 개발자가 남긴 과제 구성과 증거를 확인하세요."
          />
        </aside>
      </section>

      <HomeRoadmaps heading="역량 증거를 만드는 실행 과제" headingId="guest-roadmaps-heading" />
      <GuestBottom />
    </div>
  );
}

function SignedHome() {
  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="signed-home-heading"
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <CurrentLessonCard
          roadmap="결과물 중심 커리어 준비"
          title="목표를 정하고 첫 실행 과제를 시작하세요"
          meta="아직 이 화면에 표시할 계정별 진행 데이터가 없습니다. Career에서 목표 직무와 필요한 증거를 정하거나, 실행 과제에서 현재 작업을 확인하세요."
          href="/myroadmap"
          actionLabel="내 실행 과제 보기"
          headingId="signed-home-heading"
        />

        <aside aria-label="계정별 진행 정보" className="flex flex-col gap-4">
          {isEvidenceExecutionEnabled ? (
            <SupportCard
              label="계정별 진행"
              title="진행 데이터 없음"
              description="Career에서 목표 직무와 필요한 증거를 정하면 다음 작업을 관리할 수 있어요."
            />
          ) : null}
          <SupportCard
            label="다음 단계"
            title="실행 과제 확인하기"
            description="만들어진 실행 과제를 열어 단계와 작업을 확인하고 관리합니다."
          />
        </aside>
      </section>

      <HomeRoadmaps
        heading="계속할 실행 과제를 확인하세요"
        headingId="signed-roadmaps-heading"
        trackRecommendations={false}
      />
      <SignedBottom />
    </div>
  );
}

export default function Home() {
  return (
    <AppShell activeTab="home">
      <div className="w-full">
        <HomeAudience guest={<GuestHome />} signed={<SignedHome />} />
      </div>
    </AppShell>
  );
}
