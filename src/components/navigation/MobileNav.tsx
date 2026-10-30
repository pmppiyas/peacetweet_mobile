import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
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
    isUploadingPost,
    postUploadType,
    isPostUploadSuccess,
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

  const isBloodContext =
    postUploadType === 'BLOOD' ||
    pathname === '/blood' ||
    pathname.startsWith('/blood') ||
    pathname.includes('blood');

  const handleComposerPress = () => {
    if (isBloodContext && (pathname === '/blood' || pathname.startsWith('/blood') || pathname.includes('blood'))) {
      router.replace({ pathname: '/blood', params: { tab: 'create' } } as any);
      return;
    }
    if (!isAuthenticated) {
      router.push('/create');
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
            const activeBg = isPostUploadSuccess
              ? '#059669'
              : isBloodContext
              ? '#e11d48'
              : '#1877f2';

            const activeTextColor = isPostUploadSuccess
              ? '#059669'
              : isBloodContext
              ? '#e11d48'
              : '#1877f2';

            return (
              <Pressable
                key={item.id}
                disabled={isUploadingPost}
                onPress={handleComposerPress}
                className="flex-1 flex-col items-center justify-center -top-2.5 z-20 h-full px-0.5 active:scale-95 select-none">
                <View
                  style={{
                    backgroundColor: activeBg,
                    borderColor: theme === 'dark' ? '#242526' : '#ffffff',
                  }}
                  className="h-11 w-11 items-center justify-center rounded-full shadow-lg border-2 select-none">
                  {isUploadingPost ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : isPostUploadSuccess ? (
                    <AppIcon
                      android="check"
                      ios="checkmark"
                      size={22}
                      weight="bold"
                      color="#ffffff"
                    />
                  ) : (
                    <AppIcon
                      android="add"
                      ios="plus"
                      size={26}
                      weight="bold"
                      color="#ffffff"
                    />
                  )}
                </View>
                <Text
                  selectable={false}
                  style={{ color: activeTextColor }}
                  className="text-[10px] font-bold mt-0.5 select-none">
                  {isUploadingPost
                    ? locale === 'bn'
                      ? 'পোস্ট হচ্ছে...'
                      : 'Posting...'
                    : isPostUploadSuccess
                    ? locale === 'bn'
                      ? 'সফল!'
                      : 'Done!'
                    : label}
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
