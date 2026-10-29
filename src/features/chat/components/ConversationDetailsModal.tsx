import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import {
  ConversationItem,
  getOtherUserFromConversation,
} from '../types/chat.types';
import { ChatAvatar } from './ChatAvatar';

export interface ConversationDetailsModalProps {
  visible: boolean;
  conversation: ConversationItem | null;
  onClose: () => void;
  onQuickSalam: () => void;
}

export function ConversationDetailsModal({
  visible,
  conversation,
  onClose,
  onQuickSalam,
}: ConversationDetailsModalProps) {
  const { locale, theme } = useUi();
  const [isMuted, setIsMuted] = useState(false);

  if (!visible || !conversation) return null;

  const user = getOtherUserFromConversation(conversation);
  const displayName =
    user?.name || (locale === 'bn' ? 'ব্যবহারকারী' : 'User');
  const isOnline = user?.isOnline ?? false;

  const content = (
    <View className="flex-1 flex-col bg-white dark:bg-[#1f2021]">
      {/* Header matching ConversationDetailsPanel.tsx */}
      <View className="p-4 border-b border-[#e4e6eb] dark:border-[#393a3b] flex-row items-center justify-between shrink-0">
        <Text className="font-bold text-base text-[#050505] dark:text-white">
          {locale === 'bn' ? 'মেসেজের বিবরণ' : 'Message Details'}
        </Text>
        <Pressable
          onPress={onClose}
          className="p-1.5 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
          <AppIcon
            android="close"
            ios="xmark"
            size={20}
            color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
          />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="p-5 items-center border-b border-[#e4e6eb] dark:border-[#393a3b]">
          {/* Large Avatar */}
          <ChatAvatar
            name={displayName}
            avatarUrl={user?.avatarUrl}
            size="xl"
            isOnline={isOnline}
            showOnlineBadge
            className="mb-3"
          />

          {/* User Name & Handle */}
          <Text className="text-lg font-black text-[#050505] dark:text-white leading-tight text-center">
            {displayName}
          </Text>
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
            @{user?.username || 'user'}
          </Text>

          <View className="mt-2 flex-row items-center gap-1.5 justify-center">
            {isOnline ? (
              <>
                <View className="h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="text-xs font-medium text-emerald-500">
                  {locale === 'bn' ? 'এখন সক্রিয় আছেন' : 'Active now'}
                </Text>
              </>
            ) : (
              <Text className="text-xs font-medium text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'অফলাইন' : 'Offline'}
              </Text>
            )}
          </View>

          {/* Action Buttons matching ConversationDetailsPanel.tsx */}
          <View className="flex-row items-center gap-3 mt-4 w-full">
            <Pressable
              onPress={() => {
                onClose();
                router.push('/profile');
              }}
              className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] active:bg-[#e4e6eb]">
              <AppIcon
                android="person"
                ios="person.fill"
                size={16}
                color={theme === 'dark' ? '#e4e6eb' : '#050505'}
              />
              <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'প্রোফাইল' : 'Profile'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onQuickSalam();
                onClose();
              }}
              className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary-50 dark:bg-primary-950/60 active:bg-primary-100">
              <AppIcon
                android="auto_awesome"
                ios="sparkles"
                size={16}
                color="#1877f2"
              />
              <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                {locale === 'bn' ? 'সালাম দিন' : 'Salam'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Options & Settings Section */}
        <View className="p-4 space-y-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-[#65676b] dark:text-[#b0b3b8] px-1">
            {locale === 'bn' ? 'চ্যাট সেটিংস' : 'Chat Options'}
          </Text>

          {/* Mute Notifications */}
          <Pressable
            onPress={() => setIsMuted((prev) => !prev)}
            className="w-full flex-row items-center justify-between p-3 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#2a2b2c]">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <AppIcon
                android={isMuted ? 'notifications_off' : 'notifications'}
                ios={isMuted ? 'bell.slash.fill' : 'bell.fill'}
                size={20}
                color={
                  isMuted
                    ? '#f59e0b'
                    : theme === 'dark'
                      ? '#b0b3b8'
                      : '#65676b'
                }
              />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#050505] dark:text-white">
                  {locale === 'bn'
                    ? 'বিজ্ঞপ্তি বন্ধ রাখুন'
                    : 'Mute Notifications'}
                </Text>
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {isMuted
                    ? locale === 'bn'
                      ? 'মেসেজ নোটিফিকেশন বন্ধ রয়েছে'
                      : 'Notifications are muted'
                    : locale === 'bn'
                      ? 'নতুন মেসেজের শব্দ চালু আছে'
                      : 'Alerts are on'}
                </Text>
              </View>
            </View>
            <View
              className={`h-5 w-9 rounded-full flex-row items-center px-0.5 ${
                isMuted
                  ? 'bg-primary-500 justify-end'
                  : 'bg-gray-300 dark:bg-gray-600 justify-start'
              }`}>
              <View className="h-4 w-4 rounded-full bg-white shadow-xs" />
            </View>
          </Pressable>

          {/* Peaceful Communication Reminder Card */}
          <View className="p-3.5 rounded-2xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 mt-4">
            <View className="flex-row items-center gap-2 mb-1">
              <AppIcon
                android="favorite"
                ios="heart.fill"
                size={16}
                color="#1877f2"
              />
              <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">
                {locale === 'bn'
                  ? 'উত্তম আচরণ ও শান্তি'
                  : 'Peace & Kindness'}
              </Text>
            </View>
            <Text className="text-[11px] text-primary-800/80 dark:text-primary-300/80 leading-relaxed">
              {locale === 'bn'
                ? 'মেসেজে সুন্দর ও মার্জিত শব্দ ব্যবহার করুন। পারস্পরিক সম্প্রীতি বজায় রাখা মুমিনের ভূষণ।'
                : 'Communicate with warmth and kindness. Maintaining peace and respect is the true essence of brotherhood.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 flex-row justify-end">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="h-full w-full max-w-sm bg-white dark:bg-[#1f2021] shadow-2xl">
          {content}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
