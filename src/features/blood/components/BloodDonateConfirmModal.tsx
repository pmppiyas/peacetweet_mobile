import React from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import { BloodRequestItem } from '../types/blood.types';
import { formatBloodGroup } from '../utils/blood.utils';

export interface BloodDonateConfirmModalProps {
  isOpen: boolean;
  request: BloodRequestItem | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BloodDonateConfirmModal({
  isOpen,
  request,
  isLoading,
  onClose,
  onConfirm,
}: BloodDonateConfirmModalProps) {
  const { locale } = useUi();

  if (!isOpen || !request) return null;

  const formattedGroup = formatBloodGroup(request.bloodGroup);

  return (
    <Modal
      visible={isOpen}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={isLoading ? undefined : onClose}
    >
      <Pressable
        onPress={isLoading ? undefined : onClose}
        className="flex-1 bg-black/60 items-center justify-center p-4"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] p-5 shadow-2xl"
        >
          {/* Header Icon & Title */}
          <View className="items-center text-center mb-4">
            <View className="h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 items-center justify-center shadow-xs mb-2.5">
              <AppIcon android="water_drop" size={28} color="#e11d48" />
            </View>
            <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] text-center">
              {locale === 'bn'
                ? 'রক্তদানের অঙ্গীকার নিশ্চিতকরণ'
                : 'Confirm Blood Donation Pledge'}
            </Text>
            <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center mt-1">
              {locale === 'bn'
                ? 'আপনার রক্তদান বাঁচাতে পারে একটি মূল্যবান প্রাণ'
                : 'Your donation can save a valuable life'}
            </Text>
          </View>

          {/* Patient Card Preview */}
          <View className="rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-3.5 mb-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 rounded-2xl bg-rose-600 items-center justify-center shadow-xs">
                <Text className="text-white font-extrabold text-base">
                  {formattedGroup}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5 flex-wrap">
                  <Text
                    numberOfLines={1}
                    className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]"
                  >
                    {request.patientName}
                  </Text>
                  {request.patientAge ? (
                    <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8]">
                      ({request.patientAge} {locale === 'bn' ? 'বছর' : 'yrs'})
                    </Text>
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5"
                >
                  {request.hospitalName} • {request.location}
                </Text>
              </View>
            </View>

            {/* Units & Needed Date */}
            <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-rose-200/50 dark:border-rose-900/40">
              <View className="flex-row items-center gap-1">
                <AppIcon android="bloodtype" size={13} color="#e11d48" />
                <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {request.units}{' '}
                  {locale === 'bn' ? 'ব্যাগ প্রয়োজন' : 'units needed'}
                </Text>
              </View>

              {request.neededDate && (
                <View className="flex-row items-center gap-1">
                  <AppIcon android="schedule" size={12} color="#65676b" />
                  <Text className="text-[11px] font-medium text-[#65676b] dark:text-[#b0b3b8]">
                    {new Date(request.neededDate).toLocaleDateString(
                      locale === 'bn' ? 'bn-BD' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </Text>
                </View>
              )}
            </View>

            {request.problem ? (
              <Text
                numberOfLines={1}
                className="text-[11px] text-[#8a8d91] dark:text-[#8a8d91] mt-1.5 italic"
              >
                • {request.problem}
              </Text>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center justify-end gap-2.5">
            <Pressable
              disabled={isLoading}
              onPress={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 items-center justify-center active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]"
            >
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {locale === 'bn' ? 'বাতিল' : 'Cancel'}
              </Text>
            </Pressable>

            <Pressable
              disabled={isLoading}
              onPress={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 active:bg-rose-700 flex-row items-center justify-center gap-1.5 shadow-xs"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <AppIcon android="favorite" size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">
                    {locale === 'bn' ? 'হ্যাঁ, রক্ত দেব' : 'Yes, Pledge'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
