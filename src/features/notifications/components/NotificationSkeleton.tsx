import React from 'react';
import { View } from 'react-native';

export interface NotificationSkeletonProps {
  count?: number;
  variant?: 'page' | 'dropdown';
}

export function NotificationSkeleton({
  count = 6,
  variant = 'page',
}: NotificationSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'dropdown') {
    return (
      <View className="flex-col gap-1 p-2">
        {items.map((i) => (
          <View
            key={i}
            className="flex-row items-center gap-3 p-2.5 rounded-xl">
            <View className="relative shrink-0">
              <View className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700/60" />
              <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#242526]" />
            </View>
            <View className="flex-1 min-w-0 gap-1.5">
              <View
                className={`h-3.5 rounded-md bg-gray-200 dark:bg-gray-700/60 ${
                  i % 3 === 0 ? 'w-4/5' : i % 3 === 1 ? 'w-3/4' : 'w-2/3'
                }`}
              />
              <View className="h-3 w-16 rounded-md bg-gray-200 dark:bg-gray-700/60" />
            </View>
            {i % 2 === 0 ? (
              <View className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700/60 shrink-0" />
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-col gap-0.5">
      {items.map((i) => (
        <View
          key={i}
          className="flex-row items-center gap-2.5 px-2 py-2 rounded-xl">
          {/* Avatar with Badged Icon */}
          <View className="relative shrink-0">
            <View className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700/60" />
            <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#242526]" />
          </View>

          {/* Content lines */}
          <View className="flex-1 min-w-0 gap-1.5">
            <View
              className={`h-3.5 rounded-md bg-gray-200 dark:bg-gray-700/60 ${
                i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-5/6' : 'w-2/3'
              }`}
            />
            <View className="h-3 w-16 rounded-md bg-gray-200 dark:bg-gray-700/60" />
          </View>

          {/* Right Status Dot Placeholder */}
          <View className="flex-row items-center gap-2 shrink-0">
            {i % 2 === 0 ? (
              <View className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700/60" />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
