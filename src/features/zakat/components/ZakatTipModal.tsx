import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { FiqhTip } from '../constants/zakatConstants';

interface ZakatTipModalProps {
  tip: FiqhTip | null;
  onClose: () => void;
  isDark?: boolean;
  locale?: 'bn' | 'en';
}

export function ZakatTipModal({
  tip,
  onClose,
  isDark = false,
  locale = 'bn',
}: ZakatTipModalProps) {
  if (!tip) return null;

  return (
    <Modal
      visible={Boolean(tip)}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center p-4">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ backgroundColor: isDark ? '#242526' : '#f5f6f8' }}
          className="w-full max-w-md rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xl">
          <View className="flex-row items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <AppIcon android="menu_book" size={20} color="#059669" />
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn' ? tip.titleBn : tip.titleEn}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 items-center justify-center">
              <AppIcon android="close" size={14} color={isDark ? '#e4e6eb' : '#050505'} />
            </Pressable>
          </View>

          <Text className="text-sm leading-6 text-gray-700 dark:text-gray-300">
            {locale === 'bn' ? tip.descBn : tip.descEn}
          </Text>

          <Pressable
            onPress={onClose}
            className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 active:bg-emerald-700 items-center">
            <Text className="text-xs font-bold text-white">
              {locale === 'bn' ? 'বুঝতে পেরেছি' : 'Understood'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
