import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';
import { notificationsApi } from '@/features/notifications/api/notifications.api';

interface NavItem {
  id: string;
  labelBn: string;
  labelEn: string;
  href?: string;
  icon: AndroidSymbol;
  isComposer?: boolean;
  badge?: number;
}

export function MobileNav() {
  const pathname = usePathname();
  const {
    locale,
    setComposerModalOpen,
    isSearchOpen,
    setSearchOpen,
    activeConversationId,
    unreadMessagesCount,
    unreadNotificationsCount,
    setUnreadNotificationsCount,
    theme,
  } = useUi();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      return;
    }

    const fetchUnread = () => {
      notificationsApi
        .getUnreadCount()
        .then((count) => setUnreadNotificationsCount(count))
        .catch(() => {});
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 15000);
    return () => clearInterval(timer);
  }, [isAuthenticated, setUnreadNotificationsCount]);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const isInsideActiveChat =
    isMessagesActive && Boolean(activeConversationId);

  if (isAuthPage || isInsideActiveChat || isSearchOpen) return null;

  const navItems: NavItem[] = [
    {
      id: 'nav-home',
      labelBn: 'হোম',
      labelEn: 'Home',
      href: '/',
      icon: 'home',
    },
    {
      id: 'nav-bookmarks',
      labelBn: 'সংরক্ষিত',
      labelEn: 'Saved',
      href: '/saved',
      icon: 'bookmark',
    },
    {
      id: 'nav-composer',
      labelBn: 'পোস্ট',
      labelEn: 'Post',
      icon: 'add',
      isComposer: true,
    },
    {
      id: 'nav-messages',
      labelBn: 'মেসেজ',
      labelEn: 'Messages',
      href: '/messages',
      icon: 'chat_bubble',
      badge: unreadMessagesCount,
    },
    {
      id: 'nav-notifications',
      labelBn: 'বিজ্ঞপ্তি',
      labelEn: 'Alerts',
      href: '/notifications',
      icon: 'notifications',
      badge: unreadNotificationsCount,
    },
  ];

  const handleComposerPress = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setComposerModalOpen(true);
  };

  return (
    <View className="w-full border-t border-[#e4e6eb] bg-white dark:border-[#393a3b] dark:bg-[#242526] select-none">
      <View className="flex-row h-14 items-center select-none">
        {navItems.map((item) => {
          const label = locale === 'bn' ? item.labelBn : item.labelEn;

          if (item.isComposer) {
            return (
              <Pressable
                key={item.id}
                onPress={handleComposerPress}
                className="flex-1 flex-col items-center justify-center -top-2.5 z-20 h-full px-0.5 active:scale-95 select-none">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-500 shadow-lg border-2 border-white dark:border-[#242526] select-none">
                  <AppIcon
                    android="add"
                    ios="plus"
                    size={26}
                    weight="bold"
                    color="#ffffff"
                  />
                </View>
                <Text
                  selectable={false}
                  className="text-[10px] font-bold mt-0.5 text-primary-600 dark:text-primary-400 select-none">
                  {label}
                </Text>
              </Pressable>
            );
          }

          const href = item.href || '/';
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          const iconColor = isActive
            ? '#1877f2'
            : theme === 'dark'
              ? '#b0b3b8'
              : '#65676b';

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setSearchOpen(false);
                router.push(href as any);
              }}
              className="flex-1 flex-col items-center justify-center gap-0.5 h-full px-0.5 select-none">
              <View className="relative items-center justify-center select-none">
                <AppIcon
                  android={item.icon}
                  size={22}
                  weight="bold"
                  color={iconColor}
                />
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <View className="absolute -top-1 -right-2 h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 select-none">
                    <Text
                      selectable={false}
                      className="text-[9px] font-bold text-white select-none">
                      {item.badge > 9 ? '9+' : item.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                selectable={false}
                className={`text-[10px] leading-tight select-none ${
                  isActive
                    ? 'text-primary-500 dark:text-primary-400 font-bold'
                    : 'text-[#65676b] dark:text-[#b0b3b8] font-semibold'
                }`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
