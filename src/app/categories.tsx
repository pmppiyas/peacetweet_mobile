import React, { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import { AppIcon, type AndroidSymbol } from '@/components/ui/Icon';

interface CategoryItem {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  description?: string;
  descriptionBn?: string;
  duaCount?: number;
  icon?: AndroidSymbol;
  color?: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-daily',
    name: 'Daily Supplications',
    nameBn: 'দৈনন্দিন জীবনের দোয়া',
    slug: 'daily',
    description: 'Essential everyday Duas for sleeping, eating, home, and travel.',
    descriptionBn: 'ঘুমানো, খাওয়া, ঘরে প্রবেশ ও বাহির হওয়া এবং যাত্রার মাসনুন দোয়া।',
    duaCount: 42,
    icon: 'home',
    color: '#3b82f6',
  },
  {
    id: 'cat-morning-evening',
    name: 'Morning & Evening Adhkar',
    nameBn: 'সকাল ও সন্ধ্যার যিকির',
    slug: 'morning-evening',
    description: 'Prophetic morning and evening protection adhkar with virtues.',
    descriptionBn: 'রাসূলুল্লাহ (সাঃ) বর্ণিত সকাল ও সন্ধ্যার হেফাজত ও বরকতের মাসনুন যিকির।',
    duaCount: 36,
    icon: 'schedule',
    color: '#f59e0b',
  },
  {
    id: 'cat-prayer',
    name: 'Prayer & Tahajjud',
    nameBn: 'সালাত ও তাহাজ্জুদ',
    slug: 'prayer',
    description: 'Duas before, during, and after obligatory and night prayers.',
    descriptionBn: 'ফরয ও নফল নামায, কুনুত এবং শেষ রাতের তাহাজ্জুদের ফযিলতপূর্ণ দোয়া।',
    duaCount: 28,
    icon: 'layers',
    color: '#10b981',
  },
  {
    id: 'cat-forgiveness',
    name: 'Forgiveness & Tawbah',
    nameBn: 'ক্ষমা ও তাওবা',
    slug: 'forgiveness',
    description: 'Sayyidul Istighfar and supplications seeking Allah’s mercy.',
    descriptionBn: 'সাইয়্যিদুল ইস্তিগফার ও গুনাহ মাফের জন্য আন্তরিক তাওবার দোয়াসমূহ।',
    duaCount: 24,
    icon: 'favorite',
    color: '#8b5cf6',
  },
  {
    id: 'cat-quranic',
    name: 'Quranic Supplications',
    nameBn: 'কুরআনিক দোয়াসমূহ',
    slug: 'quranic',
    description: 'All profound supplications revealed by Allah in the Noble Quran.',
    descriptionBn: 'পবিত্র কুরআনে বর্ণিত নবী-রাসূলদের দোয়া এবং রাব্বানা দোয়াসমূহ।',
    duaCount: 40,
    icon: 'menu_book',
    color: '#06b6d4',
  },
  {
    id: 'cat-distress',
    name: 'Distress & Anxiety Relief',
    nameBn: 'বিপদ ও দুশ্চিন্তা মুক্তি',
    slug: 'distress',
    description: 'Duas for difficult times, trials, grief, fear, and debt relief.',
    descriptionBn: 'মুসিবত, মানসিক অস্থিরতা, হতাশা ও ঋণমুক্তি লাভের বিশেষ মোনাজাত।',
    duaCount: 19,
    icon: 'warning',
    color: '#ef4444',
  },
  {
    id: 'cat-healing',
    name: 'Health, Healing & Ruqyah',
    nameBn: 'সুস্থতা, শেফা ও রুকইয়াহ',
    slug: 'healing',
    description: 'Authentic prophetic remedies and supplications for physical & spiritual cure.',
    descriptionBn: 'রোগ-ব্যাধি নিরাময়, শেফা এবং বদনজর ও অনিষ্টতা থেকে বাঁচার রুকইয়াহ।',
    duaCount: 18,
    icon: 'water_drop',
    color: '#ec4899',
  },
  {
    id: 'cat-parents-family',
    name: 'Parents & Family',
    nameBn: 'পিতা-মাতা ও পরিবার',
    slug: 'family',
    description: 'Duas for parents, spouse, righteous children, and family harmony.',
    descriptionBn: 'মা-বাবার মাগফিরাত, নেক সন্তান এবং পারিবারিক শান্তি ও ভালোবাসার দোয়া।',
    duaCount: 15,
    icon: 'group',
    color: '#6366f1',
  },
  {
    id: 'cat-ramadan',
    name: 'Ramadan & Fasting',
    nameBn: 'রমযান ও সিয়াম',
    slug: 'ramadan',
    description: 'Iftar, suhoor, Laylatul Qadr, and fasting supplications.',
    descriptionBn: 'ইফতার, সেহরি, তারাবীহ ও লাইলাতুল কদরের ফযিলতপূর্ণ মাসনুন আমল।',
    duaCount: 22,
    icon: 'auto_awesome',
    color: '#14b8a6',
  },
  {
    id: 'cat-hajj-umrah',
    name: 'Hajj & Umrah',
    nameBn: 'হজ্জ ও উমরাহ',
    slug: 'hajj',
    description: 'Complete step-by-step supplications for pilgrims in the Holy Lands.',
    descriptionBn: 'ইহরাম, তাওয়াফ, সাফা-মারওয়া ও আরাফাতের ময়দানের বরকতময় দোয়া।',
    duaCount: 26,
    icon: 'public',
    color: '#d97706',
  },
];

