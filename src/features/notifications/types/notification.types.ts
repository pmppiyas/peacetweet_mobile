export type NotificationType =
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'BLOOD_REQUEST'
  | 'SYSTEM';

export interface NotificationActor {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  title?: string | null;
  message: string;
  entityId?: string | null;
  entityType?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: NotificationActor | null;
}

export interface NotificationsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationsResponse {
  meta: NotificationsMeta;
  data: NotificationItem[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export type NotificationFilter = 'ALL' | 'UNREAD';
