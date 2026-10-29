import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import {
  ConversationItem,
  getOtherUserFromConversation,
} from '../types/chat.types';
import { ChatAvatar } from './ChatAvatar';

export interface ConversationItemViewProps {
  conversation: ConversationItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function formatConversationTime(
  dateStr: string | null | undefined,
  locale: 'bn' | 'en'
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isToday) {
    return date.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  if (diffDays === 1) {
    return locale === 'bn' ? 'গতকাল' : 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'short',
    });
  }
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ConversationItemView({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemViewProps) {
  const { locale } = useUi();
  const participant = getOtherUserFromConversation(conversation);
  const unreadCount = conversation.unreadCount || 0;
  const hasUnread = unreadCount > 0;
  const displayName =
    participant?.name || (locale === 'bn' ? 'ইউজার' : 'User');

  return (
    <Pressable
      onPress={onSelect}
      className={`w-full flex-row items-center gap-2.5 px-2 py-2 rounded-xl ${
        isSelected
          ? 'bg-[#e4e6eb] dark:bg-[#3a3b3c]'
          : 'active:bg-[#e4e6eb]/70 dark:active:bg-[#3a3b3c]/60'
      }`}>
      <ChatAvatar
        name={displayName}
        avatarUrl={participant?.avatarUrl}
        size="md"
        isOnline={participant?.isOnline ?? false}
        showOnlineBadge
      />

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between gap-1">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[15px] leading-tight ${
              isSelected
                ? 'font-bold text-primary-700 dark:text-primary-400'
                : hasUnread
                  ? 'font-bold text-[#050505] dark:text-white'
                  : 'font-semibold text-[#050505] dark:text-[#e4e6eb]'
            }`}>
            {displayName}
          </Text>

          {conversation.lastMessageAt ? (
            <Text
              className={`text-[11px] shrink-0 ${
                hasUnread
                  ? 'font-bold text-primary-600 dark:text-primary-400'
                  : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {formatConversationTime(conversation.lastMessageAt, locale)}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between gap-2 mt-1">
          <Text
            numberOfLines={1}
            className={`flex-1 text-[13px] leading-normal ${
              hasUnread
                ? 'font-bold text-[#050505] dark:text-[#f0f2f5]'
                : 'text-[#65676b] dark:text-[#b0b3b8]'
            }`}>
            {conversation.lastMessageText ||
              (locale === 'bn' ? 'মেসেজ পাঠান' : 'Send a message')}
          </Text>

          {hasUnread ? (
            <View className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 items-center justify-center shrink-0">
              <Text className="text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
