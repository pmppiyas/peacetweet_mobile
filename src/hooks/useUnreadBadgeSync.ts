import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useUi } from '@/providers/UiProvider';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { chatApi } from '@/features/chat/api/chat.api';
import { initAppSocket, getAppSocket } from '@/lib/socket/socket';
import { queryCache, CACHE_KEYS } from '@/lib/cache/queryCache';
import { sessionStorage } from '@/lib/storage/secureStorage';

export function useUnreadBadgeSync() {
  const { user, isAuthenticated } = useAuth();
  const {
    activeConversationId,
    setUnreadNotificationsCount,
    setUnreadMessagesCount,
    setOnlineUserIds,
    setUserOnlineStatus,
  } = useUi();

  const activeConversationIdRef = useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const currentUserIdRef = useRef(user?.id || sessionStorage.getUser()?.id);
  currentUserIdRef.current = user?.id || sessionStorage.getUser()?.id;

  const fetchDebounceTimerRef = useRef<any>(null);

  const fetchNotificationsUnread = useCallback(() => {
    notificationsApi
      .getUnreadCount()
      .then((count) => {
        if (typeof count === 'number') {
          setUnreadNotificationsCount(count);
        }
      })
      .catch(() => {});
  }, [setUnreadNotificationsCount]);

  const fetchMessagesUnread = useCallback(() => {
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
  }, [setUnreadMessagesCount]);

  const scheduleFetchMessagesUnread = useCallback(() => {
    if (fetchDebounceTimerRef.current) {
      clearTimeout(fetchDebounceTimerRef.current);
    }
    // Debounce to coalesce simultaneous message:received and conversation:updated into a single clean sync
    fetchDebounceTimerRef.current = setTimeout(() => {
      fetchMessagesUnread();
    }, 60);
  }, [fetchMessagesUnread]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
      setOnlineUserIds([]);
      return;
    }

    // 1. Initial fetch immediately
    fetchNotificationsUnread();
    fetchMessagesUnread();

    // 2. Poll every 12 seconds as a solid background fallback
    const timer = setInterval(() => {
      fetchNotificationsUnread();
      fetchMessagesUnread();
    }, 12000);

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
        s.emit('users:get_online');
      };

      if (s.connected) {
        s.emit('users:get_online');
      }

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

      const handleOnlineList = (userIds: string[]) => {
        if (Array.isArray(userIds)) {
          setOnlineUserIds(userIds);
        }
      };

      const handleUserStatus = (payload: {
        userId: string;
        status: 'online' | 'offline';
      }) => {
        if (payload?.userId) {
          setUserOnlineStatus(payload.userId, payload.status === 'online');
        }
      };

      const handleMessageReceived = (msg: any) => {
        const senderId = msg?.senderId || msg?.sender?.id;
        const myId = currentUserIdRef.current || user?.id || sessionStorage.getUser()?.id;

        // If sent by myself, never touch or increment badge count
        if (myId && senderId && senderId === myId) {
          return;
        }

        // Acknowledge receipt/delivery to sender
        if (senderId && msg?.conversationId) {
          s.emit('message:delivered', {
            conversationId: msg.conversationId,
            messageId: msg.id,
            senderId,
          });
        }

        // If actively viewing this conversation, message is already read
        if (
          activeConversationIdRef.current &&
          activeConversationIdRef.current === msg?.conversationId
        ) {
          return;
        }

        // Sync without double-increment flicker
        scheduleFetchMessagesUnread();
        queryCache.invalidate(CACHE_KEYS.CHAT_CONVERSATIONS);
      };

      const handleConversationUpdated = (data: any) => {
        const senderId = data?.senderId;
        const myId = currentUserIdRef.current || user?.id || sessionStorage.getUser()?.id;

        // If sent by myself, never touch or increment badge count
        if (myId && senderId && senderId === myId) {
          return;
        }

        // If actively viewing this conversation, message is already read
        if (
          activeConversationIdRef.current &&
          activeConversationIdRef.current === data?.conversationId
        ) {
          return;
        }

        // Sync without double-increment flicker
        scheduleFetchMessagesUnread();
        queryCache.invalidate(CACHE_KEYS.CHAT_CONVERSATIONS);
      };

      const handleMessageSeenOrRead = () => {
        scheduleFetchMessagesUnread();
      };

      s.on('connect', handleConnect);
      s.on('users:online_list', handleOnlineList);
      s.on('user:status', handleUserStatus);
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
        if (fetchDebounceTimerRef.current) {
          clearTimeout(fetchDebounceTimerRef.current);
        }
        appStateSub.remove();
        s.off('connect', handleConnect);
        s.off('users:online_list', handleOnlineList);
        s.off('user:status', handleUserStatus);
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
      if (fetchDebounceTimerRef.current) {
        clearTimeout(fetchDebounceTimerRef.current);
      }
      appStateSub.remove();
    };
  }, [
    isAuthenticated,
    user?.id,
    fetchNotificationsUnread,
    fetchMessagesUnread,
    scheduleFetchMessagesUnread,
    setUnreadNotificationsCount,
    setUnreadMessagesCount,
    setOnlineUserIds,
    setUserOnlineStatus,
  ]);
}
