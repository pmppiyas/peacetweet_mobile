import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { ComposerMode } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export interface ComposerHeaderProps {
  isEditing: boolean;
  postType: ComposerMode;
  onChangePostType: (type: ComposerMode) => void;
  isPostValid: boolean;
  isSubmitting: boolean;
  isUploadingMedia: boolean;
  onClose: () => void;
  onSubmit: () => void;
  theme?: 'light' | 'dark';
  locale?: string;
}

export function ComposerHeader({
  isEditing,
  postType,
  onChangePostType,
  isPostValid,
  isSubmitting,
  isUploadingMedia,
  onClose,
  onSubmit,
  theme = 'light',
  locale = 'bn',
}: ComposerHeaderProps) {
  return (
    <View style={{ backgroundColor: theme === 'dark' ? '#18191a' : '#ffffff' }}>
      {/* 1. TOP HEADER BAR */}
      <View
        className="flex-row items-center justify-between px-3.5 h-14 border-b border-[#d9dde4] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a]">
        <Pressable
          onPress={onClose}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#e6e9ef] dark:bg-[#2d2e2f] active:scale-95">
          <AppIcon
            android="close"
            ios="xmark"
            size={20}
            color={theme === 'dark' ? '#e4e6eb' : '#1e2329'}
          />
        </Pressable>

        <View className="flex-row items-center gap-1.5">
          <AppIcon
            android={isEditing ? 'edit' : 'auto_awesome'}
            ios={isEditing ? 'pencil' : 'sparkles'}
            size={16}
            color={
              isEditing
                ? postType === 'BLOOD_REQUEST'
                  ? '#e11d48'
                  : postType === 'DUA'
                  ? '#059669'
                  : '#0866FF'
                : '#0866FF'
            }
          />
          <Text className="font-bold text-sm text-[#1e2329] dark:text-[#e4e6eb]">
            {isEditing
              ? postType === 'BLOOD_REQUEST'
                ? locale === 'bn'
                  ? 'রক্তের অনুরোধ সম্পাদনা'
                  : 'Edit Blood Request'
                : postType === 'DUA'
                ? locale === 'bn'
                  ? 'পবিত্র দু’আ সম্পাদনা'
                  : 'Edit Dua Post'
                : locale === 'bn'
                  ? 'পোস্ট সম্পাদনা'
                  : 'Edit Post'
              : locale === 'bn'
                ? 'নতুন পোস্ট'
                : 'Create Post'}
          </Text>
        </View>

        <Pressable
          disabled={!isPostValid || isSubmitting || isUploadingMedia}
          onPress={onSubmit}
          className={`flex-row items-center justify-center gap-1.5 px-4 py-1.5 rounded-full active:scale-95 ${
            isPostValid && !isSubmitting && !isUploadingMedia
              ? postType === 'BLOOD_REQUEST'
                ? 'bg-rose-600'
                : postType === 'DUA'
                  ? 'bg-emerald-600'
                  : 'bg-primary-500'
              : 'bg-gray-100 dark:bg-gray-800 opacity-60'
          }`}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <AppIcon
                android={isEditing ? 'check' : 'send'}
                ios={isEditing ? 'checkmark' : 'paperplane.fill'}
                size={15}
                color={isPostValid ? '#ffffff' : '#9ca3af'}
              />
              <Text
                className={`text-[13.5px] font-bold ${
                  isPostValid
                    ? 'text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                {isEditing
                  ? locale === 'bn'
                    ? 'আপডেট'
                    : 'Update'
                  : locale === 'bn'
                    ? 'পোস্ট'
                    : 'Post'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* 2. POST TYPE SEGMENTED ROW (Only when creating new post) */}
      {!isEditing && (
        <View className="px-3.5 py-1.5 border-b border-[#d9dde4]/60 dark:border-[#2d2e2f] bg-[#eef0f5] dark:bg-[#1f2022]">
          <View className="flex-row gap-1 p-0.5 rounded-xl bg-[#e6e9ef] dark:bg-[#2a2b2d]">
            <Pressable
              onPress={() => onChangePostType('TEXT')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-lg ${
                postType === 'TEXT' ? 'bg-white dark:bg-[#18191a] shadow-xs' : ''
              }`}>
              <AppIcon
                android="edit"
                size={14}
                color={postType === 'TEXT' ? '#0866FF' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'TEXT'
                    ? 'text-[#0866FF] dark:text-[#36a4fa]'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'ভাবনা / সাধারণ' : 'Reflection'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onChangePostType('DUA')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-lg ${
                postType === 'DUA' ? 'bg-white dark:bg-[#18191a] shadow-xs' : ''
              }`}>
              <AppIcon
                android="menu_book"
                size={14}
                color={postType === 'DUA' ? '#059669' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'DUA'
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'পবিত্র দু’আ' : 'Dua'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onChangePostType('BLOOD_REQUEST')}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-lg ${
                postType === 'BLOOD_REQUEST' ? 'bg-white dark:bg-[#18191a] shadow-xs' : ''
              }`}>
              <AppIcon
                android="water_drop"
                size={14}
                color={postType === 'BLOOD_REQUEST' ? '#e11d48' : '#65676b'}
              />
              <Text
                className={`text-xs font-bold ${
                  postType === 'BLOOD_REQUEST'
                    ? 'text-rose-600 dark:text-rose-300'
                    : 'text-[#65676b] dark:text-[#b0b3b8]'
                }`}>
                {locale === 'bn' ? 'রক্তদান' : 'Blood'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
