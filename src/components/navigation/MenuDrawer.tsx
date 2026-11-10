import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';

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
    icon: 'messenger',
    iconBg: 'bg-sky-500',
  },
  {
    id: 'menu-categories',
    labelBn: 'বিষয়ভিত্তিক ক্যাটাগরি',
    labelEn: 'Categories',
    href: '/categories',
    icon: 'layers',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'menu-friends',
    labelBn: 'ফ্রেন্ডস',
    labelEn: 'Friends',
    href: '/friends',
    icon: 'group',
    iconBg: 'bg-indigo-600',
  },
  {
    id: 'menu-groups',
    labelBn: 'গ্রুপসমূহ',
    labelEn: 'Groups',
    href: '/groups',
    icon: 'groups',
    iconBg: 'bg-primary-600',
  },
  {
    id: 'menu-blood',
    labelBn: 'রক্তদান',
    labelEn: 'Blood Donation',
    href: '/blood',
    icon: 'water_drop',
    iconBg: 'bg-rose-600',
  },
  {
    id: 'menu-zakat',
    labelBn: 'যাকাত ক্যালকুলেটর',
    labelEn: 'Zakat Calculator',
    href: '/zakat',
    icon: 'calculate',
    iconBg: 'bg-emerald-600',
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
    href: '/settings',
    icon: 'settings',
    iconBg: 'bg-gray-600',
  },
  {
    id: 'menu-purpose',
    labelBn: 'আমাদের উদ্দেশ্য',
    labelEn: 'Our Purpose',
    href: '/purpose',
    icon: 'auto_awesome',
    iconBg: 'bg-emerald-600',
  },
  {
    id: 'menu-feedback',
    labelBn: 'পরামর্শ ও অভিযোগ',
    labelEn: 'Feedback & Report',
    href: '/feedback',
    icon: 'feedback',
    iconBg: 'bg-teal-600',
  },
];

