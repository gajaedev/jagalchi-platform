'use client';

import Image from 'next/image';
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
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center gap-3 px-5 md:gap-7 md:px-16">
        <Link
          aria-label="Jagalchi 홈"
          className={`text-primary size-touch inline-flex shrink-0 items-center justify-center rounded-md ${focusRing}`}
          href="/"
        >
          <span className="dark:bg-primary flex size-7 items-center justify-center rounded-md">
            <Image src="/jagalchi.svg" alt="" width={20} height={20} priority />
          </span>
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
          className={`min-h-touch border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground ml-auto hidden min-w-0 flex-1 items-center gap-2 rounded-full border px-4 text-[13px] transition-colors md:flex lg:max-w-xs ${focusRing}`}
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
