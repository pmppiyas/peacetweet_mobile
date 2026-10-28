import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function SavedScreen() {
  const { locale } = useUi();

  return (
    <ScrollView className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a] px-3 pt-3">
      <View className="w-full max-w-[720px] mx-auto bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] p-5 items-center">
        <View className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950/60 items-center justify-center mb-3">
          <AppIcon android="bookmark" size={24} color="#9333ea" />
        </View>
        <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {locale === 'bn' ? 'সংরক্ষিত দোয়া ও পোস্ট' : 'Saved Duas & Posts'}
        </Text>
        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center">
          {locale === 'bn'
            ? 'আপনার সেভ করা সব দোয়া এবং রিমাইন্ডার এখানে দেখতে পাবেন।'
            : 'All your saved Duas and reminders will appear here.'}
        </Text>
      </View>
    </ScrollView>
  );
}
