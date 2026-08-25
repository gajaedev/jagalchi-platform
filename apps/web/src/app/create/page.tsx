import Link from 'next/link';

import {
  ArrowRight,
  Bot,
  Check,
  Infinity as InfinityIcon,
  PencilLine,
  RefreshCcw,
  Sparkles,
  Ticket,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell/app-shell';
import {
  MONTHLY_TICKET_GRANT,
  TICKET_COSTS,
  TICKETS_NEVER_EXPIRE,
  TicketBalance,
} from '@/features/tickets';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로드맵 만들기',
  description: 'AI와 함께 만들거나 직접 새로운 학습 로드맵을 시작하세요.',
};

const AI_TICKET_COST = TICKET_COSTS.roadmap_generation;

export default function CreatePage() {
  return (
    <AppShell activeTab="create">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-primary text-sm font-bold">새로운 학습의 시작</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              어떤 로드맵을 만들까요?
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 sm:text-base">
              목표에 맞는 방법을 고르면 바로 편집 화면에서 시작할 수 있어요.
            </p>
          </div>
          <TicketBalance balance={18} />
        </header>

        <section aria-labelledby="creation-method-heading" className="mt-7 sm:mt-9">
          <h2 id="creation-method-heading" className="sr-only">
            로드맵 생성 방법
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <Link
              href="/create/ai"
              className="group border-ticket/30 bg-ticket-subtle hover:border-ticket/60 focus-visible:ring-ticket flex min-h-80 flex-col rounded-3xl border p-6 transition-[transform,box-shadow,border-color] outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-8"
              aria-describedby="ai-creation-description ai-creation-cost"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="bg-ticket text-ticket-foreground flex size-12 items-center justify-center rounded-2xl shadow-sm">
                  <Sparkles aria-hidden="true" className="size-6" />
                </span>
                <span
                  id="ai-creation-cost"
                  className="border-ticket/25 bg-background/80 text-ticket inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold"
                >
                  <Ticket aria-hidden="true" className="size-3.5" />
                  {AI_TICKET_COST}장
                </span>
              </div>

              <div className="mt-7">
                <div className="text-ticket flex items-center gap-2 text-xs font-extrabold">
                  <Bot aria-hidden="true" className="size-4" />
                  AI로 빠르게 만들기
                </div>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                  목표만 알려주세요
                </h3>
                <p
                  id="ai-creation-description"
                  className="text-muted-foreground mt-3 text-sm leading-6"
                >
                  배우고 싶은 목표와 현재 수준을 바탕으로 AI가 나만의 학습 순서와 핵심 내용을
                  설계해요.
                </p>
              </div>

              <span className="bg-ticket text-ticket-foreground group-hover:bg-ticket-hover group-active:bg-ticket-pressed mt-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition-colors">
                AI 로드맵 시작하기
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>

            <Link
              href="/editor/new?mode=manual"
              className="group border-border bg-card hover:border-primary/40 focus-visible:ring-ring flex min-h-80 flex-col rounded-3xl border p-6 transition-[transform,box-shadow,border-color] outline-none hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-8"
              aria-describedby="manual-creation-description"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="bg-primary-subtle text-primary flex size-12 items-center justify-center rounded-2xl">
                  <PencilLine aria-hidden="true" className="size-6" />
                </span>
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-extrabold">
                  티켓 없이
                </span>
              </div>

              <div className="mt-7">
                <p className="text-primary text-xs font-extrabold">직접 자유롭게 만들기</p>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                  빈 캔버스에서 시작해요
                </h3>
                <p
                  id="manual-creation-description"
                  className="text-muted-foreground mt-3 text-sm leading-6"
                >
                  원하는 노드와 연결을 하나씩 추가해 내 방식대로 학습 경로를 구성할 수 있어요.
                </p>
              </div>

              <span className="border-border bg-background group-hover:bg-accent mt-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-extrabold transition-colors">
                직접 만들기
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          </div>
        </section>

        <aside
          aria-labelledby="ticket-policy-heading"
          className="border-border bg-muted/40 mt-8 rounded-2xl border p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <Check aria-hidden="true" className="text-success size-5" />
            <h2 id="ticket-policy-heading" className="text-base font-extrabold">
              부담 없이 시작하세요
            </h2>
          </div>
          <ul className="text-muted-foreground mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2.5">
              <Check aria-hidden="true" className="text-success size-4 shrink-0" />
              구독 없이 필요한 만큼만 사용해요
            </li>
            <li className="flex items-center gap-2.5">
              <Ticket aria-hidden="true" className="text-ticket size-4 shrink-0" />
              매월 무료 티켓 {MONTHLY_TICKET_GRANT}장을 드려요
            </li>
            <li className="flex items-center gap-2.5">
              <InfinityIcon aria-hidden="true" className="text-primary size-4 shrink-0" />
              {TICKETS_NEVER_EXPIRE && '티켓은 만료되지 않아요'}
            </li>
            <li className="flex items-center gap-2.5">
              <RefreshCcw aria-hidden="true" className="text-primary size-4 shrink-0" />
              AI 생성에 실패하면 티켓을 돌려드려요
            </li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
