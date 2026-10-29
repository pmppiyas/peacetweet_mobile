import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  NotificationItem,
  NotificationQueryParams,
  NotificationsMeta,
} from '../types/notification.types';

export interface GetNotificationsResult {
  meta: NotificationsMeta;
  data: NotificationItem[];
}

const DEFAULT_META: NotificationsMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  unreadCount: 0,
};

export const notificationsApi = {
  getNotifications: async (
    params?: NotificationQueryParams
  ): Promise<GetNotificationsResult> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      params: params as any,
    });
    const payload = response.data;

    const list: NotificationItem[] = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.data)
        ? payload.data.data
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];

    const meta: NotificationsMeta = payload?.meta ||
      payload?.data?.meta || {
        ...DEFAULT_META,
        total: list.length,
        unreadCount: list.filter((n) => !n.isRead).length,
      };

    return {
      meta,
      data: list,
    };
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
    );
    const payload = response.data?.data ?? response.data;
    return Number(payload?.unreadCount ?? 0);
  },

  markAsRead: async (id: string): Promise<NotificationItem | null> => {
    const response = await apiClient.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
    );
    return (response.data?.data ?? response.data ?? null) as
      | NotificationItem
      | null;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
  },
};
