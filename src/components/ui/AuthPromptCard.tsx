import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export interface AuthPromptCardProps {
  icon?: string;
  iconBgColor?: string;
  iconColor?: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  className?: string;
  isCard?: boolean;
}

export function AuthPromptCard({
  icon = 'lock',
  iconBgColor = 'bg-primary-50 dark:bg-primary-950/60',
  iconColor = '#0866FF',
  titleBn,
  titleEn,
  descriptionBn,
  descriptionEn,
  className = '',
  isCard = false,
}: AuthPromptCardProps) {
  const { locale } = useUi();

  const cardStyle = isCard
    ? 'bg-white dark:bg-[#242526] rounded-2xl p-6 border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs'
    : 'bg-transparent p-2 sm:p-4';

  return (
    <View
      className={`w-full max-w-[420px] mx-auto items-center text-center justify-center ${cardStyle} ${className}`}
    >
      {/* Icon Badge */}
      <View
        className={`h-16 w-16 rounded-full ${iconBgColor} items-center justify-center mb-4`}
      >
        <AppIcon
          android={icon as any}
          ios={icon as any}
          size={30}
          color={iconColor}
        />
      </View>

      {/* Contextual Title */}
      <Text className="text-lg sm:text-xl font-bold text-[#050505] dark:text-[#e4e6eb] text-center mb-2">
        {locale === 'bn' ? titleBn : titleEn}
      </Text>

      {/* Description */}
      <Text className="text-[13.5px] leading-[20px] text-[#65676b] dark:text-[#b0b3b8] text-center max-w-[320px] mb-6">
        {locale === 'bn' ? descriptionBn : descriptionEn}
      </Text>

      {/* Action Buttons: Log In & Register */}
      <View className="flex-row items-center gap-3 w-full max-w-[280px]">
        <Pressable
          onPress={() => router.push('/login')}
          className="flex-1 h-11 rounded-full bg-primary-600 active:bg-primary-700 items-center justify-center shadow-xs"
        >
          <Text className="text-[13.5px] font-bold text-white">
            {locale === 'bn' ? 'লগইন' : 'Log In'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/register')}
          className="flex-1 h-11 rounded-full bg-emerald-600 active:bg-emerald-700 items-center justify-center shadow-xs"
        >
          <Text className="text-[13.5px] font-bold text-white">
            {locale === 'bn' ? 'রেজিস্টার' : 'Register'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Screen-level wrapper for AuthPromptCard on private/protected pages.
 * Centered vertically and horizontally directly on the page background (no card border/box).
 */
export function AuthPromptScreen(props: AuthPromptCardProps) {
  return (
    <View className="flex-1 w-full h-full bg-white dark:bg-[#18191a] items-center justify-center px-4">
      <AuthPromptCard {...props} isCard={false} />
    </View>
  );
}
