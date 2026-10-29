import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import {
  ChatUser,
  ConversationItem,
  SearchedChatUser,
  getOtherUserFromConversation,
} from '../types/chat.types';
import { chatApi } from '../api/chat.api';
import { ChatAvatar } from './ChatAvatar';
import { ConversationItemView } from './ConversationItemView';

export interface ConversationSidebarProps {
  conversations: ConversationItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  selectedId: string | null;
  onSelectConversation: (conversation: ConversationItem) => void;
  onStartChatWithUser: (user: ChatUser) => Promise<void>;
  currentUserId?: string;
  totalUnreadCount?: number;
}

export function ConversationSidebar({
  conversations,
  isLoading,
  isRefreshing,
  onRefresh,
  selectedId,
  onSelectConversation,
  onStartChatWithUser,
  currentUserId,
  totalUnreadCount = 0,
}: ConversationSidebarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { locale, chatSearchQuery, setChatSearchQuery, theme } = useUi();
  const [isSearching, setIsSearching] = useState(false);
  const [creatingForUserId, setCreatingForUserId] = useState<string | null>(
    null
  );
  const [friendResults, setFriendResults] = useState<SearchedChatUser[]>([]);
  const [otherResults, setOtherResults] = useState<SearchedChatUser[]>([]);

  const activeQuery = chatSearchQuery.trim();
  const isInitialLoading = isLoading && conversations.length === 0;

  useEffect(() => {
    if (!activeQuery) {
      setFriendResults([]);
      setOtherResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await chatApi.searchUsersAndFriends(
          activeQuery,
          currentUserId
        );
        if (!isCancelled) {
          setFriendResults(res.friends);
          setOtherResults(res.others);
        }
      } catch {
        if (!isCancelled) {
          setFriendResults([]);
          setOtherResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeQuery, currentUserId]);

  const handleSelectUser = async (targetUser: ChatUser) => {
    if (
      creatingForUserId ||
      !targetUser?.id ||
      targetUser.id === currentUserId
    ) {
      return;
    }
    setCreatingForUserId(targetUser.id);
    try {
      await onStartChatWithUser(targetUser);
      setChatSearchQuery('');
    } finally {
      setCreatingForUserId(null);
    }
  };

  const renderUserItem = (user: ChatUser, isFriend: boolean) => {
    const isCreatingThis = creatingForUserId === user.id;
    return (
      <Pressable
        key={user.id}
        disabled={Boolean(creatingForUserId)}
        onPress={() => handleSelectUser(user)}
        className="w-full flex-row items-center gap-2.5 px-2 py-2 rounded-xl active:bg-[#e4e6eb]/70 dark:active:bg-[#3a3b3c]/60">
        <ChatAvatar
          name={user.name}
          avatarUrl={user.avatarUrl}
          size="md"
          isOnline={user.isOnline ?? false}
        />

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-1.5">
            <Text
              numberOfLines={1}
              className="text-[15px] font-bold text-[#050505] dark:text-[#e4e6eb] leading-tight">
              {user.name}
            </Text>
            {isFriend ? (
              <View className="px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 shrink-0">
                <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {locale === 'bn' ? 'ফ্রেন্ড' : 'Friend'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            className="text-[13px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5 leading-normal">
            @{user.username}
          </Text>
        </View>

        <View className="shrink-0">
          {isCreatingThis ? (
            <ActivityIndicator size="small" color="#1877f2" />
          ) : (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c]">
              <AppIcon
                android="chat_bubble"
                ios="bubble.right.fill"
                size={15}
                color="#1877f2"
              />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="w-full flex-1 flex-col bg-white dark:bg-[#18191a] md:bg-transparent overflow-hidden py-2 sm:py-3 lg:py-4 pr-0 md:pr-1">
      {/* Top Header & Search Input Bar (Desktop only - Mobile has title & search in the top navbar) */}
      {isDesktop ? (
        <>
          <View className="px-2 pb-2.5 flex-row items-center justify-between gap-2 shrink-0">
            <View className="flex-row items-center gap-2 min-w-0">
              <Pressable
                onPress={() => router.push('/')}
                className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e4e6eb]/70 dark:bg-[#3a3b3c]">
                <AppIcon
                  android="arrow_back"
                  ios="chevron.left"
                  size={18}
                  color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                />
              </Pressable>
              <Text
                numberOfLines={1}
                className="text-xl font-bold tracking-tight text-[#050505] dark:text-white">
                {locale === 'bn' ? 'মেসেজ' : 'Messages'}
              </Text>
              {totalUnreadCount > 0 ? (
                <View className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 items-center justify-center">
                  <Text className="text-[11px] font-bold text-white">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="px-2 pb-2 shrink-0">
            <View className="relative flex-row items-center rounded-xl bg-[#e4e6eb]/70 dark:bg-[#3a3b3c] px-3 py-2">
              <AppIcon
                android="search"
                ios="magnifyingglass"
                size={16}
                color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
              />
              <TextInput
                value={chatSearchQuery}
                onChangeText={setChatSearchQuery}
                placeholder={
                  locale === 'bn'
                    ? 'ফ্রেন্ড বা ইউজার খুঁজুন...'
                    : 'Search friends or users...'
                }
                placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                className="flex-1 ml-2 text-sm text-[#050505] dark:text-[#e4e6eb] py-0"
              />
              {chatSearchQuery.length > 0 ? (
                <Pressable
                  onPress={() => setChatSearchQuery('')}
                  className="p-1 rounded-full">
                  <AppIcon
                    android="close"
                    ios="xmark"
                    size={14}
                    color="#65676b"
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
        </>
      ) : null}

      {/* Content Area: Conversations or Friends Search Results */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isInitialLoading}
        className="flex-1 px-1 no-scrollbar scrollbar-none"
        contentContainerClassName={isInitialLoading ? 'pb-0' : 'pb-6 md:pb-2'}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#1877f2']}
            tintColor="#1877f2"
          />
        }>
        {activeQuery ? (
          isSearching ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="small" color="#1877f2" />
              <Text className="mt-2 text-xs font-medium text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}
              </Text>
            </View>
          ) : friendResults.length === 0 && otherResults.length === 0 ? (
            <View className="py-12 px-4 items-center">
              <View className="mb-2 opacity-30">
                <AppIcon
                  android="person_off"
                  ios="person.crop.circle.badge.xmark"
                  size={40}
                  color="#1877f2"
                />
              </View>
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
                {locale === 'bn'
                  ? 'কোনো ফলাফল পাওয়া যায়নি'
                  : 'No results found'}
              </Text>
              <Text className="text-xs mt-1 max-w-[220px] text-[#65676b] dark:text-[#b0b3b8] text-center leading-relaxed">
                {locale === 'bn'
                  ? 'অন্য নাম বা ইউজারনেম দিয়ে আবার চেষ্টা করুন'
                  : 'Try searching with a different name or username'}
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-3">
              {/* 1. Friends Section (Top) */}
              {friendResults.length > 0 ? (
                <View className="flex-col gap-0.5">
                  <View className="px-2.5 py-1 flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
                      {locale === 'bn' ? 'ফ্রেন্ডস' : 'Friends'}
                    </Text>
                    <View className="bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {friendResults.length}
                      </Text>
                    </View>
                  </View>
                  {friendResults.map((user) => renderUserItem(user, true))}
                </View>
              ) : null}

              {/* 2. Others Section (Bottom) */}
              {otherResults.length > 0 ? (
                <View className="flex-col gap-0.5">
                  <View className="px-2.5 py-1 flex-row items-center justify-between">
                    <Text className="text-[11px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
                      {locale === 'bn' ? 'অন্যান্য' : 'Others'}
                    </Text>
                    <View className="bg-gray-100 dark:bg-[#3a3b3c] px-1.5 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-[#65676b] dark:text-[#b0b3b8]">
                        {otherResults.length}
                      </Text>
                    </View>
                  </View>
                  {otherResults.map((user) => renderUserItem(user, false))}
                </View>
              ) : null}
            </View>
          )
        ) : isInitialLoading ? (
          <View className="flex-col gap-0.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                className="flex-row items-center gap-2.5 px-2 py-2 rounded-xl">
                <View className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700/60 shrink-0" />
                <View className="flex-1 gap-1.5 min-w-0">
                  <View
                    className={`h-3.5 bg-gray-200 dark:bg-gray-700/60 rounded-md ${
                      i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-5/6' : 'w-2/3'
                    }`}
                  />
                  <View className="h-3 bg-gray-200 dark:bg-gray-700/60 rounded-md w-16" />
                </View>
              </View>
            ))}
          </View>
        ) : conversations.length === 0 ? (
          <View className="py-12 px-4 items-center">
            <View className="mb-3 opacity-30">
              <AppIcon
                android="chat_bubble"
                ios="bubble.left.and.bubble.right"
                size={40}
                color="#1877f2"
              />
            </View>
            <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
              {locale === 'bn' ? 'এখনো কোনো মেসেজ নেই' : 'No messages yet'}
            </Text>
            <Text className="text-xs mt-1 max-w-[220px] text-[#65676b] dark:text-[#b0b3b8] text-center leading-relaxed">
              {locale === 'bn'
                ? 'ফ্রেন্ড খুঁজতে ওপরের সার্চ আইকন ব্যবহার করুন'
                : 'Use search above to find a friend and start chatting'}
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-0.5">
            {conversations.map((conv) => {
              const other = getOtherUserFromConversation(conv);
              return (
                <ConversationItemView
                  key={conv.id}
                  conversation={{
                    ...conv,
                    otherUser: other || undefined,
                  }}
                  isSelected={selectedId === conv.id}
                  onSelect={() => onSelectConversation(conv)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
