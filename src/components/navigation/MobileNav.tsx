import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { initAppSocket } from '@/lib/socket/socket';
import { queryCache } from '@/lib/cache/queryCache';

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

    const s = initAppSocket();
    if (s) {
      const handleNotif = () => {
        notificationsApi
          .getUnreadCount()
          .then((count) => setUnreadNotificationsCount(count))
          .catch(() => {});
        queryCache.invalidate('notifications');
      };
      const handleCount = (count: number) => {
        if (typeof count === 'number') {
          setUnreadNotificationsCount(count);
        }
      };

      s.on('notification:received', handleNotif);
      s.on('notification:unreadCount', handleCount);

      return () => {
        clearInterval(timer);
        s.off('notification:received', handleNotif);
        s.off('notification:unreadCount', handleCount);
      };
    }

    return () => clearInterval(timer);
  }, [isAuthenticated, setUnreadNotificationsCount]);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPostViewerPage = pathname.startsWith('/post/');
  const isMessagesActive =
    pathname === '/messages' || pathname.startsWith('/messages/');
  const isInsideActiveChat =
    isMessagesActive && Boolean(activeConversationId);

  // NOTE: MobileNav intentionally stays mounted while the photo viewer is open
  // (the viewer fully covers it) so the feed layout never resizes/jumps.
  if (isAuthPage || isPostViewerPage || isInsideActiveChat || isSearchOpen)
    return null;

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
      icon: 'messenger',
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
            const isBloodContext = postUploadType === 'BLOOD';

            const activeBg = isPostUploadSuccess
              ? '#059669'
              : isBloodContext
              ? '#e11d48'
              : '#0866FF';

            return (
              <Pressable
                key={item.id}
                disabled={isUploadingPost}
                onPress={handleComposerPress}
                accessibilityLabel={label}
                className="flex-1 flex-col items-center justify-center -top-3.5 z-20 h-full px-0.5 active:scale-95 select-none">
                <View
                  style={{
                    backgroundColor: activeBg,
                    borderColor: theme === 'dark' ? '#242526' : '#ffffff',
                  }}
                  className="h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg border-2 select-none">
                  {isUploadingPost ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : isPostUploadSuccess ? (
                    <AppIcon
                      android="check"
                      ios="checkmark"
                      size={28}
                      weight="bold"
                      color="#ffffff"
                    />
                  ) : (
                    <AppIcon
                      android="add"
                      ios="plus"
                      size={32}
                      weight="bold"
                      color="#ffffff"
                    />
                  )}
                </View>
              </Pressable>
            );
          }

          const href = item.href || '/';
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          const iconColor = isActive
            ? '#0866FF'
            : theme === 'dark'
              ? '#e4e6eb'
              : '#1e2329';

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setSearchOpen(false);
                if (pathname === href) return;
                router.navigate(href as any);
              }}
              accessibilityLabel={label}
              className="flex-1 items-center justify-center h-full px-0.5 select-none">
              <View className="relative items-center justify-center select-none">
                <AppIcon
                  android={item.icon}
                  size={29}
                  weight="bold"
                  color={iconColor}
                />
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <View className="absolute -top-1.5 -right-2.5 h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 select-none">
                    <Text
                      selectable={false}
                      className="text-[9px] font-bold text-white select-none">
                      {item.badge > 9 ? '9+' : item.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
