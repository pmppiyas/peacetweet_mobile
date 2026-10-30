import React, { useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { chatApi } from '@/features/chat/api/chat.api';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import {
  ChatUser,
  ConversationItem,
  getOtherUserFromConversation,
} from '@/features/chat/types/chat.types';
import { ConversationSidebar } from '@/features/chat/components/ConversationSidebar';
import { ChatView } from '@/features/chat/components/ChatView';
import { EmptyChatPlaceholder } from '@/features/chat/components/EmptyChatPlaceholder';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
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

  // Sync activeConversationId with UiProvider so Navbar & MobileNav hide on mobile when inside an active chat
  useEffect(() => {
    setActiveConversationId(selectedConversation?.id || null);
    return () => {
      setActiveConversationId(null);
    };
  }, [selectedConversation?.id, setActiveConversationId]);

  // If not authenticated, render friendly AuthPromptCard instead of redirecting directly to /login
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <AuthPromptScreen
        icon="chat_bubble"
        iconBgColor="bg-blue-50 dark:bg-blue-950/60"
        iconColor="#1877f2"
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
        setSelectedConversation({
          ...existing,
          otherUser: getOtherUserFromConversation(existing) || targetUser,
        });
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
        setSelectedConversation(enriched);
      } catch {}
    },
    [conversations]
  );

  // Handle deep-link params (?conversationId=... or ?userId=...)
  useEffect(() => {
    if (!isAuthenticated) return;

    if (params.conversationId && conversations.length > 0) {
      const match = conversations.find((c) => c.id === params.conversationId);
      if (match) {
        setSelectedConversation(match);
      }
    } else if (params.userId) {
      chatApi
        .getOrCreateConversation(params.userId)
        .then((conv) => {
          setSelectedConversation(conv);
        })
        .catch(() => {});
    }
  }, [params.conversationId, params.userId, isAuthenticated, conversations]);

  const handleConversationUpdated = useCallback(
    (
      conversationId: string,
      lastMessageText: string,
      lastMessageAt: string
    ) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev;
        const updatedItem: ConversationItem = {
          ...prev[idx],
          lastMessageText,
          lastMessageAt,
          unreadCount: 0,
        };
        const rest = prev.filter((c) => c.id !== conversationId);
        return [updatedItem, ...rest];
      });
    },
    []
  );

  const handleConversationMarkedRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );
  const isChatActive = Boolean(selectedConversation);

  return (
    <View className="flex-1 overflow-hidden bg-white dark:bg-[#18191a] sm:bg-[#f0f2f5]">
      <View className="flex-1 w-full max-w-[1440px] mx-auto px-0 sm:px-4 lg:px-6">
        <View className="flex-1 flex-row h-full gap-4 lg:gap-6">
          {/* 1. Left Sidebar: Chats / Conversations Sidebar */}
          {!isChatActive || isDesktop ? (
            <View className="w-full md:w-60 lg:w-60 xl:w-64 2xl:w-72 h-full shrink-0 flex-col">
              <ConversationSidebar
                conversations={conversations}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  loadChatData(true);
                }}
                selectedId={selectedConversation?.id || null}
                onSelectConversation={(conv) => setSelectedConversation(conv)}
                onStartChatWithUser={handleStartChatWithUser}
                currentUserId={user?.id}
                totalUnreadCount={totalUnreadCount}
              />
            </View>
          ) : null}

          {/* 2. Main Area: Active Chat Window or Empty Placeholder */}
          {isChatActive || isDesktop ? (
            <View className="flex-1 w-full min-w-0 h-full py-0 sm:py-3 lg:py-4 px-0">
              <View className="flex-1 w-full h-full bg-white dark:bg-[#242526] sm:rounded-2xl sm:border sm:border-[#e4e6eb] sm:dark:border-[#393a3b] overflow-hidden">
                {selectedConversation ? (
                  <ChatView
                    key={selectedConversation.id}
                    conversation={selectedConversation}
                    onBack={() => setSelectedConversation(null)}
                    onConversationUpdated={handleConversationUpdated}
                    onConversationMarkedRead={handleConversationMarkedRead}
                  />
                ) : (
                  <EmptyChatPlaceholder />
                )}
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
