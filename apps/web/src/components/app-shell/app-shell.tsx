import type { ReactNode } from 'react';

import { MobileBottomNav, type AppTab } from './mobile-bottom-nav';
import { ProductHeader } from './product-header';

export interface AppShellProps {
  children: ReactNode;
  activeTab?: AppTab;
}

export function AppShell({ children, activeTab = 'home' }: AppShellProps) {
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <a
        className="bg-primary text-primary-foreground focus:ring-ring fixed top-3 left-3 z-[100] -translate-y-20 rounded-md px-4 py-3 font-semibold shadow-lg transition-transform focus:translate-y-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <ProductHeader />
      <main
        className="mx-auto w-full max-w-[1440px] px-5 pt-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:px-16 md:pt-9 md:pb-14"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
      <MobileBottomNav activeTab={activeTab} />
    </div>
  );
}
