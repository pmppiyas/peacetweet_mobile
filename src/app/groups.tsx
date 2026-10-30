import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';

interface CommunityGroup {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  category: string;
  categoryBn: string;
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  joined: boolean;
}

const INITIAL_GROUPS: CommunityGroup[] = [
  {
    id: 'grp-sunnah',
    name: 'Daily Sunnah & Masnoon Duas',
    nameBn: 'দৈনন্দিন সুন্নাহ ও মাসনুন দোয়া',
    description: 'A community sharing and encouraging daily authentic sunnah habits and adhkar.',
    descriptionBn: 'প্রতিদিনের মাসনুন আমল, সকাল-সন্ধ্যার যিকির ও সুন্নাহ চর্চার সক্রিয় কমিউনিটি।',
    category: 'Daily Practice',
    categoryBn: 'দৈনন্দিন আমল',
    memberCount: 1420,
    postCount: 380,
    isPrivate: false,
    joined: true,
  },
  {
    id: 'grp-quran',
    name: 'Quran Memorization & Tajweed',
    nameBn: 'হিফযুল কুরআন ও তাজবীদ চর্চা',
    description: 'Learn correct pronunciation, daily recitation tracking, and reflection.',
    descriptionBn: 'সহীহ তিলাওয়াত, তাজবীদের নিয়ম এবং দৈনিক হিফয ও তিলাওয়াত পর্যবেক্ষণের গ্রুপ।',
    category: 'Quran Study',
    categoryBn: 'কুরআন চর্চা',
    memberCount: 980,
    postCount: 210,
    isPrivate: false,
    joined: false,
  },
  {
    id: 'grp-hadith',
    name: 'Authentic Hadith & Fiqh Study',
    nameBn: 'সহীহ হাদিস ও ফিক্বহ শিক্ষা',
    description: 'Studying Sahih Bukhari, Muslim, and fundamental Islamic jurisprudence.',
    descriptionBn: 'সহীহ হাদিসের ব্যাখ্যা, প্রয়োজনীয় আহকাম ও প্রামাণিক ফিক্বহ চর্চার প্ল্যাটফর্ম।',
    category: 'Knowledge',
    categoryBn: 'ইলম ও শিক্ষা',
    memberCount: 850,
    postCount: 175,
    isPrivate: false,
    joined: false,
  },
  {
    id: 'grp-youth',
    name: 'Youth & Character Purification',
    nameBn: 'যুব সমাজ ও আত্মশুদ্ধি',
    description: 'Guiding Muslim youth against digital fitnah, building Islamic morality and purpose.',
    descriptionBn: 'চোখের যিনা, আসক্তি ও পাপাচার থেকে বেঁচে চরিত্রবান মুসলিম তরুণ প্রজন্ম গড়ার উদ্যোগ।',
    category: 'Self Improvement',
    categoryBn: 'আত্মশুদ্ধি',
    memberCount: 1240,
    postCount: 430,
    isPrivate: false,
    joined: true,
  },
  {
    id: 'grp-blood',
    name: 'Emergency Blood & Relief Network',
    nameBn: 'রক্তদান ও জরুরি সেবা ফোরাম',
    description: 'Connecting voluntary blood donors with patients across districts.',
    descriptionBn: 'জরুরি প্রয়োজনে দ্রুত রক্তদাতা খুঁজে দেওয়া এবং মুমূর্ষু রোগীর পাশে দাঁড়ানোর স্বেচ্ছাসেবী ফোরাম।',
    category: 'Community Service',
    categoryBn: 'সামাজিক সেবা',
    memberCount: 2100,
    postCount: 520,
    isPrivate: false,
    joined: false,
  },
  {
    id: 'grp-family',
    name: 'Islamic Parenting & Family Life',
    nameBn: 'ইসলামিক প্যারেন্টিং ও পরিবার',
    description: 'Islamic guidance on raising righteous children and nurturing peaceful homes.',
    descriptionBn: 'সন্তান প্রতিপালনে নবীজির দিকনির্দেশনা ও শান্তিপূর্ণ দাম্পত্য জীবনের বাস্তব পরামর্শ।',
    category: 'Family',
    categoryBn: 'পারিবারিক',
    memberCount: 760,
    postCount: 140,
    isPrivate: true,
    joined: false,
  },
];

