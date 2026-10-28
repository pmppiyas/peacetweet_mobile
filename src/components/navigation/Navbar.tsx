import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
  const { setMenuDrawerOpen, setSearchOpen, theme } = useUi();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  const iconColor = theme === 'dark' ? '#e4e6eb' : '#050505';

  return (
    <View className="w-full h-14 border-b border-[#e4e6eb] bg-white dark:border-[#393a3b] dark:bg-[#242526] px-3 flex-row items-center justify-between">
      {/* Left: Brand Logo */}
      <Pressable
        onPress={() => router.push('/')}
        className="flex-row items-center gap-2.5">
        <Text className="text-2xl font-black tracking-tight text-primary-700 dark:text-white">
          PeaceTweet
        </Text>
      </Pressable>

      {/* Right: Circular Search + 9-Dots Menu Button */}
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
    </View>
  );
}
