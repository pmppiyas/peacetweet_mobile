import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { SearchScope } from '../types/search.types';

export interface SearchSkeletonProps {
  tab?: SearchScope;
}

export function SearchSkeleton({ tab = 'ALL' }: SearchSkeletonProps) {
  const showPeople = tab === 'ALL' || tab === 'USERS';
  const showDuasOrPosts = tab === 'ALL' || tab === 'DUAS' || tab === 'POSTS';
  const showGroups = tab === 'ALL' || tab === 'GROUPS';

  return (
    <View className="gap-3.5">
      {/* 1. People Section Skeleton */}
      {showPeople && (
        <View className="rounded-xl bg-white dark:bg-[#242526] p-4 border border-[#e4e6eb] dark:border-[#393a3b] gap-3">
          <View className="flex-row items-center gap-2 border-b border-[#e4e6eb] dark:border-[#393a3b] pb-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </View>

          <View className="gap-3">
            {[0, 1].map((i) => (
              <View
                key={i}
                className="flex-row items-center justify-between py-1 gap-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <View className="flex-1 gap-1.5">
                    <Skeleton
                      className={`h-3.5 rounded-md ${
                        i === 0 ? 'w-2/5' : 'w-1/2'
                      }`}
                    />
                    <Skeleton className="h-3 w-1/4 rounded-md" />
                  </View>
                </View>
                <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 2. Groups Section Skeleton */}
      {showGroups && !showDuasOrPosts && (
        <View className="rounded-xl bg-white dark:bg-[#242526] p-4 border border-[#e4e6eb] dark:border-[#393a3b] gap-3">
          <View className="flex-row items-center gap-2 border-b border-[#e4e6eb] dark:border-[#393a3b] pb-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </View>

          <View className="gap-3">
            {[0, 1].map((i) => (
              <View
                key={i}
                className="flex-row items-center justify-between py-1 gap-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <View className="flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-1/3 rounded-md" />
                    <Skeleton className="h-3 w-1/5 rounded-md" />
                  </View>
                </View>
                <Skeleton className="h-7 w-20 rounded-lg shrink-0" />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 3. Posts & Duas Section Skeleton */}
      {showDuasOrPosts && (
        <View className="rounded-xl bg-white dark:bg-[#242526] p-4 border border-[#e4e6eb] dark:border-[#393a3b] gap-3">
          <View className="flex-row items-center gap-2 border-b border-[#e4e6eb] dark:border-[#393a3b] pb-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
          </View>

          <View className="gap-4 pt-1">
            {[0, 1].map((i) => (
              <View
                key={i}
                className="gap-2.5 pb-2 border-b border-[#e4e6eb]/60 dark:border-[#393a3b]/60 last:border-b-0">
                <View className="flex-row items-center gap-2.5">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <View className="gap-1 flex-1">
                    <Skeleton className="h-3.5 w-1/3 rounded-md" />
                    <Skeleton className="h-2.5 w-1/5 rounded-md" />
                  </View>
                </View>

                <View className="gap-1.5 py-1">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-4/5 rounded-md" />
                  <Skeleton className="h-3.5 w-3/5 rounded-md" />
                </View>

                <View className="flex-row items-center justify-between pt-1">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
