import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ComposerMode } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';
import {
  POST_BACKGROUNDS,
  PostBackgroundOption,
} from '@/features/feed/constants/postBackgrounds';
import { PostBackgroundView } from '@/features/feed/components/PostBackgroundView';

export interface ComposerBottomBarProps {
  postType: ComposerMode;
  mediaUrls: string[];
  selectedBackground: PostBackgroundOption | null;
  onSelectBackground: (bg: PostBackgroundOption | null) => void;
  showBackgroundPicker: boolean;
  onToggleBackgroundPicker: () => void;
  onPickImages: () => void;
  isUploadingMedia: boolean;
  selectedFeeling: any;
  onOpenFeelingPicker: () => void;
  contentLength: number;
  charLimit?: number;
  keyboardHeight: number;
  insetsBottom: number;
  theme?: 'light' | 'dark';
  locale?: string;
  onFocusInput?: () => void;
}

export function ComposerBottomBar({
  postType,
  mediaUrls,
  selectedBackground,
  onSelectBackground,
  showBackgroundPicker,
  onToggleBackgroundPicker,
  onPickImages,
  isUploadingMedia,
  selectedFeeling,
  onOpenFeelingPicker,
  contentLength,
  charLimit = 5000,
  keyboardHeight,
  insetsBottom,
  theme = 'light',
  locale = 'bn',
  onFocusInput,
}: ComposerBottomBarProps) {
  // Circular character progress ring
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(contentLength / charLimit, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View
      style={{
        paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
        backgroundColor: theme === 'dark' ? '#18191a' : '#ffffff',
      }}
    >
      {/* ────────────────── 1. FACEBOOK-STYLE BACKGROUND SELECTOR BAR ────────────────── */}
      {postType === 'TEXT' && mediaUrls.length === 0 && (showBackgroundPicker || selectedBackground) && (
        <View className="py-2.5 px-3 border-t border-[#f0f2f5] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, alignItems: 'center', paddingHorizontal: 2 }}
          >
            {POST_BACKGROUNDS.map((bg) => {
              const isSelected =
                (!selectedBackground && bg.id === 'none') ||
                selectedBackground?.id === bg.id;

              return (
                <Pressable
                  key={bg.id}
                  onPress={() => {
                    if (bg.type === 'none') {
                      onSelectBackground(null);
                    } else {
                      onSelectBackground(bg);
                    }
                    setTimeout(() => {
                      onFocusInput?.();
                    }, 50);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    overflow: 'hidden',
                    borderWidth: isSelected ? 2.5 : 1,
                    borderColor: isSelected
                      ? '#0866FF'
                      : theme === 'dark'
                        ? '#3e4146'
                        : '#d0d5dd',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: bg.thumbBg,
                    transform: [{ scale: isSelected ? 1.08 : 1 }],
                    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                  } as any}
                >
                  {bg.type === 'none' ? (
                    <AppIcon android="block" ios="nosign" size={17} color="#65676b" />
                  ) : bg.type === 'image' && bg.thumbImage ? (
                    <Image source={bg.thumbImage} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : bg.type === 'gradient' && bg.gradientColors ? (
                    <PostBackgroundView background={bg} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ────────────────── 2. FIXED BOTTOM ACCESSORY TOOLBAR ────────────────── */}
      <View className="h-14 border-t border-[#e4e6eb] dark:border-[#2d2e2f] bg-white dark:bg-[#18191a] px-4 flex-row items-center justify-between select-none">
        {/* Left: Quick Action Buttons */}
        <View className="flex-row items-center gap-2">
          {/* Style / Background Button (Active in TEXT mode when no media attached) */}
          {postType === 'TEXT' && mediaUrls.length === 0 && (
            <Pressable
              onPress={onToggleBackgroundPicker}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
                selectedBackground && selectedBackground.type !== 'none'
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800'
                  : showBackgroundPicker
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800'
                    : 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/50'
              }`}>
              <View className="h-4 w-4 rounded-full items-center justify-center bg-[#8b5cf6]">
                <Text className="text-[10px] font-black text-white leading-none">Aa</Text>
              </View>
              <Text className="text-xs font-bold text-purple-700 dark:text-purple-300">
                {selectedBackground && selectedBackground.type !== 'none'
                  ? locale === 'bn'
                    ? selectedBackground.nameBn
                    : selectedBackground.nameEn
                  : locale === 'bn'
                    ? 'স্টাইল'
                    : 'Style'}
              </Text>
            </Pressable>
          )}

          {/* Photo Button (Active in TEXT mode) */}
          {postType === 'TEXT' && (
            <Pressable
              onPress={onPickImages}
              disabled={isUploadingMedia || mediaUrls.length >= 10}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
                mediaUrls.length > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50'
              }`}>
              {isUploadingMedia ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <AppIcon android="image" ios="photo" size={16} color="#059669" />
              )}
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {isUploadingMedia
                  ? locale === 'bn'
                    ? 'আপলোড হচ্ছে...'
                    : 'Uploading...'
                  : locale === 'bn'
                    ? 'ছবি যুক্ত'
                    : 'Photo'}
              </Text>
              {mediaUrls.length > 0 && (
                <View className="h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                  <Text className="text-[10px] font-bold text-white">
                    {mediaUrls.length}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Feeling Button */}
          <Pressable
            onPress={onOpenFeelingPicker}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:scale-95 ${
              selectedFeeling
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/50'
            }`}>
            <AppIcon
              android="sentiment_satisfied"
              ios="face.smiling"
              size={16}
              color="#d97706"
            />
            <Text className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {selectedFeeling
                ? locale === 'bn'
                  ? `${selectedFeeling.emoji} ${selectedFeeling.labelBn}`
                  : `${selectedFeeling.emoji} ${selectedFeeling.label}`
                : locale === 'bn'
                  ? 'অনুভূতি'
                  : 'Feeling'}
            </Text>
          </Pressable>
        </View>

        {/* Right: Counter Ring / Mode Label */}
        <View className="flex-row items-center gap-2">
          {postType === 'TEXT' && (
            <View className="flex-row items-center gap-1.5">
              <Svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx={12}
                  cy={12}
                  r={radius}
                  stroke={theme === 'dark' ? '#3a3b3c' : '#e4e6eb'}
                  strokeWidth={2.5}
                  fill="transparent"
                />
                <Circle
                  cx={12}
                  cy={12}
                  r={radius}
                  stroke={
                    progress > 0.9
                      ? '#ef4444'
                      : progress > 0.7
                        ? '#f59e0b'
                        : '#0866FF'
                  }
                  strokeWidth={2.5}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </Svg>
              <Text className="text-[11px] font-bold text-[#8e8e93] dark:text-[#a0a0a5]">
                {contentLength > 4500
                  ? charLimit - contentLength
                  : `${contentLength}/${charLimit}`}
              </Text>
            </View>
          )}

          {postType === 'DUA' && (
            <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {locale === 'bn' ? '🌙 পবিত্র দু’আ' : '🌙 Authentic Dua'}
            </Text>
          )}

          {postType === 'BLOOD_REQUEST' && (
            <Text className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              {locale === 'bn' ? '🩸 রক্তদানের আবেদন' : '🩸 Blood Request'}
            </Text>
          )}
        </View>
      </View>

      {/* ────────────────── 3. BOTTOM ENDPOINT / SAFE AREA BAR ────────────────── */}
      {keyboardHeight === 0 && (
        <View
          style={{
            height: Math.max(insetsBottom, Platform.OS === 'android' ? 16 : 0),
            backgroundColor: theme === 'dark' ? '#18191a' : '#ffffff',
          }}
        />
      )}
    </View>
  );
}