export default function CategoriesScreen() {
  const { locale, theme, setSearchOpen, setChatSearchQuery } = useUi();
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.CATEGORIES.LIST);
      const items = res?.data?.data || res?.data?.items || res?.data;
      if (Array.isArray(items) && items.length > 0) {
        const mapped: CategoryItem[] = items.map((cat: any) => ({
          id: cat.id || cat.slug,
          name: cat.name || cat.title || 'Category',
          nameBn: cat.nameBn || cat.name,
          slug: cat.slug || cat.id,
          description: cat.description || '',
          descriptionBn: cat.descriptionBn || cat.description,
          duaCount: cat._count?.duas ?? cat.duaCount ?? 0,
          icon: 'menu_book',
          color: '#2563eb',
        }));
        setCategories(mapped);
      }
    } catch {
      // Keep default static categories if backend response is empty
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories();
    setIsRefreshing(false);
  };

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.nameBn && cat.nameBn.toLowerCase().includes(q)) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        (cat.descriptionBn && cat.descriptionBn.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const handleSelectCategory = (cat: CategoryItem) => {
    const term = locale === 'bn' ? cat.nameBn || cat.name : cat.name;
    setChatSearchQuery(term);
    setSearchOpen(true);
  };

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme === 'dark' ? '#ffffff' : '#1877f2'}
        />
      }>
      <View className="w-full max-w-[768px] mx-auto space-y-4">
        {/* Header Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs items-center text-center">
          <View className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 items-center justify-center mb-3">
            <AppIcon android="layers" size={28} color="#2563eb" />
          </View>
          <Text className="text-xl font-extrabold text-[#050505] dark:text-[#e4e6eb] text-center mb-1">
            {locale === 'bn' ? 'বিষয়ভিত্তিক দোয়া ও যিকির ক্যাটাগরি' : 'Islamic Dua Categories'}
          </Text>
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-lg leading-relaxed mb-4">
            {locale === 'bn'
              ? 'দৈনন্দিন জীবন, সালাত, সুরক্ষা, ক্ষমা ও আত্মিক শান্তির জন্য সহীহ হাদিস ও কুরআনের আলোয় সংকলিত মাসনুন দোয়াসমূহ।'
              : 'Explore authentic Quranic and Prophetic supplications categorized by everyday situations and spiritual needs.'}
          </Text>

          {/* In-page Category Search Input */}
          <View className="w-full flex-row items-center rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 py-2">
            <AppIcon android="search" size={17} color="#65676b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                locale === 'bn'
                  ? 'ক্যাটাগরি বা বিষয় খুঁজুন...'
                  : 'Search categories...'
              }
              placeholderTextColor="#8a8d91"
              className="flex-1 ml-2 text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] py-0"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon android="close" size={16} color="#65676b" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Categories Grid */}
        <View className="space-y-2.5">
          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="small" color="#1877f2" />
            </View>
          ) : filteredCategories.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center bg-white dark:bg-[#242526]">
              <AppIcon android="info" size={24} color="#65676b" />
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                {locale === 'bn'
                  ? 'কোনো ক্যাটাগরি পাওয়া যায়নি।'
                  : 'No categories matched your search.'}
              </Text>
            </View>
          ) : (
            filteredCategories.map((cat) => {
              const displayName = locale === 'bn' ? cat.nameBn || cat.name : cat.name;
              const displayDesc =
                locale === 'bn' ? cat.descriptionBn || cat.description : cat.description;

              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleSelectCategory(cat)}
                  className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 flex-row items-center justify-between active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]/60">
                  <View className="flex-row items-center gap-3.5 flex-1 pr-3">
                    <View
                      style={{ backgroundColor: `${cat.color || '#3b82f6'}18` }}
                      className="h-11 w-11 rounded-2xl items-center justify-center shrink-0">
                      <AppIcon
                        android={cat.icon || 'layers'}
                        size={22}
                        color={cat.color || '#3b82f6'}
                      />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                          {displayName}
                        </Text>
                        {cat.duaCount ? (
                          <View className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 border border-blue-200/60 dark:border-blue-800/60">
                            <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              {cat.duaCount} {locale === 'bn' ? 'দোয়া' : 'Duas'}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {displayDesc ? (
                        <Text
                          numberOfLines={2}
                          className="text-xs text-[#65676b] dark:text-[#b0b3b8] leading-tight">
                          {displayDesc}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <AppIcon android="chevron_right" size={18} color="#8a8d91" />
                </Pressable>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
