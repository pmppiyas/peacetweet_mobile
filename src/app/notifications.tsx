import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { NotificationItem } from '@/features/notifications/types/notification.types';
import { NotificationSkeleton } from '@/features/notifications/components/NotificationSkeleton';
import { NotificationItemRow } from '@/features/notifications/components/NotificationItemRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPromptScreen } from '@/components/ui/AuthPromptCard';

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const { locale, setUnreadNotificationsCount, theme } = useUi();
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
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<NotificationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasAutoMarked = useRef(false);

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

  // If not authenticated, render friendly AuthPromptCard instead of redirecting directly to /login
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <AuthPromptScreen
        icon="notifications"
        iconBgColor="bg-amber-50 dark:bg-amber-950/60"
        iconColor="#d97706"
        titleBn="বিজ্ঞপ্তি দেখতে লগইন করুন"
        titleEn="Sign in to view Notifications"
        descriptionBn="আপনার পোস্টের প্রতিক্রিয়া, কমেন্ট ও গুরুত্বপূর্ণ নোটিফিকেশন পেতে অ্যাকাউন্টে প্রবেশ করুন।"
        descriptionEn="Log in to your account to view reactions, comments, mentions, and updates."
      />
    );
  }

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
        router.push('/profile');
        break;
      case 'POST_LIKE':
      case 'POST_COMMENT':
        router.push('/');
        break;
      case 'BLOOD_REQUEST':
        router.push('/');
        break;
      default:
        if (item.actor?.username) {
          router.push('/profile');
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

  const handleConfirmDelete = async () => {
    if (!pendingDeleteItem) return;
    const targetId = pendingDeleteItem.id;
    setIsDeleting(true);
    setNotifications((prev) => prev.filter((n) => n.id !== targetId));
    try {
      await notificationsApi.deleteNotification(targetId);
    } catch {
      loadNotifications(true);
    } finally {
      setIsDeleting(false);
      setPendingDeleteItem(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isInitialLoading = isLoading && notifications.length === 0;

  return (
    <View className="flex-1 overflow-hidden bg-white dark:bg-[#18191a] sm:bg-[#f0f2f5] py-2 sm:py-3 lg:py-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isInitialLoading}
        className="flex-1 px-1 sm:px-4 no-scrollbar scrollbar-none"
        contentContainerClassName={isInitialLoading ? 'pb-0' : 'pb-6'}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadNotifications(true);
            }}
            colors={['#1877f2']}
            tintColor="#1877f2"
          />
        }>
        {/* Flat Content Display: Matching Message page layout & gap from Navbar */}
        <View className="w-full max-w-[720px] mx-auto bg-white dark:bg-[#18191a] sm:dark:bg-[#242526] sm:rounded-2xl sm:border sm:border-[#e4e6eb] sm:dark:border-[#393a3b] overflow-hidden sm:p-2">
          {/* Header (Desktop/Tablet only - hidden on mobile so top gap from Navbar matches Messages 100%) */}
          {isDesktop ? (
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#e4e6eb]/60 dark:border-[#393a3b]/60 mb-2">
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
                    color="#1877f2"
                  />
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {locale === 'bn' ? 'সব পঠিত করুন' : 'Mark all read'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Notifications List - Matching Message page gap-0.5 */}
          <View className="flex-col gap-0.5">
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
              notifications.map((item) => (
                <NotificationItemRow
                  key={item.id}
                  item={item}
                  onPress={handleNotificationPress}
                  onRequestDelete={(target) => setPendingDeleteItem(target)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reusable Delete Notification Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteItem)}
        onClose={() => setPendingDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        variant="danger"
        title={
          locale === 'bn'
            ? 'বিজ্ঞপ্তি মুছে ফেলবেন?'
            : 'Delete notification?'
        }
        subtitle={
          locale === 'bn'
            ? 'এই কাজটি বাতিল করা যাবে না।'
            : 'This action cannot be undone.'
        }
        description={
          locale === 'bn'
            ? 'আপনি কি নিশ্চিতভাবে এই বিজ্ঞপ্তিটি তালিকা থেকে মুছে ফেলতে চান?'
            : 'Are you sure you want to remove this notification from your list?'
        }
        confirmText={locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Delete'}
        cancelText={locale === 'bn' ? 'বাতিল করুন' : 'Cancel'}
      />
    </View>
  );
}
