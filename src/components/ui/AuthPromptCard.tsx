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
}

/**
 * Standardized AuthPromptCard matching PeaceTweet mobile design.
 * Shows an icon, contextual title, description, and dual "Log In" / "Register" buttons.
 */
export function AuthPromptCard({
  icon = 'lock',
  iconBgColor = 'bg-primary-50 dark:bg-primary-950/60',
  iconColor = '#1877f2',
  titleBn,
  titleEn,
  descriptionBn,
  descriptionEn,
  className = '',
}: AuthPromptCardProps) {
  const { locale } = useUi();

  return (
    <View
      className={`w-full max-w-[720px] mx-auto bg-white dark:bg-[#242526] rounded-2xl p-6 border border-[#e4e6eb] dark:border-[#393a3b] items-center text-center shadow-xs ${className}`}>
      {/* Icon Badge */}
      <View
        className={`h-14 w-14 rounded-2xl ${iconBgColor} items-center justify-center mb-3.5`}>
        <AppIcon android={icon as any} ios={icon as any} size={28} color={iconColor} />
      </View>

      {/* Contextual Title */}
      <Text className="text-base sm:text-lg font-bold text-[#050505] dark:text-[#e4e6eb] text-center mb-1.5">
        {locale === 'bn' ? titleBn : titleEn}
      </Text>

      {/* Description */}
      <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center max-w-sm mb-4 leading-relaxed">
        {locale === 'bn' ? descriptionBn : descriptionEn}
      </Text>

      {/* Action Buttons: Log In & Register */}
      <View className="flex-row items-center gap-2.5 w-full max-w-[280px]">
        <Pressable
          onPress={() => router.push('/login')}
          className="flex-1 rounded-xl bg-primary-500 active:bg-primary-600 py-2.5 items-center justify-center shadow-xs">
          <Text className="text-xs font-bold text-white">
            {locale === 'bn' ? 'লগইন' : 'Log In'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/register')}
          className="flex-1 rounded-xl bg-emerald-600 active:bg-emerald-700 py-2.5 items-center justify-center shadow-xs">
          <Text className="text-xs font-bold text-white">
            {locale === 'bn' ? 'রেজিস্টার' : 'Register'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Screen-level wrapper for AuthPromptCard on private/protected pages.
 */
export function AuthPromptScreen(props: AuthPromptCardProps) {
  return (
    <ScrollView
      className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a]"
      contentContainerStyle={{
        paddingHorizontal: 6,
        paddingTop: 16,
        paddingBottom: 24,
      }}>
      <AuthPromptCard {...props} />
    </ScrollView>
  );
}
