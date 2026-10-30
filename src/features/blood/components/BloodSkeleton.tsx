import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export interface BloodSkeletonProps {
  count?: number;
}

export function BloodSkeleton({ count = 6 }: BloodSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View className="w-full">
      {items.map((i) => (
        <View
          key={i}
          className="py-3.5 flex-row items-center justify-between border-b border-[#f0f2f5] dark:border-[#242526]">
          {/* Blood Group Badge & Info */}
          <View className="flex-row items-center gap-3 flex-1 pr-2">
            <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
            <View className="flex-1 min-w-0 gap-1.5">
              <Skeleton
                className={`h-4 rounded-md ${
                  i % 3 === 0 ? 'w-40' : i % 3 === 1 ? 'w-32' : 'w-36'
                }`}
              />
              <Skeleton
                className={`h-3 rounded-md ${
                  i % 2 === 0 ? 'w-48' : 'w-44'
                }`}
              />
              <Skeleton className="h-2.5 w-24 rounded-md" />
            </View>
          </View>

          {/* Action button skeleton */}
          <Skeleton className="h-8 w-20 rounded-xl" />
        </View>
      ))}
    </View>
  );
}
