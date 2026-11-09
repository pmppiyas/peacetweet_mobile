import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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

    // 1. Initial fetch immediately
    fetchNotificationsUnread();
    fetchMessagesUnread();

    // 2. Poll every 10 seconds as a reliable background fallback
    const timer = setInterval(() => {
      fetchNotificationsUnread();
      fetchMessagesUnread();
    }, 10000);

    // 3. AppState change listener (refresh instantly when user resumes app)
    const appStateSub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          fetchNotificationsUnread();
          fetchMessagesUnread();
          const s = getAppSocket() || initAppSocket();
          if (s && s.disconnected) {
            s.connect();
          }
        }
      }
    );

    // 4. Socket real-time event listeners
    const s = initAppSocket() || getAppSocket();
    if (s) {
      if (s.disconnected) {
        s.connect();
      }

      const handleConnect = () => {
        fetchNotificationsUnread();
        fetchMessagesUnread();
      };

      const handleNotifReceived = () => {
        fetchNotificationsUnread();
        queryCache.invalidate(CACHE_KEYS.NOTIFICATIONS_LIST);
      };

      const handleNotifCount = (payload: any) => {
        const count =
          typeof payload === 'number' ? payload : payload?.unreadCount;
        if (typeof count === 'number') {
          setUnreadNotificationsCount(count);
        }
      };

      const handleMessageReceived = (msg: any) => {
        const senderId = msg?.senderId || msg?.sender?.id;
        const myId = currentUserIdRef.current;
        // If not sent by current user:
        if (!myId || senderId !== myId) {
          if (
            !activeConversationIdRef.current ||
            activeConversationIdRef.current !== msg?.conversationId
          ) {
            setUnreadMessagesCount((prev: number) => Math.max(0, prev + 1));
          }
          fetchMessagesUnread();
          queryCache.invalidate(CACHE_KEYS.CHAT_CONVERSATIONS);
        }
      };

      const handleConversationUpdated = (data: any) => {
        const senderId = data?.senderId;
        const myId = currentUserIdRef.current;
        if (!myId || senderId !== myId) {
          if (
            data?.unreadDelta &&
            (!activeConversationIdRef.current ||
              activeConversationIdRef.current !== data?.conversationId)
          ) {
            setUnreadMessagesCount((prev: number) =>
              Math.max(0, prev + Number(data.unreadDelta))
            );
          }
        }
        fetchMessagesUnread();
        queryCache.invalidate(CACHE_KEYS.CHAT_CONVERSATIONS);
      };

      const handleMessageSeenOrRead = () => {
        fetchMessagesUnread();
      };

      s.on('connect', handleConnect);
      s.on('notification:received', handleNotifReceived);
      s.on('notification:new', handleNotifReceived);
      s.on('notification:unreadCount', handleNotifCount);
      s.on('notification:unread_count', handleNotifCount);
      s.on('message:received', handleMessageReceived);
      s.on('conversation:updated', handleConversationUpdated);
      s.on('message:seen', handleMessageSeenOrRead);
      s.on('message:read', handleMessageSeenOrRead);

      return () => {
        clearInterval(timer);
        appStateSub.remove();
        s.off('connect', handleConnect);
        s.off('notification:received', handleNotifReceived);
        s.off('notification:new', handleNotifReceived);
        s.off('notification:unreadCount', handleNotifCount);
        s.off('notification:unread_count', handleNotifCount);
        s.off('message:received', handleMessageReceived);
        s.off('conversation:updated', handleConversationUpdated);
        s.off('message:seen', handleMessageSeenOrRead);
        s.off('message:read', handleMessageSeenOrRead);
      };
    }

    return () => {
      clearInterval(timer);
      appStateSub.remove();
    };
  }, [
    isAuthenticated,
    user?.id,
    setUnreadNotificationsCount,
    setUnreadMessagesCount,
  ]);
}