export default function GroupsScreen() {
  const { locale, theme } = useUi();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<CommunityGroup[]>(INITIAL_GROUPS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleJoin = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextJoined = !g.joined;
          return {
            ...g,
            joined: nextJoined,
            memberCount: nextJoined ? g.memberCount + 1 : Math.max(0, g.memberCount - 1),
          };
        }
        return g;
      })
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const filteredGroups = useMemo(() => {
    let list = groups;
    if (activeTab === 'my') {
      list = list.filter((g) => g.joined);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.nameBn.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.descriptionBn.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.categoryBn.toLowerCase().includes(q)
    );
  }, [groups, activeTab, searchQuery]);

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
        {/* Hero Card */}
        <View className="w-full rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-5 shadow-xs items-center text-center">
          <View className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 items-center justify-center mb-3">
            <AppIcon android="groups" size={28} color="#059669" />
          </View>
          <Text className="text-xl font-extrabold text-[#050505] dark:text-[#e4e6eb] text-center mb-1">
            {locale === 'bn' ? 'কমিউনিটি গ্রুপসমূহ' : 'Community Groups'}
          </Text>
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-lg leading-relaxed mb-4">
            {locale === 'bn'
              ? 'আমল, জ্ঞান চর্চা ও পারস্পরিক সহযোগিতার জন্য ইসলামিক ভ্রাতৃত্বপূর্ণ গ্রুপসমূহে যুক্ত হোন।'
              : 'Join interest-based groups to learn, share authentic knowledge, and support one another.'}
          </Text>

          {/* Search bar */}
          <View className="w-full flex-row items-center rounded-xl bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 py-2">
            <AppIcon android="search" size={17} color="#65676b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={locale === 'bn' ? 'গ্রুপ খুঁজুন...' : 'Search groups...'}
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

        {/* Tab Selector */}
        <View className="flex-row rounded-xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-1">
          <Pressable
            onPress={() => setActiveTab('all')}
            className={`flex-1 py-2 items-center rounded-lg ${
              activeTab === 'all'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
            }`}>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'all' ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn' ? 'সকল গ্রুপ' : 'All Groups'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('my')}
            className={`flex-1 py-2 items-center rounded-lg ${
              activeTab === 'my'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]'
            }`}>
            <Text
              className={`text-xs font-bold ${
                activeTab === 'my' ? 'text-white' : 'text-[#65676b] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn' ? 'আমার গ্রুপসমূহ' : 'My Groups'}
            </Text>
          </Pressable>
        </View>

        {/* Groups List */}
        <View className="space-y-3">
          {filteredGroups.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center bg-white dark:bg-[#242526]">
              <AppIcon android="info" size={24} color="#65676b" />
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium">
                {activeTab === 'my'
                  ? locale === 'bn'
                    ? 'আপনি এখনো কোনো গ্রুপে যুক্ত হননি।'
                    : 'You haven’t joined any groups yet.'
                  : locale === 'bn'
                    ? 'কোনো গ্রুপ পাওয়া যায়নি।'
                    : 'No groups matched your search.'}
              </Text>
            </View>
          ) : (
            filteredGroups.map((group) => {
              const name = locale === 'bn' ? group.nameBn : group.name;
              const desc = locale === 'bn' ? group.descriptionBn : group.description;
              const cat = locale === 'bn' ? group.categoryBn : group.category;

              return (
                <View
                  key={group.id}
                  className="rounded-2xl bg-white dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] p-4 shadow-xs">
                  <View className="flex-row items-start justify-between gap-3 mb-2.5">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 items-center justify-center shrink-0">
                        <AppIcon android="groups" size={22} color="#059669" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                            {name}
                          </Text>
                          {group.isPrivate && (
                            <AppIcon android="lock" size={13} color="#8a8d91" />
                          )}
                        </View>
                        <Text className="text-[11px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                          {cat} • {group.memberCount} {locale === 'bn' ? 'সদস্য' : 'members'}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => toggleJoin(group.id)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        group.joined
                          ? 'border-[#ced0d4] dark:border-[#3e4042] bg-[#f0f2f5] dark:bg-[#3a3b3c]'
                          : 'border-emerald-600 bg-emerald-600'
                      }`}>
                      <Text
                        className={`text-xs font-bold ${
                          group.joined
                            ? 'text-[#050505] dark:text-[#e4e6eb]'
                            : 'text-white'
                        }`}>
                        {group.joined
                          ? locale === 'bn'
                            ? 'যুক্ত আছেন'
                            : 'Joined'
                          : locale === 'bn'
                            ? 'যোগ দিন'
                            : 'Join'}
                      </Text>
                    </Pressable>
                  </View>

                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] leading-relaxed mb-3">
                    {desc}
                  </Text>

                  <View className="pt-2.5 border-t border-[#f0f2f5] dark:border-[#393a3b] flex-row items-center justify-between">
                    <Text className="text-[11px] text-[#8a8d91] font-medium">
                      {group.postCount} {locale === 'bn' ? 'পোস্ট ও আলোচনা' : 'posts & discussions'}
                    </Text>
                    <Pressable className="flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-primary-600 dark:text-primary-400">
                        {locale === 'bn' ? 'গ্রুপ দেখুন' : 'View Group'}
                      </Text>
                      <AppIcon android="chevron_right" size={14} color="#1877f2" />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
