import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { friendsApi } from '@/features/friends/api/friends.api';
import {
  FriendItem,
  FriendRequestItem,
  FriendUser,
} from '@/features/friends/types/friends.types';
import { AppIcon } from '@/components/ui/Icon';
import { FriendsSkeleton } from '@/features/friends/components/FriendsSkeleton';
import { AuthPromptCard } from '@/components/ui/AuthPromptCard';
import { queryCache } from '@/lib/cache/queryCache';

export default function FriendsScreen() {
  const { locale, theme } = useUi();
  const { isAuthenticated, user } = useAuth();

  // If not logged in, default to 'suggestions' (Discover)
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggestions'>(
    isAuthenticated ? 'all' : 'suggestions'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Cache-first state initialization to prevent flash/blinking on tab changes
  const [friends, setFriends] = useState<FriendItem[]>(
    () => queryCache.get<FriendItem[]>('friends:all') || []
  );
  const [requests, setRequests] = useState<FriendRequestItem[]>(
    () => queryCache.get<FriendRequestItem[]>('friends:requests') || []
  );
  const [suggestions, setSuggestions] = useState<FriendUser[]>(
    () => queryCache.get<FriendUser[]>('friends:suggestions') || []
  );
  const [sentRequestIds, setSentRequestIds] = useState<Record<string, boolean>>({});

  const loadedTabsRef = useRef<Record<string, boolean>>({
    all: queryCache.has('friends:all'),
    requests: queryCache.has('friends:requests'),
    suggestions: queryCache.has('friends:suggestions'),
  });

  const friendsRef = useRef(friends);
  friendsRef.current = friends;
  const requestsRef = useRef(requests);
  requestsRef.current = requests;
  const suggestionsRef = useRef(suggestions);
  suggestionsRef.current = suggestions;

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isFirstSearchRender = useRef(true);

  // If user logs out while on friends screen, redirect activeTab to 'suggestions'
  useEffect(() => {
    if (!isAuthenticated && (activeTab === 'all' || activeTab === 'requests')) {
      setActiveTab('suggestions');
    }
  }, [isAuthenticated]);

  const fetchTabContent = useCallback(
    async (
      tab: 'all' | 'requests' | 'suggestions',
      query?: string,
      forceLoading = false
    ) => {
      // If not authenticated, we only fetch for 'suggestions' (public user search)
      if (!isAuthenticated && tab !== 'suggestions') {
        return;
      }

      const isSearch = Boolean(query && query.trim().length > 0);
      const hasExistingData =
        (tab === 'all' && friendsRef.current.length > 0) ||
        (tab === 'requests' && requestsRef.current.length > 0) ||
        (tab === 'suggestions' && suggestionsRef.current.length > 0) ||
        Boolean(loadedTabsRef.current[tab]);

      // Only show full skeleton if we have NO data yet for this tab, or explicitly forced
      if (forceLoading || (!hasExistingData && !isSearch)) {
        setIsLoading(true);
      }

      try {
        if (tab === 'all') {
          const res = await friendsApi.getFriends({ search: query?.trim() || undefined });
          const items = res.items || [];
          setFriends(items);
          if (!isSearch) {
            queryCache.set('friends:all', items);
            loadedTabsRef.current['all'] = true;
          }
        } else if (tab === 'requests') {
          const res = await friendsApi.getReceivedFriendRequests();
          const items = res.items || [];
          setRequests(items);
          if (!isSearch) {
            queryCache.set('friends:requests', items);
            loadedTabsRef.current['requests'] = true;
          }
        } else if (tab === 'suggestions') {
          const users = await friendsApi.discoverUsers(query?.trim() || undefined);
          const filtered = user?.id ? users.filter((u) => u.id !== user.id) : users;
          setSuggestions(filtered);
          if (!isSearch) {
            queryCache.set('friends:suggestions', filtered);
            loadedTabsRef.current['suggestions'] = true;
          }
        }
      } catch (err) {
        // Fallback gracefully on error
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id]
  );

  // 1. Fetch on tab change immediately (silent if already loaded once - zero flicker)
  useEffect(() => {
    const hasData =
      (activeTab === 'all' && friendsRef.current.length > 0) ||
      (activeTab === 'requests' && requestsRef.current.length > 0) ||
      (activeTab === 'suggestions' && suggestionsRef.current.length > 0) ||
      Boolean(loadedTabsRef.current[activeTab]);

    fetchTabContent(activeTab, searchQuery, !hasData);
  }, [activeTab, fetchTabContent]);

  // 2. Debounced search: ONLY fires when searchQuery changes (never on activeTab switch)
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchTabContent(activeTabRef.current, searchQuery, false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchTabContent]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTabContent(activeTab, searchQuery, false);
    setIsRefreshing(false);
  };

  const handleAcceptRequest = async (item: FriendRequestItem) => {
    setActionLoadingId(item.id);
    try {
      await friendsApi.acceptFriendRequest(item.id);
      setRequests((prev) => prev.filter((r) => r.id !== item.id));
    } catch {}
    setActionLoadingId(null);
  };

  const handleRejectRequest = async (item: FriendRequestItem) => {
    setActionLoadingId(item.id);
    try {
      await friendsApi.rejectFriendRequest(item.id);
      setRequests((prev) => prev.filter((r) => r.id !== item.id));
    } catch {}
    setActionLoadingId(null);
  };

  const handleUnfriend = async (friendId: string) => {
    setActionLoadingId(friendId);
    try {
      await friendsApi.unfriend(friendId);
      setFriends((prev) => prev.filter((f) => f.friendId !== friendId && f.user.id !== friendId));
    } catch {}
    setActionLoadingId(null);
  };

  const handleSendFriendRequest = async (targetUser: FriendUser) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setActionLoadingId(targetUser.id);
    try {
      await friendsApi.sendFriendRequest(targetUser.id);
      setSentRequestIds((prev) => ({ ...prev, [targetUser.id]: true }));
    } catch {}
    setActionLoadingId(null);
  };

  const handleMessage = (targetUser: FriendUser) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push({
      pathname: '/messages',
      params: { userId: targetUser.id, username: targetUser.username },
    } as any);
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-[#18191a]"
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme === 'dark' ? '#ffffff' : '#4f46e5'}
        />
      }>
      {/* Index 0: Sticky Tab Switcher (No Header) */}
      <View className="w-full bg-white dark:bg-[#18191a] z-20 border-b border-[#f0f2f5] dark:border-[#242526] px-3 py-2">
        <View className="w-full max-w-[768px] mx-auto flex-row rounded-xl bg-[#f0f2f5] dark:bg-[#242526] p-1">
          {[
            { key: 'all', bn: 'আমার ফ্রেন্ডস', en: 'My Friends' },
            { key: 'requests', bn: 'রিকোয়েস্ট', en: 'Requests' },
            { key: 'suggestions', bn: 'নতুন খুঁজুন', en: 'Discover' },
          ].map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key as any)}
                className={`flex-1 py-2 items-center rounded-lg ${
                  isSelected
                    ? 'bg-indigo-600 shadow-xs'
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

        {/* Content Section (Flat) */}
        {activeTab === 'all' && !isAuthenticated ? (
          <View className="py-4">
            <AuthPromptCard
              icon="group"
              iconBgColor="bg-indigo-50 dark:bg-indigo-950/60"
              iconColor="#4f46e5"
              titleBn="ফ্রেন্ড তালিকা দেখতে লগইন করুন"
              titleEn="Sign in to connect with Friends"
              descriptionBn="আপনার ফ্রেন্ডদের তালিকা এবং সাম্প্রতিক কার্যক্রম দেখতে অ্যাকাউন্টে প্রবেশ করুন।"
              descriptionEn="Log in to your account to view your friends list, manage friend requests, and find companions."
            />
          </View>
        ) : activeTab === 'requests' && !isAuthenticated ? (
          <View className="py-4">
            <AuthPromptCard
              icon="inbox"
              iconBgColor="bg-amber-50 dark:bg-amber-950/60"
              iconColor="#d97706"
              titleBn="ফ্রেন্ড রিকোয়েস্ট দেখতে লগইন করুন"
              titleEn="Sign in to view Friend Requests"
              descriptionBn="আপনাকে পাঠানো ফ্রেন্ড রিকোয়েস্ট দেখতে ও গ্রহণ করতে অ্যাকাউন্টে প্রবেশ করুন।"
              descriptionEn="Log in to view, accept, or decline friend requests sent to you."
            />
          </View>
        ) : isLoading && !isRefreshing ? (
          <FriendsSkeleton tab={activeTab} count={6} />
        ) : activeTab === 'all' ? (
          /* 1. Friends List (Flat) */
          <View className="w-full">
            {friends.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center my-4">
                <AppIcon android="group" size={24} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
                  {locale === 'bn'
                    ? 'আপনার ফ্রেন্ড তালিকায় এখনো কেউ যুক্ত নেই। নতুন ফ্রেন্ড খুঁজতে "নতুন খুঁজুন" ট্যাবে যান।'
                    : 'No friends in your list yet. Check the "Discover" tab to add friends.'}
                </Text>
              </View>
            ) : (
              friends.map((item, index) => {
                const u = item.user;
                const isWorking = actionLoadingId === (item.friendId || u.id);
                const isLast = index === friends.length - 1;
                return (
                  <View
                    key={item.id || u.id}
                    className={`py-3 flex-row items-center justify-between ${
                      !isLast ? 'border-b border-[#f0f2f5] dark:border-[#242526]' : ''
                    }`}>
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-11 w-11 rounded-full bg-indigo-500 items-center justify-center shrink-0">
                        <Text className="text-white text-base font-bold">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                          {u.name}
                        </Text>
                        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] truncate">
                          @{u.username} {u.location ? `• ${u.location}` : ''}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      <Pressable
                        onPress={() => handleMessage(u)}
                        className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 active:opacity-80">
                        <AppIcon android="chat_bubble" size={16} color="#1877f2" />
                      </Pressable>

                      <Pressable
                        onPress={() => handleUnfriend(item.friendId || u.id)}
                        disabled={isWorking}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40">
                        {isWorking ? (
                          <ActivityIndicator size="small" color="#e11d48" />
                        ) : (
                          <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {locale === 'bn' ? 'আনফ্রেন্ড' : 'Unfriend'}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : activeTab === 'requests' ? (
          /* 2. Friend Requests List (Flat) */
          <View className="w-full">
            {requests.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center my-4">
                <AppIcon android="inbox" size={24} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                  {locale === 'bn'
                    ? 'কোনো নতুন ফ্রেন্ড রিকোয়েস্ট নেই।'
                    : 'No pending friend requests.'}
                </Text>
              </View>
            ) : (
              requests.map((item, index) => {
                const u = item.sender || {
                  id: item.id,
                  name: 'Friend Request',
                  username: 'user',
                };
                const isWorking = actionLoadingId === item.id;
                const isLast = index === requests.length - 1;
                return (
                  <View
                    key={item.id}
                    className={`py-3 flex-row items-center justify-between ${
                      !isLast ? 'border-b border-[#f0f2f5] dark:border-[#242526]' : ''
                    }`}>
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-11 w-11 rounded-full bg-amber-500 items-center justify-center shrink-0">
                        <Text className="text-white text-base font-bold">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                          {u.name}
                        </Text>
                        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] truncate">
                          @{u.username}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      <Pressable
                        onPress={() => handleAcceptRequest(item)}
                        disabled={isWorking}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-500 active:bg-primary-600">
                        {isWorking ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text className="text-xs font-bold text-white">
                            {locale === 'bn' ? 'গ্রহণ করুন' : 'Confirm'}
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => handleRejectRequest(item)}
                        disabled={isWorking}
                        className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-[#ced0d4] dark:border-[#4a4b4d]">
                        <Text className="text-xs font-bold text-[#65676b] dark:text-[#b0b3b8]">
                          {locale === 'bn' ? 'মুছুন' : 'Delete'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* 3. Discover Users (Flat) */
          <View className="w-full">
            {suggestions.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center my-4">
                <AppIcon android="person_search" size={24} color="#65676b" />
                <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
                  {locale === 'bn'
                    ? 'কোনো ইউজার পাওয়া যায়নি। অন্য নাম লিখে অনুসন্ধান করুন।'
                    : 'No users found matching your search.'}
                </Text>
              </View>
            ) : (
              suggestions.map((u, index) => {
                const isSent = Boolean(sentRequestIds[u.id]);
                const isWorking = actionLoadingId === u.id;
                const isLast = index === suggestions.length - 1;
                return (
                  <View
                    key={u.id}
                    className={`py-3 flex-row items-center justify-between ${
                      !isLast ? 'border-b border-[#f0f2f5] dark:border-[#242526]' : ''
                    }`}>
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-11 w-11 rounded-full bg-indigo-500 items-center justify-center shrink-0">
                        <Text className="text-white text-base font-bold">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                          {u.name}
                        </Text>
                        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] truncate">
                          @{u.username} {u.location ? `• ${u.location}` : ''}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => (!isSent ? handleSendFriendRequest(u) : null)}
                      disabled={isSent || isWorking}
                      className={`px-3.5 py-1.5 rounded-xl border ${
                        isSent
                          ? 'border-[#ced0d4] dark:border-[#3e4042] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                          : 'border-indigo-600 bg-indigo-600 active:bg-indigo-700'
                      }`}>
                      {isWorking ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text
                          className={`text-xs font-bold ${
                            isSent
                              ? 'text-[#65676b] dark:text-[#b0b3b8]'
                              : 'text-white'
                          }`}>
                          {isSent
                            ? locale === 'bn'
                              ? 'রিকোয়েস্ট পাঠানো হয়েছে'
                              : 'Requested'
                            : locale === 'bn'
                              ? 'ফ্রেন্ড রিকোয়েস্ট'
                              : 'Add Friend'}
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
