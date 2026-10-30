import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { AuthPromptCard } from '@/components/ui/AuthPromptCard';
import { groupsApi } from '@/features/groups/api/groups.api';
import { GroupItem } from '@/features/groups/types/groups.types';
import { GroupsSkeleton } from '@/features/groups/components/GroupsSkeleton';
import { queryCache } from '@/lib/cache/queryCache';

export default function GroupsScreen() {
  const { locale, theme } = useUi();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // If logged in: default to 'my' (My Groups), otherwise default to 'all' (All Groups)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>(
    isAuthenticated ? 'my' : 'all'
  );

  const hasSetInitialTab = useRef(false);
  useEffect(() => {
    if (!isAuthLoading && !hasSetInitialTab.current) {
      hasSetInitialTab.current = true;
      setActiveTab(isAuthenticated ? 'my' : 'all');
    }
  }, [isAuthLoading, isAuthenticated]);

  // Cache-first state initialization to prevent flash/blinking on tab changes
  const [allGroups, setAllGroups] = useState<GroupItem[]>(
    () => queryCache.get<GroupItem[]>('groups:all') || []
  );
  const [myGroups, setMyGroups] = useState<GroupItem[]>(
    () => queryCache.get<GroupItem[]>('groups:my') || []
  );

  const loadedTabsRef = useRef<Record<string, boolean>>({
    all: queryCache.has('groups:all'),
    my: queryCache.has('groups:my'),
  });

  const allGroupsRef = useRef(allGroups);
  allGroupsRef.current = allGroups;
  const myGroupsRef = useRef(myGroups);
  myGroupsRef.current = myGroups;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchTabContent = useCallback(
    async (tab: 'all' | 'my', forceLoading = false) => {
      // If not authenticated, we only fetch for 'all'
      if (!isAuthenticated && tab === 'my') {
        return;
      }

      const hasExistingData =
        (tab === 'all' && allGroupsRef.current.length > 0) ||
        (tab === 'my' && myGroupsRef.current.length > 0) ||
        Boolean(loadedTabsRef.current[tab]);

      // Only show skeleton if we have NO data yet for this tab, or explicitly forced
      if (forceLoading || !hasExistingData) {
        setIsLoading(true);
      }

      try {
        if (tab === 'all') {
          const res = await groupsApi.discoverGroups();
          const items = res.items || [];
          setAllGroups(items);
          queryCache.set('groups:all', items);
          loadedTabsRef.current['all'] = true;
        } else if (tab === 'my') {
          const res = await groupsApi.getMyGroups();
          const items = res.items || [];
          setMyGroups(items);
          queryCache.set('groups:my', items);
          loadedTabsRef.current['my'] = true;
        }
      } catch (err) {
        // Fallback gracefully on error
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  // 1. Fetch on tab change immediately (silent if already loaded once - zero flicker)
  useEffect(() => {
    const hasData =
      (activeTab === 'all' && allGroupsRef.current.length > 0) ||
      (activeTab === 'my' && myGroupsRef.current.length > 0) ||
      Boolean(loadedTabsRef.current[activeTab]);

    fetchTabContent(activeTab, !hasData);
  }, [activeTab, fetchTabContent]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTabContent(activeTab, false);
    setIsRefreshing(false);
  };

  const handleToggleJoin = async (group: GroupItem) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const isMember =
      group.membership?.status === 'MEMBER' ||
      group.membership?.status === 'OWNER' ||
      group.membership?.status === 'ADMIN';

    setActionLoadingId(group.id);

    try {
      if (isMember) {
        await groupsApi.leaveGroup(group.id);
        const updateItem = (item: GroupItem): GroupItem =>
          item.id === group.id
            ? {
                ...item,
                memberCount: Math.max(0, item.memberCount - 1),
                membership: { status: 'NONE', role: null, requestId: null },
              }
            : item;

        setAllGroups((prev) => prev.map(updateItem));
        setMyGroups((prev) => prev.filter((g) => g.id !== group.id));
      } else {
        await groupsApi.joinGroup(group.id);
        const nextStatus = group.visibility === 'PRIVATE' ? 'PENDING' : 'MEMBER';
        const updateItem = (item: GroupItem): GroupItem =>
          item.id === group.id
            ? {
                ...item,
                memberCount:
                  nextStatus === 'MEMBER' ? item.memberCount + 1 : item.memberCount,
                membership: { status: nextStatus, role: null, requestId: null },
              }
            : item;

        setAllGroups((prev) => prev.map(updateItem));
        if (nextStatus === 'MEMBER') {
          setMyGroups((prev) => {
            const exists = prev.some((g) => g.id === group.id);
            if (exists) return prev;
            return [
              ...prev,
              {
                ...group,
                memberCount: group.memberCount + 1,
                membership: { status: 'MEMBER', role: null, requestId: null },
              },
            ];
          });
        }
      }
    } catch (err) {
      // Graceful error handling
    } finally {
      setActionLoadingId(null);
    }
  };

  const displayedGroups = activeTab === 'all' ? allGroups : myGroups;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-[#18191a]"
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme === 'dark' ? '#ffffff' : '#059669'}
        />
      }>
      {/* Index 0: Sticky Tab Switcher (No Header) */}
      <View className="w-full bg-white dark:bg-[#18191a] z-20 border-b border-[#f0f2f5] dark:border-[#242526] px-3 py-2">
        <View className="w-full max-w-[768px] mx-auto flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#242526] p-1">
          {[
            { key: 'my', bn: 'আমার গ্রুপসমূহ', en: 'My Groups' },
            { key: 'all', bn: 'সকল গ্রুপ', en: 'All Groups' },
          ].map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key as any)}
                className={`flex-1 py-2 items-center rounded-lg ${
                  isSelected
                    ? 'bg-emerald-600 shadow-xs'
                    : 'active:bg-white/60 dark:active:bg-[#3a3b3c]'
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
                  }`}>
                  {locale === 'bn' ? t.bn : t.en}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Index 1: Content Section (Flat) */}
      <View className="w-full max-w-[768px] mx-auto px-3">
        {activeTab === 'my' && !isAuthenticated ? (
          <View className="py-4">
            <AuthPromptCard
              icon="groups"
              iconBgColor="bg-primary-50 dark:bg-primary-950/60"
              iconColor="#1877f2"
              titleBn="আপনার গ্রুপসমূহ দেখতে লগইন করুন"
              titleEn="Sign in to view your Groups"
              descriptionBn="আপনার যুক্ত থাকা গ্রুপসমূহ দেখতে এবং নতুন গ্রুপে যোগ দিতে অ্যাকাউন্টে প্রবেশ করুন।"
              descriptionEn="Log in to your account to view your joined communities and manage group activities."
            />
          </View>
        ) : isLoading && !isRefreshing ? (
          <GroupsSkeleton count={6} />
        ) : (
          <View className="w-full">
            {displayedGroups.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center my-4">
                <AppIcon android="groups" size={24} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
                  {activeTab === 'my'
                    ? locale === 'bn'
                      ? 'আপনি এখনো কোনো গ্রুপে যুক্ত হননি।'
                      : 'You have not joined any groups yet.'
                    : locale === 'bn'
                      ? 'কোনো গ্রুপ পাওয়া যায়নি।'
                      : 'No community groups found.'}
                </Text>
              </View>
            ) : (
              displayedGroups.map((group, index) => {
                const isWorking = actionLoadingId === group.id;
                const isLast = index === displayedGroups.length - 1;

                const isMember =
                  group.membership?.status === 'MEMBER' ||
                  group.membership?.status === 'OWNER' ||
                  group.membership?.status === 'ADMIN';

                const isPending = group.membership?.status === 'PENDING';

                return (
                  <View
                    key={group.id}
                    className={`py-3 flex-row items-center justify-between ${
                      !isLast ? 'border-b border-[#f0f2f5] dark:border-[#242526]' : ''
                    }`}>
                    {/* Left Icon & Text Info */}
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 items-center justify-center shrink-0">
                        <AppIcon android="groups" size={22} color="#059669" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                          {group.name}
                        </Text>
                        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] truncate mt-0.5">
                          {group.memberCount} {locale === 'bn' ? 'জন সদস্য' : 'members'} •{' '}
                          {group.visibility === 'PUBLIC'
                            ? locale === 'bn'
                              ? 'পাবলিক'
                              : 'Public'
                            : locale === 'bn'
                              ? 'প্রাইভেট'
                              : 'Private'}
                        </Text>
                      </View>
                    </View>

                    {/* Join / Member Action Button */}
                    <Pressable
                      onPress={() => handleToggleJoin(group)}
                      disabled={isWorking}
                      className={`px-3.5 py-1.5 rounded-xl border ${
                        isMember
                          ? 'border-[#ced0d4] dark:border-[#3e4042] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                          : isPending
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                            : 'border-emerald-600 bg-emerald-600 active:bg-emerald-700'
                      }`}>
                      {isWorking ? (
                        <ActivityIndicator
                          size="small"
                          color={isMember ? '#65676b' : '#ffffff'}
                        />
                      ) : (
                        <Text
                          className={`text-xs font-bold ${
                            isMember
                              ? 'text-[#65676b] dark:text-[#b0b3b8]'
                              : isPending
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-white'
                          }`}>
                          {isMember
                            ? locale === 'bn'
                              ? 'যুক্ত আছেন'
                              : 'Joined'
                            : isPending
                              ? locale === 'bn'
                                ? 'অনুরোধ পাঠানো হয়েছে'
                                : 'Requested'
                              : locale === 'bn'
                                ? 'যুক্ত হোন'
                                : 'Join'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
