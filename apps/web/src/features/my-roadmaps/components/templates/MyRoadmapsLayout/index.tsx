import { AppShell } from '@/components/app-shell/app-shell';

import { MyRoadmapsSidebar } from '../../organisms/MyRoadmapsSidebar';

interface MyRoadmapsLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  onProfileClick?: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

export function MyRoadmapsLayout({
  children,
  onLogout,
  onProfileClick,
  userEmail,
  userName,
}: MyRoadmapsLayoutProps) {
  return (
    <AppShell activeTab="roadmaps">
      <div className="border-border bg-card flex min-h-[calc(100dvh-10rem)] overflow-hidden rounded-2xl border">
        <MyRoadmapsSidebar
          className="hidden min-h-0 lg:flex"
          onLogout={onLogout}
          onProfileClick={onProfileClick}
          userEmail={userEmail ?? undefined}
          userName={userName ?? undefined}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShell>
  );
}
