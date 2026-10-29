import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import {
  ConversationItem,
  getOtherUserFromConversation,
} from '../types/chat.types';
import { ChatAvatar } from './ChatAvatar';

export interface ChatViewHeaderProps {
  conversation: ConversationItem;
  onBack?: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}

export function ChatViewHeader({
  conversation,
  onBack,
  showDetails,
  onToggleDetails,
}: ChatViewHeaderProps) {
  const { locale, theme } = useUi();
  const user = getOtherUserFromConversation(conversation);
  const displayName =
    user?.name || (locale === 'bn' ? 'ব্যবহারকারী' : 'User');
  const isOnline = user?.isOnline ?? false;

  return (
    <View className="h-14 sm:h-16 px-3.5 sm:px-5 border-b border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] flex-row items-center justify-between gap-3 shrink-0 z-10">
      <View className="flex-row items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        {/* Mobile Back Button */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            className="md:hidden p-2 -ml-1.5 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
            <AppIcon
              android="arrow_back"
              ios="chevron.left"
              size={20}
              color={theme === 'dark' ? '#e4e6eb' : '#050505'}
            />
          </Pressable>
        ) : null}

        {/* User Info Link */}
        <Pressable
          onPress={() => router.push('/profile')}
          className="flex-row items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <ChatAvatar
            name={displayName}
            avatarUrl={user?.avatarUrl}
            size="md"
            isOnline={isOnline}
            showOnlineBadge
          />

          <View className="flex-1 min-w-0">
            <Text
              numberOfLines={1}
              className="text-sm sm:text-base font-bold text-[#050505] dark:text-white">
              {displayName}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              {isOnline ? (
                <>
                  <View className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <Text
                    numberOfLines={1}
                    className="text-xs font-medium text-emerald-500 leading-tight">
                    {locale === 'bn' ? 'সক্রিয় আছেন' : 'Active now'}
                  </Text>
                </>
              ) : (
                <Text
                  numberOfLines={1}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] leading-tight">
                  {locale === 'bn' ? 'অফলাইন' : 'Offline'}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </View>

      {/* Header Actions */}
      <View className="flex-row items-center gap-1.5 shrink-0">
        <Pressable
          onPress={onToggleDetails}
          className={`p-2 sm:p-2.5 rounded-full ${
            showDetails
              ? 'bg-primary-50 dark:bg-primary-950/60'
              : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
          }`}>
          <AppIcon
            android="info"
            ios="info.circle"
            size={20}
            color={
              showDetails
                ? '#1877f2'
                : theme === 'dark'
                  ? '#b0b3b8'
                  : '#65676b'
            }
          />
        </Pressable>
      </View>
    </View>
  );
}
