'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Bell, Search, Ticket, UserRound } from 'lucide-react';

import { getTicketBalance } from '@/api/tickets';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';

const headerLinks = [
  { label: '홈', href: '/' },
  { label: '탐색', href: '/explore' },
  { label: '커뮤니티', href: '/community' },
  { label: '내 로드맵', href: '/myroadmap' },
] as const;

const focusRing =
  'transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function ProductHeader() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const balanceQuery = useQuery({
    queryKey: ['tickets', 'balance'],
    queryFn: getTicketBalance,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  return (
    <header className="border-border bg-surface h-16 border-b md:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 md:gap-7 lg:px-8">
        <Link
          aria-label="Jagalchi 홈"
          className={`text-primary shrink-0 text-lg font-black tracking-[0.12em] ${focusRing}`}
          href="/"
        >
          JAGALCHI
        </Link>

        <nav aria-label="데스크톱 주요 메뉴" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {headerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className={`min-h-touch text-muted-foreground hover:bg-muted hover:text-foreground flex items-center rounded-md px-3 text-[13px] font-semibold transition-colors ${focusRing}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          aria-label="로드맵 검색"
          className={`min-h-touch border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground ml-auto hidden min-w-0 flex-1 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors md:flex lg:max-w-xs ${focusRing}`}
          href="/explore"
        >
          <Search aria-hidden="true" className="size-[18px] shrink-0" />
          <span className="truncate">관심 있는 로드맵 검색</span>
        </Link>

        <span aria-hidden="true" className="ml-auto md:hidden" />
        {isAuthenticated && balanceQuery.data ? (
          <Link
            href="/tickets"
            aria-label={`AI 티켓 ${balanceQuery.data.balance}장 확인`}
            className={`bg-ticket-subtle text-ticket inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors hover:opacity-80 ${focusRing}`}
          >
            <Ticket aria-hidden="true" className="size-4" />
            {new Intl.NumberFormat('ko-KR').format(balanceQuery.data.balance)}장
          </Link>
        ) : null}
        <ThemeToggle />

        <Link
          aria-label="알림"
          className={`size-touch text-muted-foreground hover:bg-muted hover:text-foreground hidden shrink-0 items-center justify-center rounded-full transition-colors sm:flex ${focusRing}`}
          href="/activity"
        >
          <Bell aria-hidden="true" className="size-5" />
        </Link>

        <Link
          aria-label={isAuthenticated ? '내 프로필' : '로그인'}
          className={`size-touch bg-primary-subtle text-primary hover:bg-primary-subtle/70 flex shrink-0 items-center justify-center rounded-full transition-colors ${focusRing}`}
          href={isAuthenticated ? '/profile' : '/login'}
        >
          <UserRound aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </header>
  );
}
