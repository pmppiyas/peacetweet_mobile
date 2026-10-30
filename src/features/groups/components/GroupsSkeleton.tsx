import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export interface GroupsSkeletonProps {
  count?: number;
}

export function GroupsSkeleton({ count = 6 }: GroupsSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View className="w-full">
      {items.map((i) => (
        <View
          key={i}
          className="py-3 flex-row items-center justify-between border-b border-[#f0f2f5] dark:border-[#242526]">
          {/* Avatar & Info */}
          <View className="flex-row items-center gap-3 flex-1 pr-2">
            <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
            <View className="flex-1 min-w-0 gap-1.5">
              <Skeleton
                className={`h-4 rounded-md ${
                  i % 3 === 0 ? 'w-36' : i % 3 === 1 ? 'w-28' : 'w-32'
                }`}
              />
              <Skeleton
                className={`h-3 rounded-md ${
                  i % 2 === 0 ? 'w-24' : 'w-20'
                }`}
              />
            </View>
          </View>

          {/* Join action button skeleton */}
          <Skeleton className="h-8 w-20 rounded-xl" />
        </View>
      ))}
    </View>
  );
}
