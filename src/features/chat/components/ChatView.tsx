import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppIcon } from '@/components/ui/Icon';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import {
  ChatMessage,
  ConversationItem,
  getOtherUserFromConversation,
} from '../types/chat.types';
import { chatApi } from '../api/chat.api';
import { ChatViewHeader } from './ChatViewHeader';
import { MessageFeedItem } from './MessageFeedItem';
import { MessageComposerView } from './MessageComposerView';
import { ConversationDetailsModal } from './ConversationDetailsModal';
import { ChatMessagesSkeleton } from './ChatSkeleton';
import { ChatAvatar } from './ChatAvatar';
import { getAppSocket, initAppSocket } from '@/lib/socket/socket';

export interface ChatViewProps {
  conversation: ConversationItem;
  onBack?: () => void;
  onConversationUpdated: (
    conversationId: string,
    lastMessageText: string,
    lastMessageAt: string
  ) => void;
  onConversationMarkedRead: (conversationId: string) => void;
}

export function ChatView({
  conversation,
  onBack,
  onConversationUpdated,
  onConversationMarkedRead,
}: ChatViewProps) {
  const { locale } = useUi();
  const { user } = useAuth();
  const scrollViewRef = useRef<any>(null);

  const cacheKey = CACHE_KEYS.CHAT_MESSAGES(conversation.id);
  const [messages, setMessagesState] = useState<ChatMessage[]>(
    () => queryCache.get<ChatMessage[]>(cacheKey) || []
  );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !queryCache.has(cacheKey)
  );
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessagesState((prev) => {
        let next: ChatMessage[];
        if (typeof updater === 'function') {
          next = updater(prev);
        } else {
          // Never wipe out pending in-flight messages (id starts with temp_) when background fetch arrives
          const pending = prev.filter((m) => m.id.startsWith('temp_'));
          if (pending.length === 0) {
            next = updater;
          } else {
            const serverIds = new Set(updater.map((m) => m.id));
            const stillPending = pending.filter(
              (p) =>
                !serverIds.has(p.id) &&
                !updater.some(
                  (s) =>
                    s.senderId === p.senderId &&
                    s.text === p.text &&
                    Math.abs(new Date(s.createdAt).getTime() - new Date(p.createdAt).getTime()) < 60000
                )
            );
            next = [...updater, ...stillPending];
          }
        }
        queryCache.set(cacheKey, next);
        return next;
      });
    },
    [cacheKey]
  );
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<ChatMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);

  const otherUser = getOtherUserFromConversation(conversation);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd?.({ animated });
    }, 80);
  }, []);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!silent && !queryCache.has(cacheKey)) {
        setIsLoading(true);
      }
      try {
        const res = await chatApi.getMessages(conversation.id, undefined, 30);
        setMessages(res.messages);
        if (!silent) {
          setNextCursor(res.nextCursor);
          scrollToBottom(false);
        }
        if ((conversation.unreadCount || 0) > 0) {
          chatApi.markAsRead(conversation.id).catch(() => {});
          onConversationMarkedRead(conversation.id);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    [
      cacheKey,
      conversation.id,
      conversation.unreadCount,
      onConversationMarkedRead,
      scrollToBottom,
      setMessages,
    ]
  );

  // Real-time Socket.io Message, Seen & Typing Listeners
  useEffect(() => {
    const s = initAppSocket() || getAppSocket();
    if (!s) return;

    // 1. Message received from the other user in real-time
    const handleReceived = (newMsg: ChatMessage) => {
      if (newMsg.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom(true);
        // Mark as read immediately on active screen
        chatApi.markAsRead(conversation.id).catch(() => {});
        s.emit('message:read', {
          conversationId: conversation.id,
          receiverId: newMsg.senderId,
        });
        onConversationMarkedRead(conversation.id);
        onConversationUpdated(
          conversation.id,
          newMsg.text,
          newMsg.createdAt
        );
      }
    };

    // 2. Message sent confirmation from socket
    const handleSent = (savedMsg: ChatMessage) => {
      if (savedMsg.conversationId === conversation.id) {
        setMessages((prev) => {
          const matchIndex = prev.findIndex(
            (m) => m.id.startsWith('temp_') && m.text === savedMsg.text
          );
          if (matchIndex !== -1) {
            const next = [...prev];
            next[matchIndex] = savedMsg;
            return next;
          }
          if (!prev.some((m) => m.id === savedMsg.id)) {
            return [...prev, savedMsg];
          }
          return prev;
        });
      }
    };

    // 3. Other user saw our message (update checkmarks to double checkmark)
    const handleSeen = (payload: { conversationId: string }) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === (user?.id || 'me') ? { ...m, isRead: true } : m
          )
        );
      }
    };

    // 4. Other user typing indicator
    const handleTyping = (payload: {
      conversationId: string;
      receiverId: string;
      isTyping: boolean;
    }) => {
      if (payload.conversationId === conversation.id) {
        setIsOtherTyping(Boolean(payload.isTyping));
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        if (payload.isTyping) {
          typingTimerRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3500);
        }
      }
    };

    // 5. Message edited in real-time
    const handleUpdated = (updated: ChatMessage) => {
      if (updated.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
      }
    };

    // 6. Message deleted in real-time
    const handleDeleted = (deleted: ChatMessage) => {
      if (deleted.conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === deleted.id ? deleted : m))
        );
      }
    };

    s.on('message:received', handleReceived);
    s.on('message:sent', handleSent);
    s.on('message:seen', handleSeen);
    s.on('message:typing', handleTyping);
    s.on('message:updated', handleUpdated);
    s.on('message:deleted', handleDeleted);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      s.off('message:received', handleReceived);
      s.off('message:sent', handleSent);
      s.off('message:seen', handleSeen);
      s.off('message:typing', handleTyping);
      s.off('message:updated', handleUpdated);
      s.off('message:deleted', handleDeleted);
    };
  }, [
    conversation.id,
    user?.id,
    onConversationMarkedRead,
    onConversationUpdated,
    scrollToBottom,
    setMessages,
  ]);

  useEffect(() => {
    setEditingMessage(null);
    setText('');
    const cached = queryCache.get<ChatMessage[]>(cacheKey);
    if (cached) {
      setMessagesState(cached);
      setIsLoading(false);
      scrollToBottom(false);
    }
    loadMessages(Boolean(cached));

    const interval = setInterval(() => {
      loadMessages(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [conversation.id]);

  const handleLoadOlder = async () => {
    if (!nextCursor || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const res = await chatApi.getMessages(conversation.id, nextCursor, 30);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const olderUnique = res.messages.filter((m) => !existingIds.has(m.id));
        return [...olderUnique, ...prev];
      });
      setNextCursor(res.nextCursor);
    } catch {
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleSendText = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    if (editingMessage) {
      setIsSending(true);
      try {
        const updated = await chatApi.editMessage(editingMessage.id, trimmed);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? {
                  ...m,
                  ...updated,
                  text: trimmed,
                  isEdited: true,
                }
              : m
          )
        );
        setEditingMessage(null);
        setText('');
      } catch {
      } finally {
        setIsSending(false);
      }
      return;
    }

    const receiverId = otherUser?.id;
    if (!receiverId) return;

    setIsSending(true);
    const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      conversationId: conversation.id,
      senderId: user?.id || 'me',
      receiverId,
      text: trimmed,
      isRead: false,
      createdAt: nowIso,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText('');
    scrollToBottom(true);

    // Stop typing indicator via socket
    const s = getAppSocket() || initAppSocket();
    if (s && receiverId) {
      s.emit('message:typing', {
        receiverId,
        conversationId: conversation.id,
        isTyping: false,
      });
    }

    try {
      const saved = await chatApi.sendMessage({
        receiverId,
        text: trimmed,
        conversationId: conversation.id,
      });

      setMessages((prev) => {
        const hasOptimistic = prev.some((m) => m.id === optimisticId);
        if (hasOptimistic) {
          return prev.map((m) => (m.id === optimisticId ? saved : m));
        }
        if (!prev.some((m) => m.id === saved.id)) {
          return [...prev, saved];
        }
        return prev;
      });

      onConversationUpdated(
        conversation.id,
        saved.text || trimmed,
        saved.createdAt || nowIso
      );
      scrollToBottom(true);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickSalam = () => {
    handleSendText('আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্');
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteMessage) return;
    const targetId = pendingDeleteMessage.id;
    setIsDeleting(true);
    try {
      await chatApi.deleteMessage(targetId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === targetId
            ? {
                ...m,
                isDeleted: true,
                text:
                  locale === 'bn'
                    ? 'মেসেজটি মুছে ফেলা হয়েছে'
                    : 'This message was deleted',
              }
            : m
        )
      );
    } catch {
    } finally {
      setIsDeleting(false);
      setPendingDeleteMessage(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 h-full flex-col min-w-0 bg-white dark:bg-[#18191a] overflow-hidden">
      {/* Chat Top Header */}
      <ChatViewHeader
        conversation={conversation}
        onBack={onBack}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails((prev) => !prev)}
      />

      {/* Scrollable Message Feed matching MessageFeed.tsx */}
      <View className="relative flex-1 min-h-0 flex-col bg-[#f8f9fa] dark:bg-[#18191a]">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isLoading || messages.length > 0}
          className="flex-1 no-scrollbar scrollbar-none"
          contentContainerClassName="flex-grow p-3 sm:p-5">
          {/* Loader or "Load Earlier Messages" Button */}
          {nextCursor ? (
            <View className="items-center justify-center pt-2 pb-3">
              {isLoadingOlder ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#0866FF" />
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'আগের মেসেজ লোড হচ্ছে...'
                      : 'Loading older messages...'}
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleLoadOlder}
                  className="px-3 py-1 rounded-full bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b]">
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'পূর্ববর্তী মেসেজ দেখুন'
                      : 'Load earlier messages'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {isLoading && messages.length === 0 ? (
            <ChatMessagesSkeleton />
          ) : messages.length === 0 ? (
            <EmptyState
              iconAndroid="chat_bubble"
              iconIos="bubble.left.and.bubble.right"
              iconColor="#0866FF"
              iconBgClassName="bg-primary-50 dark:bg-primary-950/40"
              title={
                locale === 'bn'
                  ? 'মেসেজ পাঠানো শুরু করুন'
                  : 'Say Salam & start messaging'
              }
              description={
                locale === 'bn'
                  ? 'প্রথম মেসেজটি পাঠিয়ে আন্তরিক যোগাযোগ গড়ে তুলুন'
                  : 'Send your first message or a warm Salam to start messaging'
              }
              className="flex-1 py-10"
            />
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.id || msg.senderId === 'me';
              const nextMsg = messages[idx + 1];
              const prevMsg = messages[idx - 1];
              const showAvatar =
                !isMe && (!nextMsg || nextMsg.senderId !== msg.senderId);

              const msgDateStr = new Date(msg.createdAt).toDateString();
              const prevDateStr = prevMsg
                ? new Date(prevMsg.createdAt).toDateString()
                : null;
              const showDateSeparator = !prevMsg || msgDateStr !== prevDateStr;

              return (
                <MessageFeedItem
                  key={msg.id}
                  message={msg}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  showDateSeparator={showDateSeparator}
                  otherUser={otherUser}
                  onStartEdit={(target) => {
                    setEditingMessage(target);
                    setText(target.text);
                  }}
                  onRequestDelete={(target) => setPendingDeleteMessage(target)}
                />
              );
            })
          )}

          {/* Animated Messenger-Style Typing Indicator */}
          {isOtherTyping ? (
            <View className="flex-row items-end gap-2 justify-start my-2">
              <View className="w-8 h-8 shrink-0 items-center justify-center">
                <ChatAvatar
                  name={otherUser?.name || 'User'}
                  avatarUrl={otherUser?.avatarUrl}
                  size="xs"
                />
              </View>
              <View className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-[#e6e9ef] dark:bg-[#3a3b3c] flex-row items-center gap-1.5 shadow-xs">
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#65676b] dark:bg-[#b0b3b8] opacity-70" />
                  <View className="w-1.5 h-1.5 rounded-full bg-[#65676b] dark:bg-[#b0b3b8] opacity-70" />
                  <View className="w-1.5 h-1.5 rounded-full bg-[#65676b] dark:bg-[#b0b3b8] opacity-70" />
                </View>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] font-medium ml-1">
                  {locale === 'bn' ? 'টাইপ করছেন...' : 'typing...'}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* Bottom Message Composer */}
      <MessageComposerView
        text={text}
        onChangeText={setText}
        onSubmit={() => handleSendText(text)}
        isSending={isSending}
        editingMessage={editingMessage}
        onCancelEdit={() => {
          setEditingMessage(null);
          setText('');
        }}
        otherUserId={otherUser?.id}
        conversationId={conversation.id}
      />

      {/* Right Column / Drawer: Conversation Details Panel */}
      <ConversationDetailsModal
        visible={showDetails}
        conversation={conversation}
        onClose={() => setShowDetails(false)}
        onQuickSalam={handleQuickSalam}
      />

      {/* Reusable Delete Message Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteMessage)}
        onClose={() => setPendingDeleteMessage(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={locale === 'bn' ? 'মেসেজটি মুছে ফেলবেন?' : 'Delete message?'}
        subtitle={
          locale === 'bn'
            ? 'এই কাজটি বাতিল করা যাবে না।'
            : 'This action cannot be undone.'
        }
        description={
          locale === 'bn'
            ? 'আপনি কি নিশ্চিতভাবে এই মেসেজটি কথোপকথন থেকে মুছে ফেলতে চান?'
            : 'Are you sure you want to delete this message from the conversation?'
        }
        confirmText={locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Delete'}
        cancelText={locale === 'bn' ? 'বাতিল করুন' : 'Cancel'}
      />
    </KeyboardAvoidingView>
  );
}
