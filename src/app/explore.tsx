import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { AppIcon } from '@/components/ui/Icon';

export default function ExploreScreen() {
  const { locale } = useUi();

  return (
    <ScrollView className="flex-1 bg-[#f0f2f5] dark:bg-[#18191a] px-3 pt-3">
      <View className="w-full max-w-[720px] mx-auto bg-white dark:bg-[#242526] rounded-2xl border border-[#e4e6eb] dark:border-[#393a3b] p-5 items-center">
        <View className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950/60 items-center justify-center mb-3">
          <AppIcon android="layers" size={24} color="#2563eb" />
        </View>
        <Text className="text-base font-bold text-[#050505] dark:text-[#e4e6eb] mb-1">
          {locale === 'bn' ? 'বিষয়ভিত্তিক ক্যাটাগরি' : 'Categories'}
        </Text>
        <Text className="text-xs text-[#65676b] dark:text-[#b0b3b8] text-center">
          {locale === 'bn'
            ? 'সকাল-সন্ধ্যার যিকির, সালাত, রমজান ও দৈনন্দিন জীবনের মাসনুন দোয়াসমূহ।'
            : 'Explore authentic Duas by category.'}
        </Text>
      </View>
    </ScrollView>
  );
}
