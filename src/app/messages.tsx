import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { chatApi } from '@/features/chat/api/chat.api';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import { getAppSocket, initAppSocket } from '@/lib/socket/socket';
import {
  ChatUser,
  ConversationItem,
  getOtherUserFromConversation,
} from '@/features/chat/types/chat.types';
import { ConversationSidebar } from '@/features/chat/components/ConversationSidebar';
import { ChatView } from '@/features/chat/components/ChatView';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';

export default function MessagesScreen() {
  const { setActiveConversationId, setUnreadMessagesCount } = useUi();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const params = useLocalSearchParams<{
    conversationId?: string;
    userId?: string;
    user?: string;
    username?: string;
  }>();

  const [conversations, setConversationsState] = useState<ConversationItem[]>(
    () => queryCache.get<ConversationItem[]>(CACHE_KEYS.CHAT_CONVERSATIONS) || []
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !queryCache.has(CACHE_KEYS.CHAT_CONVERSATIONS)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setConversations = useCallback(
    (
      updater:
        | ConversationItem[]
        | ((prev: ConversationItem[]) => ConversationItem[])
    ) => {
      setConversationsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        queryCache.set(CACHE_KEYS.CHAT_CONVERSATIONS, next);
        return next;
      });
    },
    []
  );

  const openConversation = useCallback(
    (conv: ConversationItem) => {
      setActiveConversationId(conv.id);
      setSelectedConversation(conv);
    },
    [setActiveConversationId]
  );

  const closeConversation = useCallback(() => {
    setActiveConversationId(null);
    setSelectedConversation(null);
  }, [setActiveConversationId]);

  // Clean up activeConversationId when leaving the Messages screen entirely
  useEffect(() => {
    return () => {
      setActiveConversationId(null);
    };
  }, [setActiveConversationId]);

  // Android back swipe inside an active mobile chat returns to conversation list
  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedConversation) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeConversation();
      return true;
    });
    return () => sub.remove();
  }, [selectedConversation, closeConversation]);

  // If not authenticated, render friendly AuthPromptCard instead of redirecting directly to /login
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <AuthPromptScreen
        icon="chat_bubble"
        iconBgColor="bg-blue-50 dark:bg-blue-950/60"
        iconColor="#0866FF"
        titleBn="মেসেজ দেখতে লগইন করুন"
        titleEn="Sign in to view Messages"
        descriptionBn="আপনার কনভারসেশন ও ফ্রেন্ডদের সাথে বার্তা আদান-প্রদান করতে অ্যাকাউন্টে প্রবেশ করুন।"
        descriptionEn="Log in to your account to view conversations, send direct messages, and chat with friends."
      />
    );
  }

  const loadChatData = useCallback(
    async (silent = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      if (!silent && !queryCache.has(CACHE_KEYS.CHAT_CONVERSATIONS)) {
        setIsLoading(true);
      }
      try {
        const convList = await chatApi.getConversations().catch(() => []);
        setConversations(convList);

        const totalUnread = convList.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessagesCount(totalUnread);

        setSelectedConversation((prev) => {
          if (!prev) return null;
          const updated = convList.find((c) => c.id === prev.id);
          if (!updated) return prev;
          return {
            ...updated,
            otherUser:
              getOtherUserFromConversation(updated) ||
              getOtherUserFromConversation(prev) ||
              undefined,
          };
        });
      } finally {
        if (!silent) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, setUnreadMessagesCount]
  );

  useEffect(() => {
    loadChatData(queryCache.has(CACHE_KEYS.CHAT_CONVERSATIONS));

    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      loadChatData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [loadChatData, isAuthenticated]);

  const handleStartChatWithUser = useCallback(
    async (targetUser: ChatUser) => {
      const existing = conversations.find((c) => {
        const other = getOtherUserFromConversation(c);
        return (
          other?.id === targetUser.id ||
          c.participantOneId === targetUser.id ||
          c.participantTwoId === targetUser.id
        );
      });

      if (existing) {
        const enriched: ConversationItem = {
          ...existing,
          otherUser: getOtherUserFromConversation(existing) || targetUser,
        };
        openConversation(enriched);
        return;
      }

      try {
        const created = await chatApi.getOrCreateConversation(targetUser.id);
        const enriched: ConversationItem = {
          ...created,
          otherUser: getOtherUserFromConversation(created) || targetUser,
        };
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== enriched.id);
          return [enriched, ...filtered];
        });
        openConversation(enriched);
      } catch {}
    },
    [conversations, openConversation, setConversations]
  );

  const handledParamRef = useRef<string>('');

  // Handle deep-link params (?conversationId=... or ?userId=...) cleanly without re-fetching on every conversations state update
  useEffect(() => {
    if (!isAuthenticated) return;

    const currentKey = `${params.conversationId || ''}::${params.userId || ''}`;
    if (!currentKey || currentKey === '::' || handledParamRef.current === currentKey) {
      return;
    }

    if (params.conversationId && conversations.length > 0) {
      const match = conversations.find((c) => c.id === params.conversationId);
      if (match) {
        handledParamRef.current = currentKey;
        openConversation(match);
      }
    } else if (params.userId) {
      handledParamRef.current = currentKey;
      chatApi
        .getOrCreateConversation(params.userId)
        .then((conv) => {
          openConversation(conv);
        })
        .catch(() => {
          handledParamRef.current = '';
        });
    }
  }, [params.conversationId, params.userId, isAuthenticated, conversations.length, openConversation]);

  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;

  const handleConversationUpdated = useCallback(
    (
      conversationId: string,
      lastMessageText: string,
      lastMessageAt: string,
      senderId?: string,
      unreadDelta?: number
    ) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev;
        const myId = user?.id;
        const isSentByMe = Boolean(myId && senderId && senderId === myId);
        const isActiveChat = selectedConversationRef.current?.id === conversationId;

        const nextUnread = isActiveChat || isSentByMe
          ? 0
          : (prev[idx].unreadCount || 0) + (typeof unreadDelta === 'number' ? unreadDelta : 1);

        const updatedItem: ConversationItem = {
          ...prev[idx],
          lastMessageText,
          lastMessageAt,
          unreadCount: nextUnread,
        };
        const rest = prev.filter((c) => c.id !== conversationId);
        const next = [updatedItem, ...rest];
        const newTotal = next.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessagesCount(newTotal);
        return next;
      });
    },
    [user?.id, setConversations, setUnreadMessagesCount]
  );

  // Real-time Socket.io update for conversations sidebar
  useEffect(() => {
    const s = initAppSocket() || getAppSocket();
    if (!s) return;

    const handleConvUpdated = (data: {
      conversationId: string;
      lastMessageText: string;
      lastMessageAt: string;
      senderId?: string;
      unreadDelta?: number;
    }) => {
      handleConversationUpdated(
        data.conversationId,
        data.lastMessageText,
        data.lastMessageAt,
        data.senderId,
        data.unreadDelta
      );
    };

    s.on('conversation:updated', handleConvUpdated);
    return () => {
      s.off('conversation:updated', handleConvUpdated);
    };
  }, [handleConversationUpdated]);

  const handleConversationMarkedRead = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        );
        const newTotal = next.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessagesCount(newTotal);
        return next;
      });
    },
    [setUnreadMessagesCount]
  );

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );
  const isChatActive = Boolean(selectedConversation);

  return (
    <View className="flex-1 overflow-hidden bg-white dark:bg-[#18191a]">
      {/* 1. Chats / Conversations List */}
      <View
        style={{ display: !isChatActive ? 'flex' : 'none' }}
        className="flex-1 w-full h-full pt-[60px] pb-[56px]">
        <ConversationSidebar
          conversations={conversations}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            loadChatData(true);
          }}
          selectedId={selectedConversation?.id || null}
          onSelectConversation={openConversation}
          onStartChatWithUser={handleStartChatWithUser}
          currentUserId={user?.id}
          totalUnreadCount={totalUnreadCount}
        />
      </View>

      {/* 2. Active Chat View */}
      {isChatActive && selectedConversation ? (
        <View className="flex-1 w-full h-full">
          <ChatView
            key={selectedConversation.id}
            conversation={selectedConversation}
            onBack={closeConversation}
            onConversationUpdated={handleConversationUpdated}
            onConversationMarkedRead={handleConversationMarkedRead}
          />
        </View>
      ) : null}
    </View>
  );
}
