import React from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useFeed } from '@/providers/FeedProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function HomeScreen() {
  const { locale, setComposerModalOpen, openComposer, handleFeedScroll } =
    useUi();
  const { user, isAuthenticated } = useAuth();
  const { items, isLoading, isRefreshing, error, refreshFeed } = useFeed();

  const firstName = user?.name?.trim()?.split(' ')?.[0] || '';
  const composerPrompt =
    locale === 'bn'
      ? firstName
        ? `${firstName}, কী ভাবছেন?`
        : 'কী ভাবছেন?'
      : firstName
        ? `${firstName}, what's on your mind?`
        : "What's on your mind?";

  return (
    <ScrollView
      testID="feed-scroll-view"
      className="flex-1 bg-white dark:bg-[#18191a]"
      onScroll={handleFeedScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingTop: 60, paddingBottom: 68 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshFeed}
          tintColor="#0866FF"
          progressViewOffset={60}
        />
      }
    >
      <View className="w-full max-w-[720px] mx-auto">
        {/* 1. Post Composer Card */}
        <View className="w-full bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] px-4 pt-3.5 pb-2.5">
          {!isAuthenticated ? (
            <View className="flex-row items-center justify-between gap-3 py-1">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#0866FF]">
                  <Text className="text-white font-black text-lg">P</Text>
                </View>
                <Text className="flex-1 text-[13.5px] leading-snug text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? 'আপনার ভাবনা, দোয়া বা রক্তদানের অনুরোধ শেয়ার করতে সাইন ইন করুন।'
                    : 'Sign in to share reflections, Duas, or blood donation requests.'}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/login')}
                className="rounded-xl bg-[#0866FF] active:bg-[#0756d6] px-4 py-2"
              >
                <Text className="text-white text-[13px] font-bold">
                  {locale === 'bn' ? 'লগইন' : 'Log In'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Top Row: User Avatar + Spacious Input Pill */}
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => router.push('/profile')}
                  className="active:opacity-80"
                >
                  <UserAvatar
                    avatarUrl={user?.avatarUrl || (user as any)?.avatar}
                    name={user?.name || 'User'}
                    size="md"
                  />
                </Pressable>

                <Pressable
                  onPress={() => openComposer({ mode: 'TEXT' })}
                  className="h-11 flex-1 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-4.5 justify-center active:bg-[#e4e6eb] dark:active:bg-[#4e4f50]"
                >
                  <Text className="text-[15px] font-normal text-[#65676b] dark:text-[#b0b3b8]">
                    {composerPrompt}
                  </Text>
                </Pressable>
              </View>

              {/* Clean Subtle Horizontal Divider */}
              <View className="h-[1px] bg-[#e4e6eb] dark:bg-[#393a3b] mt-3 mb-1" />

              {/* 3-Column Bottom Action Buttons with prominent icons & text */}
              <View className="flex-row items-center justify-between">
                {/* 1. Photo/Video */}
                <Pressable
                  onPress={() =>
                    openComposer({ mode: 'TEXT', action: 'photo' })
                  }
                  className="flex-1 flex-row items-center justify-center gap-2 py-2.5 px-1 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]"
                >
                  <AppIcon
                    android="image"
                    ios="photo"
                    size={23}
                    color="#45bd62"
                  />
                  <Text className="text-[13.5px] font-semibold text-[#4e5156] dark:text-[#d1d5db]">
                    {locale === 'bn' ? 'ছবি / মিডিয়া' : 'Photo/video'}
                  </Text>
                </Pressable>

                {/* Vertical Divider */}
                <View className="w-[1px] h-5 bg-[#e4e6eb] dark:bg-[#393a3b]" />

                {/* 2. Dua */}
                <Pressable
                  onPress={() => openComposer({ mode: 'DUA' })}
                  className="flex-1 flex-row items-center justify-center gap-2 py-2.5 px-1 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]"
                >
                  <AppIcon
                    android="menu_book"
                    ios="book"
                    size={23}
                    color="#0866FF"
                  />
                  <Text className="text-[13.5px] font-semibold text-[#4e5156] dark:text-[#d1d5db]">
                    {locale === 'bn' ? 'পবিত্র দোয়া' : 'Dua'}
                  </Text>
                </Pressable>

                {/* Vertical Divider */}
                <View className="w-[1px] h-5 bg-[#e4e6eb] dark:bg-[#393a3b]" />

                {/* 3. Feeling */}
                <Pressable
                  onPress={() =>
                    openComposer({ mode: 'TEXT', action: 'feeling' })
                  }
                  className="flex-1 flex-row items-center justify-center gap-2 py-2.5 px-1 rounded-xl active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]"
                >
                  <AppIcon
                    android="sentiment_satisfied"
                    ios="face.smiling"
                    size={23}
                    color="#f7b125"
                  />
                  <Text className="text-[13.5px] font-semibold text-[#4e5156] dark:text-[#d1d5db]">
                    {locale === 'bn' ? 'অনুভূতি' : 'Feeling'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* 2. Feed List Card */}
        {isLoading && items.length === 0 ? (
          <View className="w-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                className={`bg-white dark:bg-[#242526] border-b border-[#d9dde4] dark:border-[#393a3b] p-3 space-y-3 ${
                  i > 0 ? 'mt-2 border-t' : ''
                }`}
              >
                <View className="flex-row items-center gap-2.5">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <View className="flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                    <Skeleton className="h-2.5 w-20 rounded-md" />
                  </View>
                </View>
                <View className="space-y-1.5">
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </View>
                <View className="pt-2 border-t border-[#e6e9ef] dark:border-[#393a3b] flex-row justify-around">
                  <Skeleton className="h-7 w-20 rounded-xl" />
                  <Skeleton className="h-7 w-20 rounded-xl" />
                  <Skeleton className="h-7 w-20 rounded-xl" />
                </View>
              </View>
            ))}
          </View>
        ) : error && items.length === 0 ? (
          <View className="mx-2 mt-3 rounded-2xl bg-white dark:bg-[#242526] p-6 items-center gap-3 border border-[#d9dde4] dark:border-[#393a3b]">
            <Text className="text-xs text-rose-600 dark:text-rose-400 text-center">
              {error}
            </Text>
            <Pressable
              onPress={refreshFeed}
              className="rounded-lg bg-primary-500 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full bg-white dark:bg-[#242526] border-b border-[#d9dde4] dark:border-[#393a3b] overflow-hidden">
            {items.map((post, index) => (
              <React.Fragment key={post.id}>
                {index > 0 && (
                  <View className="h-2 w-full bg-[#f0f2f5] dark:bg-[#18191a] border-y border-[#e4e6eb] dark:border-[#393a3b]" />
                )}
                <View nativeID={`feed-post-${post.id}`} collapsable={false}>
                  <FeedPostCard post={post} />
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
