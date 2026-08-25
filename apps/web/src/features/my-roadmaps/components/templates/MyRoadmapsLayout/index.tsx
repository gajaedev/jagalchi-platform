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
    <div className="flex min-h-screen">
      <MyRoadmapsSidebar
        onLogout={onLogout}
        onProfileClick={onProfileClick}
        userEmail={userEmail ?? undefined}
        userName={userName ?? undefined}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
