import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { AppIcon } from '@/components/ui/Icon';
import { FEELINGS } from '@/features/feed/constants/feelings';

export interface ComposerFeelingsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFeelingId: string | null;
  onSelectFeeling: (id: string | null) => void;
  theme?: 'light' | 'dark';
  locale?: string;
}

export function ComposerFeelingsModal({
  visible,
  onClose,
  selectedFeelingId,
  onSelectFeeling,
  theme = 'light',
  locale = 'bn',
}: ComposerFeelingsModalProps) {
  return (
    <Modal
      visible={visible}
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
          className="w-full max-w-sm rounded-3xl border border-[#e4e6eb] bg-white p-4 shadow-2xl dark:border-[#393a3b] dark:bg-[#242526]">
          {/* Dialog Header */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-[#e4e6eb] dark:border-[#393a3b]">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                <AppIcon
                  android="sentiment_satisfied"
                  ios="face.smiling"
                  size={18}
                  color="#d97706"
                />
              </View>
              <Text className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb]">
                {locale === 'bn'
                  ? 'কেমন অনুভব করছেন?'
                  : 'How are you feeling?'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-1 rounded-full active:bg-[#e6e9ef] dark:active:bg-[#3a3b3c]">
              <AppIcon
                android="close"
                ios="xmark"
                size={18}
                color={theme === 'dark' ? '#e4e6eb' : '#050505'}
              />
            </Pressable>
          </View>

          {/* 12 Feelings Grid */}
          <ScrollView style={{ maxHeight: 300 }}>
            <View className="flex-row flex-wrap gap-2">
              {FEELINGS.map((item) => {
                const isSelected = selectedFeelingId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      onSelectFeeling(item.id);
                      onClose();
                    }}
                    className={`w-[48%] flex-row items-center gap-2 p-2.5 rounded-2xl border active:scale-95 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:border-amber-700'
                        : 'bg-[#f8f9fa] dark:bg-[#18191a] border-[#e4e6eb]/60 dark:border-[#393a3b]/60'
                    }`}>
                    <Text className="text-lg">{item.emoji}</Text>
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        isSelected
                          ? 'text-amber-900 dark:text-amber-200'
                          : 'text-[#050505] dark:text-[#e4e6eb]'
                      }`}>
                      {locale === 'bn' ? item.labelBn : item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Clear Feeling Option */}
          {selectedFeelingId && (
            <View className="mt-3 pt-3 border-t border-[#e4e6eb] dark:border-[#393a3b] items-end">
              <Pressable
                onPress={() => {
                  onSelectFeeling(null);
                  onClose();
                }}>
                <Text className="text-xs font-bold text-rose-600">
                  {locale === 'bn' ? 'অনুভূতি মুছুন' : 'Remove Feeling'}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
