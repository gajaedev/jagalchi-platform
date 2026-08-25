import { apiClient } from './client';

export type NotificationType =
  'COMMENT' | 'REPLY' | 'FOLLOW' | 'FORK' | 'LIKE' | 'AI_COMPLETE' | 'LEARNING_REMINDER' | 'SYSTEM';

export interface ActivityNotification {
  id: string;
  type: NotificationType;
  resourceType: string | null;
  resourceId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  size?: number;
  isRead?: boolean;
}

export interface NotificationListResponse {
  content: NotificationResponse[];
  totalElements: number;
  page: number;
  size: number;
}

interface NotificationPage {
  items: ActivityNotification[];
  page: number;
  size: number;
  total: number;
}

function queryString(params: NotificationListParams = {}): string {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    size: String(params.size ?? 30),
    unreadOnly: String(params.isRead === false),
  });
  return query.toString();
}

export async function getNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  const response = await apiClient.get<NotificationPage>(`/notifications?${queryString(params)}`);
  return {
    content: response.items.map((notification) => ({
      id: notification.id,
      message: notification.body,
      isRead: notification.readAt !== null,
      createdAt: notification.createdAt,
    })),
    totalElements: response.total,
    page: response.page,
    size: response.size,
  };
}

export const getActivityNotifications = () =>
  apiClient.get<NotificationPage>('/notifications?page=1&size=100&unreadOnly=false');

export const markNotificationRead = (id: string) =>
  apiClient.patch<void>(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => apiClient.patch<void>('/notifications/read-all');
