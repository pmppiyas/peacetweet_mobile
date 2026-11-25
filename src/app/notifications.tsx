import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  BackHandler,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { NotificationItem } from '@/features/notifications/types/notification.types';
import { NotificationSkeleton } from '@/features/notifications/components/NotificationSkeleton';
import { NotificationItemRow } from '@/features/notifications/components/NotificationItemRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';
import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/navMetrics';

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const {
    locale,
    setUnreadNotificationsCount,
    theme,
    setTabSwipeLocked,
    isTabSwipeLockedRef,
  } = useUi();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [notifications, setNotificationsState] = useState<NotificationItem[]>(
    () =>
      queryCache.get<NotificationItem[]>(CACHE_KEYS.NOTIFICATIONS_LIST) || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !queryCache.has(CACHE_KEYS.NOTIFICATIONS_LIST)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const hasAutoMarked = useRef(false);
  const scrollViewRef = useRef<any>(null);

  const setVerticalScrollLocked = useCallback((locked: boolean) => {
    const node = scrollViewRef.current;
    if (!node) return;
    if (locked && typeof node.getScrollResponder === 'function') {
      const responder = node.getScrollResponder();
      if (responder) {
        responder.isTouching = false;
      }
    }
    if (typeof node.setNativeProps === 'function') {
      node.setNativeProps({ scrollEnabled: !locked });
    }
    const domNode =
      typeof node.getScrollableNode === 'function'
        ? node.getScrollableNode()
        : node;
    if (domNode && domNode.style) {
      domNode.style.overflowY = locked ? 'hidden' : 'auto';
      domNode.style.touchAction = locked ? 'none' : 'auto';
    }
  }, []);

  useEffect(() => {
    const locked = Boolean(selectedNotificationId);
    setTabSwipeLocked(locked);
    setVerticalScrollLocked(locked);
    return () => {
      setTabSwipeLocked(false);
      setVerticalScrollLocked(false);
    };
  }, [selectedNotificationId, setTabSwipeLocked, setVerticalScrollLocked]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedNotificationId) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedNotificationId(null);
      return true;
    });
    return () => sub.remove();
  }, [selectedNotificationId]);

  const setNotifications = useCallback(
    (
      updater:
        | NotificationItem[]
        | ((prev: NotificationItem[]) => NotificationItem[])
    ) => {
      setNotificationsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        queryCache.set(CACHE_KEYS.NOTIFICATIONS_LIST, next);
        return next;
      });
    },
    []
  );

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      if (!silent && !queryCache.has(CACHE_KEYS.NOTIFICATIONS_LIST)) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const res = await notificationsApi.getNotifications({
          page: 1,
          limit: 40,
        });
        const list = res.data || [];
        setNotifications(list);

        const unread =
          res.meta?.unreadCount ?? list.filter((n) => !n.isRead).length;
        setUnreadNotificationsCount(unread);

        // Auto-mark all as read on opening notification route
        if (unread > 0 && !hasAutoMarked.current) {
          hasAutoMarked.current = true;
          notificationsApi
            .markAllAsRead()
            .then(() => {
              setUnreadNotificationsCount(0);
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
              );
            })
            .catch(() => {});
        }
      } catch {
        if (!silent && notifications.length === 0) {
          setError(
            locale === 'bn'
              ? 'বিজ্ঞপ্তি লোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
              : 'Failed to load notifications. Please check your connection.'
          );
        }
      } finally {
        if (!silent) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, setUnreadNotificationsCount]
  );

  useEffect(() => {
    hasAutoMarked.current = false;
    loadNotifications(queryCache.has(CACHE_KEYS.NOTIFICATIONS_LIST));

    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [loadNotifications, isAuthenticated]);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      notificationsApi.markAsRead(item.id).catch(() => {});
    }

    switch (item.type) {
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPT':
        if (item.actor?.username) {
          router.push(`/${item.actor.username}` as any);
        } else {
          router.push(
            item.type === 'FRIEND_REQUEST'
              ? ({ pathname: '/friends', params: { tab: 'requests' } } as any)
              : ('/friends' as any)
          );
        }
        break;

      case 'POST_LIKE':
      case 'POST_COMMENT':
        if (item.entityId) {
          router.push(`/post/${item.entityId}` as any);
        } else if (item.actor?.username) {
          router.push(`/${item.actor.username}` as any);
        } else {
          router.push('/');
        }
        break;

      case 'BLOOD_REQUEST':
        if (item.entityId && item.entityType === 'POST') {
          router.push(`/post/${item.entityId}` as any);
        } else {
          router.push({ pathname: '/blood', params: { tab: 'activity' } } as any);
        }
        break;

      default:
        if (
          item.entityId &&
          (item.entityType === 'POST' || item.entityType === 'COMMENT')
        ) {
          router.push(`/post/${item.entityId}` as any);
        } else if (item.actor?.username) {
          router.push(`/${item.actor.username}` as any);
        } else {
          router.push('/');
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationsCount(0);
    try {
      await notificationsApi.markAllAsRead();
    } catch {}
  };

  const handleDirectDelete = useCallback(
    async (targetId: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== targetId));
      setSelectedNotificationId(null);
      try {
        await notificationsApi.deleteNotification(targetId);
      } catch {
        loadNotifications(true);
      }
    },
    [setNotifications, loadNotifications]
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isInitialLoading = isLoading && notifications.length === 0;

  // If not authenticated, render friendly AuthPromptCard instead of redirecting directly to /login
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <View className="flex-1 overflow-hidden bg-white dark:bg-[#18191a]">
        <View
          style={{ paddingTop: 60, paddingBottom: BOTTOM_NAV_CLEARANCE }}
          className="flex-1 w-full max-w-[720px] mx-auto sm:border-x sm:border-[#e4e6eb] sm:dark:border-[#393a3b]">
          <AuthPromptScreen
            icon="notifications"
            iconBgColor="bg-amber-50 dark:bg-amber-950/60"
            iconColor="#d97706"
            titleBn="বিজ্ঞপ্তি দেখতে লগইন করুন"
            titleEn="Sign in to view Notifications"
            descriptionBn="আপনার পোস্টের প্রতিক্রিয়া, কমেন্ট ও গুরুত্বপূর্ণ নোটিফিকেশন পেতে অ্যাকাউন্টে প্রবেশ করুন।"
            descriptionEn="Log in to your account to view reactions, comments, mentions, and updates."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 overflow-hidden bg-white dark:bg-[#18191a]">
      <View
        style={{ paddingTop: 60, paddingBottom: BOTTOM_NAV_CLEARANCE }}
        className="flex-1 w-full max-w-[720px] mx-auto sm:border-x sm:border-[#e4e6eb] sm:dark:border-[#393a3b]">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isInitialLoading && !selectedNotificationId}
          {...({
            onScrollShouldSetResponderCapture: (e: any) => {
              if (
                isTabSwipeLockedRef.current ||
                Boolean(selectedNotificationId)
              ) {
                e?.stopPropagation?.();
              }
              return false;
            },
          } as any)}
          onScrollBeginDrag={() => {
            if (selectedNotificationId) {
              setSelectedNotificationId(null);
            }
          }}
          scrollEventThrottle={16}
          className="flex-1 no-scrollbar scrollbar-none"
          contentContainerStyle={{
            paddingTop: 6,
            paddingBottom: 0,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                loadNotifications(true);
              }}
              colors={['#0866FF']}
              tintColor="#0866FF"
            />
          }>
          {/* Header (Desktop/Tablet only - hidden on mobile so top gap from Navbar matches Messages 100%) */}
          {isDesktop ? (
            <View className="flex-row items-center justify-between px-3 py-3 border-b border-[#e4e6eb]/60 dark:border-[#393a3b]/60 mb-2">
              <View>
                <Text className="text-xl sm:text-2xl font-bold tracking-tight text-[#050505] dark:text-[#e4e6eb]">
                  Notifications
                </Text>
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                  Stay updated with your activities and friends
                </Text>
              </View>

              {unreadCount > 0 ? (
                <Pressable
                  onPress={handleMarkAllRead}
                  className="flex-row items-center gap-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 px-3 py-1.5">
                  <AppIcon
                    android="done_all"
                    ios="checkmark.circle"
                    size={15}
                    color="#0866FF"
                  />
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn' ? 'সব পঠিত করুন' : 'Mark all read'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Notifications List - Matching Feed and Save edge-to-edge layout */}
          <View className="flex-col flex-1">
            {isInitialLoading ? (
              <NotificationSkeleton count={6} variant="page" />
            ) : error && notifications.length === 0 ? (
              <View className="py-12 items-center justify-center gap-3 px-4">
                <AppIcon
                  android="error_outline"
                  ios="exclamationmark.triangle"
                  size={36}
                  color="#ef4444"
                />
                <Text className="text-sm font-semibold text-rose-600 dark:text-rose-400 text-center">
                  {error}
                </Text>
                <Pressable
                  onPress={() => loadNotifications(false)}
                  className="rounded-xl bg-primary-500 px-4 py-2 mt-1 active:opacity-90">
                  <Text className="text-xs font-bold text-white">
                    {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                  </Text>
                </Pressable>
              </View>
            ) : notifications.length === 0 ? (
              <EmptyState
                iconAndroid="inbox"
                iconIos="tray"
                title={
                  locale === 'bn'
                    ? 'কোনো বিজ্ঞপ্তি নেই'
                    : 'No notifications yet'
                }
                description={
                  locale === 'bn'
                    ? 'কেউ আপনার পোস্টে লাইক বা কমেন্ট করলে, কিংবা ফ্রেন্ড রিকোয়েস্ট পাঠালে তা এখানে দেখতে পাবেন।'
                    : 'When someone likes or comments on your posts, or sends you a friend request, you will see it here.'
                }
              />
            ) : (
              <>
                {notifications.map((item) => (
                  <NotificationItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedNotificationId === item.id}
                    onPress={(clickedItem) => {
                      if (selectedNotificationId) {
                        setSelectedNotificationId(null);
                        return;
                      }
                      handleNotificationPress(clickedItem);
                    }}
                    onSelect={(target) => {
                      setVerticalScrollLocked(true);
                      setTabSwipeLocked(true);
                      setSelectedNotificationId(target.id);
                    }}
                    onDeselect={() => {
                      setSelectedNotificationId(null);
                    }}
                    onDirectDelete={(target) => {
                      handleDirectDelete(target.id);
                    }}
                  />
                ))}
                {/* Tapping empty space below notifications deselects row */}
                <Pressable
                  className="flex-1 min-h-[120px]"
                  onPress={() => {
                    if (selectedNotificationId) {
                      setSelectedNotificationId(null);
                    }
                  }}
                />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
