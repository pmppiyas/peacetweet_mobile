import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Skeleton placeholder for a feed post card in the profile feed.
 * Matches FeedPostCard layout and spacing.
 */
export function PostCardSkeleton() {
  return (
    <View className="bg-white dark:bg-[#242526] p-4 border-y border-[#e4e6eb] dark:border-[#393a3b] space-y-3 gap-3 overflow-hidden">
      {/* Header (Author avatar + Name + Time) */}
      <View className="flex-row items-center gap-2.5">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <View className="flex-1 space-y-1.5 gap-1.5">
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <Skeleton className="h-2.5 w-20 rounded-md" />
        </View>
      </View>

      {/* Body content lines */}
      <View className="space-y-2 gap-2">
        <Skeleton className="h-3.5 w-5/6 rounded-md" />
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-3/4 rounded-md" />
      </View>

      {/* Actions Footer (Like, Comment, Share) */}
      <View className="pt-2 border-t border-[#e6e9ef] dark:border-[#393a3b] flex-row justify-around gap-2">
        <Skeleton className="h-7 w-20 rounded-xl" />
        <Skeleton className="h-7 w-20 rounded-xl" />
        <Skeleton className="h-7 w-20 rounded-xl" />
      </View>
    </View>
  );
}

/**
 * 1:1 Pixel-perfect Profile Skeleton replicating ProfileView.
 * Includes Cover Banner with Back/Share controls, centered overlapping Avatar,
 * User Name & Verified icon, @handle, Badges pills, Bio lines, Action buttons,
 * Segmented Tab switcher, and Overview tab content (Intro details + Friends grid + Post).
 */
export function ProfileSkeleton() {
  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Cover Photo Banner */}
      <View className="relative w-full h-44 sm:h-52 bg-[#e4e6eb] dark:bg-[#2e2f30] overflow-hidden">
        {/* Top-left Back button placeholder */}
        <View className="absolute top-3 left-3 z-30 h-9 w-9 rounded-full bg-black/20" />
        {/* Top-right Share button placeholder */}
        <View className="absolute top-3 right-3 z-30 h-9 w-18 rounded-full bg-black/20" />
      </View>

      {/* 2. Profile Details & Bio & Action Buttons (Hero Card) */}
      <View className="w-full max-w-[768px] mx-auto bg-white dark:bg-[#242526] px-4 pb-4 border-b border-[#e4e6eb] dark:border-[#393a3b] items-center relative z-20">
        {/* Centered Avatar overlapping Cover Banner */}
        <View className="-mt-14 relative z-40 items-center">
          <View className="relative h-28 w-28">
            <View className="h-28 w-28 rounded-full border-4 border-white dark:border-[#242526] bg-[#e4e6eb] dark:bg-[#3a3b3c] overflow-hidden items-center justify-center">
              <Skeleton className="w-full h-full rounded-full" />
            </View>
          </View>
        </View>

        {/* Name & Verified Badge */}
        <View className="flex-row items-center justify-center gap-1.5 mt-3">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <View style={{ transform: [{ translateY: 2 }] }}>
            <Skeleton className="h-4.5 w-4.5 rounded-full" />
          </View>
        </View>

        {/* @username handle */}
        <Skeleton className="h-4 w-28 rounded-md mt-1" />

        {/* Badges Row */}
        <View className="flex-row flex-wrap items-center justify-center gap-1.5 mt-2.5">
          <Skeleton className="h-6 w-28 rounded-full" />
        </View>

        {/* Bio Section */}
        <View className="w-full max-w-md mt-2.5 items-center space-y-1.5 gap-1.5 px-4">
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </View>

        {/* Action Buttons (Add Friend / Message) */}
        <View className="flex-row items-center justify-center gap-2 mt-4">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </View>
      </View>

      {/* 3. Sticky Segmented Tab Switcher */}
      <View className="bg-white dark:bg-[#242526] border-b border-[#e4e6eb] dark:border-[#393a3b] px-2 py-2">
        <View className="w-full max-w-[768px] mx-auto flex-row items-center justify-between gap-1">
          {/* Active Tab (Overview) */}
          <View className="flex-1 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/50 items-center justify-center flex-row gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full bg-primary-300 dark:bg-primary-700" />
            <Skeleton className="h-4 w-16 rounded-md bg-primary-300 dark:bg-primary-700" />
          </View>
          {/* Tab 2 (Posts) */}
          <View className="flex-1 py-2 rounded-xl items-center justify-center flex-row gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </View>
          {/* Tab 3 (Friends) */}
          <View className="flex-1 py-2 rounded-xl items-center justify-center flex-row gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-md" />
          </View>
          {/* Tab 4 (Groups) */}
          <View className="flex-1 py-2 rounded-xl items-center justify-center flex-row gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </View>
        </View>
      </View>

      {/* 4. Overview Tab Content */}
      <View className="w-full max-w-[768px] mx-auto px-0 pb-6 mt-2 space-y-2 gap-2">
        {/* Intro Details Card */}
        <View className="bg-white dark:bg-[#242526] p-4 sm:p-5 border-y border-[#e4e6eb] dark:border-[#393a3b] space-y-3.5 gap-3.5">
          <Skeleton className="h-5 w-24 rounded-md mb-1" />
          <View className="space-y-3 gap-3">
            {/* Location row */}
            <View className="flex-row items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </View>
            {/* Blood Group row */}
            <View className="flex-row items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </View>
            {/* Joined Date row */}
            <View className="flex-row items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full shrink-0" />
              <Skeleton className="h-4 w-40 rounded-md" />
            </View>
          </View>
        </View>

        {/* Friends Preview Card */}
        <View className="bg-white dark:bg-[#242526] p-4 sm:p-5 border-y border-[#e4e6eb] dark:border-[#393a3b]">
          <View className="flex-row items-center justify-between pb-2.5 mb-2.5 border-b border-[#e6e9ef] dark:border-[#393a3b]">
            <View className="space-y-1 gap-1">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </View>
            <Skeleton className="h-7 w-18 rounded-lg" />
          </View>
          <View className="flex-row justify-between gap-2 pt-1">
            <View className="w-[30%] items-center space-y-1.5 gap-1.5">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </View>
            <View className="w-[30%] items-center space-y-1.5 gap-1.5">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </View>
            <View className="w-[30%] items-center space-y-1.5 gap-1.5">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </View>
          </View>
        </View>

        {/* Feed Post Card */}
        <PostCardSkeleton />
      </View>
    </ScrollView>
  );
}
