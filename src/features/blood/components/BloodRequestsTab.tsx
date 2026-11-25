import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { BloodRequestItem } from '../types/blood.types';
import { BloodSkeleton } from './BloodSkeleton';
import { formatBloodGroup } from '../utils/blood.utils';

export interface BloodRequestsTabProps {
  requests: BloodRequestItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  selectedGroup: string;
  acceptingId: string | null;
  onAccept: (req: BloodRequestItem) => void;
  onScrollToTop?: () => void;
}

export function BloodRequestsTab({
  requests,
  isLoading,
  isRefreshing,
  isLoadingMore = false,
  hasMore = false,
  selectedGroup,
  acceptingId,
  onAccept,
  onScrollToTop,
}: BloodRequestsTabProps) {
  const { locale, theme } = useUi();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const currentUserId = user?.id;

  return (
    <View className="w-full">
      {requests.length === 0 && isLoading && !isRefreshing ? (
        <BloodSkeleton count={6} />
      ) : requests.length === 0 ? (
        <View
          style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
          className="rounded-2xl border border-dashed p-8 items-center justify-center my-4">
          <AppIcon android="water_drop" size={26} color="#e11d48" />
          <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8] mt-2.5 font-medium text-center">
            {selectedGroup === 'ALL'
              ? locale === 'bn'
                ? 'বর্তমানে কোনো সক্রিয় রক্তের আবেদন নেই।'
                : 'No active blood requests at the moment.'
              : locale === 'bn'
              ? `${selectedGroup} গ্রুপের কোনো সক্রিয় রক্তের আবেদন পাওয়া যায়নি।`
              : `No active blood requests found for ${selectedGroup} group.`}
          </Text>
        </View>
      ) : (
        requests.map((req, index) => {
          const isLast = index === requests.length - 1;
          const formattedGroup = formatBloodGroup(req.bloodGroup);
          const isMyRequest = Boolean(currentUserId && req.requesterId === currentUserId);
          const isAcceptedByMe = Boolean(
            currentUserId &&
              req.donations?.some(
                (d) => d.donorId === currentUserId && d.status !== 'CANCELLED'
              )
          );
          const activePledges =
            req.donations?.filter(
              (d) => d.status === 'ACCEPTED' || d.status === 'COMPLETED'
            ).length || 0;
          const isFull = activePledges >= req.units;

          return (
            <View
              key={req.id}
              style={
                !isLast
                  ? {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? '#242526' : '#e6e9ef',
                    }
                  : undefined
              }
              className="py-3.5 flex-row items-center justify-between">
              {/* Left: Blood Group Badge & Patient Info */}
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View
                  style={{
                    borderColor: isDark ? 'rgba(225, 29, 72, 0.35)' : '#fecdd3',
                  }}
                  className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border items-center justify-center shrink-0">
                  <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-[15px]">
                    {formattedGroup}
                  </Text>
                </View>

                <View className="flex-1 min-w-0">
                  {/* Title Row */}
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Text
                      numberOfLines={1}
                      className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                      {req.patientName}
                    </Text>
                    {req.patientAge ? (
                      <Text className="text-[14px] text-[#65676b] dark:text-[#b0b3b8]">
                        ({req.patientAge} {locale === 'bn' ? 'বছর' : 'yrs'})
                      </Text>
                    ) : null}
                  </View>

                  {/* Hospital & Location */}
                  <Text
                    numberOfLines={1}
                    className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {req.hospitalName} • {req.location}
                  </Text>

                  {/* Units, Needed Date/Time & Problem */}
                  <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                    <Text className="text-[13.5px] font-semibold text-rose-600 dark:text-rose-400">
                      {req.units} {locale === 'bn' ? 'ব্যাগ প্রয়োজন' : 'units needed'}
                    </Text>
                    {req.neededDate && (
                      <View className="flex-row items-center gap-1">
                        <AppIcon android="schedule" size={13} color="#e11d48" />
                        <Text className="text-[13.5px] font-medium text-rose-600 dark:text-rose-400">
                          {new Date(req.neededDate).toLocaleString(
                            locale === 'bn' ? 'bn-BD' : 'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            }
                          )}
                        </Text>
                      </View>
                    )}
                    {req.problem && (
                      <Text
                        numberOfLines={1}
                        className="text-[13.5px] text-[#65676b] dark:text-[#8a8d91]">
                        • {req.problem}
                      </Text>
                    )}

                    {/* Pledged Donors Banner */}
                    {activePledges > 0 && req.donations && (
                      <View className="mt-1.5 flex-row items-center gap-1.5 flex-wrap">
                        <View
                          style={{
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
                          }}
                          className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border">
                          <AppIcon android="check" size={12} color="#059669" />
                          <Text numberOfLines={1} className="text-[12.5px] text-emerald-800 dark:text-emerald-300">
                            <Text className="font-semibold">{locale === 'bn' ? 'রক্তদাতা: ' : 'Donor: '}</Text>
                            <Text className="font-bold">
                              {req.donations
                                .filter((d) => d.status === 'ACCEPTED' || d.status === 'COMPLETED')
                                .map((d) => d.donor?.name || 'Donor')
                                .join(', ')}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Right: Action Button or Status Badge */}
              {isMyRequest ? (
                <View
                  style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
                  className="px-3 py-2 rounded-xl bg-[#e6e9ef] dark:bg-[#242526] border items-center">
                  <Text className="text-[13px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'আমার আবেদন' : 'My Request'}
                  </Text>
                </View>
              ) : isAcceptedByMe ? (
                <View
                  style={{
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#6ee7b7',
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border flex-row items-center gap-1">
                  <AppIcon android="check" size={14} color="#059669" />
                  <Text className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                    {locale === 'bn' ? 'গৃহীত' : 'Pledged'}
                  </Text>
                </View>
              ) : isFull ? (
                <View
                  style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
                  className="px-3 py-2 rounded-xl bg-[#e6e9ef] dark:bg-[#242526] border">
                  <Text className="text-[13px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn' ? 'ডোনার পূর্ণ' : 'Fulfilled'}
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => onAccept(req)}
                  disabled={acceptingId === req.id}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 active:bg-rose-700 flex-row items-center gap-1.5">
                  {acceptingId === req.id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <AppIcon android="water_drop" size={15} color="#ffffff" />
                  )}
                  <Text className="text-[14px] font-bold text-white">
                    {locale === 'bn' ? 'রক্ত দিন' : 'Donate'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      {/* Infinite Scroll Footer Spinner */}
      {isLoadingMore && (
        <View className="py-4 items-center justify-center flex-row gap-2">
          <ActivityIndicator size="small" color="#e11d48" />
          <Text className="text-[14px] text-[#65676b] dark:text-[#b0b3b8]">
            {locale === 'bn' ? 'আরও আবেদন লোড হচ্ছে...' : 'Loading more requests...'}
          </Text>
        </View>
      )}

      {/* End of List Indicator with right-side Go To Top icon */}
      {!hasMore && !isLoading && !isLoadingMore && requests.length > 0 && (
        <View className="pt-3 pb-2 items-center justify-center">
          <Pressable
            onPress={onScrollToTop}
            style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-[#e6e9ef] dark:bg-[#242526] border active:opacity-80">
            <View className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <Text className="text-[13.5px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
              {locale === 'bn'
                ? 'আর কোনো রক্তের আবেদন নেই'
                : 'No more blood requests'}
            </Text>
            {onScrollToTop && (
              <View className="ml-1 pl-1.5 border-l border-[#d0d2d6] dark:border-[#3a3b3c]">
                <AppIcon android="keyboard_arrow_up" size={15} color="#e11d48" weight="bold" />
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