export function MenuDrawer() {
  const insets = useSafeAreaInsets();
  const appTopStart = Math.max(
    insets.top || 0,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0
  );
  const appBottomEnd = insets.bottom || 0;
  const pathname = usePathname();
  const {
    isMenuDrawerOpen,
    setMenuDrawerOpen,
    locale,
    setLocale,
    theme,
    toggleTheme,
    unreadMessagesCount,
  } = useUi();
  const { user, isAuthenticated } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(isMenuDrawerOpen);
  const slideAnim = useRef(new Animated.Value(380)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMenuDrawerOpen) {
      setIsModalVisible(true);
      slideAnim.setValue(380);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 220,
          mass: 0.8,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else if (isModalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 380,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [isMenuDrawerOpen, slideAnim, backdropAnim, isModalVisible]);

  const closeDrawer = useCallback(() => {
    setMenuDrawerOpen(false);
  }, [setMenuDrawerOpen]);

  const closeAndNavigate = useCallback(
    (href: string) => {
      setMenuDrawerOpen(false);
      if (pathname === href) return;
      router.navigate(href as any);
    },
    [pathname, setMenuDrawerOpen]
  );

  if (!isModalVisible && !isMenuDrawerOpen) return null;

  return (
    <Modal
      visible={isModalVisible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      onRequestClose={closeDrawer}
    >
      <View style={{ flex: 1 }}>
        {/* Top outside area: Status bar / Network bar (Tap to close) */}
        {appTopStart > 0 ? (
          <Pressable
            style={{ height: appTopStart }}
            onPress={closeDrawer}
            accessibilityLabel={locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
          />
        ) : null}

        {/* App Viewport Container */}
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            backgroundColor: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'],
            }),
          }}
        >
          {/* Backdrop tap area */}
          <Pressable
            className="flex-1"
            onPress={closeDrawer}
            accessibilityLabel={
              locale === 'bn' ? 'মেনু ড্রয়ার বন্ধ করুন' : 'Close menu drawer'
            }
          />

          {/* Drawer Panel matching ProfileView */}
          <Animated.View
            style={[
              {
                transform: [{ translateX: slideAnim }],
                backgroundColor: theme === 'dark' ? '#242526' : '#ffffff',
                height: '100%',
              },
            ]}
            className="w-[88%] sm:w-[380px] max-w-[90%] border-l border-t border-b border-[#e4e6eb] dark:border-[#393a3b] shadow-2xl flex-col select-none rounded-tl-2xl rounded-bl-2xl overflow-hidden"
          >
          {/* Drawer Header */}
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-[#e4e6eb] dark:border-[#393a3b] select-none">
            <View className="flex-row items-center gap-2">
              <AppIcon
                android="menu"
                size={20}
                color={theme === 'dark' ? '#e4e6eb' : '#050505'}
              />
              <Text
                selectable={false}
                className="text-[17.5px] font-bold text-[#050505] dark:text-[#e4e6eb] select-none"
              >
                {locale === 'bn' ? 'মেনু ও সেটিংস' : 'Menu & Settings'}
              </Text>
            </View>

            <Pressable
              onPress={closeDrawer}
              hitSlop={6}
              accessibilityLabel="Close menu drawer"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] active:bg-[#e4e6eb] dark:active:bg-[#4e4f50]"
            >
              <AppIcon
                android="close"
                ios="xmark"
                size={20}
                weight="bold"
                color={theme === 'dark' ? '#e4e6eb' : '#050505'}
              />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView className="flex-1 p-4" contentContainerClassName="pb-5">
            {/* User Account / Auth Section matching peacetweet_frontend MenuDrawer.tsx */}
            {isAuthenticated && user ? (
              <View className="mb-3.5">
                <Pressable
                  onPress={() => closeAndNavigate('/profile')}
                  className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#3a3b3c]"
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl || (user as any).avatar}
                    name={user.name}
                    size="md"
                  />
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-bold text-[16px] text-[#1e2329] dark:text-white"
                    >
                      {user.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5"
                    >
                      {user.username ? `@${user.username}` : user.email}
                    </Text>
                  </View>
                  <AppIcon
                    android="chevron_right"
                    size={20}
                    color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
                  />
                </Pressable>
              </View>
            ) : (
              <View className="p-4 rounded-2xl  bg-[#e6e9ef]/70  dark:bg-[#3a3b3c]/40 mb-3.5">
                <Text className="font-bold text-[16px] text-[#1e2329] dark:text-white">
                  {locale === 'bn'
                    ? 'PeaceTweet এ স্বাগতম'
                    : 'Welcome to PeaceTweet'}
                </Text>
                <Text className="text-[13.5px] text-[#65676b] dark:text-[#b0b3b8] mt-1 mb-3.5 leading-5">
                  {locale === 'bn'
                    ? 'দোয়া ও ইসলামিক চিন্তার প্ল্যাটফর্মে যুক্ত হন'
                    : 'Join the peaceful Dua & Islamic platform'}
                </Text>

                <View className="flex-row gap-2.5">
                  <Pressable
                    onPress={() => closeAndNavigate('/login')}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-2.5"
                  >
                    <AppIcon
                      android="login"
                      ios="arrow.right.square"
                      size={16}
                      color="#ffffff"
                    />
                    <Text className="text-[14px] font-bold text-white">
                      {locale === 'bn' ? 'লগইন' : 'Log In'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => closeAndNavigate('/register')}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#d9dde4] bg-white py-2.5 dark:border-[#393a3b] dark:bg-[#242526]"
                  >
                    <AppIcon
                      android="person_add"
                      ios="person.badge.plus"
                      size={16}
                      color={theme === 'dark' ? '#e4e6eb' : '#1e2329'}
                    />
                    <Text className="text-[14px] font-bold text-[#1e2329] dark:text-[#e4e6eb]">
                      {locale === 'bn' ? 'যোগ দিন' : 'Join'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* All Shortcuts */}
            <Text className="px-2 pb-2 text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
              {locale === 'bn' ? 'সকল মেনু' : 'All Shortcuts'}
            </Text>

            <View className="gap-1.5 mb-3.5">
              {MENU_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : item.href === '/categories'
                    ? pathname === '/categories' || pathname === '/explore'
                    : pathname === item.href ||
                      (pathname.startsWith(item.href + '/') &&
                        item.href !== '/');

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => closeAndNavigate(item.href)}
                    className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 ${
                      isActive
                        ? 'bg-[#dee2e8] dark:bg-[#3a3b3c]'
                        : 'active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]/60'
                    }`}
                  >
                    <View className="flex-row items-center gap-3.5 flex-1">
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-full shrink-0 ${item.iconBg}`}
                      >
                        <AppIcon
                          android={item.icon}
                          size={19}
                          weight="bold"
                          color="#ffffff"
                        />
                      </View>
                      <Text
                        className={`text-[15px] leading-snug flex-1 ${
                          isActive
                            ? 'font-bold text-primary-700 dark:text-primary-400'
                            : 'font-semibold text-[#1e2329] dark:text-[#e4e6eb]'
                        }`}
                      >
                        {locale === 'bn' ? item.labelBn : item.labelEn}
                      </Text>
                      {item.id === 'menu-messages' && unreadMessagesCount > 0 ? (
                        <View className="h-5 min-w-5 px-1.5 rounded-full bg-red-600 items-center justify-center mr-1">
                          <Text className="text-[10px] font-bold text-white leading-none">
                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Preferences */}
            <View className="pt-2.5 border-t border-[#d9dde4] dark:border-[#393a3b] gap-2.5">
              <Text className="px-2 text-[12.5px] font-bold text-[#65676b] dark:text-[#b0b3b8] uppercase tracking-wider">
                {locale === 'bn' ? 'পছন্দ ও সেটিংস' : 'Preferences'}
              </Text>

              {/* Dark / Light Mode Toggle */}
              <View className="flex-row items-center justify-between px-3 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50">
                <View className="flex-row items-center gap-2.5">
                  <AppIcon
                    android={theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    ios={theme === 'dark' ? 'moon.fill' : 'sun.max.fill'}
                    size={18}
                    color={theme === 'dark' ? '#4a80f5' : '#f59e0b'}
                  />
                  <Text className="text-[14.5px] font-semibold text-[#1e2329] dark:text-[#e4e6eb]">
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
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#242526]"
                >
                  <Text className="font-bold text-[12.5px] text-[#1e2329] dark:text-[#e4e6eb]">
                    {theme === 'dark' ? 'Switch Light' : 'Switch Dark'}
                  </Text>
                </Pressable>
              </View>

              {/* Language Switcher */}
              <View className="flex-row items-center justify-between px-3 py-2.5 rounded-xl bg-[#e6e9ef] dark:bg-[#3a3b3c]/50">
                <View className="flex-row items-center gap-2.5">
                  <AppIcon
                    android="language"
                    ios="globe"
                    size={18}
                    color="#14b8a6"
                  />
                  <Text className="text-[14.5px] font-semibold text-[#1e2329] dark:text-[#e4e6eb]">
                    {locale === 'bn' ? 'ভাষা (Language)' : 'Language'}
                  </Text>
                </View>

                <View className="flex-row gap-1.5">
                  <Pressable
                    onPress={() => setLocale('bn')}
                    className={`px-2.5 py-1 rounded-md ${
                      locale === 'bn'
                        ? 'bg-primary-500'
                        : 'bg-white dark:bg-[#242526]'
                    }`}
                  >
                    <Text
                      className={`font-bold text-[12.5px] ${
                        locale === 'bn'
                          ? 'text-white'
                          : 'text-[#65676b] dark:text-[#b0b3b8]'
                      }`}
                    >
                      বাংলা
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setLocale('en')}
                    className={`px-2.5 py-1 rounded-md ${
                      locale === 'en'
                        ? 'bg-primary-500'
                        : 'bg-white dark:bg-[#242526]'
                    }`}
                  >
                    <Text
                      className={`font-bold text-[12.5px] ${
                        locale === 'en'
                          ? 'text-white'
                          : 'text-[#65676b] dark:text-[#b0b3b8]'
                      }`}
                    >
                      ENG
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Footer Links */}
              <View className="pt-2 px-2 flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <Text className="text-[12px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn' ? 'উদ্দেশ্য' : 'Purpose'} •{' '}
                  {locale === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms'} •{' '}
                  {locale === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy'} • PeaceTweet ©
                  2026
                </Text>
              </View>
            </View>
          </ScrollView>
          </Animated.View>
        </Animated.View>

        {/* Bottom outside area: System navigation / gesture bar (Tap to close) */}
        {appBottomEnd > 0 ? (
          <Pressable
            style={{ height: appBottomEnd }}
            onPress={closeDrawer}
            accessibilityLabel={locale === 'bn' ? 'বন্ধ করুন' : 'Close'}
          />
        ) : null}
      </View>
    </Modal>
  );
}
