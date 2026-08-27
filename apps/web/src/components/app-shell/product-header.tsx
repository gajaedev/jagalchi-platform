'use client';

import Link from 'next/link';

import { useAtomValue } from 'jotai';
import { Bell, Search, UserRound } from 'lucide-react';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';
import { isEnabled } from '@/lib/feature-flags';

const headerLinks = [
  { label: '홈', href: '/' },
  ...(isEnabled('EVIDENCE_EXECUTION_ENABLED') ? [{ label: '목표 공고', href: '/career' }] : []),
  { label: '실행 과제', href: '/myroadmap' },
  { label: '과제 템플릿', href: '/explore' },
] as const;

const focusRing =
  'transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function ProductHeader() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

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
          aria-label="실전 과제 검색"
          className={`min-h-touch border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground ml-auto hidden min-w-0 flex-1 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors md:flex lg:max-w-xs ${focusRing}`}
          href="/explore"
        >
          <Search aria-hidden="true" className="size-[18px] shrink-0" />
          <span className="truncate">필요한 증거 과제 검색</span>
        </Link>

        <span aria-hidden="true" className="ml-auto md:hidden" />
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
