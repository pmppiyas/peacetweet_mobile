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
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center p-4">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: isDark ? '#242526' : '#ffffff',
            borderColor: isDark ? '#393a3b' : '#e4e6eb',
          }}
          className="w-full max-w-md rounded-2xl p-5 border shadow-xl">
          <View
            style={{ borderBottomColor: isDark ? '#333436' : '#f0f2f5' }}
            className="flex-row items-center justify-between mb-3.5 border-b pb-3">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <AppIcon android="menu_book" size={22} color="#059669" />
              <Text className="text-[17px] font-bold text-[#050505] dark:text-[#e4e6eb] flex-1">
                {locale === 'bn' ? tip.titleBn : tip.titleEn}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 items-center justify-center">
              <AppIcon android="close" size={16} color={isDark ? '#e4e6eb' : '#050505'} />
            </Pressable>
          </View>

          <Text className="text-base leading-6 text-[#1c1e21] dark:text-[#e4e6eb]">
            {locale === 'bn' ? tip.descBn : tip.descEn}
          </Text>

          <Pressable
            onPress={onClose}
            className="mt-5 w-full py-3 rounded-xl bg-emerald-600 active:bg-emerald-700 items-center">
            <Text className="text-[15px] font-bold text-white">
              {locale === 'bn' ? 'বুঝতে পেরেছি' : 'Understood'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
