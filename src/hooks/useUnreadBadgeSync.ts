import { useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useUi } from '@/providers/UiProvider';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { chatApi } from '@/features/chat/api/chat.api';
import { initAppSocket, getAppSocket } from '@/lib/socket/socket';
import { queryCache, CACHE_KEYS } from '@/lib/cache/queryCache';

export function useUnreadBadgeSync() {
  const { user, isAuthenticated } = useAuth();
  const {
    activeConversationId,
    setUnreadNotificationsCount,
    setUnreadMessagesCount,
  } = useUi();

  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const currentUserIdRef = useRef(user?.id);
  currentUserIdRef.current = user?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    const fetchNotificationsUnread = () => {
      notificationsApi
        .getUnreadCount()
        .then((count) => {
          if (typeof count === 'number') {
            setUnreadNotificationsCount(count);
          }
        })
        .catch(() => {});
    };

    const fetchMessagesUnread = () => {
      chatApi
        .getConversations()
        .then((list) => {
          if (Array.isArray(list)) {
            const total = list.reduce(
              (sum, c) => sum + (c.unreadCount || 0),
              0
            );
            setUnreadMessagesCount(total);
            queryCache.set(CACHE_KEYS.CHAT_CONVERSATIONS, list);
          }
        })
        .catch(() => {});
    };

    // Initial fetch on mount & whenever auth is established
    fetchNotificationsUnread();
    fetchMessagesUnread();

    // 15-second background polling
    const timer = setInterval(() => {
      fetchNotificationsUnread();
      fetchMessagesUnread();
    }, 15000);

    // Socket real-time event listeners
    const s = initAppSocket() || getAppSocket();
    if (s) {
      const handleNotifReceived = () => {
        fetchNotificationsUnread();
        queryCache.invalidate(CACHE_KEYS.NOTIFICATIONS_LIST);
      };

      const handleNotifCount = (count: number) => {
        if (typeof count === 'number') {
          setUnreadNotificationsCount(count);
        }
      };

      const handleMessageReceived = (msg: any) => {
        // If not sent by current user:
        if (msg?.senderId && msg.senderId !== currentUserIdRef.current) {
          if (activeConversationIdRef.current !== msg?.conversationId) {
            setUnreadMessagesCount((prev: number) => prev + 1);
          }
          fetchMessagesUnread();
          queryCache.invalidate(CACHE_KEYS.CHAT_CONVERSATIONS);
        }
      };

      const handleConversationUpdated = () => {
        fetchMessagesUnread();
      };

      const handleMessageSeenOrRead = () => {
        fetchMessagesUnread();
      };

      s.on('notification:received', handleNotifReceived);
      s.on('notification:unreadCount', handleNotifCount);
      s.on('message:received', handleMessageReceived);
      s.on('conversation:updated', handleConversationUpdated);
      s.on('message:seen', handleMessageSeenOrRead);
      s.on('message:read', handleMessageSeenOrRead);

      return () => {
        clearInterval(timer);
        s.off('notification:received', handleNotifReceived);
        s.off('notification:unreadCount', handleNotifCount);
        s.off('message:received', handleMessageReceived);
        s.off('conversation:updated', handleConversationUpdated);
        s.off('message:seen', handleMessageSeenOrRead);
        s.off('message:read', handleMessageSeenOrRead);
      };
    }

    return () => clearInterval(timer);
  }, [isAuthenticated, setUnreadNotificationsCount, setUnreadMessagesCount]);
}
