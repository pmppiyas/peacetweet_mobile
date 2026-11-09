import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function PostCardSkeleton() {
  return (
    <View className="border-y border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] p-3 space-y-3 gap-3 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center gap-2.5">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <View className="flex-1 space-y-1.5 gap-1.5">
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <Skeleton className="h-2.5 w-20 rounded-md" />
        </View>
      </View>

      {/* Body lines */}
      <View className="space-y-2 gap-2">
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </View>

      {/* Actions */}
      <View className="pt-2 border-t border-[#e6e9ef] dark:border-[#393a3b] flex-row justify-around gap-2">
        <Skeleton className="h-7 w-20 rounded-xl" />
        <Skeleton className="h-7 w-20 rounded-xl" />
        <Skeleton className="h-7 w-20 rounded-xl" />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-[#18191a]"
      showsVerticalScrollIndicator={false}>
      {/* Cover Banner Skeleton */}
      <Skeleton className="w-full h-44 sm:h-52 rounded-none" />

      {/* Hero Card Skeleton */}
      <View className="w-full max-w-[768px] mx-auto bg-white dark:bg-[#242526] px-4 pb-4 border-b border-[#e4e6eb] dark:border-[#393a3b] items-center">
        {/* Overlapping Avatar */}
        <View className="-mt-14 relative z-10">
          <Skeleton className="h-28 w-28 rounded-full border-4 border-white dark:border-[#242526]" />
        </View>

        {/* Name & Handle */}
        <View className="items-center mt-3 space-y-2 gap-2">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-3.5 w-28 rounded-md" />
        </View>

        {/* Badges Pill Row */}
        <View className="flex-row items-center justify-center gap-2 mt-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </View>

        {/* Bio Skeleton */}
        <View className="mt-3.5 w-full max-w-sm space-y-1.5 gap-1.5 items-center">
          <Skeleton className="h-3.5 w-4/5 rounded-md" />
          <Skeleton className="h-3.5 w-3/5 rounded-md" />
        </View>
      </View>

      {/* Sticky Tab Switcher Skeleton */}
      <View className="bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] px-2 py-1.5">
        <View className="w-full max-w-[768px] mx-auto flex-row items-center justify-between gap-1">
          <Skeleton className="flex-1 h-8 rounded-lg" />
          <Skeleton className="flex-1 h-8 rounded-lg" />
          <Skeleton className="flex-1 h-8 rounded-lg" />
          <Skeleton className="flex-1 h-8 rounded-lg" />
          <Skeleton className="flex-1 h-8 rounded-lg" />
        </View>
      </View>

      {/* Tab Content Skeleton */}
      <View className="w-full max-w-[768px] mx-auto px-0 pb-6 mt-2 space-y-2 gap-2">
        {/* Intro Card Skeleton */}
        <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b] space-y-3 gap-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <View className="space-y-2.5 gap-2.5">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-4 w-52 rounded-md" />
          </View>
        </View>

        {/* Friends Preview Skeleton */}
        <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b] space-y-3 gap-3">
          <View className="flex-row items-center justify-between">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-4 w-14 rounded-md" />
          </View>
          <View className="flex-row justify-between gap-2 pt-1">
            <Skeleton className="w-[30%] aspect-square rounded-xl" />
            <Skeleton className="w-[30%] aspect-square rounded-xl" />
            <Skeleton className="w-[30%] aspect-square rounded-xl" />
          </View>
        </View>

        {/* Feed Posts Skeleton */}
        <PostCardSkeleton />
        <PostCardSkeleton />
      </View>
    </ScrollView>
  );
}
