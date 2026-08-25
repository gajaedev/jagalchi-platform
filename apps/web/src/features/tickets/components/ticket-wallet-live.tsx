'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { CalendarDays, Ticket } from 'lucide-react';

import { getTicketBalance } from '@/api/tickets';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';

import { formatTicketCount, MONTHLY_TICKET_GRANT, TICKETS_NEVER_EXPIRE } from '../ticket-policy';

import { TicketBalance } from './ticket-balance';

function useLiveBalance() {
  const authenticated = useAtomValue(isAuthenticatedAtom);
  const query = useQuery({
    queryKey: ['tickets', 'balance'],
    queryFn: getTicketBalance,
    enabled: authenticated,
    staleTime: 30_000,
  });
  return { authenticated, query };
}

export function LiveTicketBalance() {
  const { authenticated, query } = useLiveBalance();
  if (!authenticated) {
    return (
      <Link href="/login" className="text-primary text-sm font-extrabold hover:underline">
        로그인하고 잔액 확인
      </Link>
    );
  }
  if (query.isError) {
    return (
      <button
        type="button"
        onClick={() => query.refetch()}
        disabled={query.isFetching}
        aria-busy={query.isFetching}
        className="text-error focus-visible:ring-ring rounded-sm text-sm font-extrabold outline-none hover:underline focus-visible:ring-2"
      >
        {query.isFetching ? '잔액 재확인 중…' : '잔액 다시 확인'}
      </button>
    );
  }
  if (!query.data) {
    return <span className="text-muted-foreground text-sm">잔액 확인 중…</span>;
  }
  return <TicketBalance balance={query.data.balance} />;
}

export function TicketWalletHero() {
  const { authenticated, query } = useLiveBalance();
  if (!authenticated) {
    return (
      <section className="bg-primary text-primary-foreground mt-7 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold">무료 티켓 30장으로 시작하세요</h2>
        <p className="text-primary-foreground/80 mt-2 text-sm">
          가입 후 매월 무료 티켓도 자동으로 지급돼요.
        </p>
        <Link
          href="/register"
          className="text-primary mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-extrabold"
        >
          무료로 시작
        </Link>
      </section>
    );
  }
  if (query.isError) {
    return (
      <section className="border-destructive/30 mt-7 rounded-3xl border p-6">
        <p className="text-destructive text-sm font-bold">티켓 잔액을 불러오지 못했습니다.</p>
        <button
          type="button"
          disabled={query.isFetching}
          aria-busy={query.isFetching}
          onClick={() => query.refetch()}
          className="text-primary focus-visible:ring-ring mt-3 rounded-sm text-sm font-bold outline-none hover:underline focus-visible:ring-2 disabled:opacity-50"
        >
          {query.isFetching ? '다시 불러오는 중…' : '다시 시도'}
        </button>
      </section>
    );
  }
  const balance = query.data;
  return (
    <section className="bg-primary text-primary-foreground mt-7 overflow-hidden rounded-3xl shadow-sm">
      <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold opacity-80">
            <Ticket aria-hidden="true" className="size-4" />
            현재 보유 티켓
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {balance ? formatTicketCount(balance.balance) : '확인 중…'}
          </h2>
          <p className="mt-4 text-sm leading-6 opacity-80">
            {TICKETS_NEVER_EXPIRE
              ? '구매하거나 지급받은 티켓은 유효기간 없이 사용할 수 있어요.'
              : '티켓의 유효기간은 이용 정책에서 확인할 수 있어요.'}
          </p>
        </div>
        <div className="bg-background/10 ring-primary-foreground/20 rounded-2xl p-5 ring-1">
          <div className="flex items-start gap-3">
            <CalendarDays aria-hidden="true" className="size-5" />
            <div>
              <p className="text-sm font-extrabold">매월 무료 지급</p>
              <p className="mt-1 text-2xl font-black">{formatTicketCount(MONTHLY_TICKET_GRANT)}</p>
            </div>
          </div>
          {balance ? (
            <p className="border-primary-foreground/20 mt-4 border-t pt-4 text-xs opacity-80">
              다음 지급 예정 · {new Date(balance.nextMonthlyGrantAt).toLocaleDateString('ko-KR')}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
