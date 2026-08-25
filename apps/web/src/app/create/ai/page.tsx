import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import { AiRoadmapCreator } from '@/features/tickets/components/ai-roadmap-creator';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 로드맵 만들기',
  description: '학습 목표를 바탕으로 AI가 맞춤 로드맵을 설계합니다.',
};

export default function AiRoadmapCreatePage() {
  return (
    <AppShell activeTab="create">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/create"
          className="text-muted-foreground hover:bg-accent focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold outline-none focus-visible:ring-2"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          만들기 방법 다시 선택
        </Link>
        <header className="mt-5 mb-7">
          <p className="text-ticket text-sm font-bold">AI 맞춤 설계</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            목표를 알려주면 순서를 설계해요
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            결과를 받은 뒤 실제 로드맵으로 저장된 경우에만 편집 화면으로 이동합니다.
          </p>
        </header>
        <AiRoadmapCreator />
      </div>
    </AppShell>
  );
}
