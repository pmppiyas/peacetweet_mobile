import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { useUi } from '@/providers/UiProvider';
import { BloodDonorItem } from '../types/blood.types';
import { BloodSkeleton } from './BloodSkeleton';
import { formatBloodGroup } from '../utils/blood.utils';

export interface BloodDonorsTabProps {
  donors: BloodDonorItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  selectedGroup: string;
  onDonorMessage: (donor: BloodDonorItem) => void;
  onScrollToTop?: () => void;
}

export function BloodDonorsTab({
  donors,
  isLoading,
  isRefreshing,
  isLoadingMore = false,
  hasMore = false,
  selectedGroup,
  onDonorMessage,
  onScrollToTop,
}: BloodDonorsTabProps) {
  const { locale } = useUi();

  return (
    <View className="w-full">
      {donors.length === 0 && isLoading && !isRefreshing ? (
        <BloodSkeleton count={6} />
      ) : donors.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-[#e4e6eb] dark:border-[#393a3b] p-8 items-center justify-center my-4">
          <AppIcon android="person_search" size={24} color="#e11d48" />
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-2 font-medium text-center">
            {selectedGroup === 'ALL'
              ? locale === 'bn'
                ? 'কোনো নিবন্ধিত রক্তদাতা পাওয়া যায়নি।'
                : 'No available blood donors found.'
              : locale === 'bn'
              ? `${selectedGroup} গ্রুপের কোনো রক্তদাতা পাওয়া যায়নি।`
              : `No donors found for ${selectedGroup} group.`}
          </Text>
        </View>
      ) : (
        donors.map((donor, index) => {
          const isLast = index === donors.length - 1;
          const formattedGroup = formatBloodGroup(donor.bloodGroup);

          return (
            <View
              key={donor.id}
              className={`py-3.5 flex-row items-center justify-between ${
                !isLast ? 'border-b border-[#f0f2f5] dark:border-[#242526]' : ''
              }`}>
              {/* Left: Blood Group Badge & Donor Info */}
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 items-center justify-center shrink-0 shadow-xs">
                  <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                    {formattedGroup}
                  </Text>
                </View>

                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate">
                    {donor.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-xs text-[#65676b] dark:text-[#b0b3b8] truncate mt-0.5">
                    @{donor.username} • {donor.location || 'Bangladesh'}
                  </Text>

                  {/* Donation count badge */}
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <View className="h-2 w-2 rounded-full bg-emerald-500" />
                    <Text className="text-[11px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                      {donor.donationCount > 0
                        ? locale === 'bn'
                          ? `${donor.donationCount} বার রক্তদান করেছেন`
                          : `${donor.donationCount} donations completed`
                        : locale === 'bn'
                        ? 'নতুন রক্তদাতা'
                        : 'Ready to donate'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: Message / Chat with Donor (Red) */}
              <Pressable
                onPress={() => onDonorMessage(donor)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 active:bg-rose-700 flex-row items-center gap-1.5 shadow-xs">
                <AppIcon android="chat_bubble" size={14} color="#ffffff" />
                <Text className="text-xs font-bold text-white">
                  {locale === 'bn' ? 'মেসেজ' : 'Chat'}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}

      {/* Infinite Scroll Footer Spinner */}
      {isLoadingMore && (
        <View className="py-4 items-center justify-center flex-row gap-2">
          <ActivityIndicator size="small" color="#e11d48" />
          <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'আরও রক্তদাতা লোড হচ্ছে...' : 'Loading more donors...'}
          </Text>
        </View>
      )}

      {/* End of List Indicator with right-side Go To Top icon */}
      {!hasMore && !isLoading && !isLoadingMore && donors.length > 0 && (
        <View className="pt-3 pb-2 items-center justify-center">
          <Pressable
            onPress={onScrollToTop}
            className="flex-row items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f0f2f5] dark:bg-[#242526] border border-[#e4e6eb] dark:border-[#393a3b] active:bg-[#e4e6eb] dark:active:bg-[#3a3b3c]">
            <View className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <Text className="text-[11px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn'
                ? 'আর কোনো রক্তদাতা নেই'
                : 'No more donors available'}
            </Text>
            {onScrollToTop && (
              <View className="ml-1 pl-1.5 border-l border-[#d0d2d6] dark:border-[#3a3b3c]">
                <AppIcon android="keyboard_arrow_up" size={13} color="#e11d48" weight="bold" />
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
