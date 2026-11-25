import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { useAuth } from '@/providers/AuthProvider';
import { AppIcon } from '@/components/ui/Icon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { AuthPromptCard } from '@/components/ui/AuthPromptCard';
import { BloodRequestItem } from '../types/blood.types';
import { BloodSkeleton } from './BloodSkeleton';
import { formatBloodGroup, getStatusBadge } from '../utils/blood.utils';

export interface BloodActivityTabProps {
  myRequests: BloodRequestItem[];
  myAccepted: BloodRequestItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  actionLoadingId: string | null;
  onCompleteMyRequest: (req: BloodRequestItem) => void;
  onCancelMyRequest: (req: BloodRequestItem) => void;
  onCancelAcceptedDonation: (req: BloodRequestItem) => void;
  onCall: (phone?: string | null) => void;
  onDonorMessage: (user: any) => void;
  onSwitchToCreate: () => void;
  onSwitchToRequests: () => void;
  onScrollToTop?: () => void;
}

export function BloodActivityTab({
  myRequests,
  myAccepted,
  isLoading,
  isRefreshing,
  actionLoadingId,
  onCompleteMyRequest,
  onCancelMyRequest,
  onCancelAcceptedDonation,
  onCall,
  onDonorMessage,
  onSwitchToCreate,
  onSwitchToRequests,
  onScrollToTop,
}: BloodActivityTabProps) {
  const { locale, theme } = useUi();
  const { isAuthenticated } = useAuth();
  const [activitySubTab, setActivitySubTab] = useState<'my_requests' | 'my_accepted'>('my_requests');

  const isDark = theme === 'dark';

  if (!isAuthenticated) {
    return (
      <View className="w-full pt-2">
        <View className="py-6">
          <AuthPromptCard
            icon="bookmark"
            iconBgColor="bg-rose-50 dark:bg-rose-950/60"
            iconColor="#e11d48"
            titleBn="আপনার রক্তদানের কার্যক্রম দেখতে লগইন করুন"
            titleEn="Log in to view blood activity"
            descriptionBn="আপনার করা রক্তের আবেদন এবং রক্তদাতা হিসেবে আপনার গৃহীত তালিকা দেখতে সাইন ইন করুন।"
            descriptionEn="Sign in to view blood requests posted by you and requests you have pledged to donate for."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="w-full pt-2">
      <View className="w-full">
        {/* Pill Sub-tabs: My Requests vs My Accepted */}
        <View
          style={{ width: '100%', flexDirection: 'row' }}
          className="w-full flex-row rounded-xl bg-[#e6e9ef] dark:bg-[#242526] p-1 mb-3">
          <Pressable
            onPress={() => setActivitySubTab('my_requests')}
            style={{ flex: 1, minWidth: 0 }}
            className={`py-2.5 items-center justify-center flex-row gap-1.5 rounded-lg ${
              activitySubTab === 'my_requests'
                ? 'bg-white dark:bg-[#3a3b3c]'
                : 'active:bg-white/50'
            }`}>
            <AppIcon
              android="water_drop"
              size={15}
              color={activitySubTab === 'my_requests' ? '#e11d48' : '#8a8d91'}
            />
            <Text
              numberOfLines={1}
              className={`text-[14px] font-bold ${
                activitySubTab === 'my_requests'
                  ? 'text-[#050505] dark:text-[#e4e6eb]'
                  : 'text-[#8a8d91] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn'
                ? `আমার আবেদন (${myRequests.length})`
                : `My Requests (${myRequests.length})`}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActivitySubTab('my_accepted')}
            style={{ flex: 1, minWidth: 0 }}
            className={`py-2.5 items-center justify-center flex-row gap-1.5 rounded-lg ${
              activitySubTab === 'my_accepted'
                ? 'bg-white dark:bg-[#3a3b3c]'
                : 'active:bg-white/50'
            }`}>
            <AppIcon
              android="favorite"
              size={15}
              color={activitySubTab === 'my_accepted' ? '#e11d48' : '#8a8d91'}
            />
            <Text
              numberOfLines={1}
              className={`text-[14px] font-bold ${
                activitySubTab === 'my_accepted'
                  ? 'text-[#050505] dark:text-[#e4e6eb]'
                  : 'text-[#8a8d91] dark:text-[#b0b3b8]'
              }`}>
              {locale === 'bn'
                ? `গৃহীত রক্তদান (${myAccepted.length})`
                : `Accepted (${myAccepted.length})`}
            </Text>
          </Pressable>
        </View>

        {/* Content of Sub-Tab 1: My Requests */}
        {activitySubTab === 'my_requests' && (
          <View>
            {isLoading && !isRefreshing && myRequests.length === 0 ? (
              <BloodSkeleton count={3} />
            ) : myRequests.length === 0 ? (
              <View
                style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
                className="rounded-2xl border border-dashed p-8 items-center justify-center my-4">
                <AppIcon android="inbox" size={26} color="#e11d48" />
                <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8] mt-2.5 font-medium text-center">
                  {locale === 'bn'
                    ? 'আপনি এখনও কোনো রক্তের আবেদন পোস্ট করেননি।'
                    : 'You have not posted any blood requests yet.'}
                </Text>
                <Pressable
                  onPress={onSwitchToCreate}
                  className="mt-3.5 px-4 py-2.5 rounded-xl bg-rose-600 active:bg-rose-700 flex-row items-center gap-1.5">
                  <AppIcon android="add" size={16} color="#ffffff" />
                  <Text className="text-[14px] font-bold text-white">
                    {locale === 'bn' ? 'নতুন আবেদন করুন' : 'Create New Request'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              myRequests.map((req, index) => {
                const isLast = index === myRequests.length - 1;
                const formattedGroup = formatBloodGroup(req.bloodGroup);
                const statusBadge = getStatusBadge(req.status, locale);

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
                    className="py-3.5">
                    <View className="flex-row items-start justify-between gap-2">
                      {/* Left: Blood Group Badge & Patient Info */}
                      <View className="flex-row items-start gap-3 flex-1 min-w-0">
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
                          {/* Title & Status Row */}
                          <View className="flex-row items-center gap-2 flex-wrap">
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
                            <View
                              className={`flex-row items-center gap-1 px-2.5 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.border}`}>
                              {statusBadge.isPosting && (
                                <ActivityIndicator size="small" color="#e11d48" style={{ transform: [{ scale: 0.65 }] }} />
                              )}
                              <Text className={`text-[12.5px] font-bold ${statusBadge.text}`}>
                                {statusBadge.label}
                              </Text>
                            </View>
                          </View>

                          {/* Hospital & Location */}
                          <Text
                            numberOfLines={1}
                            className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                            {req.hospitalName} • {req.location}
                          </Text>

                          {/* Units & Needed Date/Time */}
                          <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                            <Text className="text-[13.5px] font-semibold text-rose-600 dark:text-rose-400">
                              {req.unitsFulfilled}/{req.units}{' '}
                              {locale === 'bn' ? 'ব্যাগ রক্ত' : 'units'}
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
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Donors who accepted this request */}
                    {(() => {
                      const activeDonations = (req.donations || []).filter(
                        (d) => d.status === 'ACCEPTED' || d.status === 'COMPLETED'
                      );
                      if (activeDonations.length === 0) return null;

                      return (
                        <View
                          style={{
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
                          }}
                          className="mt-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border">
                          <View
                            style={{
                              borderBottomColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#d1fae5',
                            }}
                            className="flex-row items-center justify-between mb-2 pb-1.5 border-b">
                            <View className="flex-row items-center gap-1.5">
                              <AppIcon android="check_circle" size={15} color="#059669" />
                              <Text className="text-[13.5px] font-bold text-emerald-900 dark:text-emerald-300">
                                {locale === 'bn' ? 'রক্তদানে সম্মত রক্তদাতা:' : 'Pledged Donors:'}
                              </Text>
                            </View>
                            <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60">
                              <Text className="text-[12.5px] font-bold text-emerald-800 dark:text-emerald-300">
                                {activeDonations.length} {locale === 'bn' ? 'জন' : 'Donor(s)'}
                              </Text>
                            </View>
                          </View>

                          <View className="gap-2.5">
                            {activeDonations.map((d) => {
                              const donorName = d.donor?.name || 'Blood Donor';
                              const donorGroup = d.donor?.bloodGroup ? formatBloodGroup(d.donor.bloodGroup) : null;
                              const isCompleted = d.status === 'COMPLETED';

                              return (
                                <View
                                  key={d.id}
                                  style={{
                                    borderColor: isDark ? '#393a3b' : '#d1fae5',
                                  }}
                                  className="flex-row items-center justify-between bg-white dark:bg-[#242526] p-2.5 rounded-xl border">
                                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0 pr-2">
                                    <UserAvatar
                                      name={donorName}
                                      avatarUrl={d.donor?.avatarUrl}
                                      size="md"
                                    />
                                    <View className="flex-1 min-w-0">
                                      <View className="flex-row items-center gap-1.5 flex-wrap">
                                        <Text
                                          numberOfLines={1}
                                          className="text-[14.5px] font-bold text-[#050505] dark:text-[#e4e6eb]">
                                          {donorName}
                                        </Text>
                                        {donorGroup && (
                                          <View
                                            style={{
                                              borderColor: isDark ? 'rgba(225, 29, 72, 0.35)' : '#fecdd3',
                                            }}
                                            className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border">
                                            <Text className="text-[12px] font-extrabold text-rose-600 dark:text-rose-400">
                                              {donorGroup}
                                            </Text>
                                          </View>
                                        )}
                                      </View>
                                      <Text className="text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                                        {isCompleted
                                          ? (locale === 'bn' ? '✓ রক্তদান সম্পন্ন' : '✓ Donation Completed')
                                          : (locale === 'bn' ? '✓ রক্ত দিতে সম্মত হয়েছেন' : '✓ Agreed to donate')}
                                      </Text>
                                    </View>
                                  </View>

                                  {d.donor && (
                                    <Pressable
                                      onPress={() => onDonorMessage(d.donor as any)}
                                      className="px-3 py-2 rounded-lg bg-rose-600 active:bg-rose-700 flex-row items-center gap-1">
                                      <AppIcon
                                        android="chat_bubble"
                                        size={14}
                                        color="#ffffff"
                                      />
                                      <Text className="text-[13.5px] font-bold text-white">
                                        {locale === 'bn' ? 'মেসেজ' : 'Chat'}
                                      </Text>
                                    </Pressable>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Actions: Mark Completed or Cancel */}
                    {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && req.status !== 'POSTING' && (
                      <View
                        style={{
                          borderTopColor: isDark ? '#242526' : '#e6e9ef',
                        }}
                        className="flex-row items-center gap-2 mt-2.5 pt-2.5 border-t">
                        <Pressable
                          onPress={() => onCompleteMyRequest(req)}
                          disabled={actionLoadingId === req.id}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center gap-1.5">
                          {actionLoadingId === req.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <AppIcon android="check" size={15} color="#ffffff" />
                          )}
                          <Text className="text-[14px] font-bold text-white">
                            {locale === 'bn' ? 'রক্ত পেয়েছি (Complete)' : 'Mark as Completed'}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => onCancelMyRequest(req)}
                          disabled={actionLoadingId === req.id}
                          className="py-2 px-3.5 rounded-xl bg-gray-100 dark:bg-[#3a3b3c] active:opacity-70 flex-row items-center justify-center gap-1">
                          <AppIcon
                            android="close"
                            size={15}
                            color={isDark ? '#b0b3b8' : '#65676b'}
                          />
                          <Text className="text-[14px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                            {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* End of list indicator with right-side Go To Top icon */}
            {!isLoading && myRequests.length > 0 && (
              <View className="pt-3 pb-2 items-center justify-center">
                <Pressable
                  onPress={onScrollToTop}
                  style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
                  className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-[#e6e9ef] dark:bg-[#242526] border active:opacity-80">
                  <View className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <Text className="text-[13.5px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'আর কোনো আবেদন নেই'
                      : 'No more requests'}
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
        )}

        {/* Content of Sub-Tab 2: My Accepted (গৃহীত রক্তদান) */}
        {activitySubTab === 'my_accepted' && (
          <View>
            {isLoading && !isRefreshing && myAccepted.length === 0 ? (
              <BloodSkeleton count={3} />
            ) : myAccepted.length === 0 ? (
              <View
                style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
                className="rounded-2xl border border-dashed p-8 items-center justify-center my-4">
                <AppIcon android="favorite" size={26} color="#e11d48" />
                <Text className="text-[15px] leading-[22px] text-[#65676b] dark:text-[#b0b3b8] mt-2.5 font-medium text-center">
                  {locale === 'bn'
                    ? 'আপনি এখনও কোনো রক্তদানের আবেদন গ্রহণ করেননি।'
                    : 'You have not pledged to donate for any requests yet.'}
                </Text>
                <Pressable
                  onPress={onSwitchToRequests}
                  className="mt-3.5 px-4 py-2.5 rounded-xl bg-rose-600 active:bg-rose-700 flex-row items-center gap-1.5">
                  <AppIcon android="search" size={16} color="#ffffff" />
                  <Text className="text-[14px] font-bold text-white">
                    {locale === 'bn' ? 'রক্তের আবেদন খুঁজুন' : 'Explore Blood Requests'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              myAccepted.map((req, index) => {
                const isLast = index === myAccepted.length - 1;
                const formattedGroup = formatBloodGroup(req.bloodGroup);

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
                    className="py-3.5">
                    <View className="flex-row items-start gap-3">
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

                        <Text
                          numberOfLines={1}
                          className="text-[14px] text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                          🏥 {req.hospitalName} • {req.location}
                        </Text>

                        {/* Needed Date & Time */}
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <AppIcon android="schedule" size={14} color="#e11d48" />
                          <Text className="text-[13.5px] font-bold text-rose-600 dark:text-rose-400">
                            {locale === 'bn' ? 'প্রয়োজন: ' : 'Needed: '}
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

                        {/* Direct Actions: Call, Chat & Cancel Commitment */}
                        <View className="flex-row items-center gap-2 mt-3 flex-wrap">
                          <Pressable
                            onPress={() => onCall(req.contactNumber)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 active:bg-emerald-700 flex-row items-center gap-1.5">
                            <AppIcon android="call" size={15} color="#ffffff" />
                            <Text className="text-[14px] font-bold text-white">
                              {locale === 'bn' ? 'কল দিন' : 'Call'}
                            </Text>
                          </Pressable>

                          {(req.requester || req.requesterId) && (
                            <Pressable
                              onPress={() =>
                                onDonorMessage(
                                  (req.requester as any) || { id: req.requesterId, username: req.patientName }
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-rose-600 active:bg-rose-700 flex-row items-center gap-1.5">
                              <AppIcon android="chat_bubble" size={15} color="#ffffff" />
                              <Text className="text-[14px] font-bold text-white">
                                {locale === 'bn' ? 'মেসেজ' : 'Chat'}
                              </Text>
                            </Pressable>
                          )}

                          <Pressable
                            onPress={() => onCancelAcceptedDonation(req)}
                            disabled={actionLoadingId === req.id}
                            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#3a3b3c] active:opacity-70 flex-row items-center gap-1">
                            {actionLoadingId === req.id ? (
                              <ActivityIndicator size="small" color="#e11d48" />
                            ) : (
                              <AppIcon android="close" size={14} color="#e11d48" />
                            )}
                            <Text className="text-[14px] font-semibold text-rose-600 dark:text-rose-400">
                              {locale === 'bn' ? 'অপারগ / বাতিল' : 'Cancel'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* End of list indicator with right-side Go To Top icon */}
            {!isLoading && myAccepted.length > 0 && (
              <View className="pt-3 pb-2 items-center justify-center">
                <Pressable
                  onPress={onScrollToTop}
                  style={{ borderColor: isDark ? '#393a3b' : '#e4e6eb' }}
                  className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-[#e6e9ef] dark:bg-[#242526] border active:opacity-80">
                  <View className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <Text className="text-[13.5px] font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                    {locale === 'bn'
                      ? 'আর কোনো গৃহীত রক্তদান নেই'
                      : 'No more accepted pledges'}
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
        )}
      </View>
    </View>
  );
}
