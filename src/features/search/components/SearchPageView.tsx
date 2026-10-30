import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon, AndroidSymbol } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import {
  GlobalSearchResult,
  SearchDuaItem,
  SearchGroupItem,
  SearchHistoryItem,
  SearchScope,
  SearchUserItem,
} from '../types/search.types';
import {
  searchApi,
  getLocalSearchHistory,
  subscribeToSearchHistory,
} from '../api/search.api';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import { SearchSkeleton } from './SearchSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';

const TABS: {
  id: SearchScope;
  labelEn: string;
  labelBn: string;
  icon: AndroidSymbol;
}[] = [
  { id: 'ALL', labelEn: 'All', labelBn: 'সব', icon: 'search' },
  { id: 'USERS', labelEn: 'People', labelBn: 'মানুষ', icon: 'person' },
  { id: 'DUAS', labelEn: 'Duas', labelBn: 'দোয়া', icon: 'menu_book' },
  { id: 'GROUPS', labelEn: 'Groups', labelBn: 'গ্রুপ', icon: 'groups' },
  { id: 'POSTS', labelEn: 'Posts', labelBn: 'পোস্ট', icon: 'article' },
];

export function SearchPageView() {
  const { locale, theme, chatSearchQuery, setChatSearchQuery, setSearchOpen } =
    useUi();
  const { isAuthenticated } = useAuth();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<SearchScope>('ALL');
  const [history, setHistoryState] = useState<SearchHistoryItem[]>(() => {
    const cached = queryCache.get<SearchHistoryItem[]>(CACHE_KEYS.SEARCH_HISTORY);
    if (cached && cached.length > 0) return cached;
    return getLocalSearchHistory();
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(() => {
    const cached = queryCache.get<SearchHistoryItem[]>(CACHE_KEYS.SEARCH_HISTORY);
    if (cached && cached.length > 0) return false;
    const local = getLocalSearchHistory();
    if (local.length > 0) return false;
    return isAuthenticated;
  });
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'pending' | 'success' | 'empty' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setHistory = useCallback(
    (
      updater:
        | SearchHistoryItem[]
        | ((prev: SearchHistoryItem[]) => SearchHistoryItem[])
    ) => {
      setHistoryState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        queryCache.set(CACHE_KEYS.SEARCH_HISTORY, next);
        return next;
      });
    },
    []
  );

  // Real-time synchronization across all components & storage
  useEffect(() => {
    const unsubscribe = subscribeToSearchHistory((updatedList) => {
      setHistoryState(updatedList);
      setIsHistoryLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load recent search history from API if authenticated
  useEffect(() => {
    let active = true;
    searchApi
      .getSearchHistory(15, isAuthenticated)
      .then((list) => {
        if (active && Array.isArray(list)) {
          setHistory(list);
        }
      })
      .finally(() => {
        if (active) {
          setIsHistoryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, setHistory]);

  // Support pressing Escape to dismiss search on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  // Debounced live global search when query changes
  const trimmedQuery = chatSearchQuery.trim();

  const executeSearch = useCallback(
    async (q: string, tab: SearchScope) => {
      const clean = q.trim();
      if (!clean) {
        setResults(null);
        setStatus('idle');
        setErrorMessage(null);
        return;
      }
      setStatus('pending');
      setErrorMessage(null);
      try {
        const res = await searchApi.searchGlobal({
          q: clean,
          type: tab,
          limit: 25,
        });
        setResults(res);
        if (res.total > 0) {
          setStatus('success');
        } else {
          setStatus('empty');
        }
      } catch {
        setErrorMessage(
          locale === 'bn'
            ? 'সার্চ করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
            : 'Search request failed. Please check your connection.'
        );
        setStatus('error');
      }
    },
    [locale]
  );

  useEffect(() => {
    if (!trimmedQuery) {
      setResults(null);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    setStatus('pending');
    const timer = setTimeout(() => {
      executeSearch(trimmedQuery, activeTab);
    }, 240);

    return () => clearTimeout(timer);
  }, [trimmedQuery, activeTab, executeSearch]);

  const recordHistoryItem = useCallback(
    async (input: {
      query: string;
      entityType?: 'KEYWORD' | 'USER' | 'DUA' | 'GROUP';
      entityId?: string | null;
      entityName?: string | null;
      entityAvatar?: string | null;
      entitySubtext?: string | null;
    }) => {
      const clean = input.query.trim();
      if (!clean) return;

      try {
        await searchApi.addSearchHistory({ ...input, query: clean });
      } catch {}
    },
    []
  );

  const handleDeleteHistoryItem = async (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    await searchApi.deleteSearchHistoryItem(id);
  };

  const handleClearAllHistory = async () => {
    setHistory([]);
    await searchApi.clearSearchHistory();
  };

  const handleSelectHistoryItem = (item: SearchHistoryItem) => {
    recordHistoryItem({
      query: item.query,
      entityType: item.entityType || 'KEYWORD',
      entityId: item.entityId,
      entityName: item.entityName,
      entityAvatar: item.entityAvatar,
      entitySubtext: item.entitySubtext,
    });

    if (item.entityType === 'USER' && item.entityId) {
      setSearchOpen(false);
      setChatSearchQuery('');
      router.push({
        pathname: '/messages',
        params: {
          userId: item.entityId,
          username: (item.entitySubtext || '').replace('@', ''),
        },
      });
      return;
    }

    if (item.entityType === 'DUA') {
      setSearchOpen(false);
      setChatSearchQuery('');
      router.push('/saved');
      return;
    }

    if (item.entityType === 'GROUP') {
      setSearchOpen(false);
      setChatSearchQuery('');
      router.push('/explore');
      return;
    }

    setChatSearchQuery(item.query);
  };

  const handleSelectUser = (user: SearchUserItem) => {
    recordHistoryItem({
      query: user.name,
      entityType: 'USER',
      entityId: user.id,
      entityName: user.name,
      entityAvatar: user.avatarUrl,
      entitySubtext: `@${user.username}`,
    });
    setSearchOpen(false);
    setChatSearchQuery('');
    router.push({
      pathname: '/messages',
      params: { userId: user.id, username: user.username },
    });
  };

  const handleSelectDua = (dua: SearchDuaItem) => {
    recordHistoryItem({
      query: dua.title,
      entityType: 'DUA',
      entityId: dua.id,
      entityName: dua.title,
      entitySubtext: dua.category?.name || 'Dua',
    });
    setSearchOpen(false);
    setChatSearchQuery('');
    router.push('/saved');
  };

  const handleSelectGroup = (group: SearchGroupItem) => {
    recordHistoryItem({
      query: group.name,
      entityType: 'GROUP',
      entityId: group.slug || group.id,
      entityName: group.name,
      entityAvatar: group.avatarUrl,
      entitySubtext: `${group._count?.members || 0} members`,
    });
    setSearchOpen(false);
    setChatSearchQuery('');
    router.push('/explore');
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      className="flex-1 bg-white dark:bg-[#242526] no-scrollbar scrollbar-none"
      contentContainerClassName="py-3 px-3 sm:px-6 pb-24"
    >
      <View className="w-full max-w-[720px] mx-auto gap-3.5">
        {/* Category Filter Tabs (Shown when typing or exploring) */}
        {trimmedQuery.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-xl p-1 no-scrollbar scrollbar-none select-none"
            contentContainerClassName="flex-row items-center gap-1.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-lg select-none ${
                    isActive
                      ? 'bg-primary-500 shadow-xs'
                      : 'bg-transparent hover:bg-white/60 dark:hover:bg-[#242526]'
                  }`}
                >
                  <AppIcon
                    android={tab.icon}
                    size={15}
                    color={
                      isActive ? '#ffffff' : isDark ? '#b0b3b8' : '#65676b'
                    }
                  />
                  <Text
                    selectable={false}
                    className={`text-xs font-bold select-none ${
                      isActive
                        ? 'text-white'
                        : 'text-[#65676b] dark:text-[#b0b3b8]'
                    }`}
                  >
                    {locale === 'bn' ? tab.labelBn : tab.labelEn}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* STATE 1: Empty Query -> Dedicated Full-Page Recent Searches */}
        {trimmedQuery.length === 0 ? (
          <View className="w-full select-none">
            <View className="flex-row items-center justify-between border-b border-[#e4e6eb] dark:border-[#393a3b] pb-3 mb-2 px-1 select-none">
              <View className="flex-row items-center gap-2 select-none">
                <AppIcon
                  android="schedule"
                  ios="clock"
                  size={17}
                  color={isDark ? '#b0b3b8' : '#65676b'}
                />
                <Text
                  selectable={false}
                  className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
                  {locale === 'bn' ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent Searches'}
                </Text>
              </View>
              {history.length > 0 ? (
                <Pressable
                  onPress={handleClearAllHistory}
                  hitSlop={8}
                  className="px-2.5 py-1 rounded-md active:opacity-75 select-none"
                >
                  <Text
                    selectable={false}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 select-none">
                    {locale === 'bn' ? 'সব মুছুন' : 'Clear all'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {isHistoryLoading ? (
              <View className="gap-2.5 py-3 px-1 select-none">
                {[1, 2, 3].map((i) => (
                  <View key={i} className="flex-row items-center gap-3 py-1.5 select-none">
                    <View className="h-9 w-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c]" />
                    <View className="flex-1 gap-1.5">
                      <View className="h-3.5 w-1/2 rounded bg-[#e4e6eb] dark:bg-[#3a3b3c]" />
                      <View className="h-2.5 w-1/3 rounded bg-[#e4e6eb] dark:bg-[#3a3b3c]" />
                    </View>
                  </View>
                ))}
              </View>
            ) : history.length === 0 ? (
              <EmptyState
                iconAndroid="schedule"
                iconIos="clock"
                title={
                  locale === 'bn'
                    ? 'সাম্প্রতিক কোনো অনুসন্ধান নেই'
                    : 'No recent searches'
                }
                description={
                  locale === 'bn'
                    ? 'মানুষ, দোয়া, গ্রুপ বা পোস্ট খুঁজলে সেগুলো এখানে দেখতে পাবেন।'
                    : 'Search for people, duas, or groups to see them here.'
                }
                className="py-14 select-none"
              />
            ) : (
              <View className="divide-y divide-[#e4e6eb]/60 dark:divide-[#393a3b]/60 select-none">
                {history.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectHistoryItem(item)}
                    className="flex-row items-center justify-between gap-3 py-2.5 px-2 rounded-xl hover:bg-[#f0f2f5] active:bg-[#e4e6eb] dark:hover:bg-[#3a3b3c] dark:active:bg-[#4e4f50] select-none"
                  >
                    <View className="flex-row items-center gap-3 min-w-0 flex-1 select-none">
                      {item.entityType === 'USER' ? (
                        <UserAvatar
                          avatarUrl={item.entityAvatar}
                          name={item.entityName || item.query}
                          size="sm"
                        />
                      ) : item.entityType === 'DUA' ? (
                        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 select-none">
                          <AppIcon
                            android="menu_book"
                            size={18}
                            color="#059669"
                          />
                        </View>
                      ) : item.entityType === 'GROUP' ? (
                        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50 select-none">
                          <AppIcon android="groups" size={18} color="#2563eb" />
                        </View>
                      ) : (
                        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] select-none">
                          <AppIcon
                            android="schedule"
                            ios="clock"
                            size={18}
                            color={isDark ? '#b0b3b8' : '#65676b'}
                          />
                        </View>
                      )}

                      <View className="min-w-0 flex-1 select-none">
                        <Text
                          selectable={false}
                          numberOfLines={1}
                          className="text-sm font-semibold text-[#050505] dark:text-[#e4e6eb] select-none"
                        >
                          {item.entityName || item.query}
                        </Text>
                        {item.entitySubtext ? (
                          <Text
                            selectable={false}
                            numberOfLines={1}
                            className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none"
                          >
                            {item.entitySubtext}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDeleteHistoryItem(item.id);
                      }}
                      hitSlop={8}
                      className="h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50] active:scale-95 select-none"
                    >
                      <AppIcon
                        android="close"
                        ios="xmark"
                        size={14}
                        color={isDark ? '#b0b3b8' : '#65676b'}
                      />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* STATE 2: User is typing -> Full Page Categorized Search Results */
          <View className="gap-3.5 select-none">
            {/* Quick Search Keyword Row */}
            <Pressable
              onPress={() => {
                recordHistoryItem({
                  query: trimmedQuery,
                  entityType: 'KEYWORD',
                });
                executeSearch(trimmedQuery, activeTab);
              }}
              className="flex-row items-center gap-3 rounded-xl bg-white dark:bg-[#242526] p-3 border border-[#e4e6eb] dark:border-[#393a3b] active:opacity-85 select-none"
            >
              <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 select-none">
                <AppIcon android="search" size={18} color="#ffffff" />
              </View>
              <View className="min-w-0 flex-1 select-none">
                <Text
                  selectable={false}
                  numberOfLines={1}
                  className="text-sm text-[#050505] dark:text-[#e4e6eb] select-none"
                >
                  {locale === 'bn' ? 'অনুসন্ধান করুন ' : 'Search for '}
                  <Text className="font-bold text-primary-600 dark:text-primary-400 select-none">
                    &quot;{trimmedQuery}&quot;
                  </Text>
                </Text>
                <Text
                  selectable={false}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
                  {locale === 'bn'
                    ? 'সকল মানুষ, দোয়া, গ্রুপ এবং পোস্ট খুঁজুন'
                    : 'Search all posts, people, duas, and groups'}
                </Text>
              </View>
              <AppIcon
                android="chevron_right"
                size={18}
                color={isDark ? '#b0b3b8' : '#65676b'}
              />
            </Pressable>

            {status === 'pending' ? (
              /* Loading Skeleton Cards */
              <SearchSkeleton tab={activeTab} />
            ) : status === 'error' ? (
              /* Error State with Retry */
              <View className="rounded-xl bg-white dark:bg-[#242526] p-6 border border-[#e4e6eb] dark:border-[#393a3b] items-center gap-3">
                <AppIcon
                  android="error_outline"
                  ios="exclamationmark.triangle"
                  size={36}
                  color="#ef4444"
                />
                <Text className="text-sm font-semibold text-rose-600 dark:text-rose-400 text-center">
                  {errorMessage ||
                    (locale === 'bn'
                      ? 'সার্চ করতে সমস্যা হয়েছে।'
                      : 'Search request failed.')}
                </Text>
                <Pressable
                  onPress={() => executeSearch(trimmedQuery, activeTab)}
                  className="rounded-xl bg-primary-500 px-4 py-2 mt-1 active:opacity-90"
                >
                  <Text className="text-xs font-bold text-white">
                    {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                  </Text>
                </Pressable>
              </View>
            ) : status === 'empty' || !results || results.total === 0 ? (
              /* No Results Empty State */
              <View className="rounded-xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b]">
                <EmptyState
                  iconAndroid="search"
                  iconIos="magnifyingglass"
                  title={
                    locale === 'bn'
                      ? `"${trimmedQuery}"-এর জন্য কোনো ফলাফল পাওয়া যায়নি`
                      : `We didn't find any results for "${trimmedQuery}"`
                  }
                  description={
                    locale === 'bn'
                      ? 'বানান সঠিক আছে কি না যাচাই করুন অথবা অন্য কোনো শব্দ দিয়ে মানুষ, দোয়া বা গ্রুপ খুঁজুন।'
                      : 'Make sure all words are spelled correctly or try different keywords for people, duas, or groups.'
                  }
                  className="py-10"
                />
              </View>
            ) : results ? (
              <View className="gap-3.5">
                {/* 1. PEOPLE */}
                {(activeTab === 'ALL' || activeTab === 'USERS') &&
                results.users.length > 0 ? (
                  <View className="rounded-xl bg-white dark:bg-[#242526] p-4 border border-[#e4e6eb] dark:border-[#393a3b] gap-2 select-none">
                    <View className="flex-row items-center justify-between border-b border-[#e4e6eb] dark:border-[#393a3b] pb-2 select-none">
                      <View className="flex-row items-center gap-1.5 select-none">
                        <AppIcon android="person" size={16} color="#1877f2" />
                        <Text
                          selectable={false}
                          className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
                          {locale === 'bn' ? 'মানুষ' : 'People'} (
                          {results.users.length})
                        </Text>
                      </View>
                    </View>

                    <View className="divide-y divide-[#e4e6eb] dark:divide-[#393a3b] select-none">
                      {results.users.map((u) => (
                        <Pressable
                          key={u.id}
                          onPress={() => handleSelectUser(u)}
                          className="flex-row items-center justify-between py-2.5 gap-3 select-none"
                        >
                          <View className="flex-row items-center gap-3 min-w-0 flex-1 select-none">
                            <UserAvatar
                              avatarUrl={u.avatarUrl}
                              name={u.name}
                              size="md"
                            />
                            <View className="min-w-0 flex-1 select-none">
                              <Text
                                selectable={false}
                                numberOfLines={1}
                                className="font-bold text-sm text-[#050505] dark:text-[#e4e6eb] select-none"
                              >
                                {u.name}
                              </Text>
                              <Text
                                selectable={false}
                                numberOfLines={1}
                                className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none"
                              >
                                @{u.username}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => handleSelectUser(u)}
                            className="rounded-lg bg-primary-50 dark:bg-primary-950/40 px-3 py-1.5 select-none"
                          >
                            <Text
                              selectable={false}
                              className="text-xs font-bold text-primary-600 dark:text-primary-400 select-none">
                              {locale === 'bn' ? 'মেসেজ' : 'Message'}
                            </Text>
                          </Pressable>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* 2. DUAS & SUPPLICATIONS */}
                {(activeTab === 'ALL' || activeTab === 'DUAS') &&
                results.duas.length > 0 ? (
                  <View className="rounded-xl bg-white dark:bg-[#242526] p-4 border border-[#e4e6eb] dark:border-[#393a3b] gap-2">
                    <View className="flex-row items-center justify-between border-b border-[#e4e6eb] dark:border-[#393a3b] pb-2 select-none">
                      <View className="flex-row items-center gap-1.5 select-none">
                        <AppIcon
                          android="menu_book"
                          size={16}
                          color="#10b981"
                        />
                        <Text
                          selectable={false}
                          className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
                          {locale === 'bn'
                            ? 'দোয়া ও যিকির'
                            : 'Duas & Supplications'}{' '}
                          ({results.duas.length})
                        </Text>
                      </View>
                    </View>

                    <View className="divide-y divide-[#e4e6eb] dark:divide-[#393a3b]">
                      {results.duas.map((dua) => (
                        <Pressable
                          key={dua.id}
                          onPress={() => handleSelectDua(dua)}
                          className="py-3 gap-1.5"
                        >
                          <View className="flex-row items-start justify-between gap-2">
                            <View className="flex-1 gap-1">
                              <Text
                                selectable={true}
                                className="font-bold text-sm text-[#050505] dark:text-[#e4e6eb] select-text">
                                {dua.title}
                              </Text>
                              {dua.category ? (
                                <View className="self-start rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 select-none">
                                  <Text
                                    selectable={false}
                                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 select-none">
                                    {dua.category.name}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <View className="rounded-lg bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3 py-1.5 shrink-0 select-none">
                              <Text
                                selectable={false}
                                className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
                                {locale === 'bn' ? 'দোয়া পড়ুন' : 'Read Dua'}
                              </Text>
                            </View>
                          </View>

                          {dua.arabicText ? (
                            <Text
                              selectable={true}
                              className="text-base text-right text-[#050505] dark:text-[#e4e6eb] leading-relaxed pt-1 select-text">
                              {dua.arabicText}
                            </Text>
                          ) : null}

                          {dua.meaningBangla ? (
                            <Text
                              selectable={true}
                              numberOfLines={2}
                              className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-text"
                            >
                              {dua.meaningBangla}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* 3. GROUPS */}
                {(activeTab === 'ALL' || activeTab === 'GROUPS') &&
                results.groups.length > 0 ? (
                  <View className="rounded-xl bg-white dark:bg-[#242526] p-4 border border-[#e4e6eb] dark:border-[#393a3b] gap-2 select-none">
                    <View className="flex-row items-center justify-between border-b border-[#e4e6eb] dark:border-[#393a3b] pb-2 select-none">
                      <View className="flex-row items-center gap-1.5 select-none">
                        <AppIcon android="groups" size={16} color="#3b82f6" />
                        <Text
                          selectable={false}
                          className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] select-none">
                          {locale === 'bn' ? 'গ্রুপসমূহ' : 'Groups'} (
                          {results.groups.length})
                        </Text>
                      </View>
                    </View>

                    <View className="divide-y divide-[#e4e6eb] dark:divide-[#393a3b] select-none">
                      {results.groups.map((group) => (
                        <Pressable
                          key={group.id}
                          onPress={() => handleSelectGroup(group)}
                          className="flex-row items-center justify-between py-2.5 gap-3 select-none"
                        >
                          <View className="flex-row items-center gap-3 min-w-0 flex-1 select-none">
                            <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50 select-none">
                              <AppIcon
                                android="groups"
                                size={20}
                                color="#2563eb"
                              />
                            </View>
                            <View className="min-w-0 flex-1 select-none">
                              <Text
                                selectable={false}
                                numberOfLines={1}
                                className="font-bold text-sm text-[#050505] dark:text-[#e4e6eb] select-none"
                              >
                                {group.name}
                              </Text>
                              <Text
                                selectable={false}
                                className="text-xs text-[#65676b] dark:text-[#b0b3b8] select-none">
                                {group._count?.members || 0} members •{' '}
                                {group.visibility.toLowerCase()}
                              </Text>
                            </View>
                          </View>

                          <View className="rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 select-none">
                            <Text
                              selectable={false}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 select-none">
                              {locale === 'bn' ? 'গ্রুপ দেখুন' : 'View Group'}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* 4. POSTS */}
                {(activeTab === 'ALL' || activeTab === 'POSTS') &&
                results.posts.length > 0 ? (
                  <View className="gap-2.5">
                    <View className="rounded-xl bg-white dark:bg-[#242526] px-4 py-3 border border-[#e4e6eb] dark:border-[#393a3b] flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <AppIcon android="article" size={16} color="#a855f7" />
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                          {locale === 'bn' ? 'পোস্টসমূহ' : 'Posts'} (
                          {results.posts.length})
                        </Text>
                      </View>
                    </View>

                    <View className="rounded-2xl overflow-hidden border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526]">
                      {results.posts.map((post, index) => (
                        <React.Fragment key={post.id}>
                          {index > 0 && (
                            <View className="h-2 w-full bg-[#f0f2f5] dark:bg-[#18191a] border-y border-[#e4e6eb] dark:border-[#393a3b]" />
                          )}
                          <FeedPostCard post={post} defaultShowArabic={true} />
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
