import { AppShell } from '@/components/app-shell/app-shell';
import { ActivityFeed } from '@/features/activity/components/activity-feed';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '알림',
  description: '학습과 커뮤니티에서 도착한 새로운 소식을 확인하세요.',
};

export default function ActivityPage() {
  return (
    <AppShell activeTab="activity">
      <div className="mx-auto w-full max-w-3xl">
        <ActivityFeed />
      </div>
    </AppShell>
  );
}
