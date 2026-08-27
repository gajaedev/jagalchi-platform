import Link from 'next/link';

import { Bell, House, Route, Target, UserRound, type LucideIcon } from 'lucide-react';

import { isEnabled } from '@/lib/feature-flags';

export type AppTab = 'home' | 'career' | 'roadmaps' | 'explore' | 'create' | 'activity' | 'my';

export interface MobileBottomNavProps {
  activeTab: AppTab;
}

const navItems: ReadonlyArray<{
  id: AppTab;
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { id: 'home', label: '홈', href: '/', icon: House },
  ...(isEnabled('EVIDENCE_EXECUTION_ENABLED')
    ? [{ id: 'career' as const, label: '커리어', href: '/career', icon: Target }]
    : []),
  { id: 'roadmaps', label: '실행', href: '/myroadmap', icon: Route },
  { id: 'activity', label: '활동', href: '/activity', icon: Bell },
  { id: 'my', label: '마이', href: '/profile', icon: UserRound },
];

export function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-50 border-t px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="mx-auto flex max-w-md gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <li className="min-w-0 flex-1" key={item.id}>
              <Link
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={[
                  'min-h-touch flex w-full flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[10px] font-semibold transition-[background-color,color,transform] active:scale-95',
                  'focus-visible:ring-ring focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  isActive
                    ? 'bg-primary-subtle text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
                href={item.href}
              >
                <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
