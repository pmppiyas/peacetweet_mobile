import React from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from './Icon';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const { locale } = useUi();

  if (!isOpen) return null;

  const iconBgClass =
    variant === 'warning'
      ? 'bg-amber-100 dark:bg-amber-950/50'
      : 'bg-primary-100 dark:bg-primary-950/50';

  const iconColor = variant === 'warning' ? '#d97706' : '#1877f2';

  const confirmBtnClass =
    variant === 'warning'
      ? 'bg-amber-600 active:bg-amber-700'
      : 'bg-primary-600 active:bg-primary-700';

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center p-4">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] p-5 shadow-2xl">
          <View className="flex-row items-center gap-3">
            <View
              className={`h-11 w-11 items-center justify-center rounded-full ${iconBgClass}`}>
              <AppIcon
                android={variant === 'danger' ? 'delete' : 'warning'}
                ios={
                  variant === 'danger'
                    ? 'trash'
                    : 'exclamationmark.triangle.fill'
                }
                size={20}
                color={iconColor}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb]">
                {title ||
                  (locale === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')}
              </Text>
              <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] mt-0.5">
                {subtitle ||
                  (locale === 'bn'
                    ? 'এই কাজটি বাতিল করা যাবে না।'
                    : 'This action cannot be undone.')}
              </Text>
            </View>
          </View>

          {description ? (
            <Text className="mt-3.5 text-xs text-[#65676b] dark:text-[#b0b3b8] leading-5">
              {description}
            </Text>
          ) : null}

          <View className="mt-5 flex-row items-center justify-end gap-2.5">
            <Pressable
              disabled={isLoading}
              onPress={onClose}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 active:bg-[#f0f2f5] dark:active:bg-[#3a3b3c]">
              <Text className="text-xs font-semibold text-[#65676b] dark:text-[#b0b3b8]">
                {cancelText || (locale === 'bn' ? 'বাতিল করুন' : 'Cancel')}
              </Text>
            </Pressable>

            <Pressable
              disabled={isLoading}
              onPress={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-row items-center gap-1.5 rounded-xl px-4 py-2 ${confirmBtnClass}`}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <AppIcon
                    android={variant === 'danger' ? 'delete' : 'check'}
                    ios={variant === 'danger' ? 'trash' : 'checkmark'}
                    size={14}
                    color="#ffffff"
                  />
                  <Text className="text-xs font-semibold text-white">
                    {confirmText ||
                      (locale === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Delete')}
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
