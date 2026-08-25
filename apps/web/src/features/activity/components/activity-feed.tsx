'use client';

import Link from 'next/link';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import {
  BellRing,
  GitFork,
  MessageCircle,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

import {
  getActivityNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ActivityNotification,
} from '@/api/notifications';
import { isAuthenticatedAtom, isAuthInitializedAtom } from '@/lib/auth-atoms';

const iconByType: Record<ActivityNotification['type'], LucideIcon> = {
  COMMENT: MessageCircle,
  REPLY: MessageCircle,
  FOLLOW: UserPlus,
  FORK: GitFork,
  LIKE: Sparkles,
  AI_COMPLETE: Sparkles,
  LEARNING_REMINDER: BellRing,
  SYSTEM: BellRing,
};

function notificationHref(notification: ActivityNotification): string {
  if (notification.resourceType === 'roadmap' && notification.resourceId) {
    return `/viewer/${notification.resourceId}`;
  }
  if (notification.type === 'FOLLOW') return '/profile';
  return '/activity';
}

function relativeTime(value: string): string {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return '방금';
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`;
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border rounded-2xl border border-dashed px-5 py-12 text-center">
      <BellRing aria-hidden="true" className="text-muted-foreground mx-auto size-7" />
      <p className="mt-3 text-sm font-bold">{children}</p>
    </div>
  );
}

export function ActivityFeed() {
  const queryClient = useQueryClient();
  const initialized = useAtomValue(isAuthInitializedAtom);
  const authenticated = useAtomValue(isAuthenticatedAtom);
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: getActivityNotifications,
    enabled: initialized && authenticated,
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!initialized) {
    return <EmptyState>로그인 상태를 확인하고 있어요.</EmptyState>;
  }
  if (!authenticated) {
    return (
      <EmptyState>
        알림은 로그인 후 확인할 수 있어요.
        <Link href="/login" className="text-primary mt-4 block font-extrabold hover:underline">
          로그인
        </Link>
      </EmptyState>
    );
  }
  if (notifications.isLoading) return <EmptyState>알림을 불러오고 있어요.</EmptyState>;
  if (notifications.isError) {
    return (
      <EmptyState>
        알림을 불러오지 못했습니다.
        <button
          type="button"
          onClick={() => notifications.refetch()}
          className="text-primary mt-4 block w-full font-extrabold hover:underline"
        >
          다시 시도
        </button>
      </EmptyState>
    );
  }

  const items = notifications.data?.items ?? [];
  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <>
      <header className="flex items-start justify-between gap-5">
        <div>
          <p className="text-primary text-xs font-extrabold">활동</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">알림</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            읽지 않은 알림 <strong className="text-foreground">{unreadCount}개</strong>
          </p>
        </div>
        <button
          type="button"
          disabled={unreadCount === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
          className="text-primary hover:bg-primary-subtle rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40"
        >
          모두 읽음
        </button>
      </header>

      <div className="border-border bg-card mt-6 overflow-hidden rounded-2xl border">
        {items.length ? (
          <ul className="divide-border divide-y">
            {items.map((notification) => {
              const Icon = iconByType[notification.type];
              const unread = !notification.readAt;
              return (
                <li key={notification.id}>
                  <Link
                    href={notificationHref(notification)}
                    onClick={() => {
                      if (unread) void markNotificationRead(notification.id);
                    }}
                    className={`hover:bg-accent focus-visible:ring-ring flex gap-4 px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset sm:px-5 ${unread ? 'bg-primary-subtle/70' : ''}`}
                  >
                    <span className="border-border bg-background text-primary flex size-11 shrink-0 items-center justify-center rounded-xl border">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-extrabold">
                        {notification.title}
                        {unread ? <span className="bg-primary size-2 rounded-full" /> : null}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-sm leading-5">
                        {notification.body}
                      </span>
                      <time
                        dateTime={notification.createdAt}
                        className="text-muted-foreground mt-1.5 block text-xs"
                      >
                        {relativeTime(notification.createdAt)}
                      </time>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>새로운 알림이 없어요.</EmptyState>
        )}
      </div>
    </>
  );
}
