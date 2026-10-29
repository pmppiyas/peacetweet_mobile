import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

function NineDotsIcon({ color }: { color: string }) {
  const dots = [0, 1, 2];
  return (
    <View className="w-[19px] h-[19px] justify-between">
      {dots.map((row) => (
        <View key={row} className="flex-row justify-between">
          {dots.map((col) => (
            <View
              key={col}
              style={{ backgroundColor: color }}
              className="w-[4.5px] h-[4.5px] rounded-full"
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const {
    locale,
    setMenuDrawerOpen,
    setSearchOpen,
    chatSearchQuery,
    setChatSearchQuery,
    activeConversationId,
    theme,
  } = useUi();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const isInsideActiveChat =
    isMessagesActive && Boolean(activeConversationId);

  // Hide Navbar on mobile when inside an active conversation (matches peacetweet_frontend)
  if (isInsideActiveChat) {
    return null;
  }

  const iconColor = theme === 'dark' ? '#e4e6eb' : '#050505';

  return (
    <View className="w-full h-14 border-b border-[#e4e6eb] bg-white dark:border-[#393a3b] dark:bg-[#242526] px-3 flex-row items-center justify-between">
      {/* Left: Brand Logo */}
      <Pressable
        onPress={() => router.push('/')}
        className="flex-row items-center gap-2.5 shrink-0">
        <Text className="text-2xl sm:text-[27px] font-black tracking-tight text-primary-700 dark:text-white">
          PeaceTweet
        </Text>
      </Pressable>

      {/* Right: Mobile Messages Search Input on /messages, otherwise Search + 9-Dots Menu */}
      {isMessagesActive ? (
        <View className="flex-row items-center justify-end h-10">
          <View className="relative w-[180px] sm:w-[210px] h-9 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-primary-500/20 flex-row items-center px-3">
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
                locale === 'bn' ? 'ফ্রেন্ড খুঁজুন...' : 'Search friends...'
              }
              placeholderTextColor={theme === 'dark' ? '#b0b3b8' : '#65676b'}
              className="flex-1 ml-2 text-xs sm:text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] py-0"
            />
            {chatSearchQuery.length > 0 ? (
              <Pressable
                onPress={() => setChatSearchQuery('')}
                className="ml-1 p-0.5 rounded-full">
                <AppIcon
                  android="close"
                  ios="xmark"
                  size={13}
                  color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={() => setSearchOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:opacity-80">
            <AppIcon
              android="search"
              ios="magnifyingglass"
              size={22}
              weight="bold"
              color={iconColor}
            />
          </Pressable>

          <Pressable
            onPress={() => setMenuDrawerOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:opacity-80">
            <NineDotsIcon color={iconColor} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
