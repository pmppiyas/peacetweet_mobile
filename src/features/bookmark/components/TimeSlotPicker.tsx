import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { TimeSlot, TIME_SLOTS } from '@/types/saved.types';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

interface TimeSlotPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot?: TimeSlot | string | null;
  onSelectSlot: (slot: TimeSlot | null) => void;
  onRemove?: () => void;
  title?: string;
  itemTitle?: string;
}

export function TimeSlotPicker({
  isOpen,
  onClose,
  selectedSlot,
  onSelectSlot,
  onRemove,
  title,
  itemTitle,
}: TimeSlotPickerProps) {
  const { locale, theme } = useUi();

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 justify-end sm:justify-center sm:items-center p-0 sm:p-4">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] p-5 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-[#e4e6eb] dark:border-[#393a3b]">
            <View className="flex-row items-center gap-2.5 flex-1">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950/60">
                <AppIcon
                  android="schedule"
                  ios="clock"
                  size={20}
                  color={theme === 'dark' ? '#4a80f5' : '#1565d8'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                  {title ||
                    (locale === 'bn'
                      ? 'পড়ার নির্দিষ্ট সময় নির্ধারণ করুন'
                      : 'Choose reading routine')}
                </Text>
                {itemTitle ? (
                  <Text
                    numberOfLines={1}
                    className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                    {itemTitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="p-1.5 rounded-full active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
              <AppIcon
                android="close"
                ios="xmark"
                size={20}
                color={theme === 'dark' ? '#b0b3b8' : '#65676b'}
              />
            </Pressable>
          </View>

          {/* Routine Slots Grid */}
          <View className="mt-4 flex-row flex-wrap gap-2.5">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => {
                    onSelectSlot(slot.id);
                    onClose();
                  }}
                  className={`w-[48%] justify-between p-3 rounded-2xl border min-h-[88px] ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40'
                      : 'border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526]'
                  }`}>
                  <View className="flex-row items-center justify-between w-full mb-1">
                    <Text className="text-2xl">{slot.icon}</Text>
                    {isSelected && (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                        <AppIcon
                          android="check"
                          ios="checkmark"
                          size={13}
                          color="#ffffff"
                        />
                      </View>
                    )}
                  </View>
                  <View>
                    <Text
                      numberOfLines={1}
                      className="text-sm font-bold text-[#050505] dark:text-white">
                      {locale === 'bn' ? slot.labelBn : slot.labelEn}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                      {locale === 'bn' ? slot.routineBn : slot.routineEn}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {/* Any Time / General Option */}
            <Pressable
              onPress={() => {
                onSelectSlot(null);
                onClose();
              }}
              className={`w-[48%] justify-between p-3 rounded-2xl border min-h-[88px] ${
                !selectedSlot
                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40'
                  : 'border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526]'
              }`}>
              <View className="flex-row items-center justify-between w-full mb-1">
                <Text className="text-2xl">🗂️</Text>
                {!selectedSlot && (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                    <AppIcon
                      android="check"
                      ios="checkmark"
                      size={13}
                      color="#ffffff"
                    />
                  </View>
                )}
              </View>
              <View>
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold text-[#050505] dark:text-white">
                  {locale === 'bn' ? 'যেকোনো সময়' : 'Anytime'}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[11px] text-[#65676b] dark:text-[#b0b3b8]">
                  {locale === 'bn'
                    ? 'সাধারণ / কোনো ওয়াক্ত ছাড়া'
                    : 'General / No routine'}
                </Text>
              </View>
            </Pressable>
          </View>

          {onRemove && (
            <View className="mt-4 pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b]">
              <Pressable
                onPress={() => {
                  onRemove();
                  onClose();
                }}
                className="w-full flex-row items-center justify-center gap-2 p-2.5 rounded-xl active:bg-rose-50 dark:active:bg-rose-950/30">
                <AppIcon
                  android="delete"
                  ios="trash"
                  size={16}
                  color="#e11d48"
                />
                <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {locale === 'bn'
                    ? 'সংরক্ষণ তালিকা থেকে বাদ দিন'
                    : 'Remove from Saved'}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function TimeSlotBadge({
  timeSlot,
  onPress,
  size = 'md',
  fallbackLabel,
}: {
  timeSlot?: TimeSlot | string | null;
  onPress?: () => void;
  size?: 'sm' | 'md';
  fallbackLabel?: string;
}) {
  const { locale } = useUi();
  const config = timeSlot ? TIME_SLOTS.find((s) => s.id === timeSlot) : null;

  if (!config) {
    if (!fallbackLabel) return null;
    return (
      <Pressable
        onPress={onPress}
        className={`flex-row items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 ${
          size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
        }`}>
        <Text className={size === 'sm' ? 'text-[10px]' : 'text-[11px]'}>
          📌
        </Text>
        <Text
          className={`font-bold text-gray-700 dark:text-gray-300 ${
            size === 'sm' ? 'text-[10px]' : 'text-[11px]'
          }`}>
          {fallbackLabel}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1 rounded-full ${config.badgeBg} ${
        size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}>
      <Text className={size === 'sm' ? 'text-[10px]' : 'text-[11px]'}>
        {config.icon}
      </Text>
      <Text
        className={`font-bold ${config.badgeText} ${
          size === 'sm' ? 'text-[10px]' : 'text-[11px]'
        }`}>
        {locale === 'bn' ? config.labelBn : config.labelEn}
      </Text>
    </Pressable>
  );
}
