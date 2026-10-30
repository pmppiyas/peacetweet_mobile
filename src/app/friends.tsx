import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

interface FriendUser {
  id: string;
  name: string;
  username: string;
  location?: string;
  mutualCount?: number;
  status: 'friend' | 'pending' | 'none';
}

const SAMPLE_FRIENDS: FriendUser[] = [
  {
    id: 'u-1',
    name: 'মুহাম্মদ আব্দুল্লাহ',
    username: 'abdullah_bd',
    location: 'ঢাকা, বাংলাদেশ',
    mutualCount: 14,
    status: 'friend',
  },
  {
    id: 'u-2',
    name: 'তানভীর হাসান',
    username: 'tanvir_h',
    location: 'চট্টগ্রাম, বাংলাদেশ',
    mutualCount: 8,
    status: 'friend',
  },
  {
    id: 'u-3',
    name: 'আরিফুল ইসলাম',
    username: 'ariful_islam',
    location: 'সিলেট, বাংলাদেশ',
    mutualCount: 5,
    status: 'friend',
  },
  {
    id: 'u-4',
    name: 'সাব্বির আহমেদ',
    username: 'sabbir_ahmed',
    location: 'রাজশাহী, বাংলাদেশ',
    mutualCount: 3,
    status: 'pending',
  },
  {
    id: 'u-5',
    name: 'নাজমুল হুদা',
    username: 'nazmul_huda',
    location: 'খুলনা, বাংলাদেশ',
    mutualCount: 12,
    status: 'none',
  },
];

export default function FriendsScreen() {
  const { locale, theme } = useUi();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggestions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendUser[]>(SAMPLE_FRIENDS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const toggleFriendship = (id: string) => {
    setFriends((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          if (f.status === 'friend') return { ...f, status: 'none' };
          if (f.status === 'none') return { ...f, status: 'pending' };
          return { ...f, status: 'friend' };
        }
        return f;
      })
    );
  };

  const filteredUsers = friends.filter((u) => {
    if (activeTab === 'all' && u.status !== 'friend') return false;
    if (activeTab === 'requests' && u.status !== 'pending') return false;
    if (activeTab === 'suggestions' && u.status !== 'none') return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.location && u.location.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{ paddingHorizontal: 6, paddingTop: 10, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme === 'dark' ? '#ffffff' : '#4f46e5'}
        />
      }>
      <View className="w-full max-w-[768px] mx-auto space-y-3">
        {/* Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-3 sm:p-4 shadow-xs">
          <View className="flex-row items-center gap-3 mb-2.5">
            <View className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center shrink-0">
              <AppIcon android="group" size={20} color="#4f46e5" />
            </View>
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? 'ফ্রেন্ডস ও পরিচিতজন' : 'Friends & Connections'}
              </Text>
              <Text numberOfLines={1} className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn'
                  ? 'পরিচিত দ্বীনি ভাই-বোনদের খুঁজুন ও যুক্ত হোন'
                  : 'Find and connect with companions'}
              </Text>
            </View>
          </View>

          {/* Search bar */}
          <View className="w-full flex-row items-center rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3 py-1.5">
            <AppIcon android="search" size={15} color="#65676b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={locale === 'bn' ? 'ফ্রেন্ড খুঁজুন...' : 'Search friends...'}
              placeholderTextColor="#8a8d91"
              className="flex-1 ml-2 text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] py-0"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon android="close" size={15} color="#65676b" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row rounded-xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-1">
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
                    : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
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

        {/* User List */}
        <View className="space-y-3">
          {filteredUsers.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center bg-white dark:bg-[#242526]">
              <AppIcon android="info" size={24} color="#65676b" />
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                {locale === 'bn' ? 'কোনো ফ্রেন্ড পাওয়া যায়নি।' : 'No users found.'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((u) => (
              <View
                key={u.id}
                className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-3 shadow-xs flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View className="h-11 w-11 rounded-full bg-indigo-500 items-center justify-center shrink-0">
                    <Text className="text-white text-base font-bold">
                      {u.name.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                      {u.name}
                    </Text>
                    <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                      @{u.username} {u.location ? `• ${u.location}` : ''}
                    </Text>
                    {u.mutualCount ? (
                      <Text className="text-[11px] text-[#8a8d91] font-medium">
                        {u.mutualCount} {locale === 'bn' ? 'কমন ফ্রেন্ড' : 'mutual friends'}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <Pressable
                  onPress={() => toggleFriendship(u.id)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    u.status === 'friend'
                      ? 'border-[#ced0d4] dark:border-[#3e4042] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                      : u.status === 'pending'
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-indigo-600 bg-indigo-600'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      u.status === 'friend'
                        ? 'text-[#050505] dark:text-[#e4e6eb]'
                        : 'text-white'
                    }`}>
                    {u.status === 'friend'
                      ? locale === 'bn'
                        ? 'ফ্রেন্ড'
                        : 'Friends'
                      : u.status === 'pending'
                        ? locale === 'bn'
                          ? 'অনুরোধ পাঠানো হয়েছে'
                          : 'Requested'
                        : locale === 'bn'
                          ? 'ফ্রেন্ড রিকোয়েস্ট'
                          : 'Add Friend'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
