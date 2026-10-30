import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';

interface MenuItem {
  id: string;
  labelBn: string;
  labelEn: string;
  href: string;
  icon: AndroidSymbol;
  iconBg: string;
  exact?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-home',
    labelBn: 'হোম ফিড',
    labelEn: 'Home Feed',
    href: '/',
    icon: 'home',
    iconBg: 'bg-primary-500',
    exact: true,
  },
  {
    id: 'menu-messages',
    labelBn: 'মেসেজ',
    labelEn: 'Messages',
    href: '/messages',
    icon: 'chat_bubble',
    iconBg: 'bg-sky-500',
  },
  {
    id: 'menu-categories',
    labelBn: 'বিষয়ভিত্তিক ক্যাটাগরি',
    labelEn: 'Categories',
    href: '/explore',
    icon: 'layers',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'menu-friends',
    labelBn: 'ফ্রেন্ডস',
    labelEn: 'Friends',
    href: '/profile',
    icon: 'group',
    iconBg: 'bg-indigo-600',
  },
  {
    id: 'menu-groups',
    labelBn: 'গ্রুপসমূহ',
    labelEn: 'Groups',
    href: '/explore',
    icon: 'groups',
    iconBg: 'bg-primary-600',
  },
  {
    id: 'menu-blood',
    labelBn: 'রক্তদান',
    labelEn: 'Blood Donation',
    href: '/explore',
    icon: 'water_drop',
    iconBg: 'bg-rose-600',
  },
  {
    id: 'menu-bookmarks',
    labelBn: 'সংরক্ষিত আইটেম',
    labelEn: 'Saved',
    href: '/saved',
    icon: 'bookmark',
    iconBg: 'bg-purple-600',
  },
  {
    id: 'menu-settings',
    labelBn: 'সেটিংস',
    labelEn: 'Settings',
    href: '/profile',
    icon: 'settings',
    iconBg: 'bg-gray-600',
  },
  {
    id: 'menu-purpose',
    labelBn: 'আমাদের উদ্দেশ্য',
    labelEn: 'Our Purpose',
    href: '/explore',
    icon: 'auto_awesome',
    iconBg: 'bg-emerald-600',
  },
  {
    id: 'menu-feedback',
    labelBn: 'পরামর্শ ও অভিযোগ',
    labelEn: 'Feedback & Report',
    href: '/explore',
    icon: 'feedback',
    iconBg: 'bg-teal-600',
  },
];

