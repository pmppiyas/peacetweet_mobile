import React from 'react';
import { View, Text } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export function EmptyChatPlaceholder() {
  const { locale } = useUi();

  return (
    <View className="flex-1 h-full items-center justify-center p-6 bg-[#f8f9fa] dark:bg-[#18191a]">
      <View className="relative mb-4">
        <View className="h-20 w-20 rounded-3xl bg-primary-50 dark:bg-primary-950/50 items-center justify-center border border-primary-100/60 dark:border-primary-900/40">
          <AppIcon
            android="chat_bubble"
            ios="bubble.left.and.bubble.right.fill"
            size={38}
            color="#1877f2"
          />
        </View>
        <View className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-primary-500 items-center justify-center">
          <AppIcon
            android="auto_awesome"
            ios="sparkles"
            size={14}
            color="#ffffff"
          />
        </View>
      </View>

      <Text className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight text-center">
        {locale === 'bn' ? 'আপনার মেসেজসমূহ' : 'Your Messages'}
      </Text>
      <Text className="text-sm text-[#65676b] dark:text-[#b0b3b8] max-w-sm mt-2 leading-relaxed text-center">
        {locale === 'bn'
          ? 'মেসেজ দেখতে বামপাশের তালিকা থেকে একটি চ্যাট নির্বাচন করুন অথবা ফ্রেন্ড সার্চ করে চ্যাট শুরু করুন।'
          : 'Select a chat from the left to view messages, or search for a friend to connect.'}
      </Text>
    </View>
  );
}
