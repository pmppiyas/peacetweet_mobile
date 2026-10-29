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
import { AppIcon } from '@/components/ui/Icon';
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<ChatMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const otherUser = getOtherUserFromConversation(conversation);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd?.({ animated });
    }, 80);
  }, []);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
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
        if (!silent) setIsLoading(false);
      }
    },
    [
      conversation.id,
      conversation.unreadCount,
      onConversationMarkedRead,
      scrollToBottom,
    ]
  );

  useEffect(() => {
    setEditingMessage(null);
    setText('');
    loadMessages(false);

    const interval = setInterval(() => {
      loadMessages(true);
    }, 5000);

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
    const optimisticId = `temp_${Date.now()}`;
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

    try {
      const saved = await chatApi.sendMessage({
        receiverId,
        text: trimmed,
        conversationId: conversation.id,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? saved : m))
      );
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
          className="flex-1"
          contentContainerClassName="flex-grow p-3 sm:p-5">
          {/* Loader or "Load Earlier Messages" Button */}
          {nextCursor ? (
            <View className="items-center justify-center pt-2 pb-3">
              {isLoadingOlder ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#1877f2" />
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
            /* Skeleton matching MessageFeed.tsx lines 135-150 */
            <View className="flex-1 justify-end p-2 space-y-4">
              <View className="flex-row items-end gap-2 max-w-[80%]">
                <View className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700/60 shrink-0" />
                <View className="h-12 w-52 rounded-2xl rounded-bl-xs bg-gray-200 dark:bg-gray-700/60" />
              </View>
              <View className="flex-row items-end justify-end mt-3">
                <View className="h-10 w-40 rounded-2xl rounded-br-xs bg-primary-100 dark:bg-primary-950/40" />
              </View>
              <View className="flex-row items-end gap-2 max-w-[80%] mt-3">
                <View className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700/60 shrink-0" />
                <View className="h-16 w-60 rounded-2xl rounded-bl-xs bg-gray-200 dark:bg-gray-700/60" />
              </View>
              <View className="flex-row items-end justify-end mt-3">
                <View className="h-12 w-52 rounded-2xl rounded-br-xs bg-primary-100 dark:bg-primary-950/40" />
              </View>
            </View>
          ) : messages.length === 0 ? (
            /* Empty Conversation State matching MessageFeed.tsx lines 153-165 */
            <View className="flex-1 items-center justify-center p-6">
              <View className="h-16 w-16 rounded-full bg-primary-50 dark:bg-primary-950/40 items-center justify-center mb-3">
                <AppIcon
                  android="chat_bubble"
                  ios="bubble.left.and.bubble.right"
                  size={32}
                  color="#1877f2"
                />
              </View>
              <Text className="text-base font-bold text-[#050505] dark:text-white text-center">
                {locale === 'bn'
                  ? 'মেসেজ পাঠানো শুরু করুন'
                  : 'Say Salam & start messaging'}
              </Text>
              <Text className="text-xs max-w-xs mt-1 text-[#65676b] dark:text-[#b0b3b8] leading-relaxed text-center">
                {locale === 'bn'
                  ? 'প্রথম মেসেজটি পাঠিয়ে আন্তরিক যোগাযোগ গড়ে তুলুন'
                  : 'Send your first message or a warm Salam to start messaging'}
              </Text>
            </View>
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
