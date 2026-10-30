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
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';

export default function HomeScreen() {
  const { locale, setComposerModalOpen } = useUi();
  const { user, isAuthenticated } = useAuth();
  const { items, isLoading, isRefreshing, error, refreshFeed } = useFeed();

  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerClassName="pb-6"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshFeed}
          tintColor="#1877f2"
        />
      }>
      <View className="w-full max-w-[720px] mx-auto">
        {/* 1. Post Composer Card matching peacetweet_frontend PostComposer.tsx */}
        <View className="mx-1 mt-1.5 bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] pt-2 pb-1 px-2.5">
          {!isAuthenticated ? (
            <View className="flex-row items-center justify-between gap-3 pb-1.5">
              <View className="flex-row items-center gap-2.5 flex-1">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-500">
                  <Text className="text-white font-black text-base">P</Text>
                </View>
                <Text className="flex-1 text-xs text-[#65676b] dark:text-[#b0b3b8]">
                  Sign in to share reflections, Duas, or blood donation requests.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/login')}
                className="rounded-lg bg-primary-500 px-3.5 py-2">
                <Text className="text-white text-xs font-semibold">Log In</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-500">
                  <Text className="text-white font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : '🕊️'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="h-9 flex-1 rounded-full bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 justify-center">
                  <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                    {user?.name
                      ? `${user.name.split(' ')[0]}, what's on your mind?`
                      : "What's on your mind?"}
                  </Text>
                </Pressable>
              </View>

              {/* Compact 3-Column Bottom Action Buttons */}
              <View className="flex-row gap-1 pt-1 mt-2 border-t border-[#e4e6eb] dark:border-[#393a3b]">
                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="image"
                    ios="photo"
                    size={18}
                    color="#10b981"
                  />
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'ছবি / মিডিয়া' : 'Photo/video'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="menu_book"
                    ios="book"
                    size={18}
                    color="#6366f1"
                  />
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'দোয়া' : 'Dua'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setComposerModalOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
                  <AppIcon
                    android="sentiment_satisfied"
                    ios="face.smiling"
                    size={18}
                    color="#f59e0b"
                  />
                  <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'অনুভূতি' : 'Feeling'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* 2. Feed List Card synced with http://localhost:5000/api/v1/feed */}
        {isLoading && items.length === 0 ? (
          <View className="py-12 items-center justify-center gap-2">
            <ActivityIndicator size="large" color="#1877f2" />
            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn'
                ? 'ফিড লোড হচ্ছে...'
                : 'Loading feed from server...'}
            </Text>
          </View>
        ) : error && items.length === 0 ? (
          <View className="mx-2 mt-3 rounded-2xl bg-white dark:bg-[#242526] p-6 items-center gap-3 border border-[#e4e6eb] dark:border-[#393a3b]">
            <Text className="text-xs text-rose-600 dark:text-rose-400 text-center">
              {error}
            </Text>
            <Pressable
              onPress={refreshFeed}
              className="rounded-lg bg-primary-500 px-4 py-2">
              <Text className="text-xs font-bold text-white">
                {locale === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full mt-2.5 bg-white dark:bg-[#242526] border-y border-[#e4e6eb] dark:border-[#393a3b] overflow-hidden">
            {items.map((post, index) => (
              <React.Fragment key={post.id}>
                {index > 0 && (
                  <View className="h-2 w-full bg-[#f0f2f5] dark:bg-[#18191a] border-y border-[#e4e6eb] dark:border-[#393a3b]" />
                )}
                <FeedPostCard post={post} />
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