export function MenuDrawer() {
  const pathname = usePathname();
  const {
    isMenuDrawerOpen,
    setMenuDrawerOpen,
    locale,
    setLocale,
    theme,
    toggleTheme,
  } = useUi();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isMenuDrawerOpen) return null;

  const closeAndNavigate = (href: string) => {
    setMenuDrawerOpen(false);
    router.push(href as any);
  };

  return (
    <Modal
      visible={isMenuDrawerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuDrawerOpen(false)}>
      <View className="flex-1 flex-row justify-end bg-black/60">
        {/* Backdrop tap area */}
        <Pressable
          className="flex-1"
          onPress={() => setMenuDrawerOpen(false)}
        />

        {/* Drawer Panel matching peacetweet_frontend MenuDrawer */}
        <View className="w-80 max-w-[85%] h-full bg-white dark:bg-[#242526] border-l border-[#e4e6eb] dark:border-[#393a3b] flex-col select-none">
          {/* Drawer Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#e4e6eb] dark:border-[#393a3b] select-none">
            <Text
              selectable={false}
              className="text-lg font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
              {locale === 'bn' ? 'মেনু ও সেটিংস' : 'Menu & Settings'}
            </Text>

            <Pressable
              onPress={() => setMenuDrawerOpen(false)}
              className="h-8 w-8 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c]">
              <AppIcon
                android="close"
                ios="xmark"
                size={18}
                weight="bold"
                color={theme === 'dark' ? '#e4e6eb' : '#050505'}
              />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView className="flex-1 p-3.5" contentContainerClassName="pb-8">
            {/* User Account / Auth Section matching peacetweet_frontend MenuDrawer.tsx */}
            {isAuthenticated && user ? (
              <View className="mb-3 gap-2">
                <Pressable
                  onPress={() => closeAndNavigate('/profile')}
                  className="flex-row items-center gap-3 p-3 rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c]">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-500">
                    <Text className="text-white font-bold text-base">
                      {user.name?.charAt(0)?.toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-bold text-sm text-[#050505] dark:text-white">
                      {user.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                      {user.username ? `@${user.username}` : user.email}
                    </Text>
                  </View>
                  <AppIcon
                    android="chevron_right"
                    size={18}
                    color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                  />
                </Pressable>

                <Pressable
                  onPress={async () => {
                    setMenuDrawerOpen(false);
                    await logout();
                  }}
                  className="flex-row items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 dark:border-rose-900/60 dark:bg-rose-950/40">
                  <AppIcon android="logout" size={15} color="#e11d48" />
                  <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {locale === 'bn' ? 'লগআউট করুন' : 'Log Out'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="p-3.5 rounded-2xl border border-[#e4e6eb] bg-[#f0f2f5]/60 dark:border-[#393a3b] dark:bg-[#3a3b3c]/40 mb-3">
                <Text className="font-bold text-sm text-[#050505] dark:text-white">
                  {locale === 'bn'
                    ? 'PeaceTweet এ স্বাগতম'
                    : 'Welcome to PeaceTweet'}
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5 mb-3">
                  {locale === 'bn'
                    ? 'দোয়া ও ইসলামিক চিন্তার প্ল্যাটফর্মে যুক্ত হন'
                    : 'Join the peaceful Dua & Islamic platform'}
                </Text>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => closeAndNavigate('/login')}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-2">
                    <AppIcon
                      android="login"
                      ios="arrow.right.square"
                      size={14}
                      color="#ffffff"
                    />
                    <Text className="text-xs font-bold text-white">
                      {locale === 'bn' ? 'লগইন' : 'Log In'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => closeAndNavigate('/register')}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#e4e6eb] bg-white py-2 dark:border-[#393a3b] dark:bg-[#242526]">
                    <AppIcon
                      android="person_add"
                      ios="person.badge.plus"
                      size={14}
                      color={theme === 'dark' ? '#e4e6eb' : '#050505'}
                    />
                    <Text className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'যোগ দিন' : 'Join'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* All Shortcuts */}
            <Text className="px-2 pb-1.5 text-[11px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
              {locale === 'bn' ? 'সকল মেনু' : 'All Shortcuts'}
            </Text>

            <View className="gap-1 mb-3">
              {MENU_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href) && item.href !== '/';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => closeAndNavigate(item.href)}
                    className={`flex-row items-center justify-between rounded-xl px-2.5 py-2 ${
                      isActive
                        ? 'bg-[#e4e6eb] dark:bg-[#3a3b3c]'
                        : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]/60'
                    }`}>
                    <View className="flex-row items-center gap-2.5">
                      <View
                        className={`h-8 w-8 items-center justify-center rounded-full ${item.iconBg}`}>
                        <AppIcon
                          android={item.icon}
                          size={17}
                          weight="bold"
                          color="#ffffff"
                        />
                      </View>
                      <Text
                        className={`text-[14px] ${
                          isActive
                            ? 'font-bold text-primary-700 dark:text-primary-400'
                            : 'font-semibold text-[#050505] dark:text-[#e4e6eb]'
                        }`}>
                        {locale === 'bn' ? item.labelBn : item.labelEn}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Preferences */}
            <View className="pt-2 border-t border-[#e4e6eb] dark:border-[#393a3b] gap-2">
              <Text className="px-2 text-[11px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
                {locale === 'bn' ? 'পছন্দ ও সেটিংস' : 'Preferences'}
              </Text>

              {/* Dark / Light Mode Toggle */}
              <View className="flex-row items-center justify-between px-2.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c]/50">
                <View className="flex-row items-center gap-2">
                  <AppIcon
                    android={theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    ios={theme === 'dark' ? 'moon.fill' : 'sun.max.fill'}
                    size={16}
                    color={theme === 'dark' ? '#4a80f5' : '#f59e0b'}
                  />
                  <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {theme === 'dark'
                      ? locale === 'bn'
                        ? 'ডার্ক মোড'
                        : 'Dark Mode'
                      : locale === 'bn'
                        ? 'লাইট মোড'
                        : 'Light Mode'}
                  </Text>
                </View>

                <Pressable
                  onPress={toggleTheme}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#242526]">
                  <Text className="font-bold text-[11px] text-[#050505] dark:text-[#e4e6eb]">
                    {theme === 'dark' ? 'Switch Light' : 'Switch Dark'}
                  </Text>
                </Pressable>
              </View>

              {/* Language Switcher */}
              <View className="flex-row items-center justify-between px-2.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c]/50">
                <View className="flex-row items-center gap-2">
                  <AppIcon
                    android="language"
                    ios="globe"
                    size={16}
                    color="#14b8a6"
                  />
                  <Text className="text-xs font-semibold text-[#050505] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'ভাষা (Language)' : 'Language'}
                  </Text>
                </View>

                <View className="flex-row gap-1">
                  <Pressable
                    onPress={() => setLocale('bn')}
                    className={`px-2 py-0.5 rounded-md ${
                      locale === 'bn'
                        ? 'bg-primary-500'
                        : 'bg-white dark:bg-[#242526]'
                    }`}>
                    <Text
                      className={`font-bold text-[11px] ${
                        locale === 'bn'
                          ? 'text-white'
                          : 'text-[#65676b] dark:text-[#b0b3b8]'
                      }`}>
                      বাংলা
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setLocale('en')}
                    className={`px-2 py-0.5 rounded-md ${
                      locale === 'en'
                        ? 'bg-primary-500'
                        : 'bg-white dark:bg-[#242526]'
                    }`}>
                    <Text
                      className={`font-bold text-[11px] ${
                        locale === 'en'
                          ? 'text-white'
                          : 'text-[#65676b] dark:text-[#b0b3b8]'
                      }`}>
                      ENG
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Footer Links */}
              <View className="pt-2 px-2 flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn' ? 'উদ্দেশ্য' : 'Purpose'} •{' '}
                  {locale === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms'} •{' '}
                  {locale === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy'} • PeaceTweet © 2026
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
