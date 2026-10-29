import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { bookmarkApi } from '@/features/bookmark/api/bookmark.api';
import { CACHE_KEYS, queryCache } from '@/lib/cache/queryCache';
import {
  SavedFeedItem,
  TimeSlot,
  TIME_SLOTS,
  getCurrentTimeSlot,
} from '@/types/saved.types';
import {
  TimeSlotBadge,
  TimeSlotPicker,
} from '@/features/bookmark/components/TimeSlotPicker';
import { TasbihModal } from '@/features/bookmark/components/TasbihWidget';
import { AppIcon } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';

interface SavedContentCardProps {
  item: SavedFeedItem;
  onUpdateSlot: (
    id: string,
    type: 'DUA' | 'POST',
    slot: TimeSlot | null
  ) => void;
  onRemove: (id: string, type: 'DUA' | 'POST') => void;
  fallbackSlot?: TimeSlot | 'all';
}

function SavedContentCard({
  item,
  onUpdateSlot,
  onRemove,
  fallbackSlot,
}: SavedContentCardProps) {
  const { locale, theme } = useUi();
  const [isCopied, setIsCopied] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dua = item.dua;
  const title =
    dua?.title ||
    (item.content && item.content.startsWith('🌙')
      ? item.content.replace(/^🌙\s*/, '')
      : undefined);
  const meaning =
    dua?.meaningBangla ||
    dua?.meaning ||
    (item.content && !item.content.startsWith('🌙') ? item.content : null);
  const arabicText = dua?.arabicText;
  const transliteration = dua?.transliteration;
  const itemType: 'DUA' | 'POST' = item.savedType === 'DUA' ? 'DUA' : 'POST';

  const handleCopy = () => {
    const parts: string[] = [];
    if (title) parts.push(`🌙 ${title}`);
    if (arabicText) parts.push(arabicText);
    if (transliteration) parts.push(`উচ্চারণ: ${transliteration}`);
    if (meaning) parts.push(`অর্থ: ${meaning}`);

    const text = parts.join('\n\n');
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard
    ) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <View className="w-full bg-white dark:bg-[#242526]">
      {/* 1. Header with Routine Slot & Action Buttons matching SavedContentCard.tsx */}
      <View className="flex-row items-center justify-between px-3 pt-2.5 pb-2 border-b border-[#e4e6eb]/80 dark:border-[#393a3b]/80 gap-2">
        <View className="flex-row items-center gap-2 flex-wrap flex-1">
          <TimeSlotBadge
            timeSlot={
              item.timeSlot ||
              item.viewer?.timeSlot ||
              (fallbackSlot && fallbackSlot !== 'all' ? fallbackSlot : null)
            }
            onPress={() => setIsPickerOpen(true)}
            size="md"
            fallbackLabel={
              locale === 'bn' ? 'নিত্যদিনের রুটিন' : 'Daily Routine'
            }
          />
        </View>

        {/* Action Buttons: Copy, Change Slot, Delete, Tasbih */}
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={handleCopy}
            className="p-1.5 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
            <AppIcon
              android={isCopied ? 'check' : 'content_copy'}
              ios={isCopied ? 'checkmark' : 'doc.on.doc'}
              size={16}
              color={
                isCopied
                  ? '#059669'
                  : theme === 'dark'
                    ? '#b0b3b8'
                    : '#65676b'
              }
            />
          </Pressable>

          <Pressable
            onPress={() => setIsPickerOpen(true)}
            className="p-1.5 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
            <AppIcon
              android="schedule"
              ios="clock"
              size={16}
              color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
            />
          </Pressable>

          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-xl active:bg-rose-50 dark:active:bg-rose-950/40">
            <AppIcon
              android="delete"
              ios="trash"
              size={16}
              color="#f43f5e"
            />
          </Pressable>

          {/* Top-most Right: Tasbih with Icon Blue Badge */}
          <Pressable
            onPress={() => setIsTasbihOpen(true)}
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 ml-1">
            <Text className="text-xs">📿</Text>
            <Text className="text-xs font-bold text-blue-600 dark:text-blue-300">
              {locale === 'bn' ? 'তাসবীহ' : 'Tasbih'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Dua / Post Content Body */}
      <View className="px-3 pt-2.5 pb-3.5 gap-3">
        {title && (
          <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] leading-snug">
            🌙 {title}
          </Text>
        )}

        {/* Main Dua (Arabic Text) */}
        {arabicText && (
          <View className="gap-1">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {locale === 'bn' ? 'মূল দোয়া:' : 'Main Dua:'}
            </Text>
            <Text className="text-xl text-right text-[#050505] dark:text-primary-200 leading-9">
              {arabicText}
            </Text>
          </View>
        )}

        {/* Transliteration (উচ্চারণ) */}
        {transliteration && (
          <View className="gap-1">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Pronunciation:
            </Text>
            <Text className="text-sm font-medium text-[#050505] dark:text-[#e4e6eb] leading-6">
              {transliteration}
            </Text>
          </View>
        )}

        {/* Meaning (অর্থ) */}
        {meaning && (
          <View className="gap-1">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {dua ? 'Meaning:' : 'Post:'}
            </Text>
            <Text className="text-sm font-medium text-[#050505] dark:text-[#e4e6eb] leading-6">
              {meaning}
            </Text>
          </View>
        )}

        {/* Fadilah or References */}
        {dua?.fadilah && (
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] pt-0.5 leading-5">
            <Text className="font-semibold text-[#050505] dark:text-[#e4e6eb]">
              Benefit:{' '}
            </Text>
            {dua.fadilah}
          </Text>
        )}

        {dua?.references && dua.references.length > 0 && (
          <View className="flex-row items-center gap-1.5 pt-0.5">
            <AppIcon
              android="menu_book"
              ios="book"
              size={14}
              color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
            />
            <Text className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
              {dua.references
                .map((r) => r.reference || r.source?.name)
                .join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Routine Time Slot Picker Modal */}
      <TimeSlotPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedSlot={item.timeSlot || item.viewer?.timeSlot}
        onSelectSlot={(slot) => {
          onUpdateSlot(item.id, itemType, slot);
          setIsPickerOpen(false);
        }}
        onRemove={() => {
          setIsPickerOpen(false);
          setShowDeleteConfirm(true);
        }}
        itemTitle={title || meaning?.slice(0, 40) || undefined}
      />

      {/* Digital Tasbih Modal for this Dua */}
      <TasbihModal
        isOpen={isTasbihOpen}
        onClose={() => setIsTasbihOpen(false)}
        duaTitle={title}
        arabicText={arabicText || undefined}
        transliteration={transliteration || undefined}
      />

      {/* Reusable Delete / Remove from Saved Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onRemove(item.id, itemType)}
        title={
          locale === 'bn'
            ? 'সংরক্ষণ তালিকা থেকে মুছবেন?'
            : 'Remove from Saved?'
        }
        subtitle={
          locale === 'bn'
            ? 'এটি আপনার সংরক্ষিত তালিকা থেকে সরানো হবে।'
            : 'This item will be removed from your saved list.'
        }
        description={
          locale === 'bn'
            ? 'আপনি কি নিশ্চিত যে এই দোয়া বা পোস্টটি সংরক্ষণ তালিকা থেকে বাদ দিতে চান?'
            : 'Are you sure you want to remove this item from your saved bookmarks?'
        }
        confirmText={locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Remove'}
      />
    </View>
  );
}

export default function SavedScreen() {
  const { locale } = useUi();
  const { isAuthenticated } = useAuth();
  const {
    items: feedItems,
    toggleSave,
    updatePostTimeSlot,
    refreshFeed,
  } = useFeed();
  const params = useLocalSearchParams<{ slot?: string }>();

  const currentRoutineSlot = getCurrentTimeSlot();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | 'all'>(() => {
    const paramSlot = params?.slot as TimeSlot | 'all' | undefined;
    return paramSlot || currentRoutineSlot;
  });

  useEffect(() => {
    if (params?.slot) {
      setSelectedSlot(params.slot as TimeSlot | 'all');
    }
  }, [params?.slot]);

  const [allSavedItems, setAllSavedItemsState] = useState<SavedFeedItem[]>(
    () => queryCache.get<SavedFeedItem[]>(CACHE_KEYS.SAVED_ITEMS) || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !queryCache.has(CACHE_KEYS.SAVED_ITEMS)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGlobalTasbihOpen, setIsGlobalTasbihOpen] = useState(false);

  const setAllSavedItems = useCallback(
    (
      updater:
        | SavedFeedItem[]
        | ((prev: SavedFeedItem[]) => SavedFeedItem[])
    ) => {
      setAllSavedItemsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        queryCache.set(CACHE_KEYS.SAVED_ITEMS, next);
        return next;
      });
    },
    []
  );

  const fetchSaved = useCallback(
    async (silent = false) => {
      if (!isAuthenticated) {
        setAllSavedItemsState([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!silent && !queryCache.has(CACHE_KEYS.SAVED_ITEMS)) {
        setIsLoading(true);
      }
      try {
        const res = await bookmarkApi.getSavedItems({
          timeSlot: 'all',
          type: 'ALL',
          limit: 50,
        });
        const list = ((res as any)?.data ?? res) as SavedFeedItem[];
        if (Array.isArray(list)) {
          setAllSavedItems(list);
        }
      } catch {
        // Fallback to feed items marked as saved if needed
        const fallbackFromFeed = feedItems
          .filter((i) => i.viewer?.hasSaved)
          .map((i) => ({
            ...i,
            savedType: 'POST' as const,
            timeSlot: i.viewer?.timeSlot || null,
          }));
        setAllSavedItems(fallbackFromFeed);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, feedItems, setAllSavedItems]
  );

  useEffect(() => {
    fetchSaved(queryCache.has(CACHE_KEYS.SAVED_ITEMS));
  }, [fetchSaved]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchSaved(true), refreshFeed()]);
  };

  const handleUpdateSlot = async (
    id: string,
    type: 'DUA' | 'POST',
    slot: TimeSlot | null
  ) => {
    setAllSavedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              timeSlot: slot,
              viewer: {
                ...item.viewer,
                hasSaved: true,
                timeSlot: slot,
              },
            }
          : item
      )
    );

    if (type === 'POST') {
      await updatePostTimeSlot(id, slot);
    } else {
      try {
        await bookmarkApi.updateTimeSlot({ id, type: 'DUA', timeSlot: slot });
      } catch {}
    }
    await fetchSaved(true);
  };

  const handleRemove = async (id: string, type: 'DUA' | 'POST') => {
    setAllSavedItems((prev) => prev.filter((item) => item.id !== id));
    try {
      if (type === 'DUA') {
        await bookmarkApi.unsaveDua(id);
      } else {
        await toggleSave(id, true);
      }
    } catch {
      await fetchSaved(true);
    }
  };

  const mobileTabs = [
    {
      id: 'all' as const,
      icon: '📌',
      label: locale === 'bn' ? 'সকল' : 'All',
    },
    ...TIME_SLOTS.map((slot) => ({
      id: slot.id,
      icon: slot.icon,
      label: locale === 'bn' ? slot.labelBn : slot.labelEn,
    })),
  ];

  const isRoutineSlot = selectedSlot !== 'all';
  const slotFilteredItems = isRoutineSlot
    ? allSavedItems.filter(
        (item) => (item.timeSlot || item.viewer?.timeSlot) === selectedSlot
      )
    : allSavedItems;

  const isSlotEmpty =
    isRoutineSlot && !isLoading && slotFilteredItems.length === 0;
  const shouldFallbackToAll = isSlotEmpty && allSavedItems.length > 0;
  const displayedItems = shouldFallbackToAll
    ? allSavedItems
    : slotFilteredItems;

  return (
    <View className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1877f2"
          />
        }>
        <View className="w-full max-w-[720px] mx-auto">
          {/* 1. 6-Column Routine Filter Bar matching SavedLayout.tsx */}
          <View className="w-full bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] p-1.5">
            <View className="flex-row gap-1">
              {mobileTabs.map((tab) => {
                const isActive = selectedSlot === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setSelectedSlot(tab.id)}
                    className={`flex-1 items-center justify-center py-1.5 px-0.5 rounded-lg ${
                      isActive ? 'bg-primary-500' : ''
                    }`}>
                    <Text className="text-xs leading-none">{tab.icon}</Text>
                    <Text
                      numberOfLines={1}
                      className={`text-[10px] leading-tight font-semibold mt-0.5 ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-[#65676b] dark:text-[#b0b3b8]'
                      }`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 2. Content Area */}
          {!isAuthenticated ? (
            <View className="mx-3 mt-3 bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center">
              <View className="h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-950/60 items-center justify-center mb-3">
                <AppIcon android="bookmark" size={28} color="#d97706" />
              </View>
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
                {locale === 'bn'
                  ? 'সংরক্ষিত দোয়া ও পোস্ট দেখতে লগইন করুন'
                  : 'Sign in to view Saved Duas & Posts'}
              </Text>
              <Text className="mt-1.5 text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-xs leading-relaxed">
                {locale === 'bn'
                  ? 'আপনার পছন্দের দোয়া ও পোস্টগুলো সকাল-সন্ধ্যার রুটিন অনুযায়ী সেভ করে রাখতে লগইন করুন।'
                  : 'Log in to save your favorite Duas and posts organized by daily prayer routines.'}
              </Text>
              <Pressable
                onPress={() => router.push('/login')}
                className="mt-4 rounded-xl bg-primary-500 px-5 py-2.5">
                <Text className="text-white text-xs font-bold">
                  {locale === 'bn' ? 'লগইন করুন' : 'Log In'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-2.5 gap-2.5">
              {/* Fallback Banner when routine time has no items */}
              {shouldFallbackToAll && (
                <View className="w-full bg-amber-50/90 dark:bg-amber-950/40 border-y border-amber-200/80 dark:border-amber-900/60 p-3 flex-row items-center gap-2.5">
                  <Text className="text-base">✨</Text>
                  <Text className="flex-1 text-xs font-medium text-amber-900 dark:text-amber-200 leading-snug">
                    {locale === 'bn'
                      ? `${TIME_SLOTS.find((s) => s.id === selectedSlot)?.labelBn || 'এই'} রুটিন সময়ে কোনো সংরক্ষিত পোস্ট নেই — আপনার সকল সংরক্ষিত তালিকা দেখানো হচ্ছে।`
                      : `No saved items found for ${TIME_SLOTS.find((s) => s.id === selectedSlot)?.labelEn || 'this'} routine slot — showing all saved items.`}
                  </Text>
                </View>
              )}

              {isLoading ? (
                <View className="py-12 items-center justify-center gap-2 bg-white dark:bg-[#242526] border-y border-[#e4e6eb] dark:border-[#393a3b]">
                  <ActivityIndicator size="large" color="#1877f2" />
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'সংরক্ষিত তালিকা লোড হচ্ছে...'
                      : 'Loading saved items...'}
                  </Text>
                </View>
              ) : displayedItems.length === 0 ? (
                <EmptyState
                  iconAndroid="bookmark"
                  iconSize={28}
                  iconColor="#d97706"
                  iconBgClassName="bg-amber-50 dark:bg-amber-950/60"
                  title={
                    selectedSlot !== 'all'
                      ? locale === 'bn'
                        ? `${TIME_SLOTS.find((s) => s.id === selectedSlot)?.labelBn || ''}র কোনো সংরক্ষিত আইটেম নেই`
                        : `No saved items for ${selectedSlot}`
                      : locale === 'bn'
                        ? 'এখনো কোনো আইটেম সংরক্ষণ করা হয়নি'
                        : 'No saved items yet'
                  }
                  description={
                    selectedSlot !== 'all'
                      ? locale === 'bn'
                        ? 'দোয়া বা পোস্ট সেভ করার সময় এই রুটিনটি নির্বাচন করলে তা এখানে সহজে পড়তে পারবেন।'
                        : 'Save Duas or Posts with this routine slot to organize and read them here.'
                      : locale === 'bn'
                        ? 'ফিড বা দোয়ার পাতা থেকে আপনার পছন্দের দোয়া ও পোস্টগুলো সেভ করে রাখুন।'
                        : 'Save your favorite duas and posts from the feed or dua library to review later.'
                  }
                  className="w-full border-y border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] py-12"
                />
              ) : (
                <View className="w-full bg-white dark:bg-[#242526] border-y border-[#e4e6eb] dark:border-[#393a3b] overflow-hidden">
                  {displayedItems.map((item, index) => (
                    <React.Fragment key={item.savedId || item.id}>
                      {index > 0 && (
                        <View className="h-2 w-full bg-[#f0f2f5] dark:bg-[#18191a] border-y border-[#e4e6eb] dark:border-[#393a3b]" />
                      )}
                      <SavedContentCard
                        item={item}
                        onUpdateSlot={handleUpdateSlot}
                        onRemove={handleRemove}
                        fallbackSlot={selectedSlot}
                      />
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Tasbih Button matching SavedLayout.tsx */}
      <View className="absolute bottom-5 right-4 z-40">
        <Pressable
          onPress={() => setIsGlobalTasbihOpen(true)}
          className="flex-row items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 shadow-xl active:opacity-90">
          <Text className="text-base">📿</Text>
          <Text className="text-xs font-bold text-white">
            {locale === 'bn' ? 'তাসবীহ' : 'Tasbih'}
          </Text>
        </Pressable>
      </View>

      {/* Global Digital Tasbih Modal */}
      <TasbihModal
        isOpen={isGlobalTasbihOpen}
        onClose={() => setIsGlobalTasbihOpen(false)}
      />
    </View>
  );
}
