import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function ConversationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View className="flex-col gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className="flex-row items-center gap-2.5 px-2 py-2 rounded-xl">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <View className="flex-1 gap-1.5 min-w-0">
            <Skeleton
              className={`h-3.5 rounded-md ${
                i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-5/6' : 'w-2/3'
              }`}
            />
            <Skeleton className="h-3 rounded-md w-28" />
          </View>
          <Skeleton className="h-2.5 w-8 rounded-md shrink-0" />
        </View>
      ))}
    </View>
  );
}

export function UserSearchSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="flex-col gap-1 p-1">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className="flex-row items-center justify-between px-2.5 py-2.5 rounded-xl">
          <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <View className="flex-1 gap-1.5 min-w-0">
              <Skeleton
                className={`h-3.5 rounded-md ${
                  i % 2 === 0 ? 'w-3/5' : 'w-1/2'
                }`}
              />
              <Skeleton className="h-2.5 rounded-md w-20" />
            </View>
          </View>
          <Skeleton className="h-7 w-16 rounded-lg shrink-0 ml-2" />
        </View>
      ))}
    </View>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <View className="flex-1 justify-end p-2 gap-3.5">
      {/* 1. Incoming Message Skeleton */}
      <View className="flex-row items-end gap-2 max-w-[80%]">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <View className="rounded-2xl rounded-bl-xs p-3 bg-[#e6e9ef] dark:bg-[#3a3b3c] gap-1.5 w-48">
          <Skeleton className="h-3 w-40 rounded-md bg-[#d8dadf] dark:bg-[#4e4f50]" />
          <Skeleton className="h-3 w-28 rounded-md bg-[#d8dadf] dark:bg-[#4e4f50]" />
        </View>
      </View>

      {/* 2. Outgoing Message Skeleton */}
      <View className="flex-row items-end justify-end gap-2 self-end max-w-[80%]">
        <View className="rounded-2xl rounded-br-xs p-3 bg-primary-100 dark:bg-primary-950/40 gap-1.5 w-44">
          <Skeleton className="h-3 w-36 rounded-md bg-primary-200 dark:bg-primary-900/50" />
        </View>
      </View>

      {/* 3. Incoming Message Skeleton */}
      <View className="flex-row items-end gap-2 max-w-[80%]">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <View className="rounded-2xl rounded-bl-xs p-3 bg-[#e6e9ef] dark:bg-[#3a3b3c] gap-1.5 w-56">
          <Skeleton className="h-3 w-48 rounded-md bg-[#d8dadf] dark:bg-[#4e4f50]" />
          <Skeleton className="h-3 w-32 rounded-md bg-[#d8dadf] dark:bg-[#4e4f50]" />
        </View>
      </View>

      {/* 4. Outgoing Message Skeleton */}
      <View className="flex-row items-end justify-end gap-2 self-end max-w-[80%]">
        <View className="rounded-2xl rounded-br-xs p-3 bg-primary-100 dark:bg-primary-950/40 gap-1.5 w-52">
          <Skeleton className="h-3 w-44 rounded-md bg-primary-200 dark:bg-primary-900/50" />
          <Skeleton className="h-3 w-28 rounded-md bg-primary-200 dark:bg-primary-900/50" />
        </View>
      </View>
    </View>
  );
}
